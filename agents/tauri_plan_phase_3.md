# Tauri Phase 3 Progress — RPC

## Scope
Implement **8.5 Phase 3 — RPC** from [agents/tauri_plan.md](tauri_plan.md):
engine RPC surface, handle registry, protocol doc, binary side-channel framing,
PyInstaller sidecar spec, and §6.3 tests.

## Status: Phase 3 implemented (engine-side RPC)

## What landed

- Added handle registry module at
  `tauri-app/engine/src/radio_cartographer/_handles.py` with monotonic integer
  handle allocation and structured invalid-handle signaling.
- Added `tauri-app/engine/src/radio_cartographer/rpc.py` implementing:
  - newline-delimited JSON-RPC 2.0 request/response loop over stdio,
  - handshake methods `ping` and `shutdown`,
  - workflow primitives `open_survey`, `get_sweep`, `close_handle`,
  - Phase 3 `export_fits` stub returning a structured not-implemented error,
  - structured error mapping for invalid params, unknown methods, invalid
    handles, file/parse errors, and internal exceptions.
- Added in-process binary channel abstraction (token + framed `.npy` bytes)
  with little-endian length prefix (`uint64`) and stable token references.
- Added protocol contract at `tauri-app/engine/PROTOCOL.md` documenting:
  framing, method set, error codes, and binary-channel frame format.
- Added PyInstaller spec at `tauri-app/engine/sidecar.spec`.
- Added required RPC tests under `tauri-app/engine/tests/rpc/`:
  - `test_rpc_handshake.py`
  - `test_rpc_open_survey.py`
  - `test_rpc_binary_channel.py`
  - `test_rpc_error_propagation.py`
  - plus helpers package files.

## Tests passing

```text
cd tauri-app && uv run pytest engine/tests/io engine/tests/numerics engine/tests/rpc
```

## Deviations and limits

- Plan suggested `jsonrpcserver`; implementation uses a lightweight custom
  dispatcher for tighter control of error payload shape and easier testability.
- The binary side-channel is implemented as a protocol abstraction with
  tokenized frame storage in-process (single stdio process) rather than a
  physically separate OS pipe in this phase.
  - Framing is still explicitly implemented/tested as
    `uint64 length + .npy payload`.
  - This keeps the contract stable for the future Tauri bridge to map onto a
    dedicated binary transport.
- Cross-platform PyInstaller build matrix was **not** fully verifiable in this
  Linux-only execution environment.
  - `sidecar.spec` is provided and build instructions are documented.
  - Windows/macOS binary execution validation remains to be completed in CI or
    per-OS dev hosts.

## Handshake timing note

- Local test asserts `ping -> pong` in under 1 second in the current
  environment. This is a unit-level benchmark, not yet a packaged-binary
  cold-start benchmark on Windows/macOS/Linux release artifacts.
