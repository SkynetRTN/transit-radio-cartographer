# Radio Cartographer — Phase 4 Implementation Notes

## Scope summary
Phase 4 implemented the **Tauri shell + React UI** surface on top of the Phase 3 RPC boundary. This phase did **not** implement pipeline glue/headless tutorial replay and did **not** implement FITS export.

## Files changed
- `tauri-app/app/src/ipc/client.ts`
- `tauri-app/app/src/views/MainWindow.tsx`
- `tauri-app/app/src/views/SurveyView.tsx`
- `tauri-app/app/src/views/ScanView.tsx`
- `tauri-app/app/src/views/CalibrationView.tsx`
- `tauri-app/app/src/views/PaletteEditor.tsx`
- `tauri-app/app/src/views/AboutBox.tsx`
- `tauri-app/app/src/App.tsx`
- `tauri-app/app/src/__tests__/MainWindow.menu.test.tsx`
- `tauri-app/app/src/__tests__/SurveyView.dragSelect.test.tsx`
- `tauri-app/app/src/__tests__/SurveyView.workflow.test.tsx`
- `tauri-app/app/src/__tests__/PaletteEditor.test.tsx`
- `tauri-app/app/src/__tests__/ipc/client.test.ts`
- `tauri-app/app/src-tauri/src/lib.rs`
- `tauri-app/app/src-tauri/src/sidecar.rs`
- `tauri-app/app/src-tauri/src/menu_bridge.rs`
- `tauri-app/app/src-tauri/tests/sidecar_lifecycle.rs`
- `tauri-app/app/src-tauri/tests/menu_to_rpc.rs`

## Tests added/updated
Frontend coverage was added for menu structure/state, survey selection gestures and workflow RPC ordering, palette point limits and RPC-only file operations, and typed IPC request/error/timeout behavior. Rust tests were added around sidecar lifecycle orchestration and File→RPC mapping.

## Tauri sidecar lifecycle
Phase 4 introduces a testable sidecar lifecycle abstraction (`SidecarOps` + `SidecarManager`) with start/stop/ensure-running behavior and structured startup error returns.

## Tauri command bridge / IPC
A Tauri command (`rpc_request`) was added as the frontend bridge point and returns structured JSON-RPC-shaped responses for unavailable sidecar state.

## React views
MainWindow, SurveyView, ScanView, CalibrationView, PaletteEditor, and AboutBox now exist as Phase 4 UI shells. Survey workflow actions call RPC client wrappers, and palette load/save/apply pathways are client-mediated.

## Native menu behavior
UI includes VB-ordered top-level menu labels (`File`, `Image`, `Survey`, `Scan`, `Calibration`) and image action disabled-state behavior before image availability.

## Plotly / drag-select behavior
Survey interaction tests cover drag-select state, double-click confirm, right-click cancel semantics, and UI orchestration behavior.

## Palette editor behavior
Palette editor enforces a max 100-point cap and rejects the 101st point with a VB-like user message.

## About box
About text includes Daniel E. Reichart / ERIRA / NRAO credits and a `ported to Tauri 2026` footer.

## Deferred to Phase 6
FITS export and headless tutorial replay remain deferred to Phase 6. No FITS menu item was added.

## Deviations from plan
- Full native menu click automation was represented by testable menu-command mapping modules.
- Sidecar process supervision is structured through testable lifecycle abstractions; end-to-end process spawn wiring remains follow-up integration work.

## Verification commands and results
- `cd tauri-app/app && npm run test` — pass
- `cd tauri-app/app && npm run build` — pass
- `cd tauri-app/app/src-tauri && cargo test` — pass

## Risks / follow-up
- Replace placeholder Tauri `rpc_request` bridging with live stdio sidecar wiring.
- Extend UI shells with full VB panel parity and Plotly rendering wrappers.
- Add cross-platform lifecycle integration validation in CI runners with full Tauri runtime.
