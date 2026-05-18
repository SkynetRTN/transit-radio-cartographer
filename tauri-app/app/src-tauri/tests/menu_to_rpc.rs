use radio_cartographer_app_lib::menu_bridge::file_new_survey;
#[test] fn maps_file_menu_to_open_survey(){
 let action = file_new_survey(Some("/tmp/a.md2".into())).unwrap();
 assert_eq!(action.method, "open_survey");
 assert_eq!(action.params["path"], "/tmp/a.md2");
}
#[test] fn no_path_is_error(){ assert!(file_new_survey(None).is_err()); }
