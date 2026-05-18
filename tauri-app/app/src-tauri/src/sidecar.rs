use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::io::{BufRead, BufReader, Write};
use std::path::PathBuf;
use std::process::{Child, ChildStdin, ChildStdout, Command, Stdio};
use std::sync::Mutex;

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
    command_override: Option<Vec<String>>,
    io: Option<ChildIo>,
}

impl PythonSidecar {
    pub fn new(workspace_dir: PathBuf) -> Self {
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
            command_override,
            io: None,
        }
    }

    fn build_command(&self) -> Command {
        let mut cmd = if let Some(parts) = &self.command_override {
            let mut c = Command::new(&parts[0]);
            c.args(&parts[1..]);
            c
        } else {
            let mut c = Command::new("uv");
            c.args(["run", "python", "-m", "radio_cartographer.rpc"]);
            c
        };
        cmd.current_dir(&self.workspace_dir);
        cmd.stdin(Stdio::piped());
        cmd.stdout(Stdio::piped());
        cmd.stderr(Stdio::piped());
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
    pub fn new(workspace_dir: PathBuf) -> Self {
        Self {
            inner: Mutex::new(PythonSidecar::new(workspace_dir)),
        }
    }

    pub fn rpc(&self, payload: Value) -> Value {
        let id = payload.get("id").cloned().unwrap_or(Value::Null);
        let mut sidecar = match self.inner.lock() {
            Ok(guard) => guard,
            Err(poisoned) => poisoned.into_inner(),
        };
        match sidecar.send(&payload) {
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
