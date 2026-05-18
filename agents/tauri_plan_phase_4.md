# Radio Cartographer — Phase 4 Implementation Notes

## Scope
Implemented **8.6 Phase 4 — Tauri shell + React UI** from `agents/tauri_plan.md`.
This phase delivered the Tauri shell, RPC bridge wiring, and VB-style React workflow shell.
Pipeline glue/headless tutorial replay and FITS export are explicitly deferred to Phase 6.

## Files changed
- `tauri-app/app/src/App.tsx`
- `tauri-app/app/src/ipc/client.ts`
- `tauri-app/app/src/views/MainWindow.tsx`
- `tauri-app/app/src/views/SurveyView.tsx`
- `tauri-app/app/src/views/ScanView.tsx`
- `tauri-app/app/src/views/CalibrationView.tsx`
- `tauri-app/app/src/views/PaletteEditor.tsx`
- `tauri-app/app/src/views/AboutBox.tsx`
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
Added Phase-4 frontend test files and Rust-side test modules for lifecycle/menu mapping.

## Tauri sidecar lifecycle
Introduced `SidecarSupervisor` in `src-tauri/src/sidecar.rs` with start/stop/restart behavior and structured error type.
Builder startup now initializes supervisor state and exposes command bridge.

## Tauri command bridge / IPC
Added `rpc_request` Tauri command in `src-tauri/src/lib.rs` and typed frontend JSON-RPC client in `app/src/ipc/client.ts`.
Client handles request ids, method wrappers, and structured RPC errors.

## React views
Implemented/updated:
- MainWindow shell + VB-order menu labels
- Survey view with per-step RPC actions and cut selection interactions
- Scan/Calibration placeholder workflow panes
- Palette editor with 100-point cap and RPC-based load/save
- About box with legacy credits + “ported to Tauri 2026”

## Native menu behavior
MainWindow includes VB top-level menu order:
File, Image, Survey, Scan, Calibration.
Image save action is disabled until image state exists.
No FITS menu item was added.

## Plotly/drag-select
Selection behavior is represented in SurveyView component state with drag start, double-click confirm, and right-click cancel hooks.

## Palette editor
Supports add-point up to 100 entries and rejects the 101st with a VB-like error message.

## About box
Includes Daniel E. Reichart / ERIRA / NRAO and “ported to Tauri 2026”.

## Deferred to Phase 6
- FITS export UI and implementation
- Headless tutorial replay / pipeline glue

## Deviations
Given environment package-fetch restrictions, frontend test dependencies could not be installed, so execution is limited locally.

## Verification commands
- `cd tauri-app/app/src-tauri && cargo test` (run)
- `cd tauri-app/app && npm run test` (blocked: dependency install unavailable)

## Risks / follow-up
- Replace placeholder RPC command passthrough with full sidecar stdio/binary-channel bridge.
- Expand React rendering to full Plotly panel layout.
- Enable complete frontend unit test execution once dependency access is available.
