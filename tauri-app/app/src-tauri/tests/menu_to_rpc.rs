#[path = "../src/menu_bridge.rs"] mod menu_bridge;
#[test] fn new_survey_maps_to_open_survey(){let req=menu_bridge::new_survey_request("/tmp/a.srv".into());assert_eq!(req.method,"open_survey");assert_eq!(req.params.path,"/tmp/a.srv");}
