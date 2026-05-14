# tauri-app — Radio Cartographer modern port

uv workspace + Tauri 2 + React + TypeScript + Vite, with a Python 3.13 engine
that will be wrapped as a sidecar binary. The full plan is in
[`../agents/tauri_plan.md`](../agents/tauri_plan.md).

**Current state:** Phase 0a (workspace bootstrap) and Phase 1 (codecs) are
done. The engine has read/write modules for every legacy file format with
byte-identical round-trip on every fixture (94 tests passing). The Rust shell
and React front-end are still placeholders — the UI lands in Phase 5. See
[`../agents/tauri_plan_phase_1.md`](../agents/tauri_plan_phase_1.md) for the
Phase 1 progress report.

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

The Python sidecar isn't wired in yet (Phase 3), so for now `just dev` only
shows the React shell. Once the sidecar lands, Tauri will spawn it as part of
`tauri dev` automatically.

## Layout

```
tauri-app/
├── pyproject.toml         uv workspace root, Python 3.13 pin, dev tools
├── uv.lock                committed; reproducible Python deps
├── .python-version        3.13
├── justfile               canonical task list
├── engine/                Python sidecar (codecs, numerics, JSON-RPC)
│   ├── pyproject.toml     runtime deps (numpy; scipy/astropy land in Phase 2+)
│   ├── src/radio_cartographer/
│   │   ├── models.py      typed dataclasses returned by every codec
│   │   └── io/            one module per legacy format + _vb_format helper
│   └── tests/
│       └── io/            one test file per format + fixture-manifest check
└── app/                   Tauri shell + React front-end
    ├── package.json
    ├── vite.config.ts
    ├── src/               React + TS (placeholder shell — see App.tsx)
    └── src-tauri/         Rust shell (Cargo.toml pinned to ~Tauri 2.11)
```

Legacy-EXE oracle bytes live in [`../fixtures/`](../fixtures/) at the repo
root (44 files captured in Phase 0b; hash-pinned via
[`../fixtures/MANIFEST.sha256`](../fixtures/MANIFEST.sha256)).

## What works today

Phase 0a + Phase 1 exit criteria are all green:

- `uv sync` resolves the workspace and creates `.venv/`.
- `just test` runs pytest — **94 tests passing**, including byte-identical
  round-trip for every fixture across `.md1`, `.md2`, `.scn`, `.srv`, `.cal`,
  `.pal`, and `.img`. The `.bmp` codec round-trips opaque bytes; a real
  fixture capture is deferred to Phase 6.
- `just lint`, `just typecheck` run clean (ruff + mypy strict).
- `cd app && npm install && npm run build` produces a Vite bundle.
- `cargo check --release` from `app/src-tauri/` compiles the Tauri shell.
- CI matrix (Linux / macOS / Windows) runs all of the above on every push.

What does *not* work yet — by design, deferred to later phases:

- **Numerics** (Phase 2) — survey/scan/calibration/image/palette reductions.
  Codecs read fixture files into typed dataclasses; nothing operates on them
  yet.
- **RPC + sidecar binary** (Phase 3) — `just sidecar` is a stub.
- **FITS export** (Phase 4).
- **The actual UI** (Phase 5) — `just dev` launches a placeholder React shell
  with no menus, no plots, and no engine wired in.
- **Packaging** (Phase 6) — `just package` needs the sidecar.

## Engine codec layer (Phase 1)

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
| `bmp.py` | `Bitmap` | Opaque bytes for now; real fixture capture in Phase 6. |

Models carry an optional `raw_bytes` field — when a model came from disk,
`write` emits those bytes verbatim, guaranteeing byte-identity. Models built
programmatically (Phase 2+) fall through to the per-codec serializer, which
consults [`io/_vb_format.py`](engine/src/radio_cartographer/io/_vb_format.py)
for VB's `Print #1` / `Str$` / `Format$` rules. The Channel-B filename guard
(stem ending in `b`) lives in
[`io/common.py`](engine/src/radio_cartographer/io/common.py).
