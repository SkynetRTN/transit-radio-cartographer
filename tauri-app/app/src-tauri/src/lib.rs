pub mod sidecar;
pub mod menu_bridge;
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default().invoke_handler(tauri::generate_handler![rpc_request]).run(tauri::generate_context!()).expect("error while running tauri application");
}
#[tauri::command]
fn rpc_request(payload: serde_json::Value) -> serde_json::Value { serde_json::json!({"jsonrpc":"2.0","id":payload["id"],"error":{"code":-32000,"message":"sidecar_unavailable"}}) }
