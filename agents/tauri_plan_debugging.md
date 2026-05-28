# Tauri App — Bug Tracking

This file is the bridge between manual testing of the Tauri app and Claude's
implementation work. List bugs here as you find them, then hand the file to
Claude to fix them.

## How to use this file

1. **Copy the template** at the bottom of this file (under the
   `<!-- TEMPLATE -->` marker) for each new bug.
2. **Fill in what you can.** Leave fields blank or write `n/a` rather than
   deleting them — the empty field signals "I checked, nothing here" vs.
   "I forgot."
3. **Add the bug to the Active Bugs index** below so it's easy to scan.
4. **Use markdown links for file refs** like
   `[ImageView.tsx](../tauri-app/app/src/views/ImageView.tsx)` — they
   render as clickable links in the IDE.
5. **Drop screenshots** in [docs/legacy_ui_reference/screenshots/](../docs/legacy_ui_reference/screenshots/)
   (if comparing against the legacy app) or create [docs/bugs/](../docs/bugs/)
   for app-specific captures, then link them by relative path.
6. **When a bug is fixed**, either move it to the `Fixed` section at the
   bottom (for history) or delete it — your call per bug.

---

## Active bugs

BUG-011
BUG-012
BUG-013

---

## Fixed bugs

- **BUG-004** — Restoring removed samples on the SurveyView "Removed" panel
  is now a drag-region gesture (matches Select Declination) instead of
  one-click-per-point. The Remove RFI tool stays selected throughout. See
  the BUG-004 entry below for details.
- **BUG-003** — Loading a `.cal` file now refreshes the scan/survey/pre-image
  data state immediately instead of waiting for the next accept/cut. See the
  BUG-003 entry below for details.
- **BUG-001** — Determine Peak reworked into a polynomial-fit gesture.
  User now drags an RA range on the flux plot; the engine fits a polynomial
  (degree 2/3/4) to the kept source samples in that band, takes the fit's
  maximum as `peak_flux`, and returns the evaluated curve so the UI can draw
  it on top of the data. Degree is configurable via
  Scan → Change Degree of Determine Peak…. The fit is undoable (snapshots the
  prior `peak_flux`). Replaces the legacy click-a-line picker that required
  the user to eyeball the peak height.
- **BUG-002** — Survey view declination format was multiplying degrees by 60
  (treating the `.md2` dec column as arc-minutes). Replaced with the
  decimal-degrees formula used by ScanView and the legacy
  `vb/survform.frm:8703-8705`.

---

## Example bug (delete or keep as a reference)

## BUG-000 — Example: palette anchor stops shifted by one on Pre Image view

- **Status:** Open
- **Priority:** Medium
- **Area:** UI
- **Where:** [ImagePlot.tsx](../tauri-app/app/src/lib/plots/ImagePlot.tsx),
  palette stops array near top of file; legacy reference in
  `vb/survform.frm:1518-1550`

### Repro
1. Launch the app with `just dev` from [tauri-app/](../tauri-app/).
2. Open Survey, load `fixtures/inputs/cas0awpeak.scn`.
3. Accept all sweeps to reach the Pre Image view.
4. Click **Make Image** with the default pixel resolution (2).

### Expected
The 8-stop palette renders black -> magenta -> blue -> cyan -> green ->
yellow -> red -> white, matching `docs/legacy_ui_reference/screenshots/preimagecygnus.png`.

### Actual
The first stop renders as dark magenta instead of black, and white is
missing from the high end. No console errors.

```
(no console output)
```

### Screenshots / attachments
- `docs/bugs/bug-000-palette-shift.png` (the rendered Pre Image)
- [docs/legacy_ui_reference/screenshots/preimagecygnus.png](../docs/legacy_ui_reference/screenshots/preimagecygnus.png) (legacy reference)

### Notes / suspected cause
Possibly an off-by-one when mapping `Pal!(N,1)/255` into the Plotly
colorscale `[position, color]` pairs — the legacy VB code is 1-indexed.

### Acceptance
Re-running the repro produces a Pre Image whose palette visually matches
the legacy screenshot at both extremes (true black at zero, true white at
the highest anchor).

---

<!-- TEMPLATE — copy everything between the markers below for each new bug -->
<!-- TEMPLATE START -->

## BUG-### — <short title>

- **Status:** Open | In Progress | Fixed | Won't fix | Needs more info
- **Priority:** High | Medium | Low
- **Area:** UI | Engine | RPC | Build | Workflow | Other
- **Where:** *file paths as markdown links, view names, function names —
  the more specific the better*

### Repro
1. *Step-by-step. Start from a known state (e.g. "Open app, load
   `fixtures/inputs/cas0awpeak.scn`").*
2. *...*

### Expected
*What you thought would happen, or what the legacy app does.*

### Actual
*What actually happens. Paste console errors, Python tracebacks, or RPC
payloads verbatim in a fenced code block. Note which terminal they came
from (browser devtools, `just dev` engine output, Tauri shell).*

```
<paste logs / errors / tracebacks here, or delete this block>
```

### Screenshots / attachments
- *Relative path(s) to images, e.g. `docs/bugs/bug-001-palette-mismatch.png`*

### Notes / suspected cause
*Optional — your hypothesis, related commits, things you already ruled
out. Helps Claude skip dead ends.*

### Acceptance
*How we know it's fixed. e.g. "Re-running the repro shows the violet
baseline line in the corrected panel" or "Test added in
`test_baseline_segment.py` passes".*

---

<!-- TEMPLATE END -->


## BUG-001 — Determine Peak line not able to be put at the top

- **Status:** Fixed (redesigned)
- **Priority:** Medium
- **Area:** UI + Engine
- **Where:** [ScanView.tsx](../tauri-app/app/src/views/ScanView.tsx),
  [PointScatter.tsx](../tauri-app/app/src/lib/plots/PointScatter.tsx),
  [scan_workspace.py](../tauri-app/engine/src/radio_cartographer/scan_workspace.py)

### Resolution
The original click-a-horizontal-line gesture inherited a real limitation of
the legacy VB tool: the user had to eyeball the peak height and the line
snapped to the nearest sample. Both versions also clamped the cursor inside
the plot area, so placing the line above the topmost sample was awkward.

Replaced with an actual peak-detection feature: the user drags an RA range
on the flux plot, the engine fits an N-degree polynomial
(default 0 (gaussian), configurable to 2, 3 or 4 via
**Scan → Change Degree of Determine Peak…**), evaluates it on a 200-point
grid across the selected range, and stores the max as `peak_flux`. The fit
curve is returned and drawn over the data; only `peak_flux` is persisted on
the workspace. Push-undo restores the prior `peak_flux`.

### Acceptance
- Engine tests: `tests/rpc/test_rpc_scan.py::test_determine_scan_peak_fit_*`
  pass (recovers a known quadratic, undo restores the prior peak, rejects
  too-few-samples and out-of-range degrees).
- Manual: drag a band over the visible peak on `fixtures/inputs/cas0a.md1`;
  the polynomial line lays through the band and the Peak Flux readout
  updates to the fit's max.

---

## BUG-002 — Declination Incorrect in Surveys

- **Status:** Fixed
- **Priority:** High
- **Area:** UI
- **Where:** [SurveyView.tsx](../tauri-app/app/src/views/SurveyView.tsx) `formatDec`

### Resolution
`SurveyView.formatDec` was multiplying the dec value by 60, treating the
`.md2` declination column as arc-minutes. The column is actually decimal
degrees (same as `.md1`), and the legacy VB code at
`vb/survform.frm:8703-8705` formats it as
`Int(|Dec|) : Int((|Dec|−d)·60) : Int((|Dec|−d−m/60)·3600)`.
Replaced the survey formatter with the same logic ScanView already uses.

### Acceptance
Survey readout values for known points match the legacy app and the
ScanView readout for the same RA/Dec.

---

## BUG-003 — Reload upon flux calibration selected

- **Status:** Fixed
- **Priority:** High
- **Area:** UI
- **Where:** [ScanView.tsx](../tauri-app/app/src/views/ScanView.tsx),
  [SurveyView.tsx](../tauri-app/app/src/views/SurveyView.tsx),
  [PreImageView.tsx](../tauri-app/app/src/views/PreImageView.tsx)

### Resolution
The flux-cal auto-apply effect in
[flux-cal-context.tsx](../tauri-app/app/src/state/flux-cal-context.tsx) was
already calling `refreshOverview` / `refreshWorkspace` after applying the
slope on the engine, but only the workspace metadata picked that up. The
plotted data (`ScanView.view`, `SurveyView.sweep`,
`PreImageView.imageMeta`/`imagePixels`) was loaded by effects keyed only on
the workspace handle, so they kept the cached GCU samples while the engine
silently rescaled to Jy. Determine Peak then ran on the engine in Jy and
overlaid a Jy curve onto GCU points, which is why the fit line looked
detached from the data.

Added `flux_calibrated` to the dependency arrays of those data-loading
effects so each view re-fetches when a `.cal` is loaded (or removed). The
existing reset-on-(re)calibrate logic in SurveyView was extended the same
way.

### Acceptance
Load `fixtures/inputs/cas0a.md1`, calibrate, then Flux Calibration → Select
Calibration… and pick a `.cal`. The plot redraws in Jy immediately (peak
flux readout and axis values switch), and a fresh Determine Peak fit lays
through the visible points instead of sitting in a different unit system.

---

## BUG-004 — Replace rfi removal

- **Status:** Fixed
- **Priority:** Medium
- **Area:** UI
- **Where:** [SurveyView.tsx](../tauri-app/app/src/views/SurveyView.tsx)

### Repro
1. Launch the app with `just dev` from [tauri-app/](../tauri-app/).
2. Open Survey
3. Calibrate Survey
4. Remove RFI

### Expected
In the legacy tool restoring points removed through "baseline segment" can be restored with the same ui of selecting two points and restore all points between those selected. In the new tool I want it to behave like select declination, where you can highlight a region and those points get restored, the whole time the tool should remain selected

### Actual
You can only restore points by selecting them one at a time

### Resolution
The bottom "Removed" panel used a single-click-restore gesture
(`handleRestoreClick`) keyed off each removed sample's `sampleIndex`. Wired
the panel up to PointScatter's drag-on-x mechanism instead: a new
`restoreDragRange` / `restoreDragOrigin` pair drives a blue highlight band
(`highlightColor: '#3060c0'`, distinguishing it from the green Cut and
yellow Select-Dec highlights) while the user drags, and on drag-end every
removed sample whose `dec` falls inside `[x0, x1]` is dropped from
`removedBySweep`. `dragEnabled` is bound to `hasPendingRemoved` so the
gesture is only armed when there are actually points to restore. Critically
the handler never touches `baselineMode`, so the Remove RFI tool stays
selected across the entire restore cycle — matches the "the whole time the
tool should remain selected" requirement.

The old `handleRestoreClick` was removed (a zero-distance drag is treated
as no-op rather than as a click), and the empty-state placeholder was
updated to "Removed samples appear here. Drag a declination range to
restore them."

A new SurveyView workflow test drives the full gesture end-to-end through
an upgraded PointScatter mock that exposes point-click and drag callbacks
as hidden buttons.

### Screenshots / attachments


### Notes / suspected cause


### Acceptance
You can highlight points from the lower panel in sweep view to restore
them. Verified by
[SurveyView.workflow.test.tsx](../tauri-app/app/src/__tests__/SurveyView.workflow.test.tsx)
"Drag-region on Removed plot restores points while Remove RFI stays
selected (BUG-004)" — drags 9..13 across the Removed panel, asserts every
sample in the dec window [10, 12] gets restored and the tool button still
reads `Remove RFI (click…)`.

---

## BUG-005 — Fit Calibration Line

- **Status:** Fixed
- **Priority:** Medium
- **Area:** UI
- **Where:** [flux-cal-context.tsx](../tauri-app/app/src/state/flux-cal-context.tsx) (root cause), [CalibrationView.tsx](../tauri-app/app/src/views/CalibrationView.tsx) (rendering)

### Fix
`addEntry` and `removeEntry` in `flux-cal-context.tsx` were calling the
`fluxCalFit` RPC, which populated `slope` and caused
`CalibrationView`'s `fitLine` memo to render the line as soon as the
first point was added. They now update the local table only and clear
`slope`/`error`, so the fit line stays hidden until the user clicks
**Fit Calibration** (which still runs through `refit` → `fluxCalFit`).
### Repro
1. Launch the app with `just dev` from [tauri-app/](../tauri-app/).
2. From Flux Calibration, select new calibration.
3. Add source from file

### Expected
Uploading the file only adds the point to the plot, the fit line doesn't appear until "Fit Calibration" is clicked

### Actual
As soon as the point it rendered, the fit line is as well


### Notes / suspected cause
Calculation is being performed as soon as data is available

### Acceptance
Re-running the repro shows only the point on the plot, and hitting "Fit Calibration" fits the least squares line and causes it to appear on the graph as well as stores the conversion factor (slope of the line)

---

## BUG-006 — RA in Scan View

- **Status:** Fixed
- **Priority:** High
- **Area:** UI
- **Where:** [ScanView.tsx](../tauri-app/app/src/views/ScanView.tsx), [PointScatter.tsx](../tauri-app/app/src/lib/plots/PointScatter.tsx)

### Fix
`PointScatter` now accepts an optional `xTickFormatter`. When supplied it
stamps ~5 evenly-spaced ticks across the visible X range and renders the
labels via the formatter (same `sexagesimalTicks` pattern as
[ImagePlot.tsx](../tauri-app/app/src/lib/plots/ImagePlot.tsx)). The Scan
View's declination panel — the one plot that displays the RA axis —
passes `formatRa`, so the axis now reads `20:01:30` instead of `72.05k`.

### Repro
1. Open App
2. Scan -> Open/New Scan

### Expected
RA values along bottom axis are in HH:MM:SS format like it is for the image plots and the side view that lists the RA

### Actual
Is converting somehow resulting in an axis reading 72K, 72.05K ect



### Screenshots / attachments
- docs\bug_screenshots\raaxis.png

### Notes / suspected cause
Some conversion is happening that switches the formatting
### Acceptance
The RA axis, when available is always in the standard format that we use elsewhere. 

---

## BUG-007 — Gray Space

- **Status:** Open 
- **Priority:** High 
- **Area:** UI 
- **Where:** 

### Repro
1. Open App
2. Open scan, sweep or image


### Expected
Fill the screen save for a small gray outline

### Actual
Empty gray space at the bottom of the window



### Screenshots / attachments
- docs\legacy_ui_reference\screenshots\grayspace.png

### Notes / suspected cause
Just has a set size

### Acceptance
You should be able to resize the window and have the survey or image or scan fill most of the window, leaving a small gray outline, the size of what is currently defaulted on the top and sides.

---

## BUG-008 — Right click preimage flips axis

- **Status:** Fixed
- **Priority:**  Medium 
- **Area:** UI 
- **Where:** [ImagePlot.tsx](../tauri-app/app/src/lib/plots/ImagePlot.tsx)
  `handleContextMenu`

### Fix
Two changes in [ImagePlot.tsx](../tauri-app/app/src/lib/plots/ImagePlot.tsx):

1. `handleContextMenu` only called `e.preventDefault()` when an
   `onContextMenu` callback was wired up. `PreImageView` doesn't pass
   one, so the browser context menu was free to open. Moved
   `preventDefault()` ahead of the callback check so right-click is a
   no-op on any `ImagePlot` that doesn't opt into a context-menu action.
2. The actual axis-flip cause: when Plotly resets the layout (zoom-out
   via double-click, or any other autorange reset), it sets
   `xaxis.autorange: true` — *dropping* the `'reversed'` flag we set in
   the initial layout, so RA renders min-on-left and the axis appears
   flipped. Added a `plotly_relayout` listener that detects this reset
   and re-applies `autorange: 'reversed'` (guarded by a flag so the
   relayout we trigger doesn't loop). Only kicks in when `hasBounds`,
   matching the initial layout's gate.

`ImageView` (which does wire up `onContextMenu` for the box-set flow) is
unaffected.

### Repro
1. Open App
2. Load Survey
3. Approve all sweeps, generate preimage

### Expected
Right click does nothing on preimage

### Actual
Right clicking on the preimage zooms in and then when a user zooms back out, the RA axis flips


### Notes / suspected cause
Something about doing a right click zoom resets the plot and gets rid of the correct RA axis

### Acceptance
A user can right click on a preimage and nothing will happen. 

---

## BUG-009 — Can't append  with .fits file

- **Status:** In Progress — input-guard fix landed; root-cause unit normalization tracked as BUG-011
- **Priority:** High
- **Area:** Engine
- **Where:** tauri-app/engine/src/radio_cartographer/image_compose.py, tauri-app/engine/src/radio_cartographer/io/fits.py, tauri-app/engine/src/radio_cartographer/rpc.py

### Repro
1. Open app
2. Open .fits file as image (e.g. fixtures/inputs/CAS-A_RC_Job_7963_0007654.fits)
3. Append or superimpose with another file (e.g. fixtures/outputs/cassio_a.img)

### Expected
User should be able to append and superimpose image with a fits file

### Actual (pre-fix)
When user tries to append or superimpose, either a .img file or .fits file with the base image being a .fits file, it fails and generates two errors shown below:

'Error: 1001:unknown handle: 29 '
'-32603':Unable to allocate 660. GiB for an array with shape (5269, 16803921) and data type float64

### Root cause
`.img` files store RA in **seconds of time** (e.g. `cassio_a.img` → min_ra=79208.67, max_ra=98166.5) while `.fits` files store RA in **degrees** (CAS-A → 350.04–350.86). `_compose()` in `image_compose.py` takes `min/max` across both as if they were the same unit, producing a union span of ~97,800° at the FITS primary's 0.00582°/px resolution → 16,803,921-pixel-wide output grid → 660 GiB float64 allocation → Python sidecar OOM → in-memory `HandleRegistry` lost → next UI action gets `1001:unknown handle: 29`. The handle error is a downstream symptom, not a separate bug.

### Fix (this PR)
Layered input validation that rejects the failure before any large allocation:
1. **Grid-budget guard** in `image_compose._check_grid_budget()`: raises `ValueError` with a user-readable message if the planned output grid exceeds 100 megapixels. Applied in `_compose` and `_two_image_grid` (covers append/superimpose/bicolor/tricolor).
2. **FITS WCS validation** in `io.fits.read_fits()`: rejects headers with non-finite CRVAL/CRPIX/CDELT, zero CDELT, |CDELT| > 10°, or computed Dec outside [-90, 90].
3. **RPC translation**: `_append_image` and `_tricolor_image` now wrap `ValueError` as `RpcError(ERR_INVALID_PARAMS, ...)` so the message reaches the UI via `setWarning((e as Error).message)`.

### Acceptance
- Repro now returns a clear yellow-banner warning ("Cannot compose images: combined sky area is far larger than the primary's resolution…") instead of crashing the sidecar.
- Base image handle remains valid after the rejection (no `unknown handle` follow-up).
- Tests: `test_append_fits_with_img_yields_clear_rpc_error`, `test_superimpose_fits_with_img_yields_clear_rpc_error` (RPC e2e), plus grid-budget and FITS-validation unit tests.
- Full append/superimpose between two `.fits` files (or two `.img` files) with compatible coordinates continues to work — this is just an input guard, not a behavior change for the valid cases.

---

## BUG-010 — Change Name

- **Status:** Resolved
- **Priority:** Medium 
- **Area:** UI | Engine 
- **Where:** tauri-app/app/src/views/MainWindow.tsx, tauri-app/app/src/views/dialogs/TextInputDialog.tsx, tauri-app/app/src/state/{survey,scan}-context.tsx, tauri-app/app/src/ipc/client.ts, tauri-app/engine/src/radio_cartographer/rpc.py

### Repro
1. Any Change name button

### Expected
Chnage name button should open a pop up text box that allows you to change the "name" of the image, calibration, scan or survey that is displayed on the top left of the UI. This is not the same as the file name, though the default if there isn't something else should be the file name. You should be able to change the name and it persist if you save the file, close and reopen it. 

### Actual
Buttons don't do anything currently


### Notes / suspected cause
Just hasn't been implemented yet, is being used essentially as a file name field 

### Acceptance
Using the change name button allows you to input text that will be displayed in the upper left of the window (where it currently is) that will be persistant through saving, closing and reopening of a file. 

---

## BUG-011 — `.img` and `.fits` use incompatible RA units (seconds-of-time vs degrees)

- **Status:** Open
- **Priority:** High (blocks legitimate FITS+IMG mosaics)
- **Area:** Engine
- **Where:** tauri-app/engine/src/radio_cartographer/io/img.py, tauri-app/engine/src/radio_cartographer/io/fits.py, tauri-app/engine/src/radio_cartographer/rpc.py (`_image_to_gridded`)

### Repro
1. Open a `.fits` file (e.g. CAS-A FITS, RA in degrees, ~350.04–350.86°).
2. Try to append a `.img` of the same source (e.g. `cassio_a.img`, RA values ~79208–98166 seconds-of-time).

### Expected
The compose should succeed: both files cover roughly the same sky region.

### Actual
BUG-009's input guard now rejects with a clear "different coordinate systems" error. Compose never runs.

### Notes / suspected cause
`io.img.read_img` stores `min_ra`/`max_ra` straight from the legacy VB binary header (units = seconds of time, derived from `Pix * 15 sec/pix` × column count, see survform.frm:1697). `io.fits.read_fits` stores `min_ra`/`max_ra` in degrees from WCS corner math. Both write to the same `GriddedImage.min_ra`/`max_ra` fields with no awareness of units. `_compose()` then treats them as the same scale.

Conversion: 1 second of time = 15/3600 degrees = 1/240 degree (for RA only; Dec is in degrees in both formats).

### Fix sketch
Normalize at load time so every `GriddedImage` carries RA in degrees:
- In `_image_to_gridded` (rpc.py), divide `image.min_ra`/`max_ra` by 240 before populating the GriddedImage.
- Update `_gridded_to_image` (the reverse) to multiply back by 240 when serializing `.img`.
- Audit all `GriddedImage` consumers (workspace, plots, compose math) for places that assume seconds.
- Add a roundtrip test that loads a `.img`, saves it back, and checks byte equality of the legacy bounds fields.

### Acceptance
- A `.fits` file and the corresponding `.img` of the same source compose successfully (overlap visible in the result).
- Existing `.img`-only and `.fits`-only compose tests still pass.
- Legacy `.img` roundtrip preserves on-disk byte values for min_ra/max_ra fields.

---

## BUG-012 — Sidecar crash leaves UI holding stale handles

- **Status:** Open
- **Priority:** Medium
- **Area:** RPC | Engine | UI
- **Where:** tauri-app/src-tauri/ (sidecar process management), tauri-app/engine/src/radio_cartographer/_handles.py, tauri-app/app/src/ipc/client.ts

### Repro
Any flow that crashes the Python sidecar (OOM, unhandled exception, kill -9). Observed in the wild as: BUG-009's 660 GiB allocation → sidecar OOM → next UI action returns `Error: 1001:unknown handle: 29` because the in-memory `HandleRegistry` is gone but the UI still believes its handles are live.

### Expected
The user keeps working without losing in-flight context. Either the sidecar auto-restarts and the UI re-registers its known handles (re-opening files transparently), or the UI shows a single clear "engine restarted; please re-open your files" notice and resets handle state.

### Actual
The UI surfaces a cryptic `1001:unknown handle: <N>` error on every subsequent operation. The user has to manually close and reopen everything.

### Notes / suspected cause
- `HandleRegistry` is purely in-memory (tauri-app/engine/src/radio_cartographer/_handles.py); there is no persistence layer.
- The Tauri sidecar process isn't currently monitored/restarted on crash.
- The UI has no concept of "handles invalidated; recover."

### Fix sketch
Two layers:
1. **Sidecar resilience** (src-tauri): supervise the Python process; on unexpected exit, log to a panel, restart it, and emit an IPC event "engine_restarted" with the new pid.
2. **UI handle reconciliation** (ipc/client.ts + state contexts): on `engine_restarted`, mark all handles stale, prompt user to re-open files (or attempt automatic re-open from the last known path if we tracked it). Translate `code === 1001` responses into a structured "STALE_HANDLE" error type instead of raw string parsing.

### Acceptance
- Killing the sidecar mid-session (`taskkill /F /IM python.exe` while in the dev shell) results in either an automatic restart-and-recover, or a one-time user-facing notification — never a cascade of `unknown handle` errors.
- Regression test: a mocked transport that simulates sidecar restart returns the appropriate UI state instead of breaking all open windows.

---

## BUG-013 — Bi-Color and Tri-Color Images

- **Status:** Fixed
- **Priority:** High
- **Area:** UI | Engine
- **Where:**
  - [image_compose.py](../tauri-app/engine/src/radio_cartographer/image_compose.py) (compose math, NaN handling, 3-way bbox)
  - [rpc.py](../tauri-app/engine/src/radio_cartographer/rpc.py) (`_image_meta`, `_get_*_image_pixels`, JSON-safe encoding, block-max downsample, tertiary shift params)
  - [palette.py](../tauri-app/engine/src/radio_cartographer/palette.py) (bitmap-save NaN handling)
  - [RgbImagePlot.tsx](../tauri-app/app/src/lib/plots/RgbImagePlot.tsx) (paper-coord layout image, no-data → white, gridlines off)
  - [ImagePlot.tsx](../tauri-app/app/src/lib/plots/ImagePlot.tsx) (white plot_bgcolor, null-pixel handling)
  - [ImageView.tsx](../tauri-app/app/src/views/ImageView.tsx), [client.ts](../tauri-app/app/src/ipc/client.ts), [MainWindow.tsx](../tauri-app/app/src/views/MainWindow.tsx) (null pixel propagation, tertiary shift dialog, commit-handler guard)

### Fix
Five distinct issues conspired to produce the all-black bi-color result and
the missing third image in tri-color. They were fixed in layers:

1. **`_normalize01` was not NaN-safe.** A single FITS NaN sentinel poisoned
   the whole channel because `np.min`/`np.max` propagate NaN, the `hi <= lo`
   guard returned False against NaN, and `(arr - NaN) / (NaN - NaN)` produced
   an all-NaN channel. Replaced with a finite-mask version that derives
   `lo`/`hi` from `arr[np.isfinite(arr)]` and passes NaN cells through as
   NaN so the renderer can paint them distinctly.
2. **JSON encoding emitted `NaN` bareword literals.** Python's default
   `json.dumps` writes `NaN`/`Infinity` literally, which Rust's strict
   `serde_json::from_str` in [sidecar.rs](../tauri-app/app/src-tauri/src/sidecar.rs)
   rejected — the whole RPC reply was dropped on the UI side, manifesting
   as either a `-32000:expected value at line 1 column …` error (for
   append-after-NaN) or an empty render. Added `_array_to_jsonable_list`
   that converts NaN → `null` at the array-to-list boundary in
   `_get_image_pixels`/`_get_rgb_image_pixels`, and audited every
   pixel-derived float in `_image_meta` / `_flux_range_from_params` /
   `_gridded_to_image` to use `nanmin`/`nanmax` with all-NaN fallbacks.
3. **Stride-slice downsampling dropped point-source peaks.** A bright
   one-pixel source can fall on an unsampled coordinate after
   `r[::step, ::step]` and vanish from the displayed grid. Replaced with
   `_block_downsample` (NaN-aware block-max via `nanmax` over
   `(H//step, step, W//step, step)`) so any block containing the peak
   keeps it.
4. **Bi/tri-color compose treated no-coverage cells as `0.0`.** That
   collapsed to a real-but-very-dark pixel after the [0, 1] clamp, so
   the renderer couldn't tell "no data" from "covered but dim." Threaded
   per-input coverage masks through `bicolor_compose`,
   `tricolor_compose`, and `extend_rgb_compose`; uncovered cells are
   now NaN per channel. The renderer paints white only when *all* channels
   for a pixel are non-finite, otherwise it treats non-finite individuals
   as 0 — this preserves the cassio-only / crab-only regions on a
   disjoint-input bi-color.
5. **Plotly's data-coord layout image was being squished.** With
   `xref: 'x'`, large `sizex` (~32 000 sidereal seconds for RA), and a
   reversed axis, Plotly rendered the bitmap at a tiny fraction of the
   intended width — the user saw only a sliver of Cas-A at the right
   edge. Switched to `xref: 'paper'` so the bitmap fills the plot area
   directly, and updated the canvas pixel orientation to match: canvas
   col 0 = engine col 0 = data at `max_ra` = visual LEFT after reversed
   axis. Disabled gridlines/zerolines for visual cleanliness.

For **tri-color from scratch**, `tricolor_compose` now unions all three
inputs into the output bbox (it was using `_two_image_grid` which only
considered primary+secondary, silently clipping the tertiary). Added
independent `tertiary_ra_shift_seconds` / `tertiary_dec_shift_degrees`
parameters end-to-end (engine → RPC → client → dialog cascade) so the
user can nudge the third image into a visible region.

For **tri-color from an existing bi-color**, `extend_rgb_compose` now
grows the bbox to cover the new image's footprint (it was clamping the
new image to the existing bi-color's bounds), resampling the existing
R/G/B channels onto the larger grid with NaN outside their original
coverage. A separate UI bug — an unconditional `if (!image) return` at
the top of the commit handler in [MainWindow.tsx](../tauri-app/app/src/views/MainWindow.tsx)
— was silently swallowing the from-rgb commit because `image` is null
once the bi-color is showing. Guarded per-mode so only bicolor and
tricolor-from-scalar require `image`, while tricolor-from-rgb requires
`rgbImage`.

Regression tests in
[test_image_compose.py](../tauri-app/engine/tests/numerics/test_image_compose.py)
and [test_rpc_image_io.py](../tauri-app/engine/tests/rpc/test_rpc_image_io.py)
cover NaN-safe `_normalize01`, peak-preserving block downsample,
no-finite-poisoning JSON encoding, three-way disjoint tri-color, tertiary
shifting, bbox-extended extend, and the strict-JSON meta round-trip that
caught the `min_flux: NaN, max_flux: NaN` decode failure.

### Repro
1. Open App
2. Open Image
3. Select Bi-color or Tri-color image
4. Select additional image
5. Walk through uis that pop up

### Expected
A bi-color (or tricolor) image is produced and shown

### Actual
The axes seem to scale but the entire image is black.

### Screenshots / attachments
- docs\bug_screenshots\colorimagebug.png

### Notes / suspected cause
Something in the color image is being overridden by a palette option maybe

### Acceptance
Bi color and tri color images are able to be produced

---

## BUG-014 — Black blank space instead of white in appended images

- **Status:** Fixed
- **Priority:** Medium
- **Area:** UI | Engine
- **Where:**
  - [image_compose.py](../tauri-app/engine/src/radio_cartographer/image_compose.py) (`_compose` NaN-init)
  - [ImagePlot.tsx](../tauri-app/app/src/lib/plots/ImagePlot.tsx) (white plot_bgcolor, null z-cells render transparent)
  - [ImageView.tsx](../tauri-app/app/src/views/ImageView.tsx) (null-aware magnifier, blank flux readout)
  - [client.ts](../tauri-app/app/src/ipc/client.ts), [rpc.py](../tauri-app/engine/src/radio_cartographer/rpc.py) (null-safe pixel types and JSON encoding — see BUG-013)

### Fix
Bundled with BUG-013 because the underlying contract is the same:
**NaN means "no data," renderer paints no data as white** (matching the
legacy reference screenshot of an appended image).

- `_compose` (append/superimpose) now initializes the output to
  `np.full((h, w), np.nan, …)` instead of `np.zeros(...)`. Cells covered
  by either input get the input's flux value; the gap stays NaN.
- The save side handles NaN sentinel mapping: `_gridded_to_image` swaps
  NaN to `Clr = 0` (the legacy `.img` "unpainted background" marker, which
  reloads as `min_flux_p` — round-trip-safe), `apply_palette` paints
  no-data white for `.bmp` export, and FITS save passes NaN through
  unchanged (FITS native no-data sentinel).
- `ImagePlot` sets `plot_bgcolor: '#ffffff'` and relies on Plotly's
  built-in transparent rendering of `null` heatmap cells — Vite uses
  the same `_array_to_jsonable_list` boundary as bi/tri-color so scalar
  cells encode as `null` and render as bgcolor.
- The flux readout in `ImageView` was updated to show an em-dash
  rather than `0.0000` when the cursor lands on a NaN cell, and the
  magnifier now skips NaN when computing local stretch min/max so a
  no-data corner doesn't break the local palette.

### Repro
1. Open app
2. Open image
3. Append image
4. Walk through pop ups

### Expected
Images are appended and blank space inbetween images is rendered as white and flux field is blank (not zero but blank)

### Actual
Blank space inbetween images is rendered as having a flux of zero and is black (or whatever color zero palette is)


### Screenshots / attachments
- docs\legacy_ui_reference\screenshots\appendedimage.png

### Notes / suspected cause
nans are being rendered as zero instead of something else

### Acceptance
Visual pass by user, nan values should render as white not black to differentiate from the background subtracted near-zero values of the maps.

---