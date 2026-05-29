use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::io::{BufRead, BufReader, Write};
use std::path::PathBuf;
use std::process::{Child, ChildStdin, ChildStdout, Command, Stdio};
use std::sync::Mutex;
use tauri::{AppHandle, Emitter};

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
    stdout: BufReader<ChildStdout>,
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
}

impl PythonSidecar {
    pub fn new(workspace_dir: PathBuf, bundled_exe: Option<PathBuf>) -> Self {
        let command_override = std::env::var("RADIO_CART_SIDECAR_CMD")
            .ok()
            .and_then(|raw| {
                let parts: Vec<String> = raw
                    .split_whitespace()
                    .map(|s| s.to_string())
                    .collect();
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
        }
    }

    pub fn take_restart_signal(&mut self) -> Option<u32> {
        self.restart_signal.take()
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
            self.io = None;
            return Err(AppError {
                code: "sidecar_write_failed".into(),
                message: err.to_string(),
            });
        }
        if let Err(err) = io.stdin.flush() {
            self.io = None;
            return Err(AppError {
                code: "sidecar_flush_failed".into(),
                message: err.to_string(),
            });
        }
        let mut response_line = String::new();
        match io.stdout.read_line(&mut response_line) {
            Ok(0) => {
                self.io = None;
                Err(AppError {
                    code: "sidecar_eof".into(),
                    message: "sidecar closed stdout".into(),
                })
            }
            Ok(_) => serde_json::from_str(response_line.trim()).map_err(|e| AppError {
                code: "decode_failed".into(),
                message: format!("{e}: {response_line}"),
            }),
            Err(err) => {
                self.io = None;
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
                Ok(Some(_)) => self.io = None,
                Ok(None) => return Ok(()),
                Err(_) => self.io = None,
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
        self.io = Some(ChildIo {
            child,
            stdin,
            stdout: BufReader::new(stdout),
        });
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
        if let Some(mut io) = self.io.take() {
            let shutdown = json!({"jsonrpc": "2.0", "id": 0, "method": "shutdown", "params": {}});
            if let Ok(line) = serde_json::to_string(&shutdown) {
                let _ = writeln!(io.stdin, "{}", line);
                let _ = io.stdin.flush();
            }
            let _ = io.child.wait();
        }
    }
}

pub struct SidecarBridge {
    inner: Mutex<PythonSidecar>,
}

impl SidecarBridge {
    pub fn new(workspace_dir: PathBuf, bundled_exe: Option<PathBuf>) -> Self {
        Self {
            inner: Mutex::new(PythonSidecar::new(workspace_dir, bundled_exe)),
        }
    }

    pub fn rpc(&self, app: &AppHandle, payload: Value) -> Value {
        let id = payload.get("id").cloned().unwrap_or(Value::Null);
        let mut sidecar = match self.inner.lock() {
            Ok(guard) => guard,
            Err(poisoned) => poisoned.into_inner(),
        };
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
        if let Ok(mut sidecar) = self.inner.lock() {
            sidecar.stop();
        }
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
    fn restart_signal_re_arms_on_subsequent_crashes() {
        let mut s = PythonSidecar::new(PathBuf::from("."), None);
        s.arm_restart_signal(101); // first spawn
        s.arm_restart_signal(202); // restart 1
        let _ = s.take_restart_signal();
        s.arm_restart_signal(303); // restart 2 after the bridge already drained
        assert_eq!(s.take_restart_signal(), Some(303));
    }
}
