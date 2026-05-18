use radio_cartographer_app_lib::sidecar::{AppError, SidecarManager, SidecarOps};

#[derive(Default)]
struct FakeSidecar { running: bool, starts: usize, fail_start: bool }
impl SidecarOps for FakeSidecar {
  fn start(&mut self)->Result<(),AppError>{ self.starts+=1; if self.fail_start { return Err(AppError{code:"startup_failed".into(),message:"x".into()}); } self.running=true; Ok(()) }
  fn is_running(&self)->bool{ self.running }
  fn stop(&mut self){ self.running=false; }
}
#[test] fn starts_stops_restarts_and_error(){
  let mut m = SidecarManager{ops:FakeSidecar::default()};
  assert!(m.launch().is_ok()); assert!(m.ops.is_running()); m.shutdown(); assert!(!m.ops.is_running());
  assert!(m.ensure_running().is_ok()); assert_eq!(m.ops.starts,2);
  let mut e = SidecarManager{ops:FakeSidecar{fail_start:true,..Default::default()}};
  assert!(e.launch().is_err());
}
