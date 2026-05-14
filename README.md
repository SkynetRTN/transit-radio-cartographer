# Radio Cartographer (Karaleah)

A Visual Basic 5 desktop application for reducing and visualizing single-dish
radio-astronomy survey data. Originally written by **Daniel E. Reichart**
(1996–1997) for the **Educational Research In Radio Astronomy (ERIRA)** program
at the **National Radio Astronomy Observatory (NRAO)**, Green Bank, WV.

This repository preserves the legacy VB5 source and tracks the design work for
a modern, cross-platform reimplementation.

## Repository layout

| Path | Contents |
|---|---|
| [vb/](vb/) | Legacy VB5 source (`.frm`, `.vbp`) and prebuilt Windows executables. Read-only. |
| [tauri-app/](tauri-app/) | Modern cross-platform port — Tauri 2 + React + Python 3.13 (uv workspace). See [tauri-app/README.md](tauri-app/README.md). |
| [fixtures/](fixtures/) | Golden test data captured from `vb/KARALEAH2002.exe`. Hash-pinned via [fixtures/MANIFEST.sha256](fixtures/MANIFEST.sha256) and enforced in CI. |
| [docs/](docs/) | End-user tutorial PDF; comparative reimplementation plan ([REIMPLEMENTATION_PLAN.md](docs/REIMPLEMENTATION_PLAN.md)). |
| [agents/](agents/) | Implementation plan and per-phase progress ([tauri_plan.md](agents/tauri_plan.md), [tauri_plan_phase_1.md](agents/tauri_plan_phase_1.md)). |
| [AGENT.md](AGENT.md) | Detailed inventory of the legacy codebase, the modern port layout, and per-phase status. |

## Status

- **Legacy app:** Windows-only VB5 build (`vb/KARALEAH2002.exe`). Requires
  the VB5 runtime (`MSVBVM50.DLL`). Not maintained — kept as the
  byte-for-byte oracle for the port.
- **Modern reimplementation:** under way in [tauri-app/](tauri-app/).
  - Phase 0a (workspace bootstrap) — done. `uv sync`, `just test`,
    `just build`, and `cargo check` are all green; CI matrix covers
    Linux / macOS / Windows.
  - Phase 0b (fixture capture) — done. 44 fixtures across `.md1`, `.md2`,
    `.scn`, `.srv`, `.cal`, `.img` checked in under [fixtures/](fixtures/).
  - Phase 1 (codecs) — done. Read/write modules for every legacy format
    with byte-identical round-trip on every fixture (94 tests passing).
    Details: [agents/tauri_plan_phase_1.md](agents/tauri_plan_phase_1.md).
  - Phases 2–6 (numerics, RPC, pipeline + FITS, UI, release) — not started.
    See [agents/tauri_plan.md §8](agents/tauri_plan.md) for the gate criteria.

## Quick links

- Legacy workflow walkthrough: [docs/Radio Cartographer Tutorial.docx.pdf](docs/Radio Cartographer Tutorial.docx.pdf)
- Architecture comparison (5 candidate stacks): [docs/REIMPLEMENTATION_PLAN.md](docs/REIMPLEMENTATION_PLAN.md)
- Chosen-stack implementation plan: [agents/tauri_plan.md](agents/tauri_plan.md)
- Phase 1 progress report: [agents/tauri_plan_phase_1.md](agents/tauri_plan_phase_1.md)
- Codebase orientation for contributors: [AGENT.md](AGENT.md)
- Modern port setup / day-to-day commands: [tauri-app/README.md](tauri-app/README.md)
- Fixture provenance and binary-equality policy: [fixtures/README.md](fixtures/README.md)
