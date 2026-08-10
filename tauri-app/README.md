# tauri-app — Radio Cartographer modern port

uv workspace + Tauri 2 + React + TypeScript + Vite, with a Python 3.13 engine
bundled as a sidecar binary. The full plan is in
[`../agents/tauri_plan.md`](../agents/tauri_plan.md).

**Current state:** a working, packaged desktop app (current version 0.1.4). The
engine has byte-compatible codecs for every legacy format, the full numerics
(scan/survey reduction, calibration, image gridding + composition), and a
JSON-RPC server; the React UI drives the whole legacy workflow plus FITS export
and RGB composition; and `just package` produces installable bundles. Active
work is usability polish — see
[`../docs/tester-feedback-triage.md`](../docs/tester-feedback-triage.md).

## Prerequisites

- [`uv`](https://github.com/astral-sh/uv) (manages Python 3.13 itself — no need
  to install Python by hand)
- [`just`](https://github.com/casey/just) (task runner)
- Node.js — pinned to 22 via [`app/.nvmrc`](app/.nvmrc). With nvm installed,
  run `cd app && nvm install && nvm use` once. Vite 7's dev server requires
  Node 20.19+ or 22.12+.
- Rust stable (for the Tauri shell)
- Platform extras for Tauri 2: see the
  [Tauri prerequisites guide](https://v2.tauri.app/start/prerequisites/)

### Windows note

uv on Windows occasionally needs the
[`LongPathsEnabled`](https://learn.microsoft.com/en-us/windows/win32/fileio/maximum-file-path-limitation)
registry flag — set it before the first `uv sync` to avoid path-length errors
on deeply nested deps.

## One-time setup

From this directory:

```
uv sync
cd app && npm install && cd ..
```

## Day-to-day

```
just sync        # uv sync
just test        # pytest (engine)
just lint        # ruff
just typecheck   # mypy
just dev         # launch the desktop app with hot reload
just build       # Vite production bundle
just sidecar     # (Phase 3) PyInstaller sidecar binary
just package     # (Phase 6) Tauri bundle (.msi/.dmg/.AppImage)
```

`just` with no recipe lists everything.

> Run the engine through `just test` / `uv run pytest` (or an activated
> `.venv`), never a bare `python`/`pytest`. The engine pins Python 3.13
> (`requires-python = "==3.13.*"`) and uses 3.10+ syntax; a system interpreter
> like 3.9 on `PATH` fails with errors such as `zip() takes no keyword
> arguments`. `uv` selects the pinned 3.13 for you.

### Live development loop

`just dev` sources nvm (if installed), runs `nvm use` against
[`app/.nvmrc`](app/.nvmrc) so Node 22 is active for the session, then runs
`tauri dev`, which:

- starts Vite on `http://localhost:1420` with React HMR — saving a `.tsx` /
  `.css` file under `app/src/` updates the running window without losing state.
- watches `app/src-tauri/` and recompiles + relaunches the desktop window when
  Rust changes.
- ignores `app/src-tauri/target/` and the Vite `dist/` so Rust rebuilds don't
  trigger Vite reloads and vice versa.

First launch compiles Tauri's Rust deps from scratch (~30–60 s on a warm
toolchain, longer cold). Subsequent launches are incremental. Quit the desktop
window or press Ctrl-C in the terminal to stop both processes.

The Rust shell spawns and supervises the Python engine as part of `tauri dev`,
so the running window is wired to the live sidecar. In development the engine
runs from source via `uv`; `just package` bundles the PyInstaller binary
instead.

## Layout

```
tauri-app/
├── pyproject.toml         uv workspace root, Python 3.13 pin, dev tools
├── uv.lock                committed; reproducible Python deps
├── .python-version        3.13
├── justfile               canonical task list
├── engine/                Python engine (codecs, numerics, JSON-RPC)
│   ├── pyproject.toml     runtime deps (numpy, astropy)
│   ├── sidecar.spec       PyInstaller spec for the standalone binary
│   ├── PROTOCOL.md        JSON-RPC method reference
│   ├── src/radio_cartographer/
│   │   ├── models.py      typed dataclasses returned by every codec
│   │   ├── io/            one module per legacy format + _vb_format helper
│   │   ├── rpc.py         JSON-RPC server (stdio) with binary side-channel
│   │   ├── scan.py, survey.py, calibration.py, flux_calibration.py
│   │   ├── image.py, image_compose.py, palette.py, workspace.py   numerics
│   │   └── io/fits.py     FITS reader/writer (astropy)
│   └── tests/             pytest suites (codecs, numerics, rpc, fixtures)
└── app/                   Tauri shell + React front-end
    ├── package.json
    ├── vite.config.ts
    ├── src/               React + TS UI (views/, dialogs, help, chrome)
    └── src-tauri/         Rust shell — spawns the engine sidecar (~Tauri 2.11)
```

Legacy-EXE oracle bytes live in [`../fixtures/`](../fixtures/) at the repo
root, hash-pinned via
[`../fixtures/MANIFEST.sha256`](../fixtures/MANIFEST.sha256).

## What works today

The full pipeline is functional and packaged:

- **Codecs** — byte-compatible read/write for every legacy format (`.md1`,
  `.md2`, `.scn`, `.srv`, `.cal`, `.pal`, `.img`, `.bmp`), plus FITS.
- **Numerics** — scan and survey reduction (smooth, baseline, align, cuts, RFI
  removal), telescope and flux calibration, image gridding, and image
  composition (append / superimpose / bi-/tri-color RGB, including N-way).
- **RPC engine** — a JSON-RPC 2.0 server over stdio with a binary side-channel,
  documented in [`engine/PROTOCOL.md`](engine/PROTOCOL.md), packaged into a
  standalone binary via `just sidecar`.
- **UI** — the complete legacy workflow: scan/survey reduction, calibration,
  the pre-image steps, the scalar image viewer, RGB composition, a palette
  editor, in-context help, and native-style dialogs.
- **FITS export** — `Save Image As FITS…` with a minimal WCS header.
- **Packaging** — `just package` produces installable bundles
  (`.exe` setup / `.dmg` / `.AppImage`); current version 0.1.4.
- **Tests & CI** — `just test` runs the engine (pytest) and front-end (vitest)
  suites; the Linux / macOS / Windows matrix runs them plus the Rust build on
  every push.

Remaining work is usability polish rather than missing capability — see
[`../docs/tester-feedback-triage.md`](../docs/tester-feedback-triage.md).

## Engine codec layer

The eight legacy formats each have a `read(path)` / `write(model, path)`
pair under [`engine/src/radio_cartographer/io/`](engine/src/radio_cartographer/io/),
returning the typed dataclasses in
[`models.py`](engine/src/radio_cartographer/models.py):

| Codec | Model | Notes |
|---|---|---|
| `pal.py` | `Palette` | Single-line `Str$`-joined VB format. |
| `cal.py` | `CalibrationTable` | 6-line header + 3×N body. |
| `md1.py` | `MD1Document` | Acquisition input; permissive parser; bytes pass-through on write. |
| `md2.py` | `MD2Document` | Multi-sweep input; `*`-separated sweeps; bytes pass-through on write. |
| `scn.py` | `Scan` | 8-line header + 4×Total body. Channel flag preserved. |
| `srv.py` | `Survey` | Header + sweep 0 (240 records) + per-sweep blocks. |
| `img.py` | `Image` | Binary `Put #` format: Int16-prefixed strings + Int16 pixel grid. |
| `bmp.py` | `Bitmap` | 24-bit BI_RGB bitmap export of the rendered image. |
| `fits.py` | `Image` | Single-HDU FITS with a minimal WCS header (astropy). |

Models carry an optional `raw_bytes` field — when a model came from disk,
`write` emits those bytes verbatim, guaranteeing byte-identity. Models built
programmatically fall through to the per-codec serializer, which
consults [`io/_vb_format.py`](engine/src/radio_cartographer/io/_vb_format.py)
for VB's `Print #1` / `Str$` / `Format$` rules. The Channel-B filename guard
(stem ending in `b`) lives in
[`io/common.py`](engine/src/radio_cartographer/io/common.py).
