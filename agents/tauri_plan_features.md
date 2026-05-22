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

*(none yet — add features here as you file them, e.g.
`- FEAT-001 — Multi-select sweeps for batch baseline operations`)*

---

## Done

*(none yet)*

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

- **Status:** Proposed 
- **Priority:** Low 
- **Area:** UI 
- **Where:** tauri-app\app\src\lib\plots\PointScatter.tsx

### Summary
Add light gray grid lines to 

### Motivation / why
Easier to view fluxes and coordinates at a glance, without needing to pin points

### User-facing behavior
No new buttons or, only light gray grid lines on all scatterpoint graphs

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