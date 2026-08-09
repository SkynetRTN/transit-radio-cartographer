# Radio Cartographer

Software for reducing and visualizing single-dish radio-astronomy survey data.
Originally written in Visual Basic 5 by **Daniel E. Reichart** (1996–1997) for
the **Educational Research In Radio Astronomy (ERIRA)** program at the
**National Radio Astronomy Observatory (NRAO)**, Green Bank, WV.

This repository holds two things:

1. The **legacy VB5 source** ([vb/](vb/)) — read-only, preserved as the
   byte-for-byte oracle for the port's behavior.
2. A **modern, cross-platform reimplementation** ([tauri-app/](tauri-app/)) —
   Tauri 2 + React + a Python 3.13 engine. This is now a working, packaged
   desktop application (Windows / macOS / Linux) that reproduces the legacy
   workflow and adds FITS export.

## Repository layout

| Path | Contents |
|---|---|
| [tauri-app/](tauri-app/) | The modern port — Tauri 2 (Rust) shell + React/TypeScript UI + Python engine. See [tauri-app/README.md](tauri-app/README.md). |
| [vb/](vb/) | Legacy VB5 source (`.frm`, `.vbp`) and prebuilt Windows executables. Read-only reference. |
| [fixtures/](fixtures/) | Golden test data captured from `vb/KARALEAH2002.exe`, hash-pinned via [fixtures/MANIFEST.sha256](fixtures/MANIFEST.sha256) and enforced in CI. |
| [docs/](docs/) | End-user tutorial PDF, the reimplementation analysis ([REIMPLEMENTATION_PLAN.md](docs/REIMPLEMENTATION_PLAN.md)), and the [tester-feedback triage](docs/tester-feedback-triage.md). |
| [agents/](agents/) | Phase-by-phase implementation plan and progress reports ([tauri_plan.md](agents/tauri_plan.md)). |
| [AGENT.md](AGENT.md) | Detailed inventory of the legacy codebase, the port layout, and conventions. |

## The modern app — [tauri-app/](tauri-app/)

A three-layer desktop application (design rationale in
[agents/tauri_plan.md](agents/tauri_plan.md), which is downstream of
[docs/REIMPLEMENTATION_PLAN.md](docs/REIMPLEMENTATION_PLAN.md)):

- **Tauri 2 shell (Rust, `~2.11`)** — native window, menu bar, file dialogs,
  and lifecycle management for the Python sidecar. It bridges the React UI and
  the engine over JSON-RPC.
- **React + TypeScript + Vite front-end** — view and interaction only, no
  science logic. Full menu-driven UI mirroring the legacy forms: scan and
  survey reduction, scan/survey calibration, the pre-image reduction steps,
  the scalar image viewer, RGB (bi/tri-color) composition, a palette editor,
  in-context help, and native-style dialogs.
- **Python 3.13 engine** (`radio_cartographer`, uv-managed) — file-format
  codecs, numerics (numpy + astropy), and a JSON-RPC server over stdio. It is
  bundled into a standalone sidecar binary with PyInstaller.

### What the app does

The port reproduces the legacy Survey-reduction pipeline end to end and layers
new capabilities on top:

- **Backward-compatible I/O** for every legacy format — `.md1`, `.md2`, `.scn`,
  `.srv`, `.img`, `.cal`, `.pal`, `.bmp` — with byte-identical round-trips
  enforced against the captured fixtures.
- **Scan and survey reduction** — smoothing, baselining, sweep alignment,
  segment cuts, RFI removal, and image gridding (with the on-sky pixel and
  RA/cos(dec) handling the legacy app performed inline).
- **Calibration** — telescope calibration from known-source scans and flux
  calibration to Janskys.
- **Image composition** — append, superimpose, and bi/tri-color RGB combines,
  including N-way composites resampled onto a single union grid.
- **FITS export** — `Save Image As FITS…` with a minimal WCS header, alongside
  the legacy `.img` and `.bmp` writers.

The engine's full RPC surface is documented in
[tauri-app/engine/PROTOCOL.md](tauri-app/engine/PROTOCOL.md).

### Status

The port has moved through the planned phases — codecs, numerics, the RPC
engine + sidecar binary, FITS export, the Tauri/React UI, and packaging — and
now builds installable bundles (current version 0.1.4). Active work is
usability polish driven by tester feedback; see
[docs/tester-feedback-triage.md](docs/tester-feedback-triage.md).

### Build & run

From [tauri-app/](tauri-app/) (see [tauri-app/README.md](tauri-app/README.md)
for prerequisites — `uv`, `just`, Node 22, and the Rust/Tauri toolchain):

```
uv sync                  # Python engine deps into .venv/
cd app && npm install    # front-end deps

just dev                 # launch the desktop app with hot reload
just test                # engine (pytest) + front-end (vitest)
just sidecar             # build the standalone engine binary (PyInstaller)
just package             # produce the platform bundle (.exe / .dmg / .AppImage)
```

CI runs the engine and front-end test suites plus the Rust build on a
Linux / macOS / Windows matrix on every push.

## The legacy app — [vb/](vb/)

The original **Windows-only VB5 build** (`vb/KARALEAH2002.exe`), which requires
the VB5 runtime `MSVBVM50.DLL`. It is not maintained — it is kept as the
byte-for-byte behavioral oracle for the port. It does not build on macOS/Linux
and has no modern build script; the `.OBJ` files under [vb/](vb/) are VB5
intermediate output, not COFF/ELF objects. See [AGENT.md](AGENT.md) for a full
tour of the forms, file formats, and VB conventions, and for the intended
end-user workflow distilled from the tutorial.

## Quick links

- Modern port setup and day-to-day commands: [tauri-app/README.md](tauri-app/README.md)
- Engine RPC protocol: [tauri-app/engine/PROTOCOL.md](tauri-app/engine/PROTOCOL.md)
- Packaging notes: [tauri-app/PACKAGING.md](tauri-app/PACKAGING.md)
- Implementation plan and phase reports: [agents/tauri_plan.md](agents/tauri_plan.md)
- Architecture comparison (5 candidate stacks): [docs/REIMPLEMENTATION_PLAN.md](docs/REIMPLEMENTATION_PLAN.md)
- Legacy workflow walkthrough: [docs/Radio Cartographer Tutorial.docx.pdf](docs/Radio%20Cartographer%20Tutorial.docx.pdf)
- Codebase orientation for contributors: [AGENT.md](AGENT.md)
- Fixture provenance and binary-equality policy: [fixtures/README.md](fixtures/README.md)
- Third-party licenses: [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md)
