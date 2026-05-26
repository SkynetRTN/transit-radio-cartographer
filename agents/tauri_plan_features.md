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