use serde::Serialize;
#[derive(Debug, Serialize, Clone)] pub struct AppError{pub code:String,pub message:String}
#[derive(Default)] pub struct SidecarSupervisor{pub running:bool,pub restart_count:u32}
impl SidecarSupervisor{pub fn start(&mut self)->Result<(),AppError>{self.running=true;Ok(())} pub fn stop(&mut self){self.running=false;} pub fn on_unexpected_exit(&mut self)->Result<(),AppError>{self.restart_count+=1;self.start()}}
