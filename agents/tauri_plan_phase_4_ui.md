# Phase 4 UI — Survey Workflow Implementation Notes

This is a follow-up to [tauri_plan_phase_4.md](tauri_plan_phase_4.md). The original
Phase 4 scaffolded the Tauri shell, menus, and view shells; this pass made the
shells *usable* — a student can now click through every step of the tutorial
PDF from "New Survey" to "Pre Image" without falling off the path.

The work in this file is referenced from
[docs/legacy_ui_reference/legacyuireferenceguide.md](../docs/legacy_ui_reference/legacyuireferenceguide.md)
and matches the legacy screenshots under
[docs/legacy_ui_reference/screenshots/](../docs/legacy_ui_reference/screenshots/).

---

## What was implemented

### 1. Calibrate Survey screen

- **Select Declination** is now live (previously a disabled placeholder).
  - Drag-selects a horizontal yellow band on either declination panel.
  - Keeps cal samples *inside* the band; removes everything outside.
  - Scoped to the panel the user drags on — the initial and terminal cal
    brackets sit at different declinations, so applying one panel's band to
    both would over-cut. Engine + RPC + UI all carry the
    `bracket: 'initial' | 'terminal'` argument through.
  - Undo button rolls back the most recent declination select or cut.
- Mode toggle: `Cut Segment` and `Select Declination` are mutually exclusive;
  each shows a `(drag…)` label while active.

Backend: `select_calibration_declination(ws, dec_min, dec_max, bracket)` in
[workspace.py](../tauri-app/engine/src/radio_cartographer/workspace.py); RPC
method `select_calibration_declination` validates `bracket` and surfaces
`-32602` for unknown values.

### 2. Per-sweep workflow (Accept Sweep + Baseline Segment)

- `SurveyView` now drives a real per-sweep loop after calibration:
  - `Accept Sweep` is enabled once the survey is calibrated; clicking
    advances to the next un-accepted sweep, wraps if needed, and flips to
    `'pre-image'` view mode when the last sweep is accepted.
  - The sidebar shows `N / M sweeps accepted` and tags the title with
    `· accepted` for sweeps already consumed.
  - Prev/Next nav and the accepted-sweep tracker live in `survey-context`
    so other views can read them (e.g. Pre Image's Cancel resets review).
- `Baseline Segment` works per-sweep:
  - Click two points on the flux-vs-Dec plot; the violet baseline line is
    overlaid on the top panel and the bottom panel shows the corrected
    flux (linear-interpolation between the two endpoints).
  - Per-sweep baseline segments live in component state — discarded on
    `Cancel`. (Backend persistence is intentionally deferred — see TODO.)
  - `Undo Baseline` removes the most recent segment on the current sweep.

### 3. Pre Image view (new)

[PreImageView.tsx](../tauri-app/app/src/views/PreImageView.tsx) — shown when
every source sweep has been accepted. Auto-generates a gridded image on
entry and exposes the legacy four-button column:

- **Make Image** — opens an "Input Pixel Resolution" dialog seeded with the
  current `pix` (default 2, matching vb/survform.frm:1509). Integers only;
  non-integer / non-positive entries surface the legacy
  "Invalid Pixel Resolution" message.
- **Smooth Sweeps** — calls `smooth(survey, width=5)` and re-renders.
- **Baseline Sweeps** — opens "Input Baseline Length", default `5°`; calls
  `baseline(survey, degree)`.
- **Align Sweeps** — opens "Input Maximum Declination Shift", default `0.5°`;
  calls `align(survey, factor)`.
- **Cancel** — returns to the per-sweep view, resetting the accepted set so
  the user can re-walk the workflow.

### 4. Blocky pre-image rendering

[ImagePlot.tsx](../tauri-app/app/src/lib/plots/ImagePlot.tsx) was reworked to
match the legacy `Picture4.Line ... , BF` mosaic look:

- 8-stop palette ported directly from vb/survform.frm:1518-1550 (black →
  magenta → blue → cyan → green → yellow → red → white, anchors at
  `Pal!(N,1)/255`).
- `zsmooth: false` — each Plotly heatmap cell renders as a single solid
  block, no interpolation.
- Black plot background so empty cells naturally show the palette's
  anchor=0 stop.

Engine: [image.py](../tauri-app/engine/src/radio_cartographer/image.py) now
derives grid shape from `pix` using the legacy formula
`(5970 // (15·pix)) + 1` × `(4770 // (15·pix)) + 1`. `pix=1` still maps to
(319, 399) so the existing fixture-based round-trip tests are unchanged.

### 5. Tooling

[justfile](../tauri-app/justfile) — `just test` now runs engine *and*
front-end suites (`test-engine` → `uv run pytest`; `test-app` → `cd app &&
npm test`). The two are still invocable individually.

### 6. Pre Image fill, sky coordinates, and cal-sweep exclusion

A follow-up pass made the pre-image actually *look like* the legacy
screenshots in [docs/legacy_ui_reference/screenshots/](../docs/legacy_ui_reference/screenshots/)
(`preimagecygnus.png`, `preimage.png`):

- **Strip-fill between adjacent sweeps.** [image.py](../tauri-app/engine/src/radio_cartographer/image.py)'s
  `make_image` now mirrors `vb/survform.frm:1651-1799`: after painting each
  sample's cell, it walks the overlapping declination range of every
  adjacent pair of sweeps, interpolates each sweep's `(RA, flux)` at fine
  dec steps, and paints horizontal segments between the two sweeps' RA
  columns with linearly-interpolated flux. Average-accumulates where
  strips overlap. Cells outside the swept region stay at 0 (palette
  anchor=0, black). The previous histogram-only approach left most cells
  at 0, so the pre-image rendered as a near-black sweep map.

- **Palette anchored at zmin=0.** [ImagePlot.tsx](../tauri-app/app/src/lib/plots/ImagePlot.tsx)
  now passes `zmin: 0, zmax: data_max` so the legacy palette's anchor=0
  stop lines up with truly-empty cells and the magenta background of the
  legacy cygnus pre-image survives Plotly's normalization.

- **Cal brackets excluded from the pre-image.** Previously
  `make_image(survey, ...)` consumed the full `Survey.sweeps` tuple,
  including the 2 initial + 2 terminal cal brackets — which point at a
  different calibrator and stretch the RA/Dec extent. The
  [`make_image` RPC](../tauri-app/engine/src/radio_cartographer/rpc.py)
  now accepts an optional `workspace_handle`; when given, it builds the
  input via `_survey_from_workspace_sources(ws)` from
  `workspace.source_sweeps` only and uses `workspace.calibrated_source_flux`
  when `apply_gain_calibration` has run. The front-end
  [survey-context](../tauri-app/app/src/state/survey-context.tsx) +
  [client](../tauri-app/app/src/ipc/client.ts) plumb the workspace handle
  through to every `make_image` call from `PreImageView`.

- **HH:MM:SS / DD:MM:SS axes and hover.** `ImagePlot` now publishes real
  RA/Dec coordinates per cell (RA in elapsed sidereal seconds — matching
  the `Ra!` layout in `vb/survform.frm:5571-5573` — and Dec in signed
  decimal degrees). Five sexagesimal ticks per axis; `customdata` carries
  pre-formatted strings so the hover renders
  `RA: HH:MM:SS / Dec: ±DD:MM:SS / Flux: …` directly. The x-axis is
  reversed so MaxRa lands on the left (legacy Picture4 paint convention).

- **Independent axis scaling.** With the new coordinate ranges, RA spans
  ~thousands of sidereal seconds while Dec spans tens of degrees, so the
  former `scaleanchor: 'y'` collapsed the image to a single row. Each
  axis now fills its area independently; the grid's legacy
  `width × height` shape already encodes the intended aspect ratio.

### 7. Tests

| File | Coverage added |
|---|---|
| `engine/tests/numerics/test_image_gridding.py` | `pix=2` and `pix=4` grid shapes via the legacy formula; (new) strip-fill covers >25% of cells at `pix=2`. |
| `engine/tests/rpc/test_rpc_workspace.py` | `select_calibration_declination` scoped to one bracket; rejects unknown brackets. |
| `engine/tests/rpc/test_rpc_reductions.py` | (new) `make_image` with `workspace_handle` produces strictly tighter RA/Dec bounds than the full-survey path on the `and0a.md2` fixture. |
| `app/src/__tests__/CalibrateSurveyView.test.tsx` | `Select Declination` toggle on/off. |
| `app/src/__tests__/SurveyView.workflow.test.tsx` | `Accept Sweep` enabled state + per-sweep counter; `Baseline Segment` mode toggle. |
| `app/src/__tests__/PreImageView.test.tsx` | Auto-render at default pix=2; Make Image prompt re-renders at chosen pix; Smooth Sweeps; Baseline Sweeps default 5; Align Sweeps default 0.5. Asserts `workspace_handle` is forwarded to `makeImage`. |

All passing: engine **141/141**, front-end **21/21**.

### 8. Smooth / Baseline / Align Sweeps actually mutate the pre-image

The four-button column from §3 fired the right RPCs but the rendered
image never changed. Two distinct bugs, fixed in this pass:

**Bug A — reductions never reached the rendered image.** `rpcClient.smooth/
baseline/align` took the *survey* handle, applied the operation to a fresh
`Survey`, and returned a new handle. The front-end discarded the new handle.
The next `make_image` was driven by `workspace_handle`, which builds the
grid from `workspace.source_sweeps` — untouched by the reduction. So the
reduction happened, but on a copy nobody rendered.

Fix: workspace-aware reduction path. The workspace now carries
`reduced_source_flux` (smooth/baseline output) and `reduced_source_dec`
(Align output) — mirroring the existing `calibrated_source_flux` pattern.
[`_survey_from_workspace_sources`](../tauri-app/engine/src/radio_cartographer/rpc.py)
picks the most-recent state per field (reduced > calibrated > raw) so the
next `make_image(workspace_handle=...)` grids the reduced data. The
[`smooth`/`baseline`/`align` RPCs](../tauri-app/engine/src/radio_cartographer/rpc.py)
accept an optional `workspace_handle`; when present, the reduction lands
on the workspace and the response omits the new survey handle. The
legacy survey-handle path still works for non-interactive callers. Both
[`client.ts`](../tauri-app/app/src/ipc/client.ts) and
[`PreImageView.tsx`](../tauri-app/app/src/views/PreImageView.tsx) forward
the workspace handle on every call. Reductions stack (smooth → baseline →
align all compose); `apply_gain_calibration` resets the reduction state.

**Bug B — Align Sweeps was the wrong algorithm in the wrong direction.**
The old `align_by_offset` applied a single literal flux offset to every
sweep — a uniform slide of the whole image, not a pairwise alignment.
Legacy `vb/survform.frm:2612-2818` does pairwise FFT cross-correlation:

1. For each adjacent sweep pair, interpolate both sweeps' flux onto a
   common dec grid (384 samples, zero outside each sweep's extent).
2. Cross-correlate via FFT; the peak's lag (within ±`MaxDecShift`) is the
   dec offset between the two sweeps.
3. Move the earlier sweep up by half the lag, the later down by half (or
   vice-versa) — closing the gap. Interior sweeps blend their two
   pairings weighted by correlation strength.
4. The shift is applied to **dec values**, not flux.

The rewrite lives in
[`scan.align_dec_shifts`](../tauri-app/engine/src/radio_cartographer/scan.py);
[`survey.align_survey`](../tauri-app/engine/src/radio_cartographer/survey.py)
wraps it for the non-workspace path; the workspace path calls it from
[`apply_workspace_reduction`](../tauri-app/engine/src/radio_cartographer/workspace.py)
and stores shifted dec arrays on `reduced_source_dec`. The `align_sweep`
per-sweep helper is gone (the operation is inherently multi-sweep).

**Sign-convention gotcha to remember.** The legacy uses Numerical Recipes'
`four1` with `isign=+1` forward (`e^{+iωnk}`), the *opposite* sign from
`numpy.fft.fft` (`e^{-iωnk}`). The correct numpy translation of the
legacy `conj(dat)·Temp` followed by `isign=-1` inverse is
`np.fft.ifft(np.fft.fft(a) * np.conj(np.fft.fft(b)))` — putting the
conjugate on the *later* sweep. Flipping it (a vs b on the conjugate side)
gives a peak with the opposite sign and the algorithm pushes sweeps apart
instead of together. The first run of `test_align_dec_shifts_closes_gap_for_three_sweeps`
caught it.

**New / updated tests:**

| File | Coverage |
|---|---|
| `engine/tests/numerics/test_align.py` | `align_dec_shifts`: zero-max-delta is a no-op; two sweeps with a known +0.4° offset recover ±0.2° (and the feature centers coincide after); three sweeps with linearly-stepped centers produce edges-move-inward / middle-stays-put (matching the legacy weighted-blend math); the max-delta clamp is honored. |
| `engine/tests/rpc/test_rpc_reductions.py` | (new) `smooth` then `baseline` through `workspace_handle` actually changes `get_image_pixels` output and baseline subtraction drops the gridded mean toward zero — the regression test for Bug A. |
| `app/src/__tests__/PreImageView.test.tsx` | Smooth / Baseline / Align Sweeps now assert the workspace handle is forwarded as the 3rd argument. |

All passing: engine **146/146**, front-end **21/21**.

**Known caveat.** The legacy single-pass align with ≥3 sweeps only
halves the residual mis-alignment (correlation-strength weighting damps
the interior shifts). A second click further tightens — both the legacy
app and this port behave the same way.

### 9. Flux Calibration menu wired end-to-end

The Calibration menu was renamed and every previously-disabled item is now
live. The legacy "two calibrations" naming collision (gain calibration done
on the survey vs. flux calibration from a `.cal` file) is resolved in the
menu bar — see the reference guide's
[Main Menu Screens](../docs/legacy_ui_reference/legacyuireferenceguide.md)
notes calling for the rename.

- **Menu rename `Calibration` → `Flux Calibration`** in
  [MainWindow.tsx](../tauri-app/app/src/views/MainWindow.tsx). Items wired:
  `Select Calibration…` (file picker → load `.cal`), `New Calibration…`
  (opens the empty editor), `Open Calibration…`, `Save Calibration` /
  `Save Calibration As…`, `Change Calibration Name…`. Print Calibration
  was removed entirely (see §10).
- **Engine:** new
  [flux_calibration.py](../tauri-app/engine/src/radio_cartographer/flux_calibration.py)
  module — `read_scn_peak` (parses `Peak Flux: …` from a `.scn` header),
  `default_known_jy` (legacy three-letter prefix table: `VIR`→213,
  `TAU`→942, `CYG`→1581, else 0 — matches `vb/calform.frm:156-164`),
  `fit_error` (RMS error, formula from `vb/calform.frm:554-559`).
  Re-exports the existing least-squares-through-origin
  `fit_counts_to_jy` from
  [calibration.py](../tauri-app/engine/src/radio_cartographer/calibration.py).
  The legacy mouse-drag pink-line slope (`vb/calform.frm:553`) is
  replaced with the natural automatic equivalent: fit forced through the
  origin since 0 GCU must map to 0 Jy.
- **Workspace state:** `flux_calibrated`/`flux_slope` fields on
  `SurveyWorkspace`
  ([workspace.py](../tauri-app/engine/src/radio_cartographer/workspace.py))
  and `ScanWorkspace`
  ([scan_workspace.py](../tauri-app/engine/src/radio_cartographer/scan_workspace.py));
  `apply_flux_calibration` / `revert_flux_calibration` helpers multiply
  or divide gain-calibrated flux (and `peak_flux` on scans). Re-running
  `apply_gain_calibration` clears the flux-cal state — a fresh gain
  calibration invalidates any prior Jy scaling.
- **RPC:** nine new methods on
  [rpc.py](../tauri-app/engine/src/radio_cartographer/rpc.py) —
  `flux_cal_read_file`, `flux_cal_write_file`, `flux_cal_fit`,
  `flux_cal_read_scn_peak`, `flux_cal_default_known_jy`,
  `flux_cal_apply_to_survey`, `flux_cal_revert_from_survey`,
  `flux_cal_apply_to_scan`, `flux_cal_revert_from_scan`. Workspace and
  scan overviews now carry `flux_calibrated` and `flux_slope`; the
  `unit` field on `get_source_sweep` / `get_scan_view` reports `"jy"`
  once flux-calibrated.
- **Frontend state:** new
  [flux-cal-context.tsx](../tauri-app/app/src/state/flux-cal-context.tsx)
  app-level provider holding the editable table, slope/error, file
  path, and dirty flag. An auto-apply effect fires
  `fluxCalApplyToSurvey` / `fluxCalApplyToScan` the moment a workspace
  transitions to `calibrated && !flux_calibrated` — so the user can
  load a `.cal` *before* opening a survey and have it apply on the
  first gain calibration. Wrapped into the provider tree in
  [App.tsx](../tauri-app/app/src/App.tsx) inside the survey + scan
  providers (it depends on both).
- **View:** new
  [FluxCalibrationView](../tauri-app/app/src/views/CalibrationView.tsx)
  (the old stub file kept for import stability). Editable caption,
  live slope and RMS-error readouts, entries table with per-row
  delete, three actions: `Add Source from File…` opens a `.scn` and
  reads the peak from its header, prompting for known Jy seeded with
  the legacy default; `Add Current Scan as Source` uses the open
  scan's `peak_flux`; `Fit Calibration` re-runs the fit. The plot
  reuses [PointScatter](../tauri-app/app/src/lib/plots/PointScatter.tsx)
  with measured (GCU) vs known (Jy) points and a magenta best-fit
  line drawn from (0, 0) to (maxMF, maxMF × slope).
- **IPC client:** [client.ts](../tauri-app/app/src/ipc/client.ts) extended
  with `FluxCalEntry` / `FluxCalTable` / `FluxCalReadResult` /
  `FluxCalFitResult` / `FluxCalWriteResult` / `FluxCalScnPeakResult`
  types and nine method wrappers. `WorkspaceOverview` and
  `ScanOverview` gained `flux_calibrated: boolean` / `flux_slope:
  number | null`; `SourceSweep` and `ScanViewCalibrated` accept the
  new `'jy'` unit literal.
- **Unit labels:** status bar appends `flux calibrated (Jy)` on top of
  the existing gain/raw labels; the `formatFlux` helpers in
  [SurveyView](../tauri-app/app/src/views/SurveyView.tsx) and
  [ScanView](../tauri-app/app/src/views/ScanView.tsx) render `Jy` once
  flux-calibrated.

**Tests added:**

| File | Coverage |
|---|---|
| `engine/tests/numerics/test_flux_calibration.py` | (new) 12 cases — legacy known-Jy table, closed-form fit, RMS error formula, `.scn` peak round-trip, apply/revert symmetry on survey + scan, requires-gain-cal guard, zero-slope rejection, idempotent guard, gain-recal clears flux state. |
| `engine/tests/rpc/test_rpc_flux_cal.py` | (new) 7 cases — `.cal` read returns table+slope+error, live fit recomputes from payload, write round-trips through the codec, `.scn` peak via RPC, apply-to-survey marks workspace and revert clears, uncalibrated-survey rejection, apply-to-scan also rescales `peak_flux`. |
| `app/src/__tests__/MainWindow.menu.test.tsx` | Expected label updated from `Calibration` to `Flux Calibration`; the test wraps with `FluxCalibrationProvider`. |
| `app/src/__tests__/CalibrateSurveyView.test.tsx`, `…/PreImageView.test.tsx`, `…/SurveyView.workflow.test.tsx`, `…/ScanView.workflow.test.tsx` | Fixture objects gained `flux_calibrated: false`, `flux_slope: null` to satisfy the new required fields on `WorkspaceOverview` / `ScanOverview`. |

### 10. Print menu items removed

`Print Image`, `Print Scan`, and `Print Calibration` buttons removed from
[MainWindow.tsx](../tauri-app/app/src/views/MainWindow.tsx) along with the
adjacent separators. Per user feedback ("no one will be using them
anymore") and consistent with the modern Tauri/web stack having no native
print path tied to those legacy `.frm` Printer.Print routines.

### 11. About "OG Radio Cartographer"

Per the legacy reference guide §"About Karaleah" — the dialog branding
needed to swap to the new project name while keeping the 2000s VB6
typography intact.

- **Menu label** `About "Karaleah"…` → `About OG Radio Cartographer` in
  [MainWindow.tsx](../tauri-app/app/src/views/MainWindow.tsx). This
  deliberately diverges from the existing TODO's "rename to *About*" —
  the reference guide calls for the full project name, so the rename
  landed there.
- **[AboutBox.tsx](../tauri-app/app/src/views/AboutBox.tsx)** rebuilt
  to mirror the legacy KaraLeah dialog: italic-serif title (Times New
  Roman) reading **"OG Radio Cartographer"** with **Copyright 2026**
  underneath, then bold MS Sans Serif body — "Created By / Daniel E.
  Reichart / For / Educational Research In Radio Astronomy / National
  Radio Astronomy Observatory / Green Bank, West Virginia" — on a
  light-grey panel with the legacy inset highlight (white top-left,
  drop shadow). 2000s typography preserved per the reference guide.
  No OK button — the existing aux-view "Back to workspace" control
  handles dismissal.

### 12. Make Image transitions to a dedicated Image screen

**User-reported symptom.** Clicking *Make Image* in Pre Image opened the
"Input Pixel Resolution" dialog but the heatmap didn't redraw on OK.

**Root cause was structural, not a render bug.**
[PreImageView.tsx](../tauri-app/app/src/views/PreImageView.tsx)'s local
`generateImage` stored meta + pixels in component-local `useState` that
nothing else could see. The
[survey-context](../tauri-app/app/src/state/survey-context.tsx)'s
`image: ImageMeta | null` field and `makeImage` method existed but were
never called from anywhere — dead plumbing. Result: the dialog *was*
triggering a regeneration on the engine side, but the user-visible
heatmap was still being driven by the on-mount auto-generation and
never refreshed (Plotly was re-running but on identical data when the
user re-entered the same pix).

**Fix is a separation of intent.** Pre Image keeps its in-place preview
for the Smooth / Baseline / Align iteration loop. *Make Image* now
*commits* the result and transitions to a new screen — clearer mental
model and lets the rest of the app (Image menu, status bar, future
image-level controls) actually observe that an image exists.

- **New `'image'` value** added to `WorkspaceViewMode` in
  [survey-context.tsx](../tauri-app/app/src/state/survey-context.tsx);
  new `imagePixels: ImagePixels | null` field on the context next to
  the existing `image: ImageMeta | null`. `makeImage(pix)` rewritten to
  call both `rpcClient.makeImage(...)` and `rpcClient.getImagePixels(...)`,
  store both, close the prior image handle, and flip `viewMode` to
  `'image'`. The workspace handle is read from `workspaceHandleRef` so
  the engine grids from the reduced workspace sweeps — same convention
  §6 introduced for the in-place preview.
- **New
  [ImageView.tsx](../tauri-app/app/src/views/ImageView.tsx)** — workspace-
  frame layout matching the Pre Image screen; renders
  [ImagePlot](../tauri-app/app/src/lib/plots/ImagePlot.tsx) from the
  context's `imagePixels`/`image`; side panel currently holds a
  `Back to Pre Image` button and a placeholder for the future image-
  level controls (Save Image, Save Bitmap As, Show Palette,
  Append/Superimpose, Make Bi-/Tri-Color, Change Magnifier Size,
  Change Image Name).
- **[MainWindow.tsx](../tauri-app/app/src/views/MainWindow.tsx)**: added
  the `viewMode === 'image' ? <ImageView /> : …` branch in the view-
  area routing. `hasImage` is now `image !== null` (was
  `viewMode === 'pre-image'`, which was *the wrong predicate* — it
  enabled the Image submenu while still on the Pre Image screen and
  disabled it after transition). Status bar shows `· Image` for the
  new mode.
- **[PreImageView.tsx](../tauri-app/app/src/views/PreImageView.tsx)**:
  the Make Image dialog's OK handler now `await`s the survey-context's
  `makeImage(intPix)` (which transitions the view) instead of calling
  the local `generateImage`. Smooth / Baseline / Align continue to use
  the local preview path — they're for iterative tweaking before
  committing.

Existing test suite picked up the change without modification — the
`PreImageView` test's `(handle, pix, workspaceHandle)` assertion still
holds because the context's `makeImage` calls the RPC with the same
signature.

All passing: engine **196/196**, front-end **30/30**.

### 13. Open `.srv` / `.scn`, editable sweep counter, Back to Sweeps

The Save Survey / Save Scan plumbing from earlier rounds wrote `.srv` /
`.scn` files but **Open Survey…** and **Open Scan…** were still disabled
stubs. This pass closed the round-trip and tightened the sweep nav UX.

- **Two new backend RPCs** in
  [rpc.py](../tauri-app/engine/src/radio_cartographer/rpc.py):
  - `open_saved_survey` — `read_srv` → `survey_from_srv` →
    `SurveyWorkspace`, returns the same handle/metadata/workspace shape as
    `open_survey` so the front-end can dispatch by extension without
    diverging downstream code paths.
  - `open_saved_scan` — `read_scn` → `scan_from_scn` → `ScanWorkspace`,
    parallels `open_scan`.
- **New helpers** that invert the existing
  `workspace_to_survey`/`workspace_to_scan` writers:
  - [`survey_from_srv`](../tauri-app/engine/src/radio_cartographer/workspace.py)
    splits the file's 240-sample `sweep0` back into the four 60-sample
    cal sub-sweeps, rebuilds `source_sweeps`, and seeds
    `calibrated_source_flux` so reloaded surveys self-report as
    gain-calibrated (per user direction: every `.srv` is assumed
    calibrated — legacy convention only writes after Calibrate Survey).
  - [`scan_from_scn`](../tauri-app/engine/src/radio_cartographer/scan_workspace.py)
    builds synthetic empty `ScanCalBracket` instances (the `.scn` format
    doesn't store the 240 cal samples), copies `source_ra/dec/flux` from
    the file, derives `source_mask` from the `check` column (`check==0`
    kept, `check==-1` cut — matches the mask round-trip), and seeds
    `calibrated_source_flux` when `channel == "B"`. The `Peak Flux:
    X.XXX` string from line 3 of the `.scn` is parsed back into
    `workspace.peak_flux`.
- **Frontend dispatch by extension** in
  [survey-context.tsx](../tauri-app/app/src/state/survey-context.tsx) and
  [scan-context.tsx](../tauri-app/app/src/state/scan-context.tsx):
  `open(path)` now branches on `.srv` / `.scn` suffix and routes to the
  saved-file RPC. After a `.srv` load, every sweep is initially marked
  accepted (refined in §14) and `savePath` is seeded to the picked file
  so Save Survey is enabled immediately.
- **`.srv` workflow re-entry.** A re-opened survey lands on **Pre-Image**
  by default (the legacy `SwpCnt% > Swp%` signal in
  `vb/survform.frm:4432-4475` reads as "all sweeps accepted → Pre
  Image"). The previous `Pre Image → Cancel` button reset the accepted
  set, which would lose state the moment the user wanted to re-edit a
  sweep — that button is now **Back to Sweeps** in
  [PreImageView.tsx](../tauri-app/app/src/views/PreImageView.tsx),
  preserving acceptances; a new **Create Pre-Image** button on the side
  panel in [SurveyView.tsx](../tauri-app/app/src/views/SurveyView.tsx)
  re-enters Pre Image (enabled when every sweep is accepted).
- **Editable sweep counter** in
  [SurveyView.tsx](../tauri-app/app/src/views/SurveyView.tsx). The
  status-side `N / total` span became a `<input type="number">` that
  commits on Enter or blur and clamps to `[1, sweepCount]`. The disabled
  `Survey → Goto Sweep…` menu item was removed —
  [MainWindow.tsx](../tauri-app/app/src/views/MainWindow.tsx) is the
  single source of truth for that nav action now. New
  `.sweep-nav-input` CSS in [App.css](../tauri-app/app/src/App.css).
- **Menu wiring.** Two new file pickers in
  [MainWindow.tsx](../tauri-app/app/src/views/MainWindow.tsx)
  (`pickAndOpenSavedSurvey` / `pickAndOpenSavedScan`) filter `.srv` /
  `.scn`. The disabled stubs are gone.

**Tests added** (extending
[test_workspace_save.py](../tauri-app/engine/tests/numerics/test_workspace_save.py)):
| Coverage |
|---|
| Calibrate → save `.srv` → load → workspace reports calibrated (gain) and round-trips cal1/cal2 to within 1e-3, flux to within 5e-4 (the `#.####` format truncation). |
| Calibrate scan + cut + Baseline Source + Determine Peak → save `.scn` → reload → mask preserved, peak readout restored, workspace reports calibrated. |
| Raw `.scn` (channel `A`) reload returns an uncalibrated workspace with `peak_flux is None`. |

All passing: engine **199/199**, front-end **30/30**.

### 14. Per-sweep accepted state in the `.srv` file

§13 always landed on Pre-Image after a `.srv` open because
`workspace_to_survey` unconditionally wrote `sweep_count = swp + 1` (the
legacy "all accepted" signal). This pass added per-sweep accepted
tracking so a reload opens to the **first unaccepted sweep** instead.

**File format extension.** After the existing body,
[srv.py](../tauri-app/engine/src/radio_cartographer/io/srv.py)'s
`_serialize_srv` appends a trailer when `Survey.accepted` is set:

```
...last sweep data...
#OGRC_ACCEPTED
-1     ← sweep 0 (-1 = accepted, 0 = not)
0
-1
...
```

`_parse_srv` checks for the `#OGRC_ACCEPTED` marker line after the main
body and parses `swp` ints. Legacy `.srv` files without the trailer
(`Survey.accepted = None`) fall back to the `SwpCnt%` header:
`SwpCnt > Swp` → all accepted, otherwise the first `SwpCnt - 1` sweeps
are accepted (preserves the legacy convention).

- **Model:** new `accepted: tuple[bool, ...] | None` field on
  [`Survey`](../tauri-app/engine/src/radio_cartographer/models.py). `None`
  means "no trailer — use header fallback".
- **Writer:**
  [`workspace_to_survey(ws, accepted_sweeps=…)`](../tauri-app/engine/src/radio_cartographer/workspace.py)
  takes an optional sweep-index sequence; when provided it emits the
  trailer and sets the header `sweep_count = first_unaccepted + 1` so
  legacy readers (and our own fallback) land on the right sweep.
- **Reader:**
  [`survey_from_srv`](../tauri-app/engine/src/radio_cartographer/workspace.py)
  now returns `(workspace, accepted_indices)` instead of a `was_pre_image`
  bool. Trailer wins when present; otherwise it derives indices from
  `sweep_count` + `swp`.
- **RPC plumbing:**
  - `save_survey` accepts an optional `accepted_sweeps: list[int]` param
    and forwards it.
  - `open_saved_survey` returns `accepted_sweeps: list[int]` (replacing
    the old nested `saved: { was_pre_image }` shape).
- **Frontend:**
  - [`saveSurvey(handle, path, acceptedSweeps?)`](../tauri-app/app/src/ipc/client.ts)
    now takes an optional indices array; `SurveyMeta` gained
    `accepted_sweeps?: number[]`.
  - [survey-context.tsx](../tauri-app/app/src/state/survey-context.tsx)
    added an `acceptedSweepsRef` (mirroring the other refs) so `save`
    can hand the latest set to the RPC without stale-closure issues.
    On `.srv` open, it seeds `acceptedSweeps` from
    `meta.accepted_sweeps`, then routes to Pre-Image if every sweep is
    accepted, otherwise to the **first unaccepted** sweep (`for i in
    0..n: if !accepted.has(i) → currentSweepIndex = i`).

**Tests added** (extending
[test_workspace_save.py](../tauri-app/engine/tests/numerics/test_workspace_save.py)):
| Coverage |
|---|
| Calibrate → save without `accepted_sweeps` → load → header fallback returns `list(range(source_count))` (all accepted). |
| Calibrate → save with `accepted_sweeps=[0, 2, 5]` → load → trailer round-trips the non-contiguous set verbatim; header `SwpCnt = first_unaccepted + 1 = 2` so legacy readers also land on sweep 2. |
| Legacy fixture `intermediates/and0a.srv` (no trailer, `SwpCnt > Swp`) → all sweeps accepted. |
| Legacy fixture `inputs/cygnus1atest.srv` (`SwpCnt=1`, `Swp=56`) → empty accepted list (no source sweeps accepted yet — preserves the legacy partial-prefix convention). |

All passing: engine **202/202**, front-end **30/30**.

### 15. Baseline-segment edits persist via Accept Sweep + interactive Removed plot

User-reported symptom: open a `.srv` saved after drawing baseline
segments, and the cut-out interference reappears. Root cause:
`segmentsBySweep` lived only in React component state and never reached
the workspace, so save serialized the original (un-baselined) flux.

**Math reminder.** Legacy VB at
[survform.frm:5453-5539](../vb/survform.frm#L5453-L5539) **replaces**
`Flux` with the drawn line (line 5494: `Flux = Y/X * Dec + B`) and
stores the diff `oldFlux - newFlux` in a `Baseline!()` array (line
5493) — the array used to render Picture3 (the bottom "what was
removed" plot). The current React implementation already does the
REPLACE; this pass keeps that math and adds the missing pieces: the
backend commit, the diff-rendering bottom plot, and click-to-restore.

**New backend RPC.**
[`set_source_sweep_flux(handle, index, flux)`](../tauri-app/engine/src/radio_cartographer/rpc.py)
overwrites a single source sweep's flux. Writes into whichever layer
`current_source_flux` reads (reduced > calibrated), so the next
`get_source_sweep` and `save_survey` see the new values. Rejects
length-mismatched arrays and uncalibrated workspaces (Baseline Segment is
UI-gated on calibration).

**Frontend client.**
[`setSourceSweepFlux(handle, index, flux)`](../tauri-app/app/src/ipc/client.ts)
wrapper next to `getSourceSweep`.

**`SurveyView` refactor.**
- **State swap.** `segmentsBySweep: Record<number, BaselineSegment[]>` →
  `removedBySweep: Record<number, RemovedMap>` where
  `RemovedMap = Record<sampleIndex, removedAmount>` and
  `removedAmount = originalFlux[i] - newFlux[i]`. Once committed, only the
  per-sample map matters; the line endpoints get baked into the flux and
  are no longer tracked (matches legacy: after commit, Picture2 redraws
  from `Flux!()` and Picture3 from `Baseline!()`, neither shows the
  original line).
- **Top plot** now shows the *corrected* flux while edits are pending —
  the user sees the flattened curve in real time, without re-rendering
  through a separate baseline-preview pass.
- **Bottom plot renamed "Removed".** Renders only the per-sample diff
  points carrying their `sampleIndex` through `customdata`. Clicking a
  point fires `handleRestoreClick`, which removes that entry from the
  `RemovedMap` — the top plot's flux at that index reverts and the point
  disappears from the bottom plot. The legacy persistent line overlay
  was dropped (legacy code also doesn't redraw it after commit).
- **"Undo Baseline" button removed** in favor of per-point restore-by-
  click on the bottom plot.
- **Accept Sweep commits.** The handler now `await`s
  `setSourceSweepFlux(handle, sweepIndex, applyRemoved(sweep.flux,
  removed))` before calling `acceptCurrentSweep()`. Calls a new
  `markDirty()` (exposed on the survey context) so Save Survey lights up.
- **Re-edit on already-accepted sweeps.** The button enables when there
  are pending removals even if the sweep is already accepted; it renders
  as **Apply Baselines** in that case (label switch based on
  `hasPendingRemoved && isAccepted`).
- **Per-sweep maps survive sweep navigation** but are cleared on
  workspace change (new `useEffect(() => setRemovedBySweep({}),
  [workspaceHandle])`).

**`PointScatter` widening** in
[PointScatter.tsx](../tauri-app/app/src/lib/plots/PointScatter.tsx):
`Point` gained optional `sampleIndex`, threaded through `customdata` as
the 4th element (sentinel `-1` for absent) and reconstructed in
`onHover`/`onPointClick` via a `toPoint` helper. Lets the bottom plot
identify which sample the user clicked without ad-hoc nearest-neighbour
lookup.

**Survey context.** New `markDirty()` callback on
[survey-context.tsx](../tauri-app/app/src/state/survey-context.tsx)
mirrors the equivalent on
[scan-context.tsx](../tauri-app/app/src/state/scan-context.tsx). Exposed
via the context value so `SurveyView` can flag the workspace as
out-of-sync after committing.

**Tests added** (extending
[test_rpc_workspace.py](../tauri-app/engine/tests/rpc/test_rpc_workspace.py)):
| Coverage |
|---|
| `set_source_sweep_flux` writes into `calibrated_source_flux` for a calibrated workspace. |
| Modify a sweep → save `.srv` → `open_saved_survey` → `get_source_sweep` round-trips the modified flux to within 5e-4 (format truncation). |
| Wrong-length flux array → `ERR_INVALID_PARAMS`. |
| Uncalibrated workspace → `ERR_INVALID_PARAMS` (Baseline Segment is post-cal). |

All passing: engine **206/206**, front-end **30/30**.

---

## What is left to do

### Survey workflow polish

- [ ] **Flag calibration sweeps differently on the Sweep 1 view.** The
      reference guide calls out that Sweep 1 currently includes the cal
      brackets — the workspace already separates them (`workspace.source_count`
      excludes cal sweeps), but the legacy app draws cal samples with a
      distinct symbol on the main scatter. Not yet replicated.
- [ ] **Click-to-pin readout on the Sweep view.** Already pins on click;
      pinning when in `Baseline Segment` mode currently competes with the
      first-endpoint pick. Decide on a clear two-mode UX.
- [ ] **Right-click cancels** for the baseline-segment endpoint pick.
      Today, empty-space click cancels; the legacy gesture is right-click.

### Backend persistence

- [x] ~~**Accept Sweep** should persist~~ — accepted state now round-trips
      via the `#OGRC_ACCEPTED` trailer in `.srv` (§14). The workspace
      itself still doesn't carry an `accepted_mask` (the frontend's
      `acceptedSweeps` set is authoritative and is passed to
      `save_survey`), but the round-trip works end-to-end.
- [x] ~~**Baseline Segment** needs a backend RPC~~ — the simpler design
      that won: commit on Accept Sweep via `set_source_sweep_flux` (§15).
      Segments are baked into flux permanently; no per-segment record
      stored. Restore-by-click on the new Removed plot replaces the
      "undo last segment" gesture during the current edit session.
- [x] ~~**Undo stack unification**~~ — the per-sweep Undo Baseline button
      was removed in favour of per-point restore via the Removed plot.
      The calibration undo stack stays as-is on the Calibrate Survey
      screen.

### Pre Image gaps

- [x] ~~Empty-cell handling~~ — resolved by the strip-fill in §6 above.
      The legacy `vb/survform.frm:1651-1799` paint loop is now mirrored in
      `image.py`'s `make_image`.
- [x] ~~Cal sweeps in the pre-image~~ — resolved by threading
      `workspace_handle` through `make_image`; the engine builds the grid
      from source sweeps only.
- [ ] **Image save paths** — `Save Image As…`, `Save Bitmap As…`, and the
      future `Save Image As FITS…` menu items are still disabled. `.img`
      / `.bmp` codecs already exist in `engine/src/radio_cartographer/io/`;
      wiring is just an RPC + `dialog.save()` call away.
- [ ] **Per-cell flux readout outside hover.** Plotly hover now shows
      `RA / Dec / Flux` in sexagesimal, matching the legacy bottom-right
      readout. A click-to-pin variant (consistent with the Sweep view's
      pin behaviour) is still TODO.

### Menu and About polish (legacy reference guide)

- [x] ~~Rename **Calibration** → **Flux Calibration** in the menu bar to
      avoid confusion with gain calibration.~~ Done in §9.
- [x] ~~Rename **About "Karaleah"…** → **About**.~~ Landed as
      **About OG Radio Cartographer** per the reference guide §"About
      Karaleah" (the guide calls for the full project name, not the bare
      "About"). See §11.
- [x] ~~Calibration submenu currently has every item disabled — Phase 6
      will wire `.cal` load/save once a fixture is captured.~~ Done in
      §9 (the `cal25a.cal` fixture is in the test set; the codec was
      already present from Phase 1). Print Calibration was removed
      entirely in §10 rather than wired.

### Scan Processing
- [x] ~~Open Scan…~~ — wired in §13. Calibrated `.scn` files round-trip
      including the per-sample mask (cuts) and Peak Flux readout.
- [ ] **Scan-level baseline/cut persistence.** `set_source_sweep_flux`
      from §15 is survey-only; the scan equivalent (`set_scan_source_flux`?)
      isn't there yet. Current scan workflow's existing
      `cut_scan_segment` / `baseline_scan_source` / `select_scan_declination`
      all already mutate the workspace, so save already captures their
      effect — but if a future Scan UI grows a per-sample restore
      gesture parallel to §15, it'll need the same plumbing.
- [ ] Other scan-level reductions (smooth, etc.) still TBD.

### Image Processing
- [ ] Add in the image pipeline.
- [ ] Ensure all palettes and functionality can be mirrored.
- [ ] Wire image-level controls into the
      [ImageView](../tauri-app/app/src/views/ImageView.tsx) side panel.
      The view itself was added in §12 with only a `Back to Pre Image`
      button; Save Image, Save Bitmap As…, Show Palette, Append /
      Superimpose, Make Bi-Color / Tri-Color, Change Magnifier Size,
      and Change Image Name still need handlers. The existing
      `Image save paths` bullet under "Pre Image gaps" above belongs
      here too — the `.img`/`.bmp` codecs are ready, just unwired.


### Phase 6 carryovers (already tracked in tauri_plan_phase_4.md)

- [ ] FITS export (`io/fits.py` + `Image → Save Image As FITS…`).
- [ ] Headless pipeline replay tests (`tests/pipeline/`).
- [ ] Live stdio sidecar wiring — the Tauri `rpc_request` command is still a
      placeholder shim returning canned responses; the real Python process
      spawn/IPC bridge from Phase 3 is not connected yet.
- [ ] Cross-platform Tauri runtime tests in CI.

### Risks / things to verify on a real run

- The `Plotly` `connectgaps` and `zsmooth: false` combination has not been
  visually compared side-by-side with the legacy pre-image on a real `.md2`
  fixture — only against the screenshot. A first-user demo on Andromeda
  (or another fixture with known structure) should be the acceptance test
  for the "blocky" look.
- `acceptCurrentSweep` advances to the next un-accepted sweep with a wrap.
  If a user accepts sweep 3 of 5 first, then accepts sweep 1, the order
  they see is `1 → 2 → 4 → 5 → pre-image`. Decide whether the legacy
  always walks linearly (and force that) or accepts the non-linear order
  the new flow allows.
