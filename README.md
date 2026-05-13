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
| [docs/](docs/) | End-user tutorial PDF; comparative reimplementation plan ([REIMPLEMENTATION_PLAN.md](docs/REIMPLEMENTATION_PLAN.md)). |
| [agents/](agents/) | Concrete implementation plans for chosen stacks ([tauri_plan.md](agents/tauri_plan.md)). |
| [AGENT.md](AGENT.md) | Detailed inventory of the legacy codebase, workflow, file formats, and conventions. |

## Status

- **Legacy app:** Windows-only VB5 build (`vb/KARALEAH2002.exe`). Requires
  the VB5 runtime (`MSVBVM50.DLL`). Not maintained.
- **Modern reimplementation:** in design. The current target architecture is
  **Tauri + React + Python 3.13** (managed with `uv`); see
  [agents/tauri_plan.md](agents/tauri_plan.md) for the full plan including
  test-first phases and FITS export support.

## Quick links

- Legacy workflow walkthrough: [docs/Radio Cartographer Tutorial.docx.pdf](docs/Radio Cartographer Tutorial.docx.pdf)
- Architecture comparison (5 candidate stacks): [docs/REIMPLEMENTATION_PLAN.md](docs/REIMPLEMENTATION_PLAN.md)
- Chosen-stack implementation plan: [agents/tauri_plan.md](agents/tauri_plan.md)
- Codebase orientation for contributors: [AGENT.md](AGENT.md)
