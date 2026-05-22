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