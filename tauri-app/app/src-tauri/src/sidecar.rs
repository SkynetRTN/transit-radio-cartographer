use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppError { pub code: String, pub message: String }

pub trait SidecarOps { fn start(&mut self) -> Result<(), AppError>; fn is_running(&self) -> bool; fn stop(&mut self); }

#[derive(Default)]
pub struct SidecarManager<T: SidecarOps> { pub ops: T }
impl<T: SidecarOps> SidecarManager<T> {
    pub fn launch(&mut self) -> Result<(), AppError> { self.ops.start() }
    pub fn shutdown(&mut self) { self.ops.stop(); }
    pub fn ensure_running(&mut self) -> Result<(), AppError> { if !self.ops.is_running() { self.ops.start()?; } Ok(()) }
}
