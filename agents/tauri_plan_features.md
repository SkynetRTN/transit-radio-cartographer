# Tauri App — Feature Requests

This file is the bridge between feature ideas you want in the Tauri app and
Claude's implementation work. List new features here as you think of them,
then hand the file to Claude to build them. Sibling to
[tauri_plan_debugging.md](tauri_plan_debugging.md).

## How to use this file

1. **Copy the template** at the bottom of this file (under the
   `<!-- TEMPLATE -->` marker) for each new feature request.
2. **Fill in what you can.** Leave fields blank or write `n/a` rather than
   deleting them — the empty field signals "I checked, nothing here" vs.
   "I forgot."
3. **Add the feature to the Active Features index** below so it's easy to
   scan.
4. **Use markdown links for file refs** like
   `[SurveyView.tsx](../tauri-app/app/src/views/SurveyView.tsx)` — they
   render as clickable links in the IDE.
5. **Point at legacy references** when the feature already exists in the
   VB app. Screenshot under [docs/legacy_ui_reference/screenshots/](../docs/legacy_ui_reference/screenshots/),
   source in `vb/survform.frm:<line>` if you know it. Half the work is
   often "make it look like the legacy app does here."
6. **When a feature ships**, either move it to the `Done` section at the
   bottom (for history) or delete it — your call per feature.

---

## Active features

*(none)*

---

## Done

- **FEAT-011** — Replaced the per-view Lock Aspect button (FEAT-008) and
  the Image > Snap to Square checkbox (FEAT-010) with one **Image >
  Image Display** four-mode selector: Declination Corrected (default),
  No Declination Correction, Snap to Square, Stretch to Fill. See the
  FEAT-011 entry below.
- **FEAT-010** — *(UI superseded by FEAT-011.)* Image menu had a
  **Snap to Square** toggle that switched the Lock Aspect lock between
  the default sky-shape projection (cos(dec)/240) and a pixel-grid lock
  that makes each cell square on screen. The pixel-grid formula is
  preserved in FEAT-011 as the "Snap to Square" option of the new
  selector. See the FEAT-010 entry below.
- **FEAT-009** — `make_image` now detects RA-crossing surveys (samples
  clustered at both 0h and 24h with a large middle gap) and unwraps the
  early-side samples by +86400 before gridding, so Cassiopeia-style
  observations across midnight produce a tight ~5h arc instead of a
  24h-wide grid with an empty middle. See the FEAT-009 entry below.
- **FEAT-008** — *(UI superseded by FEAT-011.)* Lock Aspect sidebar
  button on the Pre Image and Image views. ON (default) preserved the
  sky-shape aspect ratio via `scaleratio: cos(dec_center) / 240`
  (RA-seconds → degrees plus the rectangular-projection correction for
  high-dec surveys); OFF stretched to fill the workspace area. The
  cos(dec)/240, 1/240, and pixel-grid formulas all live on in FEAT-011's
  four-mode selector. See the FEAT-008 entry below for the formula
  evolution history.
- **FEAT-004** — Renamed the SurveyView Baseline Segment button to
  **Remove RFI** (and the matching pending-click hint / Accept-button labels)
  to avoid confusion with ScanView's Baseline Source tool. See the FEAT-004
  entry below for details.
- **FEAT-002** — Tool buttons (Cut Segment, Select Declination, Baseline
  Source, Determine Peak in ScanView; Cut Segment and Select Declination in
  both calibration views) stay highlighted blue after each operation
  completes, the way Baseline Segment already did in SurveyView. See the
  FEAT-002 entry below for details.
- **FEAT-001** — Light-gray grid lines added to every PointScatter plot
  (gridlines align with the existing tick positions on both axes). See the
  FEAT-001 entry below for details.

---

## Example feature (delete or keep as a reference)

## FEAT-000 — Example: keyboard shortcuts for sweep navigation

- **Status:** Proposed
- **Priority:** Medium
- **Area:** UI
- **Where:** [SurveyView.tsx](../tauri-app/app/src/views/SurveyView.tsx),
  [survey-context.tsx](../tauri-app/app/src/state/survey-context.tsx);
  shortcut registration likely belongs in
  [MainWindow.tsx](../tauri-app/app/src/views/MainWindow.tsx)

### Summary
Bind `[` / `]` to Prev/Next sweep and `Enter` to Accept Sweep when the
SurveyView is focused, mirroring the legacy app's hotkeys.

### Motivation / why
Students walking through a 30+ sweep survey currently have to mouse over
to the sidebar Prev/Next/Accept buttons for every sweep. Hotkeys cut
through-survey time roughly in half and match what experienced users of
the legacy VB app already have in their fingers.

### User-facing behavior
- When SurveyView is focused (no modal open, no text input focused):
  - `]` advances to the next sweep (wraps to first if at end).
  - `[` goes to the previous sweep.
  - `Enter` accepts the current sweep (same as clicking Accept Sweep).
  - `u` undoes the last baseline segment on the current sweep.
- Shortcuts are listed in a small "?" popover anchored to the sidebar.
- Disabled while any modal (e.g. "Input Pixel Resolution") is open.

### Legacy reference
- Screenshot: [docs/legacy_ui_reference/screenshots/calibrate.png](../docs/legacy_ui_reference/screenshots/calibrate.png)
- Legacy source: `vb/survform.frm` KeyDown handler around line 2200.

### Acceptance criteria
- [ ] Pressing `]` on SurveyView advances the sweep index in
      [survey-context.tsx](../tauri-app/app/src/state/survey-context.tsx).
- [ ] `Enter` triggers the same accept-sweep flow as the button (incl.
      transition to Pre Image after the last sweep).
- [ ] Shortcuts no-op when any modal or text input is focused.
- [ ] Test added in
      [SurveyView.test.tsx](../tauri-app/app/src/__tests__/) that simulates
      keypress and asserts sweep index change.

### Out of scope
- Rebinding shortcuts (single fixed map for now).
- Hotkeys on other views (Pre Image, Image, Palette Editor) — separate
  features if needed.

### Open questions
- Should `Enter` also work when the Accept Sweep button isn't yet enabled
  (i.e. before calibration), or should it be silent in that state?

---

<!-- TEMPLATE — copy everything between the markers below for each new feature -->
<!-- TEMPLATE START -->

## FEAT-### — <short title>

- **Status:** Proposed | Approved | In Progress | Done | Deferred | Won't do
- **Priority:** High | Medium | Low | Nice-to-have
- **Area:** UI | Engine | RPC | Build | Workflow | Other
- **Where:** *file paths as markdown links, view names, or "new file at
  `path/to/new.tsx`" — the more specific the better*

### Summary
*One paragraph: what the feature is, in your own words.*

### Motivation / why
*The problem this solves. Who needs it (student, instructor, you while
debugging). What's painful or impossible today.*

### User-facing behavior
*The new UX, click-by-click. What buttons appear, what dialogs open,
what changes on screen, what keyboard input does. If it's a backend-only
feature, describe the RPC shape instead.*

### Legacy reference
*If this matches behavior in the legacy VB app:*
- *Screenshot path under [docs/legacy_ui_reference/screenshots/](../docs/legacy_ui_reference/screenshots/)*
- *Source location like `vb/survform.frm:<line>` if you know it*

*If this is brand-new (no legacy equivalent), say so — Claude won't go
hunting for one.*

### Acceptance criteria
*Bullet list of what "done" means. Concrete and testable. e.g.*
- [ ] *Button X appears on view Y when condition Z is true.*
- [ ] *Test added in `<path>` covers the new behavior.*

### Out of scope
*What you specifically don't want built as part of this feature, so
Claude doesn't gold-plate. e.g. "no undo for this action yet",
"single-user only, not multi-survey".*

### Open questions
*Decisions you want Claude to surface back before implementing — UX
choices, edge cases, naming. Leave blank if there are none.*

---

<!-- TEMPLATE END -->
---

## FEAT-001 — Gridding on graphs

- **Status:** Done
- **Priority:** Low
- **Area:** UI
- **Where:** [PointScatter.tsx](../tauri-app/app/src/lib/plots/PointScatter.tsx)

### Summary
Add light gray grid lines to all PointScatter-based plots.

### Resolution
Plotly's `xaxis`/`yaxis` already supported a built-in grid; both axes had
`showgrid: false` in the layout config. Flipped both to `true`, added
`gridcolor: '#e6e6e6'` (soft light gray that reads as background detail on
the white plot area), and `gridwidth: 1`. Plotly draws gridlines at the same
positions it would draw tick labels, so they land on the existing tick
positions exactly as requested — no major/minor distinction, no separate
config per view, no behavioral changes to drag/hover/cut/baseline.

Because every scan, survey, calibration and pre-image plot routes through
`PointScatter`, this single change reaches all of them. The heatmap-style
ImagePlot is a different primitive and was out of scope ("scatter point
graphs" in the summary).

### Acceptance criteria
- [x] All PointScatter plots render light-gray gridlines at tick positions.
- [x] No regressions in cut / baseline / peak-fit gestures (existing
      workflow tests pass: 34/34).

### Out of scope
Major vs minor axis, the grid should just be light gray where the tick marks on the axes already are. ImagePlot heatmaps.

### Open questions


---

## FEAT-002 — Sticky tool selection

- **Status:** Done
- **Priority:**  Medium
- **Area:** UI
- **Where:** [ScanView.tsx](../tauri-app/app/src/views/ScanView.tsx),
  [CalibrateScanView.tsx](../tauri-app/app/src/views/CalibrateScanView.tsx),
  [CalibrateSurveyView.tsx](../tauri-app/app/src/views/CalibrateSurveyView.tsx)

### Summary
Each of the 'tools' in the scan and survey veiw, as well as the calibration screen should be sticky tools, eg stay selected until you click them again or select another tool. Baseline segment in surveys already exhibits this type of behavior. Cut segment, select declination, and baseline source in a scan should also exhibit this behavior. Buttons should highlight blue and remain highlighted until you click that tool again or select a different tool (exactly how it already is for baseline source in a survey). Undo should still only undo the most recent change, even if multiple changes are being made with the same tool.

### Motivation / why
When you are cutting in calibration you have to cut atleast once for each of the four states, so the tool should remain on, same is true for other tools, most of the time you are using the tool multiple times on one screen, so rather than click the tool every time, the tool should remain selected.

### User-facing behavior
Highlight tool and the user may continue to use that tool until they deselect by clicking tool again or they select a different tool

### Resolution
Each tool already used a single `mode` state variable with a toggle that
flipped it from `idle` → tool kind on button click, and the side-button
already keyed its blue `.active` class off that state. The non-sticky
behavior came from three (ScanView) and two (each calibration view)
explicit `setMode(...idle)` calls at the end of each operation's
drag/click completion handler — they snapped the mode back to idle the
moment the engine RPC resolved. Removing those resets is the entire
behavioral fix; mutual exclusion across tools is still handled by the
existing toggle (clicking tool B from inside tool A sets the mode to B,
implicitly deselecting A), and clicking the active tool a second time
still toggles back to idle.

SurveyView's Baseline Segment was untouched — it already exhibited the
desired behavior and served as the reference. Undo is also unchanged: it
calls a backend RPC (`undoScan` / `undoCalibrationCut`) that pops a single
operation off the engine's stack, so making the frontend tool sticky has
no effect on what "undo" reverses.

Tests in [ScanView.workflow.test.tsx](../tauri-app/app/src/__tests__/ScanView.workflow.test.tsx)
and [CalibrateSurveyView.test.tsx](../tauri-app/app/src/__tests__/CalibrateSurveyView.test.tsx)
now drive a full gesture (Cut Segment / Select Declination drag,
Baseline Source two-click, Determine Peak drag) through an upgraded
PointScatter mock that exposes the drag and click callbacks as hidden
buttons, and assert the tool button still reads `(drag…)` / `(click…)`
after the operation completes.

### Legacy reference
The tools work this way in the legacy tool, but doesn't stay highlighted, so no screenshot to show.

### Acceptance criteria
- [x] Tool stays highlighted, functionality remains the same
- [x] Test added to cover the new behavior

### Out of scope


### Open questions
It would be nice if the cursor also changed as a visual indicator to the
user that a certain tool was selected (eg scissors for the cut segment
tool) — deferred to a follow-up feature. The user is browsing
MDN's built-in `cursor` keyword list and the Lucide / Heroicons /
game-icons.net icon sources to decide between built-in cursors and
custom PNG cursors before scheduling that work.

---

## FEAT-003 — Change Name Buttons

- **Status:** Proposed 
- **Priority:**  Medium
- **Area:** UI | Engine 
- **Where:** 'tauri-app\app\src\views\MainWindow.tsx'

### Summary
*One paragraph: what the feature is, in your own words.*

### Motivation / why
*The problem this solves. Who needs it (student, instructor, you while
debugging). What's painful or impossible today.*

### User-facing behavior
*The new UX, click-by-click. What buttons appear, what dialogs open,
what changes on screen, what keyboard input does. If it's a backend-only
feature, describe the RPC shape instead.*

### Legacy reference
*If this matches behavior in the legacy VB app:*
- *Screenshot path under [docs/legacy_ui_reference/screenshots/](../docs/legacy_ui_reference/screenshots/)*
- *Source location like `vb/survform.frm:<line>` if you know it*

*If this is brand-new (no legacy equivalent), say so — Claude won't go
hunting for one.*

### Acceptance criteria
*Bullet list of what "done" means. Concrete and testable. e.g.*
- [ ] *Button X appears on view Y when condition Z is true.*
- [ ] *Test added in `<path>` covers the new behavior.*

### Out of scope
*What you specifically don't want built as part of this feature, so
Claude doesn't gold-plate. e.g. "no undo for this action yet",
"single-user only, not multi-survey".*

### Open questions
*Decisions you want Claude to surface back before implementing — UX
choices, edge cases, naming. Leave blank if there are none.*

---

## FEAT-004 — Rename Baseline Segment

- **Status:** Done
- **Priority:** Medium
- **Area:** UI
- **Where:** [SurveyView.tsx](../tauri-app/app/src/views/SurveyView.tsx)

### Summary
Change baseline segment button in survey view to say Remove RFI, all functionality remains the same

### Motivation / why
To avoid confusion with Baseline Source in scan view, which is more of a true baseline and background subtraction

### User-facing behavior
Only change the name of the button

### Resolution
Renamed the SurveyView tool button — the only `Baseline Segment` /
`Baseline Segment (click…)` label pair — to `Remove RFI` /
`Remove RFI (click…)`. The mid-gesture status banner ("Baseline: click first
point…" / "Baseline: click endpoint…") and the Accept-Sweep flow's
`Apply Baselines` / "Commit baseline edits…" labels were renamed to match
("Remove RFI: click first point…", `Apply Edits`, "Commit RFI edits…") so a
user doesn't see "Baseline" anywhere in the SurveyView UI after FEAT-004.
Internal symbols (`baselineMode`, `RemovedMap`, `removedBySweep`,
`baselinePlaceholder` CSS class) were left as-is — none of them are visible
to the user, and tying the rename to those would have produced a much
larger no-op diff. ScanView's Baseline Source tool was untouched.

### Legacy reference
Doesn't match legacy

### Acceptance criteria
- [x] Baseline Segment button reads Remove RFI, behavior remains the same.
- [x] Baseline Source button in Scan view remains unchanged.

### Out of scope
Do not change behavior or name of Baseline Source in scan view, only adjust the Baseline Segment button in survey view

### Open questions


---

## FEAT-005 — Exit Button

- **Status:** Proposed 
- **Priority:** Medium 
- **Area:** UI | Engine 
- **Where:** 

### Summary
The file menu should be renamed to "Help" the Help/Tutorial option should be renamed "Tutorial" and the exit button should be renamed "Close Application" and simply close the application

### Motivation / why
Currently that button isn't functional at all, it closes the application in the legacy version because there is no other way to close it. Renaming the file menu I think makes more sense as there is no ability to open or interact with files under that dropdown.

### User-facing behavior
File menu is labeled "Help" under which is the "About", "Tutorial" and "Close Application" buttons. "Close Application" closes out the application, "About" and "Tutorial" behavior remains the same 

### Legacy reference
Exit button closes application in legacy version

### Acceptance criteria
*Bullet list of what "done" means. Concrete and testable. e.g.*
- [X] Application closes when Close Application button is pressed


### Out of scope
You should not adjust the current closing method that people are familar with, this is just giving another option. 

### Open questions


---

## FEAT-006 — Additional options in peak fit

- **Status:** Done
- **Priority:** Medium
- **Area:** UI | Engine
- **Where:** [scan_workspace.py](../tauri-app/engine/src/radio_cartographer/scan_workspace.py),
  [rpc.py](../tauri-app/engine/src/radio_cartographer/rpc.py),
  [scan-context.tsx](../tauri-app/app/src/state/scan-context.tsx),
  [MainWindow.tsx](../tauri-app/app/src/views/MainWindow.tsx),
  [ScanView.tsx](../tauri-app/app/src/views/ScanView.tsx),
  [PointScatter.tsx](../tauri-app/app/src/lib/plots/PointScatter.tsx),
  new [SelectInputDialog.tsx](../tauri-app/app/src/views/dialogs/SelectInputDialog.tsx)

### Summary
Addition of squared cosine and max value to the fitting options for peak fit in a scan. The UI text box where you put in a number should be changed to a dropdown with the available options in the following order: Gaussian, Squared Cosine, 2nd Degree Polynomial, 3rd Degree Polynomial, 4th Degree Polynomial, Max Value. Gaussian should remain the default. If max value is selected, instead of a line the point that is the max value in the range they selected will be highlighted (or circled like a pinned point)

### Motivation / why
Squared cosine would be a good function to fit, max would be good for deciding what the best fit is. With 3 non-polynomial options the selection shouldn't be based around polynomials.

### User-facing behavior
Box where you type in a number to select fitting option becomes a dropdown. Fitting behavior remains unchanged

### Legacy reference
Doesn't match legacy

### Resolution
Two new engine ops live next to `determine_peak_gaussian` and
`determine_peak_fit` and return the same `(peak_flux, ra_grid, flux_grid,
peak_ra)` tuple so RPC and UI plumbing stay uniform.
`determine_peak_squared_cosine` fits `A·cos²(π(x−x₀)/W) + B` with the lobe
width `W` pinned to the user's drag range, which collapses the model
(via `cos²θ = (1 + cos 2θ)/2`) to a linear fit in three unknowns on a
`(1, cos(2πx/W), sin(2πx/W))` basis solvable with `np.linalg.lstsq` — same
"avoid scipy" trick the existing log-quadratic Gaussian uses.
`determine_peak_max_value` just walks the kept source samples in the
band and returns the `argmax`, packed into single-element grid arrays so
the response shape doesn't fork. Both push undo snapshots and update
`workspace.peak_flux`, so save/reopen and Undo behave identically to the
existing fits.

On the frontend, `peakFitDegree: number` was retired in favor of a
`peakFitKind` string union (`'gaussian' | 'cos2' | 'poly2' | 'poly3' |
'poly4' | 'max'`) — the integer encoding didn't extend cleanly to the new
named options. The Scan → Change Determine Peak Fit… menu now opens a new
`SelectInputDialog` (sibling of `NumericInputDialog`, same modal shell
with a `<select>` in place of `<input type="number">`) populated with the
six options in spec order, Gaussian preselected. `ScanView`'s drag
handler switches on the kind to pick the right RPC; for `'max'` it
clears the fit-curve overlay and sets a new `pendingPeakHighlight` state
instead. `PointScatter` gained a `highlightPoint` prop that reuses the
pinned-point ring primitive (16px open circle, 3px outline) but takes a
configurable color, defaulting to the peak-fit blue `#0080ff` so a
Max-Value pick can sit on screen alongside a gold baseline pin without
the two visuals colliding.

Engine tests in [test_rpc_scan.py](../tauri-app/engine/tests/rpc/test_rpc_scan.py)
cover recovery, undo, and validation for both new ops (six new tests).
Frontend coverage in [ScanView.workflow.test.tsx](../tauri-app/app/src/__tests__/ScanView.workflow.test.tsx)
drives a full drag-gesture with `peakFitKind='cos2'` and `'max'`,
asserting the right RPC fires and that Max Value renders a `highlightPoint`
rather than a curve overlay. [MainWindow.menu.test.tsx](../tauri-app/app/src/__tests__/MainWindow.menu.test.tsx)
verifies the dropdown's six options in spec order with Gaussian as
default. 247/247 engine and 45/45 frontend tests pass.

### Acceptance criteria
- [x] Dropdown selection of what function to fit the peak with in interactable
- [x] A squared cosine is fit when selected
- [x] The max point is highlighted when selected

### Out of scope


### Open questions
Any other options for fit that jump out to you as good for peaks like this ask if I want implemented. 

---

## FEAT-007 — Show Palette Expansion

- **Status:** Proposed 
- **Priority:**  Medium 
- **Area:** UI | Engine |
- **Where:** tauri-app\app\src\views\PaletteEditor.tsx

### Summary
Keep the functionality of color selection the same, but add color component dialogs. Below the hue bar should be three bars of similar size (one for R, one for G, one for B) that represent the color componets (above the hue bar in the legacy version). At each stop point there should be a line through the color component bars and the level of the color (ranging from 0 to 255) and in each direction the level should slope to the next stop. Additionally when a stop is selected or a new stop is created, there should be three vertical bars where you can adjust the level of rgb and see a preview of what color it is. 

### Motivation / why
More visual interest on the palette page, makes it easier for users to create new colors

### User-facing behavior
See summary

### Legacy reference
Screen shot: docs\legacy_ui_reference\screenshots\showpalette.png

The three color component "hue" bars should be below the current hue bar, opposite of how the legacy looks


### Acceptance criteria
*Bullet list of what "done" means. Concrete and testable. e.g.*
- [X] All listed UIs appear and look good
- [X] Passes visual inspection by user -- no not mark as done until user marks off this acceptance criteria

### Out of scope
Adjustment of the palette presets or palette behavior after exiting the palette editor

### Open questions
Surface questions if you are unclear about anything in the implementaion.

---

## FEAT-011 — Image > Image Display four-mode selector

- **Status:** Done
- **Priority:** Medium
- **Area:** UI
- **Where:**
  [MainWindow.tsx](../tauri-app/app/src/views/MainWindow.tsx),
  [survey-context.tsx](../tauri-app/app/src/state/survey-context.tsx),
  [ImagePlot.tsx](../tauri-app/app/src/lib/plots/ImagePlot.tsx),
  [ImageView.tsx](../tauri-app/app/src/views/ImageView.tsx),
  [PreImageView.tsx](../tauri-app/app/src/views/PreImageView.tsx),
  [App.css](../tauri-app/app/src/App.css),
  [MainWindow.menu.test.tsx](../tauri-app/app/src/__tests__/MainWindow.menu.test.tsx),
  [PreImageView.test.tsx](../tauri-app/app/src/__tests__/PreImageView.test.tsx)

### Summary
Replaces FEAT-008's per-view **Lock Aspect** sidebar button and
FEAT-010's **Image > Snap to Square** checkbox with one **Image >
Image Display ▸** menu item that opens a side submenu containing four
radio-style options:

- ✓ Declination Corrected (default)
- No Declination Correction
- Snap to Square
- Stretch to Fill

The first three lock the aspect ratio with different scaleratio
formulas; the fourth drops the lock entirely so the plot fills the
workspace area. The setting is global (survey context) and applies to
both Pre Image and Image views as well as the magnifier inset.

### Motivation / why
After three FEAT-008 iterations and FEAT-010 on top, the image-display
controls were split across two surfaces (a sidebar button + a global
menu checkbox) with overlapping semantics. Consolidating into one
named radio group makes the behavior discoverable and removes the
button clutter from the sidebars.

### User-facing behavior
- Lock Aspect button no longer appears on the Pre Image or Image
  sidebar.
- Image menu has an "Image Display ▸" item at the bottom. Clicking it
  toggles a side submenu (same look as the parent menu, positioned to
  the right of the parent item) containing the four radio-style mode
  items. Clicking a mode applies it immediately and closes both the
  submenu and the parent menu. The active mode carries a `✓` prefix;
  the others carry three leading spaces so the label position stays
  stable.
- Default mode is "Declination Corrected" — the same display behavior
  the app shipped with under FEAT-008 v3.
- Setting persists across view switches (Pre Image ↔ Image) within
  the same app session; resets to the default on app restart (no
  persistence to disk). Submenu open-state resets every time the
  parent Image menu closes.

### Legacy reference
No legacy equivalent — the legacy VB app's image is always a fixed
5970×4770 pixel rectangle whose ratio depends on the host window. The
"No Declination Correction" mode is the closest analog to legacy
behavior (1/240 with no cos correction), but legacy doesn't expose any
choice between modes.

### Resolution
Introduced `ImageDisplayMode = 'sky' | 'raw' | 'pixel' | 'stretch'` in
[survey-context.tsx](../tauri-app/app/src/state/survey-context.tsx)
and replaced the FEAT-010 `snapToSquare: boolean` field with
`imageDisplay: ImageDisplayMode` (default `'sky'`) plus a matching
`setImageDisplay` setter.

[ImagePlot.tsx](../tauri-app/app/src/lib/plots/ImagePlot.tsx) lost the
FEAT-008 `lockAspectRatio` and FEAT-010 `aspectMode` props. The single
new `displayMode` prop drives a four-way branch on the bounded-mode
axis layout:

| Mode | scaleanchor | scaleratio |
|------|-------------|------------|
| `'sky'` | yes | `cos((min_dec+max_dec)/2 * π/180) / 240` |
| `'raw'` | yes | `1 / 240` |
| `'pixel'` | yes | `(decRange × imageWidth) / (raRange × imageHeight)` |
| `'stretch'` | — | (no scaleanchor; axes scale independently) |

Pixel-mode (no RA/Dec bounds) keeps its existing `scaleanchor:'y'` /
`scaleratio:1` for all but `'stretch'`; `'stretch'` removes that lock
too.

Both [PreImageView.tsx](../tauri-app/app/src/views/PreImageView.tsx)
and [ImageView.tsx](../tauri-app/app/src/views/ImageView.tsx) lost
their local `lockAspect` state and Lock Aspect sidebar `<button>`s.
Both views now pull `imageDisplay` from `useSurvey()` and forward
`displayMode={imageDisplay}` to ImagePlot (main plot in PreImage; main
plot + magnifier inset in Image).

[MainWindow.tsx](../tauri-app/app/src/views/MainWindow.tsx) gained a
bottom-of-Image-menu side submenu: a `.menu-sep`, then a
`.menu-submenu-host` (relative-positioned flex column) containing the
parent `<button role="menuitem" aria-haspopup="menu"
aria-expanded={...}>Image Display ▸</button>` and a conditionally-
rendered `.menu-submenu` div with the four radio-style mode buttons.
The submenu is `position: absolute; left: 100%` so it floats to the
right of the parent item with the same visual style as the parent
menu. The submenu open state is local component state, and a
`useEffect` resets it to `false` whenever the parent Image menu
closes. New `.menu-submenu-host` and `.menu-submenu` styles were
added to [App.css](../tauri-app/app/src/App.css).

Test coverage:
- [MainWindow.menu.test.tsx](../tauri-app/app/src/__tests__/MainWindow.menu.test.tsx)
  asserts the four items render with `✓` on Declination Corrected by
  default, that clicking each one moves the `✓`, and that returning
  to Declination Corrected restores the default.
- [PreImageView.test.tsx](../tauri-app/app/src/__tests__/PreImageView.test.tsx)
  asserts the Pre Image plot receives `displayMode === 'sky'` on
  mount and that no Lock Aspect button is rendered.

### About .img files (user question)
The user asked whether the declination correction can be applied to
uploaded `.img` files. **Yes — automatically.** The cos(dec)
correction is a Plotly display-time scaling; ImagePlot reads
`meta.min_dec` and `meta.max_dec` and computes `scaleratio = cos((min+max)/2)/240`
regardless of whether `meta` came from `openImage` (.img file) or
`makeImage` (built from a survey). Nothing is baked into the pixel
grid. So `cassio_a.img` opened from disk shows up at sky-shape aspect
the same way a freshly-made cassio image does.

### Acceptance criteria
- [x] Image menu has an "Image Display ▸" item that opens a side
      submenu with four radio-style mode items, default ✓ on
      Declination Corrected.
- [x] Clicking any mode applies it and closes both submenu and
      parent menu.
- [x] Submenu close-on-parent-close: reopening Image doesn't auto-
      show the submenu.
- [x] Lock Aspect sidebar button is gone from both Pre Image and
      Image views.
- [x] All four modes produce the documented scaleratio behavior in
      ImagePlot.
- [x] Tests cover the menu state machine and the prop wiring.

### Out of scope
- Persisting `imageDisplay` across app launches.
- Applying display modes to RgbImagePlot.
- A "stretch but keep aspect" mode or other configurations beyond the
  four documented.
- Changing the cos(dec) correction formula itself (still
  `cos(dec_center)` rectangular projection).

### Open questions


---

## FEAT-010 — Snap to Square toggle in the Image menu

- **Status:** Done
- **Priority:** Low
- **Area:** UI
- **Where:**
  [MainWindow.tsx](../tauri-app/app/src/views/MainWindow.tsx),
  [survey-context.tsx](../tauri-app/app/src/state/survey-context.tsx),
  [ImagePlot.tsx](../tauri-app/app/src/lib/plots/ImagePlot.tsx),
  [ImageView.tsx](../tauri-app/app/src/views/ImageView.tsx),
  [PreImageView.tsx](../tauri-app/app/src/views/PreImageView.tsx),
  [MainWindow.menu.test.tsx](../tauri-app/app/src/__tests__/MainWindow.menu.test.tsx)

### Summary
Adds a checkable **Snap to Square** entry to the Image top menu.
When unchecked (default), Lock Aspect locks to true sky shape using
the FEAT-008 v3 `cos(dec_center) / 240` formula. When checked, Lock
Aspect instead uses the pixel-grid formula
`(decRange × imageWidth) / (raRange × imageHeight)`, which renders
each pixel cell square on screen. The existing Lock Aspect sidebar
button is unchanged — it still toggles whether any lock is applied;
this just picks which "locked" formula to use.

### Motivation / why
After FEAT-008 v3, sky-shape-correct surveys like cassio (dec ~60°,
heavily compressed RA) and wide RA-strip surveys can render as
awkward letterboxed thin strips that are hard to inspect at detail.
"Snap to Square" gives the user a quick way to coerce the display
into a square-cell pixel-grid view for inspection without giving up
the lock entirely (which would stretch to fill, distorting cells in
the opposite direction).

### User-facing behavior
- New **Snap to Square** item at the bottom of the Image menu,
  separated by a divider from the existing Change-Magnifier-Size /
  Change-Image-Name items.
- Always enabled (does not require an image to be loaded — the
  setting persists for the next image you build/open).
- Unchecked by default. A `✓` prefix appears when active.
- Click toggles the global setting. Both Pre Image and Image views
  (including the magnifier inset) react immediately.

### Legacy reference
No legacy equivalent. The legacy VB app's image is always a fixed
5970×4770 pixel rectangle (`vb/survform.frm:1606-1607`), so its
display ratio is whatever the host window forces.

### Resolution
Added `snapToSquare: boolean` and `setSnapToSquare` to the
`SurveyState` context in
[survey-context.tsx](../tauri-app/app/src/state/survey-context.tsx),
mirroring the existing `magnifierHalfSize` pattern (in-memory only,
no persistence to disk). [ImagePlot.tsx](../tauri-app/app/src/lib/plots/ImagePlot.tsx)
gained an `aspectMode?: 'sky' | 'pixel'` prop (default `'sky'`)
which selects between
`Math.cos(decCenter * Math.PI / 180) / 240` (sky) and
`(decRange * imageWidth) / (raRange * imageHeight)` (pixel) — the
latter is exactly the FEAT-008 v1 formula, resurrected as an opt-in
alternative.

Both [ImageView.tsx](../tauri-app/app/src/views/ImageView.tsx) (main
plot + magnifier inset) and
[PreImageView.tsx](../tauri-app/app/src/views/PreImageView.tsx) read
`snapToSquare` from context and pass
`aspectMode={snapToSquare ? 'pixel' : 'sky'}` to ImagePlot. The
existing per-view `lockAspect` button state is untouched — Snap to
Square only changes which formula the lock uses when on, it doesn't
override the on/off toggle.

The Image menu item in
[MainWindow.tsx](../tauri-app/app/src/views/MainWindow.tsx) renders
`✓ Snap to Square` when active and `   Snap to Square` when not
(three leading spaces to keep label position stable). Clicking
closes the menu and flips the context value. A test in
[MainWindow.menu.test.tsx](../tauri-app/app/src/__tests__/MainWindow.menu.test.tsx)
asserts the checkmark toggles on each click.

### Acceptance criteria
- [x] **Snap to Square** appears in the Image menu, always enabled,
      unchecked by default.
- [x] Checkmark toggles on each click; the setting persists across
      view switches (Pre Image ↔ Image) within the same app session.
- [x] When checked, ImagePlot uses the pixel-grid scaleratio (FEAT-008
      v1 formula); when unchecked, the cos(dec) sky-shape scaleratio
      (FEAT-008 v3 formula).
- [x] Lock Aspect off-state behavior unchanged — stretches to fill
      regardless of Snap to Square.
- [x] Test added in
      [MainWindow.menu.test.tsx](../tauri-app/app/src/__tests__/MainWindow.menu.test.tsx).

### Out of scope
- Persisting the toggle across app launches.
- Surfacing the same toggle on RgbImagePlot.
- A third "stretch" option in the menu — Lock Aspect's off-state
  already covers that.
- Per-view Snap to Square (the global setting is intentional — the
  user toggles it once and both views agree).

### Open questions


---

## FEAT-009 — Detect and unwrap RA-crossing surveys in make_image

- **Status:** Done
- **Priority:** Medium
- **Area:** Engine
- **Where:** [image.py](../tauri-app/engine/src/radio_cartographer/image.py),
  [test_image_gridding.py](../tauri-app/engine/tests/numerics/test_image_gridding.py)

### Summary
`make_image` now detects surveys whose RA samples straddle the
0h↔24h sidereal boundary (Cassiopeia, anything around 23h–1h) and
unwraps the early-side samples by +86400 before computing grid bounds.
Previously, `np.min` / `np.max` on the wrapped samples produced bounds
of (≈0, ≈86400), so the gridded image spanned the full 24h with a
huge empty band in the middle — Cassiopeia A landed as a single bright
pixel at the right edge of an otherwise empty strip.

### Motivation / why
Surfaced while verifying FEAT-008. A "Make Image" run on
`cassioa.md2` produced a thin 24h-wide strip with one visible source,
even though the survey only actually observes ~5.4 hours of sky. The
existing saved `fixtures/outputs/cassio_a.img` had been produced with
unwrapped bounds (max_ra=98166.5 > 86400) — proving the legacy
workflow handled this somewhere — but the new Python `make_image` was
using naive min/max.

### User-facing behavior
No new UI. The next time the user runs a survey that crosses the
0h/24h boundary through Make Image, the resulting Image View will show
the true observed arc tightly framed and aspect-ratio-correct (per
FEAT-008's sky-shape lock) instead of a sparsely-populated 24h strip.
Non-wrapping surveys see no behavior change.

### Legacy reference
The legacy VB app has the same bug in its main paint path
(`vb/survform.frm:899-904`). A wrap heuristic does exist in the
bi-color overlay path (`vb/survform.frm:6257`: `if MaxRaPI > 43200 then
add 86400 …`), so the legacy authors knew about wrap but only patched
the overlay code. FEAT-009 fixes it in the main make_image path —
deliberate divergence from legacy, same precedent as FEAT-002 /
FEAT-004 / FEAT-008-v3.

### Resolution
In [image.py](../tauri-app/engine/src/radio_cartographer/image.py)
`make_image`, after `ra_all` is concatenated:

1. Sort RA samples; compute consecutive gaps and the wrap-gap
   (`(ra_sorted[0] + 86400) - ra_sorted[-1]`).
2. If the largest middle gap exceeds **6 hours** (21600s) **and** is
   larger than the wrap gap, declare wrap. Set `cutoff = ra_sorted[i]`
   at the index of that largest middle gap.
3. Define `unwrap_ra(ra) = where(ra <= cutoff, ra + 86400, ra)` (or
   identity if no cutoff). Apply it to `ra_all` for bounds computation,
   inside `to_col` (so any RA input gets unwrapped before mapping to a
   column), and to the per-sweep `s1.ra` / `s2.ra` before the
   strip-fill `np.interp` calls (otherwise interpolation across the
   wrap point produces garbage).

Stored `min_ra` / `max_ra` may exceed 86400; the frontend's
`formatRaSeconds` at
[ImagePlot.tsx:96-102](../tauri-app/app/src/lib/plots/ImagePlot.tsx#L96-L102)
already mods to `[0, 86400)`, so tick labels and hover readouts wrap
correctly without any TS changes.

**Threshold rationale:** Most observing sessions are 1–3 hours;
legitimate gaps within a session are typically under 1 hour. 6h is
conservative enough that a wide-arc survey (e.g. `centera.md2` at ~3h)
won't accidentally trip, while still catching anything that crosses 0h
with a meaningful body of data on both sides. Surveys that genuinely
span 24h leave the largest gap as the wrap gap and are unaffected.

**Verification:**
- Three new tests in
  [test_image_gridding.py](../tauri-app/engine/tests/numerics/test_image_gridding.py):
  `test_makeimage_unwraps_ra_across_midnight` (synthetic wrap, asserts
  ~2h span), `test_makeimage_does_not_unwrap_contiguous_survey`
  (regression: naive bounds preserved), and
  `test_makeimage_unwraps_real_cassiopeia_survey` (smoke test against
  `cassioa.md2`, asserts <25000s span).
- Inline verification confirmed: synthetic wrap collapses to 7132s,
  no-wrap survey keeps 10041→17964, real cassioa unwraps to
  79055→98412 (5.38h arc — matches the saved `cassio_a.img`'s 5.27h to
  within rounding).

### Acceptance criteria
- [x] `make_image` on a wrap-crossing survey produces a contiguous
      RA range, not (0, 86400).
- [x] No regression for surveys that don't wrap.
- [x] Frontend tick labels and hover readouts still display in
      `[0, 86400)` even when bounds exceed 86400.

### Out of scope
- Fixing the same bug in legacy VB.
- Updating the `.img` file format / loader (already handles unwrapped
  values — `cassio_a.img` on disk has `max_ra=98166.5`).
- Detecting wrap when *opening* an existing `.img` (saved bounds
  already reflect whatever the producer chose).
- Polar / circumpolar surveys that genuinely cover 24h of RA — by
  design the algorithm leaves these alone (largest gap is the wrap
  gap, no unwrap).
- The pre-existing quirk of storing RA seconds in the `RA---TAN`-typed
  `crval1` field (FITS convention expects degrees).

### Open questions


---

## FEAT-008 — Lock Aspect toggle on image views

- **Status:** Done
- **Priority:** Medium
- **Area:** UI
- **Where:** [ImagePlot.tsx](../tauri-app/app/src/lib/plots/ImagePlot.tsx),
  [ImageView.tsx](../tauri-app/app/src/views/ImageView.tsx),
  [PreImageView.tsx](../tauri-app/app/src/views/PreImageView.tsx)

### Summary
Adds a "Lock Aspect" sidebar button on the Pre Image and Image views.
When ON (default), the image displays at its true sky-shape aspect ratio
(RA × Dec extent) regardless of how the user resizes the window — the
plot letterboxes or pillarboxes inside the workspace area instead of
stretching. When OFF, the plot stretches to fill the container (today's
behavior).

### Motivation / why
Resizing the window currently squishes / stretches the grayscale image
because Plotly scales each axis independently in RA/Dec mode. Circular
sources look elliptical, square footprints look rectangular. A toggle
lets the user keep things proportional by default but opt out for wide
RA-strip surveys where letterboxing would waste the screen.

### User-facing behavior
- New sidebar button labeled **Lock Aspect** on both Pre Image and
  Image views.
- Defaults to ON (highlighted blue, same `.active` style as the sticky
  tools from FEAT-002).
- Click to toggle. When ON, the image keeps its sky-shape aspect ratio
  (RA × Dec). When OFF, the image stretches to fill the container.
- State is per-view and resets to ON when the view is re-entered. No
  setting persisted to disk.
- RGB images (RgbImagePlot) are intentionally excluded — they have
  their own thin-strip concern (RgbImagePlot.tsx:63-68).

### Legacy reference
No legacy equivalent.

### Resolution
[ImagePlot.tsx](../tauri-app/app/src/lib/plots/ImagePlot.tsx) gained a
`lockAspectRatio?: boolean` prop (default `true`). When on in RA/Dec mode
it sets `xaxis.scaleanchor: 'y'` with `scaleratio: 1/240` and
`constrain: 'domain'` on both axes — `1/240` because RA is stored in
sidereal seconds and 1 RA-second = 1/240° of sky, so this makes one
RA-second occupy 1/240 the screen width that one Dec-degree does, which
is exactly the sky-shape relationship. No cos(dec) correction, matching
the legacy app's rectangular projection.

In pixel mode (`!hasBounds`) the lock uses the existing `scaleanchor: 'y'`
with default `scaleratio: 1` — square cells, since "sky shape" isn't
meaningful without RA/Dec bounds.

Both [ImageView.tsx](../tauri-app/app/src/views/ImageView.tsx) and
[PreImageView.tsx](../tauri-app/app/src/views/PreImageView.tsx) hold their
own `useState<boolean>(true)` and render a Lock Aspect button in the
existing `.side-buttons` column with the same `.active` blue style the
sticky tools use. ImageView gates the button on `hasScalar` (the toggle
doesn't apply to RgbImagePlot) and forwards the lock to the magnifier
plot as well so the inset stays consistent.

A v1 of this feature used a per-image pixel-grid scaleratio
(`(decRange*w)/(raRange*h)`) which locked to the 1.25:1 pixel grid the
legacy resolution formula produces, not the actual sky shape. v2 switched
to a fixed `1/240` after the user noted what they wanted was sky-shape
preservation, not pixel-grid preservation. v3 (this resolution) further
multiplied by `cos(dec_center)` after the user noted `1/240` is only
exact at the equator and visibly distorts at high declination; the legacy
VB app (`vb/survform.frm:1606-1714`) doesn't apply this correction either,
so v3 is a deliberate improvement over legacy in the same spirit as
FEAT-002 and FEAT-004.

Test in
[PreImageView.test.tsx](../tauri-app/app/src/__tests__/PreImageView.test.tsx)
mocks ImagePlot to capture props and asserts the button defaults to
`.active`, toggling flips both the class and the `lockAspectRatio` prop,
and clicking again toggles back on. 46/46 frontend tests pass.

### Acceptance criteria
- [x] Lock Aspect button appears on Pre Image view and Image view.
- [x] Defaults to ON (button has `.active` class on mount).
- [x] Toggling OFF lets the image stretch to fill the container.
- [x] Toggling ON preserves sky shape (`cos(dec_center) / 240`, accounting
      for both the RA-seconds → degrees conversion and the cos(dec)
      projection correction at the image center).
- [x] Test added in
      [PreImageView.test.tsx](../tauri-app/app/src/__tests__/PreImageView.test.tsx)
      covers default state + toggle behavior + prop wiring.

### Out of scope
- RgbImagePlot (separate feature if needed).
- Persisting the lock state across app launches.
- True curved projection (TAN, SIN, ARC). Plotly's heatmap is a flat-grid
  renderer; the rectangular projection with cos(dec_center) correction is
  accurate at the image center and increasingly approximate toward the
  top/bottom edges. Worth a follow-up only if the edge error turns out to
  be visually disturbing on real wide-Dec surveys.

### Open questions


---