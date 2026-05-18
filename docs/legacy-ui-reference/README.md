# Legacy UI Reference

This document is the visual & behavioral spec for the legacy `KARALEAH2002.exe` (Radio Cartographer VB5) UI. Claude reads this file plus the PNGs in `screenshots/` to drive faithful UI implementation of the React/Tauri port (Phase 4 of [`agents/tauri_plan.md`](../../agents/tauri_plan.md)).

## How to use this file

1. Drop screenshots into [`screenshots/`](./screenshots/) using the filenames already referenced under each section (e.g. `01-launch.png`).
2. Replace the **Notes** placeholder with a paragraph describing what's visible, what just happened, and what the user does next.
3. Where the **Controls** table is present, fill in one row per visible button / label / input that affects state.
4. PNG is preferred; JPG is fine. Compress if huge (Claude's PDF/image read has size limits, but anything under ~1 MB per shot is comfortable).
5. Cover every section if you can — incomplete sections become "guess and verify" in the implementation pass. The sections marked **(critical)** are the highest priority.

The same template appears in every section so future contributors can extend without re-deriving structure:

```
**VB form:** `vb/<file>.frm` (if applicable)
**When shown:** <workflow trigger>
**Screenshot:** screenshots/NN-slug.png

### Notes
<one paragraph>

### Controls (optional)
| Control | Caption | Enabled when | Action |
|---|---|---|---|
| | | | |
```

When Claude implements against this file, the goal is *fidelity to the original*, not modernization. See [`agents/tauri_plan.md` §5](../../agents/tauri_plan.md) for the "do not modernize" list (no dark mode, no animations, no hidden settings, etc.).

---

# Part A — Static views (one per VB form)

## 1. Application launch / empty backdrop  *(critical)*

**VB form:** `vb/backdrop.frm` + `vb/karaleah.frm` (menu bar host)
**When shown:** App start, before any file is opened.
**Screenshot:** `screenshots/01-launch.png`

### Notes
<one paragraph describing: window title-bar text, window dimensions, what's in the client area before any file is opened, menu-bar fonts/colors>

### Controls
| Control | Caption | Enabled when | Action |
|---|---|---|---|
| File menu | &File | always | opens File submenu |
| Image menu | &Image | always | opens Image submenu |
| Survey menu | &Survey | always | opens Survey submenu |
| Scan menu | &Scan | always | opens Scan submenu |
| Calibration menu | &Calibration | always | opens Calibration submenu |

---

## 2. About dialog

**VB form:** `vb/danform.frm`
**When shown:** File → About "Karaleah"…
**Screenshot:** `screenshots/02-about.png`

### Notes
<credits text exactly as displayed; OK button position; modal vs. non-modal>

---

## 3. Open Survey file picker

**VB form:** `vb/loaddata.frm`
**When shown:** File → New Survey…
**Screenshot:** `screenshots/03-open-survey.png`

### Notes
<exact dialog caption — note from plan §5 that `loaddata.frm` uses "caption-as-state-machine" (the caption text drives behaviour); list each state's caption verbatim if multiple>

### Controls
| Control | Caption | Enabled when | Action |
|---|---|---|---|
| File list | | always | selects file |
| Open button | | a file is highlighted | confirms selection |
| Cancel | | always | dismisses dialog |

---

## 4. Survey workspace (initial layout)  *(critical)*

**VB form:** `vb/survform.frm`
**When shown:** After a .md2 is loaded.
**Screenshot:** `screenshots/04-survey-initial.png`

### Notes
<panel layout: positions of `Picture1..Picture9`, what each is for (image, current sweep, all-sweeps strip, magnifier, palette swatch, etc.), labels, font, background color>

### Panels
| Panel | Role | Approx. position | Notes |
|---|---|---|---|
| Picture1 | | | |
| Picture2 | | | |
| Picture3 | | | |
| Picture4 | | | |
| Picture5 | | | |
| Picture6 | | | |
| Picture7 | | | |
| Picture8 | | | |
| Picture9 | | | |

---

## 5. Scan workspace

**VB form:** `vb/scanform.frm`
**When shown:** After a .md1 is loaded or Scan view is opened.
**Screenshot:** `screenshots/05-scan-initial.png`

### Notes
<one paragraph>

---

## 6. Calibration workspace

**VB form:** `vb/calform.frm`
**When shown:** Calibration → New Calibration (or similar entry point).
**Screenshot:** `screenshots/06-calibration-initial.png`

### Notes
<how the user picks known sources (Virgo A=213 Jy, Tau A=942 Jy, Cyg A=1581 Jy per plan §6.1); fit display; save flow>

---

## 7. Palette editor

**VB form:** `vb/dataform.frm`
**When shown:** Image → Show Palette… (or similar).
**Screenshot:** `screenshots/07-palette-editor.png`

### Notes
<how control points are added / removed / moved; the 100-point cap; how the palette swatch updates live>

---

# Part B — Menu enumeration

Each section shows the **same menu in different app states** so Claude can match the enable/disable rules exactly.

## 8. File menu

**Screenshot:** `screenshots/08a-file-initial.png` *(no file loaded)*
**Screenshot:** `screenshots/08b-file-survey-loaded.png` *(after New Survey)*
**Screenshot:** `screenshots/08c-file-image-loaded.png` *(after Make Image)*

### Notes
<which items toggle disabled between these three states; separators; underline accelerators>

---

## 9. Image menu

**Screenshot:** `screenshots/09a-image-initial.png`
**Screenshot:** `screenshots/09b-image-loaded.png`

### Notes
<reference: karaleah.frm:49-94 shows OpenImageMenu / SaveImageMenu / SaveAsImageMenu / SaveAsBitmapMenu / PrintImageMenu / AppendImageMenu as starting Enabled=False; confirm visually which become enabled when>

---

## 10. Survey menu

**Screenshot:** `screenshots/10a-survey-initial.png`
**Screenshot:** `screenshots/10b-survey-loaded.png`

### Notes
<one paragraph>

---

## 11. Scan menu

**Screenshot:** `screenshots/11a-scan-initial.png`
**Screenshot:** `screenshots/11b-scan-loaded.png`

### Notes
<one paragraph>

---

## 12. Calibration menu

**Screenshot:** `screenshots/12a-calibration-initial.png`
**Screenshot:** `screenshots/12b-calibration-loaded.png`

### Notes
<one paragraph>

---

# Part C — Workflow state captures (tutorial-ordered)

These are the most important shots — they show what the workspace *looks like* after each tutorial step, so Claude can match the post-action UI rather than guess from VB layout coordinates alone.

## 13. After File → New Survey loads the tutorial .md2  *(critical)*

**Screenshot:** `screenshots/13-after-open.png`

### Notes
<what panels populate; which buttons enable; status-bar text>

---

## 14. Cut-segment drag gesture  *(critical)*

**Screenshots:**
- `screenshots/14a-cut-drag-start.png` — cursor just pressed at a sample
- `screenshots/14b-cut-drag-mid.png` — drag in progress, selection highlight
- `screenshots/14c-cut-drag-confirm.png` — moment of double-click confirm
- `screenshots/14d-cut-cancelled.png` — after right-click cancel

### Notes
<exact cursor type during drag; selection color (plan §5 says green); whether the drag rubber-band is filled or outlined; what visual feedback the double-click gives>

---

## 15. After Calibration → Apply Calibration

**When:** Tutorial step that applies `cal25a.cal` to the loaded survey.
**Screenshot:** `screenshots/15-after-calibrate.png`

### Notes
<flux axis label changes from counts to Jy; status bar; calibration indicator>

---

## 16. After Survey → Smooth  *(critical)*

**Screenshot:** `screenshots/16-after-smooth.png`

### Notes
<smoothing width prompt — wording and default; before/after of one sweep>

---

## 17. After Survey → Baseline  *(critical)*

**Screenshot:** `screenshots/17-after-baseline.png`

### Notes
<degree prompt; visible flattening; reference line shown>

---

## 18. After Survey → Align  *(critical)*

**Screenshot:** `screenshots/18-after-align.png`

### Notes
<the tutorial uses 0.5 as the align factor — confirm prompt text and default; what visual changes>

---

## 19. After Survey → Make Image  *(critical)*

**Screenshot:** `screenshots/19-after-make-image.png`

### Notes
<the tutorial uses 1 as the pix parameter; how the gridded image lands in the workspace; what panels update>

---

## 20. Tighten Palette gesture

**Screenshots:**
- `screenshots/20a-palette-default.png` — initial palette mapping
- `screenshots/20b-palette-tightened.png` — after the tutorial's "tighten palette" step

### Notes
<gesture used to tighten — drag on palette swatch? prompt? exact wording>

---

## 21. Save Image As BMP dialog

**Screenshot:** `screenshots/21-save-bmp.png`

### Notes
<file extension behavior; default filename; what the user sees if they hit Save twice>

---

# Part D — Cross-cutting notes

## 22. Visual aesthetic

**Screenshot (optional):** `screenshots/22-aesthetic-sample.png`

- **Default font:** MS Sans Serif 8.25 bold (per `karaleah.frm:13-17`). Tahoma is the suggested web fallback (per plan §5).
- **Background color:** <fill in — VB form `BackColor &H...&` translates to a specific RGB>
- **Plot grid styling:** <axis labels, tick density, gridline color>
- **Cursor styles:** <during drag, hover, busy>
- **Dialog button order:** <typically `OK | Cancel` in VB; confirm>
- **Error popup style:** <icon? title bar text? button(s)?>

---

## 23. Error messages

Match the legacy app's exact wording for every error surface the React shell already produces. Add rows as you find more.

| Trigger | Legacy message | Where shown |
|---|---|---|
| Palette > 100 control points | `Maximum 100 control points.` | <modal? inline?> |
| Open a `…b.md1`/`…b.md2` (B-channel) | <verbatim> | |
| Malformed file | <verbatim> | |
| Save when no image | <verbatim> | |

---

## 24. Accelerators / keyboard shortcuts

The VB `&` prefixes in menu captions (e.g. `&File`, `Save Image &As...`) are the accelerator keys. The plan §5 commits to keeping these.

| Accelerator | Action |
|---|---|
| Alt+F | open File menu |
| Alt+I | open Image menu |
| Alt+S | open Survey menu |
| Alt+C | open Calibration menu |
| <add as confirmed> | |

Also document any non-menu shortcuts (Esc to cancel a drag, etc.).

---

## Open questions for the implementer

Any UI mystery you encounter while assembling this file — write here. Claude will read this section last and treat each item as a decision needed before implementing the related section.

- (none yet)
