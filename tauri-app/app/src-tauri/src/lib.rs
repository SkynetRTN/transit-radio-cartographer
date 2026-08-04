pub mod menu_bridge;
pub mod sidecar;

use std::path::PathBuf;
use tauri::Manager;

use crate::sidecar::SidecarBridge;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let workspace_dir = workspace_dir();
            let bundled_exe = std::env::current_exe().ok().and_then(|p| {
                p.parent().map(|d| {
                    let name = if cfg!(windows) {
                        "radio-cartographer-engine.exe"
                    } else {
                        "radio-cartographer-engine"
                    };
                    d.join(name)
                })
            });
            app.manage(SidecarBridge::new(workspace_dir, bundled_exe));
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::Destroyed = event {
                if let Some(bridge) = window.try_state::<SidecarBridge>() {
                    bridge.shutdown();
                }
            }
        })
        .invoke_handler(tauri::generate_handler![rpc_request])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn workspace_dir() -> PathBuf {
    // CARGO_MANIFEST_DIR points at tauri-app/app/src-tauri. The uv workspace
    // root (where `uv run` resolves the engine package from) is two levels up.
    let manifest = env!("CARGO_MANIFEST_DIR");
    PathBuf::from(manifest)
        .join("..")
        .join("..")
        .canonicalize()
        .unwrap_or_else(|_| PathBuf::from(manifest).join("..").join(".."))
}

#[tauri::command]
async fn rpc_request(app: tauri::AppHandle, payload: serde_json::Value) -> serde_json::Value {
    // The bridge call blocks (sidecar spawn + unbounded read_line). A sync
    // command would run it on the event-loop thread, freezing the window
    // ("Not Responding") for the duration of every engine call — so hop to
    // the blocking pool and keep the main thread free.
    let id = payload.get("id").cloned().unwrap_or(serde_json::Value::Null);
    match tauri::async_runtime::spawn_blocking(move || {
        let bridge = app.state::<SidecarBridge>();
        bridge.rpc(&app, payload)
    })
    .await
    {
        Ok(response) => response,
        Err(err) => serde_json::json!({
            "jsonrpc": "2.0",
            "id": id,
            "error": {
                "code": -32000,
                "message": format!("rpc worker failed: {err}"),
                "data": {"code": "rpc_worker_failed"}
            }
        }),
    }
}
