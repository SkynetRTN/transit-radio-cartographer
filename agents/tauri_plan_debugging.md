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

*(none)*

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

### BUG-008 — Right click preimage flips axis

- **Status:** Open
- **Priority:**  Medium 
- **Area:** UI 
- **Where:** tauri-app\app\src\views\PreImageView.tsx

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

- **Status:** Open 
- **Priority:** High 
- **Area:** UI | Engine 
- **Where:** 

### Repro
1. Open app
2. Open .fits file as image

### Expected
User should be able to append and superimpose image with a fits file

### Actual
When user tries to append or superimpose, either a .img file or .fits file with the base image being a .fits file, it fails and generates two errors shown below:

'Error: 1001:unknown handle: 29 '
'-32603':Unable to allocate 660. GiB for an array with shape (5269, 16803921) and data type float64


### Notes / suspected cause
The fits file that is being generated outside of OG RC has additional data in it that is causing either incorrect or incongruent coordinates or just too large of a file to append

### Acceptance
Append and superimpose works with either .img files or .fits files. Tests should be created to ensure uploading two files is possible with a .fits file loaded. 

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