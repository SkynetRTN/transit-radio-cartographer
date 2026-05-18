mod sidecar; mod menu_bridge;
use sidecar::SidecarSupervisor;
use tauri::State;
use std::sync::Mutex;
#[tauri::command]
fn rpc_request(payload: serde_json::Value, _state: State<Mutex<SidecarSupervisor>>) -> Result<serde_json::Value, serde_json::Value> { Ok(serde_json::json!({"jsonrpc":"2.0","id":payload.get("id").cloned().unwrap_or(serde_json::Value::Null),"result":serde_json::json!({"ok":true})})) }
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run(){ let mut sup=SidecarSupervisor::default(); let _=sup.start(); tauri::Builder::default().manage(Mutex::new(sup)).invoke_handler(tauri::generate_handler![rpc_request]).run(tauri::generate_context!()).expect("error while running tauri application"); }
