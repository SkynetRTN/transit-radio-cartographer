# Packaging Radio Cartographer

How the installers are built, what's inside them, and how to ship a new
release. Windows and Linux are built automatically in CI on a version tag;
macOS is similar but untried — see the bottom.

## Architecture in one paragraph

The Tauri shell (Rust + React) is thin: all real work — file codecs,
calibration math, image generation, ~50 RPC methods — lives in the Python
engine at `engine/`. The frontend talks to the engine via a single Tauri
command `rpc_request` that pipes JSON-RPC over the sidecar's stdin/stdout.
A bare `tauri build` would produce an installer that launches but crashes on
first action because the sidecar spawn defaults to `uv run python -m
radio_cartographer.rpc`, and lab machines don't have uv. The fix is the
standard Tauri sidecar pattern: PyInstaller freezes the engine into a
self-contained .exe, Tauri's `externalBin` config bundles it next to the
main exe, and at install time the shell spawns that bundled .exe instead of
`uv`.

## End-to-end build

From `tauri-app/`:

```bash
just package
```

That runs three stages in order:

1. **`just sidecar`** — PyInstaller freezes `engine/sidecar_entry.py` into
   `app/src-tauri/binaries/radio-cartographer-engine.exe`, then renames it to
   `radio-cartographer-engine-x86_64-pc-windows-msvc.exe` (Tauri's
   externalBin target-triple convention).
2. **`just build`** — `npm install && npm run build` produces the Vite
   production bundle at `app/dist/`.
3. **`npm run tauri build`** — Cargo compiles the Rust shell in release
   mode, then makensis packages everything into the NSIS installer.

Final output: `app/src-tauri/target/release/bundle/nsis/Radio Cartographer_<version>_x64-setup.exe`

## What's in the installer (~30 MB)

| Component | Source | Notes |
|---|---|---|
| Vite-built React frontend | `app/dist/` | Standard Tauri webview content |
| Tauri shell (`Radio Cartographer.exe`) | `app/src-tauri/` | Rust binary, ~2 MB |
| Frozen Python engine (`radio-cartographer-engine.exe`) | `engine/` via PyInstaller | ~28 MB |
| Icons | `app/src-tauri/icons/` | Already shipped |

The frozen engine bundles a trimmed Python 3.13 + numpy + a heavily-pruned
astropy (only `astropy.io.fits` + utilities; visualization, coordinates,
wcs, modeling, table, etc. excluded). See "Astropy hook override" below for
why this matters.

## Sidecar spawn behavior

`app/src-tauri/src/sidecar.rs` picks one of three commands in priority
order:

1. `RADIO_CART_SIDECAR_CMD` env var (for tests)
2. The bundled `.exe` next to the main exe (production) — only used when
   the file actually exists, so dev builds aren't affected
3. `uv run python -m radio_cartographer.rpc` (development fallback)

All three pass `CREATE_NO_WINDOW` on Windows so no console flashes when the
sidecar is spawned. The bundled exe is additionally built with
`console=False`, which makes Windows skip the console allocation entirely.

## Gotchas worth knowing

These all bit us during the initial build. The fixes are committed but
worth knowing if you ever touch the spec.

### 1. Astropy hook override

The upstream `_pyinstaller_hooks_contrib/stdhooks/hook-astropy.py` does
`collect_submodules('astropy')`, which imports every astropy submodule to
enumerate them. That includes `astropy.visualization.wcsaxes`, whose
`__init__.py` calls `pytest.importorskip("matplotlib")` and raises
`Skipped` when matplotlib is absent — which PyInstaller doesn't catch.
Result: `just sidecar` crashes during analysis.

Fix: `engine/pyinstaller-hooks/hook-astropy.py` overrides the contrib hook
with a narrower one that only collects `astropy.io.fits` plus the small
set of utilities it needs. The override is wired up via the `hookspath=`
list in `engine/sidecar.spec`. If a future engine change starts using
`astropy.coordinates` or similar, add it to the hook's `hiddenimports`.

### 2. Spec path resolution

PyInstaller resolves paths in a .spec file relative to **the spec file's
directory**, not the cwd. We compute `SPEC_DIR` at the top of
`engine/sidecar.spec` and prefix it to `hookspath` and `pathex` so the
spec works regardless of where `pyinstaller` is invoked from.

### 3. `sidecar_entry.py` wrapper

`engine/src/radio_cartographer/rpc.py` uses relative imports
(`from . import ...`). If you point PyInstaller at it directly, it freezes
as `__main__` with no parent package and the relative imports break at
runtime. `engine/sidecar_entry.py` is a one-line wrapper that imports
`serve` from the proper package context. The spec points at this wrapper.

### 4. Astropy `CITATION` and other data files

The hook override collects astropy data files via
`collect_data_files("astropy", includes=[...])` — make sure new patterns
are added if astropy ever asks for a config or data file at runtime that
isn't already covered.

### 5. Don't commit `tauri-app/build/`

PyInstaller writes intermediate cache to `tauri-app/build/sidecar/` (a
7.9 MB PYZ archive, a 28 MB binary, plus a 36K-line xref HTML). The
final exe lands in `app/src-tauri/binaries/` (which IS gitignored). The
`build/` directory is in `.gitignore` as of PR #13 — don't remove it.

### 6. Version has to match in two places

`tauri.conf.json` and `Cargo.toml` both carry the app version. Tauri
warns if they drift and uses the conf value. Bump both when cutting a
release.

## Releasing a new version

Releases are built by CI: pushing a `v<version>` tag triggers
`.github/workflows/release.yml`, which runs `just package` on
`windows-latest` and `ubuntu-22.04` and attaches every installer to a
draft GitHub release. You review the draft and publish.

1. If `version` in `app/src-tauri/tauri.conf.json` and
   `app/src-tauri/Cargo.toml` has already been released, bump both,
   commit, and merge to main. (Skip if the current version was bumped but
   never tagged — check `git tag --list`.)
2. Tag the release commit on main and push the tag:
   ```bash
   git tag v<version>
   git push origin v<version>
   ```
3. Wait for the `release` workflow (~15–25 min cold, faster with warm
   caches). A draft release appears under **Releases** with the Windows
   `.exe` and the Linux `.deb`, `.rpm`, and `.AppImage` attached. The
   sidecar ping smoke test runs inside `just package` on both runners, so
   a frozen engine that can't start fails the build rather than shipping.
4. Open the draft on github.com:
   - Title: `Radio Cartographer v<version> — <short summary>`
   - Check *Set as the latest release*, publish
5. Share the release URL with the lab.
   - **Windows** members will see a SmartScreen warning (the installer is
     unsigned) — they click **More info → Run anyway**. This is expected
     for internal distribution; signing requires an EV/OV certificate
     that isn't worth it for lab-internal builds.
   - **Linux** members who don't know their distro should grab the
     `.AppImage`: it runs on any distro with no install —
     `chmod +x`, then double-click or `./Radio*.AppImage`. The `.deb`
     (Ubuntu/Debian) and `.rpm` (Fedora/RHEL) are for people who prefer a
     managed install with a menu entry.

A manual local build (`just package` from `tauri-app/`) still works and
produces the same artifacts for the current OS — useful for smoke-checking
before tagging. To verify a locally built engine responds:
```bash
echo '{"jsonrpc":"2.0","id":1,"method":"ping","params":{}}' \
  | ./app/src-tauri/binaries/radio-cartographer-engine-x86_64-pc-windows-msvc.exe
```
Expect: `{"jsonrpc": "2.0", "id": 1, "result": "pong"}`.

### Linux notes

- The workflow pins `ubuntu-22.04` (not `-latest`) on purpose: binaries
  inherit the build machine's glibc floor, so building on the oldest
  supported Ubuntu keeps the bundles runnable everywhere newer. Don't
  "upgrade" the runner without deciding to drop older machines.
- The AppImage bundles webkit2gtk, so it's ~100 MB — much bigger than the
  Windows installer. Normal, not a regression.

## Excluded by design

Lab-internal artifacts (`agents/`, `docs/`, `fixtures/`, `vb/`, the
PyInstaller intermediate cache) live outside `tauri-app/` and are not
referenced by the Tauri config or the Rust shell, so they're never
included in the installer. No exclusion config needed — the bundle scope
is naturally limited to `tauri-app/`.

## macOS (not yet attempted)

The infrastructure is mostly ready: `justfile` already branches on
`os_name`, the `_sidecar-unix` recipe computes the target triple via
`rustc -vV`, and `sidecar.spec` is OS-agnostic. To produce a macOS .dmg
later you'll need to:

- Add `"dmg"` (and optionally `"app"`) to `bundle.targets` in
  `tauri.conf.json`, ideally behind a per-OS override so the Windows
  build doesn't also try to build .dmg
- Decide on Apple Silicon vs Intel: either build twice (one per
  architecture) or use `--target-arch universal2` in the PyInstaller
  invocation
- Gatekeeper will quarantine unsigned downloads — ad-hoc `codesign --sign
  -` is enough for personal sideloads, full notarization needs an Apple
  Developer ID (~$99/yr)
- Re-verify the astropy hook override — astropy on macOS may pull in
  different data files than on Windows; rerun the ping smoke test against
  the frozen binary before declaring done
