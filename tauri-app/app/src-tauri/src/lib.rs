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
                // Only the main window owns the Python sidecar's lifetime.
                // Auxiliary windows (e.g. the "tutorial" window) come and go
                // freely without touching the engine. When the main window is
                // destroyed, shut the sidecar down and exit the whole app so
                // any remaining windows (the tutorial) close too.
                if window.label() == "main" {
                    if let Some(bridge) = window.try_state::<SidecarBridge>() {
                        bridge.shutdown();
                    }
                    window.app_handle().exit(0);
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
fn rpc_request(
    app: tauri::AppHandle,
    bridge: tauri::State<'_, SidecarBridge>,
    payload: serde_json::Value,
) -> serde_json::Value {
    bridge.rpc(&app, payload)
}
