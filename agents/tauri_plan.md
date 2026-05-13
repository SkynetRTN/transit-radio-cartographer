# Radio Cartographer — Tauri + React + Python Reimplementation Plan

Concrete implementation plan for porting the VB5 "Karaleah / Radio Cartographer"
app onto a **Tauri + React + Python** stack. This document is downstream of
[docs/REIMPLEMENTATION_PLAN.md](../docs/REIMPLEMENTATION_PLAN.md) (which surveyed
five candidate architectures) and assumes that option **C — Tauri shell + web
front-end + Python sidecar** has been chosen.

Source-of-truth references:
- [AGENT.md](../AGENT.md) — current VB5 inventory and workflow.
- [docs/Radio Cartographer Tutorial.docx.pdf](../docs/Radio Cartographer Tutorial.docx.pdf) — the canonical end-user workflow we must preserve.
- [docs/REIMPLEMENTATION_PLAN.md](../docs/REIMPLEMENTATION_PLAN.md) — comparative analysis of stack options.

---

## 1. Goals and non-goals

**Goals.**
1. **Complete backward compatibility** with every existing file format
   (`.md1`, `.md2`, `.scn`, `.srv`, `.img`, `.cal`, `.pal`, `.bmp`).
2. **FITS export** as a new capability — `Image → Save Image As FITS…`
   alongside the existing `.img` and `.bmp` saves.
3. **UI close to the original** — same menus, same workflow order, same
   button labels. Avoid web-app polish that would re-train the user.
4. **Cross-platform** binaries for Windows, macOS, Linux.
5. **Tests written before code** — every parser, every numeric routine, every
   reduction step has a fixture-driven test in place *before* the matching
   implementation lands.

**Non-goals (explicitly out of scope).**
- Code signing / notarization (Apple Developer ID, Windows EV cert) —
  deferred indefinitely. Builds will be unsigned; users accept the OS
  warning on first launch.
- Web hosting / multi-user / collaboration features.
- New science features beyond FITS export.
- UI redesign — visual modernization is *not* a goal; clarity and fidelity
  to the VB5 layout are.

---

## 2. Stack overview

```
┌──────────────────────────────────────────────────────────┐
│  Tauri shell (Rust, ~thin)                               │
│   • OS window, menu bar, file dialogs                    │
│   • Spawns and supervises the Python sidecar             │
│   • Bridges React ↔ Python over JSON-RPC (stdio)         │
└─────────────────┬─────────────────────┬──────────────────┘
                  │                     │
                  ▼                     ▼
   ┌──────────────────────┐   ┌──────────────────────────┐
   │  React + TypeScript  │   │  Python 3.13 sidecar      │
   │  (Vite, TanStack     │   │  (radio_cartographer pkg) │
   │   Query, plotly.js   │   │   • file I/O codecs       │
   │   for plots)         │   │   • numerics (numpy/scipy)│
   │                      │   │   • astropy (FITS, WCS,   │
   │  Front-end is purely │   │     coords, units)        │
   │  view + interaction; │   │   • exposes JSON-RPC over │
   │  no science logic.   │   │     stdio                 │
   └──────────────────────┘   └──────────────────────────┘
```

**Why Tauri (not Electron):** Tauri ships a ~10 MB binary using the OS's
native WebView (WKWebView on macOS, WebView2 on Windows, WebKitGTK on Linux),
versus Electron's ~150 MB Chromium bundle. Smaller updates, less RAM, less
attack surface. No code signing means we want the smallest plausible
binary anyway.

**Why a Python sidecar (not pure JS/Rust numerics):** astropy. The current
app does its own RA/Dec math and rolls its own FFT/baseline fits. Astropy
replaces all of that with vetted implementations:
- `astropy.io.fits` for the new FITS export.
- `astropy.wcs.WCS` for the gridded-image coordinate system.
- `astropy.coordinates.SkyCoord` for RA/Dec handling.
- `astropy.units` for Jy/count bookkeeping in calibration.
- `astropy.stats.sigma_clipped_stats` for RFI rejection.

**Sidecar transport.** JSON-RPC over the Python process's stdin/stdout,
spawned by Tauri's command API. For the bulky payloads (the 570×2000
Ra/Dec/Flux cube and the gridded image bitmap), we use a streaming binary
side-channel: numpy `.npy`-encoded bytes prefixed with a length header,
referenced by handle in the JSON message. This keeps the wire format
debuggable for normal calls while staying fast for arrays.

---

## 3. Repository layout

All new code lives under a single top-level `tauri-app/` directory, which
holds the engine, the front-end, the fixtures, and the project-level
tooling (uv workspace root, top-level build scripts). The legacy VB source
in `vb/` and the design docs stay where they are.

```
ogrc/
├── AGENT.md
├── docs/
│   ├── REIMPLEMENTATION_PLAN.md          (existing)
│   └── Radio Cartographer Tutorial.docx.pdf
├── agents/
│   └── tauri_plan.md                     (this file)
├── vb/                                   (legacy source, read-only)
└── tauri-app/                            (NEW — everything modern lives here)
    ├── README.md                         (how to build/run the app)
    ├── pyproject.toml                    (uv workspace root; pins Python 3.13)
    ├── uv.lock                           (resolved, committed)
    ├── .python-version                   (`3.13`)
    ├── justfile                          (top-level task runner: build, test, package)
    ├── engine/                           (Python sidecar package, uv-managed)
    │   ├── pyproject.toml                (project metadata, deps)
    │   ├── src/
    │   │   └── radio_cartographer/
    │   │       ├── __init__.py
    │   │       ├── io/                   (one module per legacy format)
    │   │       │   ├── md1.py
    │   │       │   ├── md2.py
    │   │       │   ├── scn.py
    │   │       │   ├── srv.py
    │   │       │   ├── img.py
    │   │       │   ├── cal.py
    │   │       │   ├── pal.py
    │   │       │   ├── bmp.py
    │   │       │   └── fits.py           (NEW — FITS export only, no read)
    │   │       ├── survey.py             (Ra/Dec/Flux cube + reductions)
    │   │       ├── scan.py
    │   │       ├── calibration.py
    │   │       ├── image.py              (gridding, palette application)
    │   │       ├── palette.py
    │   │       └── rpc.py                (JSON-RPC server over stdio)
    │   └── tests/                        (see §6 — written FIRST)
    ├── app/                              (Tauri + React)
    │   ├── src-tauri/
    │   │   ├── Cargo.toml
    │   │   ├── tauri.conf.json
    │   │   └── src/
    │   │       └── main.rs               (sidecar lifecycle + IPC bridge)
    │   ├── src/                          (React + TS)
    │   │   ├── views/
    │   │   │   ├── MainWindow.tsx        (≈ karaleah.frm, menus)
    │   │   │   ├── SurveyView.tsx        (≈ survform.frm)
    │   │   │   ├── ScanView.tsx          (≈ scanform.frm)
    │   │   │   ├── CalibrationView.tsx   (≈ calform.frm)
    │   │   │   ├── PaletteEditor.tsx     (≈ dataform.frm)
    │   │   │   └── AboutBox.tsx          (≈ danform.frm)
    │   │   ├── ipc/
    │   │   │   └── client.ts             (JSON-RPC client to sidecar)
    │   │   └── lib/
    │   │       └── plots/                (Plotly wrappers)
    │   ├── package.json
    │   └── vite.config.ts
    └── fixtures/                         (golden test data, shared by engine + app)
        ├── inputs/                       (real .md1/.md2/.cal samples)
        ├── intermediates/                (real .srv/.scn from legacy EXE)
        ├── outputs/                      (real .img/.bmp from legacy EXE)
        └── README.md                     (provenance of each fixture)
```

**Why this shape.** Putting `engine/` and `app/` under one `tauri-app/`
parent gives us:

- A single uv workspace at `tauri-app/pyproject.toml` (Python 3.13 pinned
  via `.python-version`). Both `engine/` and any future Python tooling
  (build scripts, fixture-capture helpers) are workspace members, sharing
  one lockfile.
- A single `justfile` at `tauri-app/` for one-line tasks like
  `just test`, `just build`, `just sidecar` — no need to `cd` between
  directories.
- A clean separation between *legacy* (`vb/`, `docs/`) and *modern*
  (`tauri-app/`) so contributors know where to look.
- Easy future relocation: if the modern app ever moves to its own repo,
  it's a single directory to migrate.

---

## 4. Backward-compatibility strategy

The single hardest requirement. Strategy:

1. **Phase 0 — Fixture capture (before any other code).** Run
   `KARALEAH2002.exe` under a Windows VM on a representative dataset and
   capture every intermediate file at each step of the tutorial. Store
   under `tauri-app/fixtures/` with a README documenting provenance.
   These are the regression oracle.
2. **One Python codec module per legacy format.** Each module exposes
   `read(path) -> Model` and `write(Model, path) -> None`. The text formats
   are written with VB's `Print #1` semantics — leading space for positive
   numbers, `0` not `0.0`, CRLF line endings on Windows. We match those
   exactly by inspecting fixtures, not by guessing.
3. **Round-trip tests are the gate.** No reduction code is written until
   `read → write → byte-compare` is green for every fixture of every
   format.
4. **FITS is write-only.** We do not need to read FITS to satisfy
   backward compatibility; we just emit it as an alternative export. The
   FITS header carries the same WCS the legacy `.img` implies (CTYPE1
   = `'RA---TAN'`, CTYPE2 = `'DEC--TAN'`, reference pixel at image center,
   pixel scale derived from the survey grid).

---

## 5. UI fidelity — preserve, don't redesign

Concrete rules to keep the React UI close to the VB original:

| Original (VB5) | React port |
|---|---|
| Menu bar with **File / Image / Survey / Scan / Calibration** | Same menu bar via Tauri's native menu API. Same labels, same order, same enable/disable rules driven by app state. |
| Pseudo-MDI `backdrop.frm` with child forms layered on top | A single React root containing one active "view" component at a time (`SurveyView`, `ScanView`, etc.). Don't tab them; the user expects one workspace. |
| `survform.frm` with `Picture1..Picture9` panels (image, current sweep, all-sweeps strip, magnifier, palette swatch) | One Plotly `<Plot>` per panel, laid out in the same grid positions. Default fonts/colors close to VB defaults (Tahoma 8pt, grey background) — not the standard Plotly dark theme. |
| Drag from cut point to plot edge, double-click to confirm; right-click cancels | Plotly's `dragmode: 'select'` for the drag; `onDoubleClick` to confirm; right-click cancels. Highlight selection in green to match the VB visual. |
| `loaddata.frm` custom file dialog with caption-as-state-machine | Tauri's `dialog.open()` / `dialog.save()`. Same prompt wording as the menu items ("New Survey", "Save Image As", etc.). |
| Palette editor in `dataform.frm` with up to 100 control points, serialized through `SurvForm.Label8.Caption` | Same palette editor UI; serialization replaced by a typed React state + JSON-RPC call. Same `.pal` format on disk. |
| Default numeric prompts (`3`, `2`, etc. shown in the workflow) | Same prompt boxes, same defaults, same VB wording (e.g., the tutorial's instruction to "change the default `3` to `0.5`" still works literally). |
| About box crediting Daniel E. Reichart / ERIRA / NRAO | Same text, plus a "ported to Tauri 2026" footer. |

**Things we explicitly do not modernize:**
- No dark mode.
- No animations or transitions.
- No hamburger menus or hidden settings.
- No collapsible side panels — the original has none.
- No keyboard shortcut overhaul — keep VB's accelerators (`Alt+F`, etc.).

The bar is: an ERIRA student who learned the VB version should be able to
follow the tutorial PDF step-by-step on the new app without getting
confused at any step.

---

## 6. Test files needed BEFORE implementation

The team must produce these test files (with fixtures and assertions
filled in) *before* the corresponding production code is written. They
double as the spec.

### 6.1 Engine — codec tests (`tauri-app/engine/tests/io/`)

One file per legacy format. Each must include the listed cases.

- **`test_md1_io.py`** — raw single-sweep input
  - `test_read_minimal_md1_fixture` — parse the smallest checked-in `.md1`,
    assert sample count, RA/Dec/flux of first and last samples.
  - `test_read_full_md1_fixture` — parse a real tutorial `.md1`, assert
    array shape and a checksum of the flux column.
  - `test_rejects_b_channel` — a `…b.md1` filename should not be openable
    via "New Scan" (matching the tutorial's "do not use Channel-B" rule).
  - `test_malformed_truncated_file` — graceful error, no crash.

- **`test_md2_io.py`** — raw multi-sweep survey input
  - `test_read_minimal_md2` — sweep count, samples per sweep.
  - `test_read_full_tutorial_md2` — assert the Ra/Dec/Flux cube shape and
    a per-sweep flux checksum against a precomputed reference.
  - `test_rejects_b_channel_filename` — `…b.md2` is refused by `read_md2`.
  - `test_cube_dtype_is_float64` — guards against silent precision loss.

- **`test_scn_io.py`** — reduced scan
  - `test_round_trip_scn` — for every `.scn` fixture: `read → write → bytes
    identical` (including whitespace and line endings).
  - `test_scn_from_md1_matches_fixture` — running the scan reduction on a
    fixture `.md1` produces a `.scn` that matches the legacy `.scn`.

- **`test_srv_io.py`** — reduced survey
  - `test_round_trip_srv` — bytes-identical round-trip for every fixture.
  - `test_srv_carries_calibration_state` — a fixture `.srv` that was
    calibrated against `cal18a.cal` reads back with the calibration flag set
    and the Jy/count value preserved.

- **`test_img_io.py`** — gridded image
  - `test_round_trip_img` — bytes-identical for every fixture.
  - `test_img_pixel_layout_matches_legacy` — pixel-by-pixel agreement with
    a `.img` written by the legacy EXE on the tutorial `.md2` (within
    float tolerance).

- **`test_cal_io.py`** — calibration
  - `test_round_trip_cal` — bytes-identical.
  - `test_known_source_jy_values` — Virgo A = 213 Jy, Tau A = 942 Jy,
    Cyg A = 1581 Jy are hard-coded constants and surface in the right
    fields when we load a `.cal` written against them.

- **`test_pal_io.py`** — palette
  - `test_round_trip_pal` — for every checked-in palette fixture.
  - `test_palette_up_to_100_control_points` — boundary case.

- **`test_bmp_io.py`** — bitmap export
  - `test_write_bmp_matches_legacy_bytes` — `write_bmp(image)` matches the
    legacy `SavePicture` output for the tutorial image (this is the BMP
    variant VB writes — 24-bit, BI_RGB, no color table).

- **`test_fits_io.py`** — NEW format, write-only
  - `test_fits_write_produces_valid_file` — output passes
    `astropy.io.fits.verify('exception')`.
  - `test_fits_header_has_wcs` — CTYPE1/CTYPE2/CRVAL/CRPIX/CDELT all present
    and self-consistent.
  - `test_fits_data_matches_img_pixels` — pixel array of the FITS file
    equals the `.img` pixel array (allowing for the byte-order flip FITS
    requires).
  - `test_fits_round_trip_through_astropy` — read it back with
    `fits.open`, assert data identity.

### 6.2 Engine — numerics tests (`tauri-app/engine/tests/numerics/`)

These pin the math *independent* of file I/O. Most use synthetic inputs
where the analytical answer is known.

- **`test_fft.py`**
  - `test_fft_of_unit_impulse_is_flat` — replacement for the inlined
    `four1` FFT.
  - `test_fft_of_pure_sinusoid_has_single_peak` — at the correct bin.
  - `test_fft_matches_legacy_on_real_sweep` — same sweep through
    `numpy.fft.fft` and through a faithfully re-coded `four1` agree to
    machine precision.

- **`test_baseline.py`**
  - `test_baseline_subtracts_constant_offset` — pure DC sweep → zeros.
  - `test_baseline_subtracts_linear_drift` — a y = a + bx sweep → zeros.
  - `test_baseline_preserves_source_peak` — a Gaussian peak on a linear
    drift retains its amplitude within tolerance.

- **`test_smooth.py`**
  - `test_smooth_preserves_mean` — output mean matches input mean.
  - `test_smooth_reduces_noise` — std of smoothed Gaussian noise is lower
    than input by the expected factor for the chosen kernel.

- **`test_align.py`**
  - `test_align_with_zero_offset_is_noop` — passing offset = 0.5 (per the
    tutorial) on already-aligned synthetic sweeps changes nothing
    measurable.
  - `test_align_corrects_known_shift` — synthetic data with a deliberate
    sub-pixel shift returns aligned within tolerance.

- **`test_calibrate.py`**
  - `test_calibration_fit_passes_through_origin` (or near it, per the
    legacy fit form).
  - `test_calibration_converts_counts_to_jy` — apply a fitted cal to a
    synthetic measurement, assert Jy result.
  - `test_calibration_against_tutorial_cal18a` — load `cal18a.cal`, apply
    to the tutorial `.srv`, assert the resulting Jy values match the
    legacy `.img` to tolerance.

- **`test_image_gridding.py`**
  - `test_makeimage_default_parameters_match_legacy` — running
    `make_image` with the tutorial's `1` parameter on the tutorial
    `.srv` produces a `.img` equal to the legacy output.
  - `test_makeimage_pixel_scale_inverts_correctly` — the WCS derived from
    the grid metadata maps the source's known RA/Dec to the brightest
    pixel (this guards the FITS export).

- **`test_palette.py`**
  - `test_apply_palette_known_values` — a flat input image with a 2-stop
    palette produces a known output bitmap.
  - `test_palette_clamps_outside_flux_range` — values above `flux_max` are
    clamped (matching the tutorial's "tighten palette" step).

### 6.3 Engine — RPC tests (`tauri-app/engine/tests/rpc/`)

- **`test_rpc_handshake.py`** — sidecar starts, replies to a `ping`
  within 1 s, exits cleanly on `shutdown`.
- **`test_rpc_open_survey.py`** — `open_survey(path)` returns a survey
  handle and metadata; `get_sweep(handle, i)` returns the right array.
- **`test_rpc_binary_channel.py`** — large array round-trip
  (1000 × 2000 float64) through the side-channel matches input
  byte-for-byte.
- **`test_rpc_error_propagation.py`** — a malformed `.md2` surfaces as a
  structured JSON-RPC error, not a sidecar crash.

### 6.4 Engine — end-to-end pipeline tests (`tauri-app/engine/tests/pipeline/`)

These replay the tutorial workflow headlessly against fixtures.

- **`test_tutorial_pipeline_scan.py`** — open tutorial `.md1`, baseline,
  cut, calibrate, save `.scn` → matches checked-in `.scn`.
- **`test_tutorial_pipeline_survey.py`** — open tutorial `.md2`,
  calibrate against `cal18a.cal`, cut bad segments (script-replays the
  same cut coordinates the human chose in the tutorial), baseline each
  sweep, smooth, baseline, align(0.5), make_image(1) → matches
  checked-in `.img` and `.bmp`.
- **`test_tutorial_pipeline_fits_export.py`** — same as above plus
  `export_fits(path)` → produced FITS passes verify + reopens with
  data identical to the `.img`.

### 6.5 Front-end tests (`tauri-app/app/src/__tests__/`)

Lighter — the UI is intentionally a thin shell. Vitest + React Testing
Library.

- **`MainWindow.menu.test.tsx`** — every menu item exists, in the right
  order; disabled states honor the app state machine (e.g.,
  `Image → Show Palette…` is disabled before an image exists).
- **`SurveyView.dragSelect.test.tsx`** — simulating a drag on the plot
  emits a selection event with the right data coordinates.
- **`SurveyView.workflow.test.tsx`** — clicking through Smooth → Baseline
  → Align → Make Image issues the expected RPC calls in order, with the
  expected default parameters (`0.5`, `1`).
- **`PaletteEditor.test.tsx`** — adding control points up to 100 works;
  the 101st is rejected with the same error as the VB original.
- **`ipc/client.test.ts`** — mocked transport; happy path, error path,
  binary side-channel handling.

### 6.6 Tauri integration tests (`tauri-app/app/src-tauri/tests/`)

- **`sidecar_lifecycle.rs`** — Tauri spawns the Python sidecar on app
  start, kills it cleanly on app quit, restarts it if it dies.
- **`menu_to_rpc.rs`** — clicking `File → New Survey…` triggers
  `open_survey` on the sidecar with the path the user picked.

### 6.7 Test order summary

The implementation order is dictated by test order:

1. Fixtures captured into `tauri-app/fixtures/` (§4 step 1).
2. Codec tests (§6.1) → codec implementations.
3. Numerics tests (§6.2) → numerics implementations.
4. RPC tests (§6.3) → RPC server.
5. Pipeline tests (§6.4) → glue code in `survey.py` / `scan.py`.
6. Front-end tests (§6.5) and Tauri tests (§6.6) → React components and
   `main.rs` bridge.

No production module is written before its tests exist and fail.

---

## 7. Build and distribution

### 7.1 Python environment — uv-managed, Python 3.13

The project standardizes on **[uv](https://github.com/astral-sh/uv)** for all
Python tooling. uv handles interpreter download, virtualenv creation,
dependency resolution, lockfile generation, and script execution from one
fast binary — no need for separate `pyenv`, `virtualenv`, `pip`, `pip-tools`,
or `tox` installs.

- **Python version.** `3.13`, pinned in `tauri-app/.python-version`. uv reads
  this file and downloads a managed CPython 3.13 build automatically on
  first run; contributors do not install Python by hand.
- **Workspace root.** `tauri-app/pyproject.toml` declares a uv workspace
  with `members = ["engine"]`. The root carries shared dev tooling
  (`ruff`, `pytest`, `pytest-cov`, `mypy`, `pyinstaller`). The
  `engine` member has its own `pyproject.toml` with runtime deps:
  `numpy`, `scipy`, `astropy`, `pillow`, `jsonrpcserver`.
- **Lockfile.** `tauri-app/uv.lock` is generated by `uv lock` and
  committed. Reproducible builds across all three OSes.
- **Common commands** (run from `tauri-app/`):
  - `uv sync` — install all workspace deps into `.venv/` from the lock.
  - `uv run pytest engine/tests` — run the engine test suite.
  - `uv run ruff check .` / `uv run mypy engine/src` — lint/typecheck.
  - `uv build engine` — build the engine wheel.
  - `uv run pyinstaller …` — produce the sidecar binary (see below).
- **Adding a dependency.** `uv add --package engine astropy` (or
  `uv add --dev ruff` at the root). uv updates `pyproject.toml` and
  `uv.lock` together.

### 7.2 Sidecar binary

The engine ships as a standalone binary bundled into the Tauri app:

- Build with `uv run pyinstaller engine/sidecar.spec --distpath
  app/src-tauri/binaries/`. Output name follows Tauri's sidecar naming
  convention: `radio-cartographer-engine-<target-triple>` (e.g.
  `radio-cartographer-engine-aarch64-apple-darwin`).
- The spec file strips unused astropy submodules (no `astropy.io.votable`,
  no `astropy.cosmology`, etc.) to keep the bundle under ~100 MB.
- Sidecar is registered in `tauri.conf.json` under
  `bundle.externalBin` so Tauri copies the per-target binary into each
  packaged app.

### 7.3 Tauri app

- **Build.** `cd tauri-app/app && npm run tauri build` per target. The
  top-level `justfile` wraps this as `just package`.
- **CI.** Three GitHub Actions jobs — Windows x64, macOS arm64+x64
  universal, Linux x64 — each runs `uv sync`, builds the sidecar,
  then runs `tauri build`. Artifacts: `.msi`, `.dmg`, `.AppImage`.
- **No signing.** Artifacts are unsigned. macOS users run
  `xattr -d com.apple.quarantine /Applications/RadioCartographer.app` once;
  Windows users click through SmartScreen. This is the conscious cost of
  the "ignore code signing" decision; document it in the release notes.
- **Update mechanism.** None initially. Manual download from GitHub
  Releases. Tauri's updater can be added later if/when signing is
  reconsidered.

---

## 8. Phases and milestones

| Phase | Output | Definition of done |
|---|---|---|
| 0a. Workspace bootstrap | `tauri-app/` scaffolded: uv workspace, `pyproject.toml`, `.python-version` = `3.13`, `uv.lock`, empty `engine/` and `app/` skeletons, `justfile` | `uv sync` succeeds on Win/Mac/Linux; `just test` runs (zero tests) |
| 0b. Fixture capture | `tauri-app/fixtures/` populated from legacy EXE | Every legacy format has ≥1 fixture; provenance README written |
| 1. Codecs | All `tauri-app/engine/src/radio_cartographer/io/*.py` | §6.1 tests pass; round-trips bytes-identical |
| 2. Numerics | `survey.py`, `scan.py`, `calibration.py`, `image.py`, `palette.py` | §6.2 tests pass |
| 3. RPC | `tauri-app/engine/src/radio_cartographer/rpc.py` | §6.3 tests pass; sidecar binary builds on all three OSes |
| 4. Pipeline glue + FITS export | End-to-end tutorial replay headless | §6.4 tests pass; FITS opens cleanly in DS9 |
| 5. Tauri shell + React UI | The actual app | §6.5 + §6.6 tests pass; a domain user completes the tutorial PDF on each OS without help |

---

## 9. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Sidecar binary size with `pyinstaller` (~100 MB with numpy/scipy/astropy) | Accept it — without code signing, distribution is GitHub Releases anyway. Strip unused astropy submodules at build time. |
| Plotly performance on the full image at zoom | Pre-tile the image; render with Plotly's `Heatmapgl` (WebGL) trace. Fall back to a `<canvas>` direct-draw if Plotly underperforms. |
| Drag-select gesture not matching VB feel | Build a tiny prototype in week 1 of Phase 5 and demo to the original user before continuing. |
| `.bmp` byte-for-byte fidelity (VB's BMP variant is quirky) | Treat the legacy `.bmp` as a write-only compatibility artifact; the new "preferred" raster export is FITS. If exact BMP bytes prove infeasible, settle for "opens identically in Windows Photo Viewer." |
| `.img` text-format whitespace drift across platforms (CRLF vs LF) | Codec writes CRLF unconditionally; fixture compare is bytes-exact. Document this so a future contributor doesn't "fix" it. |
| Tauri 2.x is still evolving | Pin to a specific Tauri minor version in `Cargo.toml`; budget time for a single major-version bump per year. |

---

## 10. Open questions

1. Confirm which historical `.md2` / `.srv` / `.cal` files we have access to
   for fixture capture. The richer the fixture set, the stronger the
   backward-compat claim.
2. FITS header conventions — do we follow the AIPS legacy convention or
   the modern IAU recommendations? (Astropy supports both.) Default to
   IAU unless the user has downstream tooling that needs AIPS.
3. Do we want the React UI to log every reduction step into a sidebar
   history panel? This is a small departure from VB but a big maintenance
   win for users who get lost mid-survey. Default: no, to honor the "UI
   close to original" rule — revisit after first user test.
