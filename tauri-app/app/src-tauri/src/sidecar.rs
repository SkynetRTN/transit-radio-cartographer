use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::io::{BufRead, BufReader, Write};
use std::path::PathBuf;
use std::process::{Child, ChildStdin, Command, Stdio};
use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};
use std::sync::mpsc::{self, Receiver, RecvTimeoutError};
use std::sync::{Arc, Mutex, TryLockError};
use std::time::Duration;
use tauri::{AppHandle, Emitter};

// Upper bound on waiting for one engine reply. Slightly above the frontend's
// longest per-method timeout (300 s) so the JS layer always times out first;
// this is the backstop that frees the bridge mutex when the engine wedges —
// without it, one stuck call blocks every later RPC (and window close) forever.
const READ_TIMEOUT: Duration = Duration::from_secs(330);

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppError {
    pub code: String,
    pub message: String,
}

pub trait SidecarOps {
    fn start(&mut self) -> Result<(), AppError>;
    fn is_running(&self) -> bool;
    fn stop(&mut self);
}

#[derive(Default)]
pub struct SidecarManager<T: SidecarOps> {
    pub ops: T,
}

impl<T: SidecarOps> SidecarManager<T> {
    pub fn launch(&mut self) -> Result<(), AppError> {
        self.ops.start()
    }
    pub fn shutdown(&mut self) {
        self.ops.stop();
    }
    pub fn ensure_running(&mut self) -> Result<(), AppError> {
        if !self.ops.is_running() {
            self.ops.start()?;
        }
        Ok(())
    }
}

struct ChildIo {
    child: Child,
    stdin: ChildStdin,
    // Response lines arrive via a dedicated reader thread so send() can
    // apply READ_TIMEOUT — a blocking read_line here could hold the bridge
    // mutex indefinitely. The channel disconnects when the child's stdout
    // closes (exit or kill), which unblocks a pending recv immediately.
    lines: Receiver<std::io::Result<String>>,
}

/// Last-resort kill by OS pid, used when the `Child` handle is unreachable
/// (held behind a mutex owned by a blocked RPC). `/T` also takes down any
/// helper processes a PyInstaller bundle may have spawned.
fn kill_pid(pid: u32) {
    if pid == 0 {
        return;
    }
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        let _ = Command::new("taskkill")
            .args(["/PID", &pid.to_string(), "/T", "/F"])
            .creation_flags(CREATE_NO_WINDOW)
            .status();
    }
    #[cfg(not(windows))]
    {
        let _ = Command::new("kill")
            .args(["-9", &pid.to_string()])
            .status();
    }
}

/// Split a command-line override into tokens, honoring single/double quotes
/// so Windows paths with spaces (`"C:\Program Files\...\python.exe" -m ...`)
/// survive intact. Naive `split_whitespace` would hand `Command::new` the
/// bogus program name `C:\Program`. Quotes only OPEN a quoted span at the
/// start of a token: mid-token quote characters are literal, so an unquoted
/// path containing an apostrophe (`C:\Users\O'Brien\...`) is not swallowed
/// into one giant token (bug #47).
fn split_command_line(raw: &str) -> Vec<String> {
    let mut parts = Vec::new();
    let mut cur = String::new();
    let mut quote: Option<char> = None;
    let mut has_token = false;
    for c in raw.chars() {
        match quote {
            Some(q) if c == q => quote = None,
            Some(_) => cur.push(c),
            None => match c {
                '"' | '\'' if !has_token => {
                    quote = Some(c);
                    has_token = true;
                }
                c if c.is_whitespace() => {
                    if has_token {
                        parts.push(std::mem::take(&mut cur));
                        has_token = false;
                    }
                }
                c => {
                    cur.push(c);
                    has_token = true;
                }
            },
        }
    }
    if has_token {
        parts.push(cur);
    }
    parts
}

pub struct PythonSidecar {
    workspace_dir: PathBuf,
    bundled_exe: Option<PathBuf>,
    command_override: Option<Vec<String>>,
    io: Option<ChildIo>,
    // BUG-012: distinguish first-ever spawn (no event) from a respawn
    // after a crash (emit `engine_restarted`). `restart_signal` carries
    // the new child's pid until the bridge drains it via take_restart_signal.
    started_at_least_once: bool,
    restart_signal: Option<u32>,
    // Current child pid (0 = none), readable without the bridge mutex so
    // shutdown() can kill a wedged engine while an RPC still holds the lock.
    pid: Arc<AtomicU32>,
}

impl PythonSidecar {
    pub fn new(workspace_dir: PathBuf, bundled_exe: Option<PathBuf>) -> Self {
        let command_override = std::env::var("RADIO_CART_SIDECAR_CMD")
            .ok()
            .and_then(|raw| {
                let parts = split_command_line(&raw);
                if parts.is_empty() {
                    None
                } else {
                    Some(parts)
                }
            });
        Self {
            workspace_dir,
            bundled_exe,
            command_override,
            io: None,
            started_at_least_once: false,
            restart_signal: None,
            pid: Arc::new(AtomicU32::new(0)),
        }
    }

    pub fn take_restart_signal(&mut self) -> Option<u32> {
        self.restart_signal.take()
    }

    fn pid_handle(&self) -> Arc<AtomicU32> {
        Arc::clone(&self.pid)
    }

    // Tear down a broken stream. std's Child does not reap on drop, so a
    // plain `self.io = None` leaves a zombie on Unix for every crashed
    // engine; kill() also ends a still-live child on the desync paths
    // (a dead one makes it a harmless error).
    fn discard_io(&mut self) {
        if let Some(mut io) = self.io.take() {
            let _ = io.child.kill();
            let _ = io.child.wait();
        }
        self.pid.store(0, Ordering::SeqCst);
    }

    // BUG-012: first call marks "we've started"; every subsequent call arms
    // the restart signal with the new child's pid. Kept as a small helper so
    // the unit test exercises the same code as the production `start()` path.
    fn arm_restart_signal(&mut self, pid: u32) {
        if self.started_at_least_once {
            self.restart_signal = Some(pid);
        } else {
            self.started_at_least_once = true;
        }
    }

    fn build_command(&self) -> Command {
        // Priority: explicit test override > bundled PyInstaller binary > dev `uv run`.
        // The bundled binary lives alongside the main exe (Tauri externalBin convention);
        // it is self-contained, so we deliberately do not set current_dir for it.
        let mut cmd = if let Some(parts) = &self.command_override {
            let mut c = Command::new(&parts[0]);
            c.args(&parts[1..]);
            c.current_dir(&self.workspace_dir);
            c
        } else if let Some(exe) = self.bundled_exe.as_ref().filter(|p| p.exists()) {
            Command::new(exe)
        } else {
            let mut c = Command::new("uv");
            c.args(["run", "python", "-m", "radio_cartographer.rpc"]);
            c.current_dir(&self.workspace_dir);
            c
        };
        cmd.stdin(Stdio::piped());
        cmd.stdout(Stdio::piped());
        cmd.stderr(Stdio::piped());
        // Suppress the console flash on Windows. The PyInstaller exe is built
        // with console=False, but the uv-run dev fallback would otherwise still
        // open a window; this also protects against any future console-mode
        // sidecar reverts.
        #[cfg(windows)]
        {
            use std::os::windows::process::CommandExt;
            const CREATE_NO_WINDOW: u32 = 0x0800_0000;
            cmd.creation_flags(CREATE_NO_WINDOW);
        }
        cmd
    }

    pub fn send(&mut self, request: &Value) -> Result<Value, AppError> {
        self.ensure_started_internal()?;
        let io = self.io.as_mut().ok_or_else(|| AppError {
            code: "sidecar_unavailable".into(),
            message: "sidecar process not running".into(),
        })?;
        let line = serde_json::to_string(request).map_err(|e| AppError {
            code: "encode_failed".into(),
            message: e.to_string(),
        })?;
        if let Err(err) = writeln!(io.stdin, "{}", line) {
            self.discard_io();
            return Err(AppError {
                code: "sidecar_write_failed".into(),
                message: err.to_string(),
            });
        }
        if let Err(err) = io.stdin.flush() {
            self.discard_io();
            return Err(AppError {
                code: "sidecar_flush_failed".into(),
                message: err.to_string(),
            });
        }
        match io.lines.recv_timeout(READ_TIMEOUT) {
            Err(RecvTimeoutError::Disconnected) => {
                // Reader thread exited: the child closed stdout (exit/kill).
                self.discard_io();
                Err(AppError {
                    code: "sidecar_eof".into(),
                    message: "sidecar closed stdout".into(),
                })
            }
            Err(RecvTimeoutError::Timeout) => {
                // The engine produced nothing for longer than any legitimate
                // operation. Kill it so the bridge (and its mutex) recover
                // instead of blocking every subsequent RPC forever.
                self.discard_io();
                Err(AppError {
                    code: "sidecar_read_timeout".into(),
                    message: format!(
                        "engine produced no response within {}s; process killed",
                        READ_TIMEOUT.as_secs()
                    ),
                })
            }
            Ok(Ok(response_line)) => {
                let response: Value = match serde_json::from_str(response_line.trim()) {
                    Ok(v) => v,
                    Err(e) => {
                        // A non-JSON line means the stream is desynchronized:
                        // the real response may still be buffered, and every
                        // later call would read the previous call's reply.
                        // Kill the stream so the next call respawns cleanly.
                        self.discard_io();
                        return Err(AppError {
                            code: "decode_failed".into(),
                            message: format!("{e}: {response_line}"),
                        });
                    }
                };
                // Responses are strictly sequential, so the id must echo the
                // request's. The one legitimate exception is a structured
                // parse/invalid-request error, which carries id null per
                // JSON-RPC when the engine couldn't read the request id.
                let req_id = request.get("id");
                let resp_id = response.get("id");
                let null_id_error = response.get("error").is_some()
                    && matches!(resp_id, None | Some(Value::Null));
                if req_id.is_some() && resp_id != req_id && !null_id_error {
                    self.discard_io();
                    return Err(AppError {
                        code: "response_id_mismatch".into(),
                        message: format!(
                            "expected response id {req_id:?}, got {resp_id:?} (stream desynchronized)"
                        ),
                    });
                }
                Ok(response)
            }
            Ok(Err(err)) => {
                self.discard_io();
                Err(AppError {
                    code: "sidecar_read_failed".into(),
                    message: err.to_string(),
                })
            }
        }
    }

    fn ensure_started_internal(&mut self) -> Result<(), AppError> {
        if let Some(io) = self.io.as_mut() {
            match io.child.try_wait() {
                // try_wait(Some) has already reaped the exit status; drop is
                // safe here. The Err arm's liveness is unknown — discard_io
                // kills and reaps to be certain.
                Ok(Some(_)) => self.io = None,
                Ok(None) => return Ok(()),
                Err(_) => self.discard_io(),
            }
        }
        self.start()
    }
}

impl SidecarOps for PythonSidecar {
    fn start(&mut self) -> Result<(), AppError> {
        let mut cmd = self.build_command();
        let mut child = cmd.spawn().map_err(|err| AppError {
            code: "spawn_failed".into(),
            message: format!("failed to spawn sidecar: {err}"),
        })?;
        let pid = child.id();
        let stdin = child.stdin.take().ok_or_else(|| AppError {
            code: "stdin_unavailable".into(),
            message: "sidecar stdin pipe missing".into(),
        })?;
        let stdout = child.stdout.take().ok_or_else(|| AppError {
            code: "stdout_unavailable".into(),
            message: "sidecar stdout pipe missing".into(),
        })?;
        // stderr must be continuously drained: if the pipe buffer fills (numpy
        // warnings, tracebacks, `uv run` progress output), the engine blocks
        // mid-write and never produces its stdout response, deadlocking send().
        // The thread exits on its own when the child closes the pipe.
        if let Some(stderr) = child.stderr.take() {
            std::thread::spawn(move || {
                let mut reader = BufReader::new(stderr);
                let mut buf = Vec::new();
                loop {
                    buf.clear();
                    match reader.read_until(b'\n', &mut buf) {
                        Ok(0) | Err(_) => break,
                        Ok(_) => eprint!("[sidecar] {}", String::from_utf8_lossy(&buf)),
                    }
                }
            });
        }
        // Read stdout on a dedicated thread so send() can time out (the
        // channel disconnects on EOF, unblocking a pending recv the moment
        // the child dies). The thread exits on EOF, read error, or when the
        // receiver is dropped after a restart.
        let (tx, rx) = mpsc::channel::<std::io::Result<String>>();
        std::thread::spawn(move || {
            let mut reader = BufReader::new(stdout);
            loop {
                let mut line = String::new();
                match reader.read_line(&mut line) {
                    Ok(0) => break,
                    Ok(_) => {
                        if tx.send(Ok(line)).is_err() {
                            break;
                        }
                    }
                    Err(err) => {
                        let _ = tx.send(Err(err));
                        break;
                    }
                }
            }
        });
        self.io = Some(ChildIo {
            child,
            stdin,
            lines: rx,
        });
        self.pid.store(pid, Ordering::SeqCst);
        // BUG-012: First spawn -> just remember we've started; do not emit a
        // restart event. Any subsequent spawn is by definition a restart, so
        // arm the signal for the bridge to drain and emit `engine_restarted`.
        self.arm_restart_signal(pid);
        Ok(())
    }

    fn is_running(&self) -> bool {
        self.io.is_some()
    }

    fn stop(&mut self) {
        self.pid.store(0, Ordering::SeqCst);
        if let Some(io) = self.io.take() {
            let ChildIo {
                mut child,
                mut stdin,
                lines: _,
            } = io;
            let shutdown = json!({"jsonrpc": "2.0", "id": 0, "method": "shutdown", "params": {}});
            if let Ok(line) = serde_json::to_string(&shutdown) {
                let _ = writeln!(stdin, "{}", line);
                let _ = stdin.flush();
            }
            // Closing stdin gives the engine a second exit path: serve()'s
            // read loop hits EOF even if the shutdown request was never read.
            drop(stdin);
            // A wedged engine must not block window close forever: give it a
            // grace period to exit cleanly, then kill and reap it.
            let deadline = std::time::Instant::now() + std::time::Duration::from_secs(3);
            loop {
                match child.try_wait() {
                    Ok(Some(_)) => return,
                    Ok(None) if std::time::Instant::now() < deadline => {
                        std::thread::sleep(std::time::Duration::from_millis(50));
                    }
                    Ok(None) | Err(_) => break,
                }
            }
            let _ = child.kill();
            let _ = child.wait();
        }
    }
}

pub struct SidecarBridge {
    inner: Mutex<PythonSidecar>,
    // Mirror of the sidecar's current child pid, readable without `inner`.
    pid: Arc<AtomicU32>,
    // Set once the window is being destroyed. RPCs queued behind the lock at
    // that point must not respawn the engine to service a dead request.
    shutting_down: AtomicBool,
}

impl SidecarBridge {
    pub fn new(workspace_dir: PathBuf, bundled_exe: Option<PathBuf>) -> Self {
        let sidecar = PythonSidecar::new(workspace_dir, bundled_exe);
        let pid = sidecar.pid_handle();
        Self {
            inner: Mutex::new(sidecar),
            pid,
            shutting_down: AtomicBool::new(false),
        }
    }

    pub fn rpc(&self, app: &AppHandle, payload: Value) -> Value {
        let id = payload.get("id").cloned().unwrap_or(Value::Null);
        let mut sidecar = match self.inner.lock() {
            Ok(guard) => guard,
            Err(poisoned) => poisoned.into_inner(),
        };
        if self.shutting_down.load(Ordering::SeqCst) {
            return json!({
                "jsonrpc": "2.0",
                "id": id,
                "error": {
                    "code": -32000,
                    "message": "application is shutting down",
                    "data": {"code": "app_shutting_down"}
                }
            });
        }
        let result = sidecar.send(&payload);
        // BUG-012: drain the restart signal AFTER send() so we emit
        // `engine_restarted` whether the triggering call ultimately succeeded
        // or returned a transport error (sidecar_eof / write_failed / etc.).
        if let Some(pid) = sidecar.take_restart_signal() {
            let _ = app.emit("engine_restarted", json!({ "pid": pid }));
        }
        drop(sidecar);
        match result {
            Ok(response) => response,
            Err(err) => json!({
                "jsonrpc": "2.0",
                "id": id,
                "error": {"code": -32000, "message": err.message, "data": {"code": err.code}}
            }),
        }
    }

    pub fn shutdown(&self) {
        self.shutting_down.store(true, Ordering::SeqCst);
        // Recover from a poisoned lock like rpc() does — a prior panic in the
        // RPC path must not leave the engine process unreaped on window close.
        let mut sidecar = match self.inner.try_lock() {
            Ok(guard) => guard,
            Err(TryLockError::Poisoned(poisoned)) => poisoned.into_inner(),
            Err(TryLockError::WouldBlock) => {
                // An in-flight RPC holds the lock — possibly blocked inside a
                // long or wedged engine call. Kill the child by pid: its
                // stdout closes, the reader channel disconnects, the blocked
                // recv returns immediately, and the lock frees. Then take the
                // lock normally to reap whatever is left.
                kill_pid(self.pid.load(Ordering::SeqCst));
                match self.inner.lock() {
                    Ok(guard) => guard,
                    Err(poisoned) => poisoned.into_inner(),
                }
            }
        };
        sidecar.stop();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // BUG-012: the restart signal must NOT fire on the first spawn — that's
    // a normal app start, not a recovery. Only respawns (after a crash) are
    // user-visible "engine restarted" events.
    #[test]
    fn first_start_does_not_arm_restart_signal() {
        let mut s = PythonSidecar::new(PathBuf::from("."), None);
        assert!(s.take_restart_signal().is_none());
        s.arm_restart_signal(101);
        assert!(
            s.take_restart_signal().is_none(),
            "first spawn must not arm the signal"
        );
    }

    #[test]
    fn second_start_arms_signal_with_new_pid() {
        let mut s = PythonSidecar::new(PathBuf::from("."), None);
        s.arm_restart_signal(101); // first spawn
        s.arm_restart_signal(202); // restart
        assert_eq!(s.take_restart_signal(), Some(202));
        assert!(
            s.take_restart_signal().is_none(),
            "signal drains once — bridge must not double-emit"
        );
    }

    #[test]
    fn split_command_line_honors_quotes() {
        assert_eq!(
            split_command_line(r#""C:\Program Files\Python313\python.exe" -m radio_cartographer.rpc"#),
            vec![
                r"C:\Program Files\Python313\python.exe".to_string(),
                "-m".to_string(),
                "radio_cartographer.rpc".to_string(),
            ]
        );
        assert_eq!(
            split_command_line("uv run python -m radio_cartographer.rpc"),
            vec!["uv", "run", "python", "-m", "radio_cartographer.rpc"]
        );
        assert_eq!(split_command_line("  "), Vec::<String>::new());
        // An empty quoted token is still a token (edge case, but must not panic).
        assert_eq!(split_command_line(r#""" x"#), vec!["".to_string(), "x".to_string()]);
        // Mid-token quote characters are literal — an apostrophe in an
        // unquoted Windows path must not open a quoted span (bug #47).
        assert_eq!(
            split_command_line(r"C:\Users\O'Brien\venv\Scripts\python.exe -m radio_cartographer.rpc"),
            vec![
                r"C:\Users\O'Brien\venv\Scripts\python.exe".to_string(),
                "-m".to_string(),
                "radio_cartographer.rpc".to_string(),
            ]
        );
    }

    #[test]
    fn restart_signal_re_arms_on_subsequent_crashes() {
        let mut s = PythonSidecar::new(PathBuf::from("."), None);
        s.arm_restart_signal(101); // first spawn
        s.arm_restart_signal(202); // restart 1
        let _ = s.take_restart_signal();
        s.arm_restart_signal(303); // restart 2 after the bridge already drained
        assert_eq!(s.take_restart_signal(), Some(303));
    }
}
