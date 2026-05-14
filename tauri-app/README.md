# tauri-app — Radio Cartographer modern port

uv workspace + Tauri 2 + React + TypeScript + Vite, with a Python 3.13 engine
that will be wrapped as a sidecar binary. The full plan is in
[`../agents/tauri_plan.md`](../agents/tauri_plan.md); this directory implements
**Phase 0a — workspace bootstrap**.

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
│   ├── pyproject.toml
│   ├── src/radio_cartographer/
│   └── tests/
├── app/                   Tauri shell + React front-end
│   ├── package.json
│   ├── vite.config.ts
│   ├── src/               React + TS
│   └── src-tauri/         Rust shell (Cargo.toml pinned to ~Tauri 2.11)
└── fixtures/              Legacy-EXE oracle bytes (populated in Phase 0b)
```

## What works today (Phase 0a exit criteria)

- `uv sync` resolves the workspace and creates `.venv/`.
- `just test` runs pytest and passes (one trivial smoke test that imports the
  package; real tests land in Phase 1 alongside their codecs).
- `just lint`, `just typecheck` run clean.
- `cd app && npm install && npm run build` produces a Vite bundle.
- `cargo check --release` from `app/src-tauri/` compiles the Tauri shell.
- CI matrix (Linux / macOS / Windows) runs all of the above on every push.

What does *not* work yet — by design, deferred to later phases:

- No codecs, no numerics, no RPC.
- No sidecar binary; `just sidecar` is a stub.
- `just package` (Tauri bundle) needs the sidecar, so it is also deferred.
