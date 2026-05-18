use serde::{Deserialize, Serialize};
#[derive(Debug, Serialize, Deserialize, PartialEq)]
pub struct MenuAction { pub method: String, pub params: serde_json::Value }
pub fn file_new_survey(selected_path: Option<String>) -> Result<MenuAction, String> {
    let p = selected_path.ok_or("no_path_selected")?;
    Ok(MenuAction { method: "open_survey".into(), params: serde_json::json!({"path": p}) })
}
