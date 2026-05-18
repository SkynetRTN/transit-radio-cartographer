#[path = "../src/sidecar.rs"] mod sidecar;
use sidecar::SidecarSupervisor;
#[test] fn starts_and_stops(){let mut s=SidecarSupervisor::default();s.start().unwrap();assert!(s.running);s.stop();assert!(!s.running);} 
#[test] fn restarts_on_exit(){let mut s=SidecarSupervisor::default();s.start().unwrap();s.running=false;s.on_unexpected_exit().unwrap();assert_eq!(s.restart_count,1);assert!(s.running);} 
