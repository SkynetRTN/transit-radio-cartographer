# OG Radio Cartographer — Tester Feedback Triage

Triage of usability concerns raised by testers of **OG Radio Cartographer** (the
Tauri/React port of the legacy VB5 "Radio Cartographer" app). Each concern is
either **answered** (existing/intended behavior explained) or **flagged for a
fix**, with the file(s) to touch so it's actionable.

**Guiding decisions (from the maintainer):**
- **Faithful-first.** Features the legacy VB app never had are treated as
  *intended* or *optional enhancements*, not bugs.
- **Make Image gating** (enabled only after Smooth + Baseline + Align) is
  intentional per the tutorial — keep it.
- **No exposed "Accept All" button** for pedagogical reasons. Instead: a keyboard
  shortcut that accepts all, arrow-key sweep navigation (forward arrow accepts +
  advances), and a tutorial note about the loop-back-to-first-unaccepted behavior.
- **"Cut Segment" / "Select Declination"** keep their names; improve tooltips/help.

**Legend:** ✅ Answered · ℹ️ Intended · 🔧 Needs fix · 🎯 Optional enhancement (faithful-first)

---

## Implementation status

The 🔧 fixes (plus agreed doc updates) are grouped into eight tasks, landing on
the `tester-feedback-fixes` branch one commit per task. ✅ = complete, ⬜ = not
started.

| Task | Concerns covered | Status |
|------|------------------|--------|
| **1 — Layout & window sizing** | #1 responsive layout, #2 upper/lower x-axis overlap, #4 over/under-scroll | ✅ Complete |
| **2 — Sweep workflow interactions** | #3 RFI-mode readout, #7–8 accept shortcut + arrow-key nav + tutorial note | ✅ Complete |
| **3 — Scalar image view** | #24 in-view Save (scalar), #20 on-image click marker, #14 pre-image zoom hint, #11 About version | ✅ Complete |
| **4 — Palette editor robustness** | #18 edge/stack bugs, #21 errors near 50 stops | ✅ Complete |
| **5 — RGB export + back-navigation** | #15 / #24 RGB export (client-side PNG), #16 bi/tri back-button target | ⬜ Not started |
| **6 — RGB zoom + magnifier** | #17 RGB zoom + magnifier | ⬜ Not started |
| **7 — Calibration warning + Cut/Select clarity** | #13 empty-cal warning, #12 Cut/Select tooltips, #9a fitting-DOF help note | ⬜ Not started |
| **8 — Scan undo restores model fit** | #22 undo restores the fitted curve | ⬜ Not started |

**Not part of a task** — answered or intended, no code change: #5 (Make Image
gating, intended), #6 (Smooth parameter, intended/optional), #9a (polynomial DOF
already exists — help note lands in Task 7), #9b (fit uncertainty, optional),
#10 (calibration-source recognition, answered), #11 About page (version string
added in Task 3), #14 survey magnifier (optional; the Task 3 fix is the zoom
hint), #19 (zoom/magnifier single shape, intended/optional), #23 (edge RFI
removal, leave as-is).

---

## Layout & window

### 1. Formatting degrades as the window shrinks (worst at a medium size) — 🔧
No media queries or resize handling exist anywhere in the frontend. The layout
uses a hard-coded `grid-template-columns: 1fr 220px` side panel and pixel plot
floors (`minHeight` in
[PointScatter.tsx:535](../tauri-app/app/src/lib/plots/PointScatter.tsx#L535),
heights 260/200 in SurveyView) plus a fixed 24px y-label column
([App.css:394-422](../tauri-app/app/src/App.css#L394-L422)). When the window is
narrow/short the fixed sizes overflow instead of compressing.

**Fix:** make the side panel's width responsive (min/preferred), replace the
pixel plot floors with flex sizing, and add a breakpoint or two so the
Radio Cartographer view degrades gracefully.

### 2. Accepting sweeps: the upper panel's x-axis label + ticks overlap the lower panel — 🔧
Confirmed bug, isolated to
[SurveyView.tsx:447-464](../tauri-app/app/src/views/SurveyView.tsx#L447-L464):
its top `PointScatter` renders with the default `showXTicks={true}` and an
`xAxisLabel`, so the ticks and "Declination" title land in the bottom margin and
visually collide with the "Removed" panel butted directly beneath it. `ScanView`
already solves this — it passes `showXTicks={false}` on the top plot and renders
a single shared x-axis label *between* the two plots
([ScanView.tsx:502-511](../tauri-app/app/src/views/ScanView.tsx#L502-L511)).

**Fix:** adopt the same shared-label pattern in `SurveyView`.

### 4. You can scroll above the toolbar / below the image even at full size (minor) — 🔧
The single scroll region `.view-area { overflow:auto }` plus 12px/16px padding
and the oversized plot min-heights spill past the container. The menu and status
bars are correctly outside the scroll region.

**Fix (low priority):** clamp the workspace to fit (`min-height:0` +
`overflow:hidden` on the body) and trim the surrounding padding.

---

## Sweep workflow

### 3. RA/Dec/Flux stop updating on click in "Remove RFI" mode — 🔧
In [SurveyView.tsx:257-281](../tauri-app/app/src/views/SurveyView.tsx#L257-L281),
the `if (baselineMode)` branch consumes clicks as baseline-line endpoints and
`return`s before reaching `setStickyPoint(p)`, so the readout no longer pins on
click (only live hover updates it). This matches the tester's report exactly.

**Fix:** also update the sticky readout point on click while in Remove RFI mode —
small change, and matches the expectation that clicking a new point always
updates RA/Dec/Flux.

### 23. Hard to remove RFI at the edge of a survey sweep — ℹ️
The survey "Remove RFI" gesture is **two clicks** that draw a straight line
between the two clicked samples, and it replaces only the samples strictly
*between* them with that line
([SurveyView.tsx:261-277](../tauri-app/app/src/views/SurveyView.tsx#L261-L277)).
The clicked endpoints are real data samples and are left unchanged, and there is
no sample beyond the sweep boundary to anchor against — so the outermost samples
can't be interpolated out. (It is *not* an interpolation between the neighbors
bracketing the region, as the concern assumed — it's a line between the two
clicks.) Note this differs from the scan screen, where "Baseline Source"
subtracts a line across the *entire* scan and therefore has no edge limitation
([scan_workspace.py:386-408](../tauri-app/engine/src/radio_cartographer/scan_workspace.py#L386-L408)).

**Decision: leave as-is.** The point-to-point behavior does what's intended and
extrapolating past the edge is not wanted. Documented here so the edge limitation
is understood rather than treated as a bug.

### 5. Make Image only enabled after Smooth + Baseline + Align — ℹ️
**Intended.** `canMakeImage = didSmooth && didBaseline && didAlign` gates the
button ([PreImageView.tsx:173-215](../tauri-app/app/src/views/PreImageView.tsx#L173-L215));
the tutorial explicitly says not to click Make Image until those steps run. The
"compare original vs. processed" request is noted as a possible future
enhancement, not a change now.

### 6. Smooth Sweeps has no parameter (Baseline/Align do) — ℹ️ / 🎯
**Intended for parity** — legacy "Smooth Sweeps → OK" took no prompt; the
smoothing window is hard-coded to `5` (`rpcClient.smooth(handle, 5, …)` in
[PreImageView.tsx:98-113](../tauri-app/app/src/views/PreImageView.tsx#L98-L113)).
Baseline and Align open `NumericInputDialog` prompts by design.
**Optional enhancement:** expose the smoothing window as a prompt for consistency.

### 7 + 8. No "Accept All"; no list of which sweeps still need accepting — 🔧 (per maintainer direction)
No bulk-accept exists; acceptance is one sweep at a time. Per the maintainer, do
**not** add an exposed Accept-All button (pedagogy). Instead:
- Add a **keyboard shortcut that accepts all** sweeps.
- Add **arrow-key sweep navigation**: left/right move between sweeps, and the
  **forward arrow accepts the current sweep and advances**.
- **Document** in the tutorial that `acceptCurrentSweep`
  ([survey-context.tsx:309-327](../tauri-app/app/src/state/survey-context.tsx#L309-L327))
  already advances to the next *unaccepted* sweep and wraps — so accepting the
  last one loops back to the first unaccepted one, which is how you find what's
  left. Progress is shown as `X / Y sweeps accepted`.

---

## Scan mode / fitting

### 9a. "Choosing degrees of freedom in a polynomial fit" — you couldn't find it — ✅
It exists. **Scan → "Change Determine Peak Fit…"**
([MainWindow.tsx:1613-1637](../tauri-app/app/src/views/MainWindow.tsx#L1613-L1637))
offers Gaussian, Squared Cosine, **2nd / 3rd / 4th Degree Polynomial**, and Max
Value. The selection lives in `peakFitKind`
([scan-context.tsx:69](../tauri-app/app/src/state/scan-context.tsx#L69)). So the
polynomial degree (2–4) is selectable — this is a **discoverability** issue; call
it out in the help/tutorial.

### 9b. A measure of uncertainty on the peak-flux fit — 🎯
Not computed or surfaced today. Notably the Gaussian path even computes a width
`sigma` internally and then discards it
([scan_workspace.py:494-495](../tauri-app/engine/src/radio_cartographer/scan_workspace.py#L494-L495));
the RPC returns only `peak_flux / peak_ra / fit_*`.
**Optional enhancement:** surface a fit uncertainty (e.g. σ or fit RMS) alongside
the reported peak.

### 22. Undo reverts peak flux but does not restore the model fit — 🔧
The fitted curve is **frontend-only** state (`pendingPeakFit`) and is cleared by
the `[view]` effect on every reload
([ScanView.tsx:104-111](../tauri-app/app/src/views/ScanView.tsx#L104-L111)); the
engine undo snapshot restores `peak_flux` but never stored the fit grid
([scan_workspace.py:681-685](../tauri-app/engine/src/radio_cartographer/scan_workspace.py#L681-L685)).
So the peak value reverts while the fitted curve disappears.

**Fix:** persist the fit grid in the undo snapshot (or a frontend history) so undo
redraws the model fit that matches the restored peak.

---

## Calibration

### 10. How does TRC recognize calibration sources (it knew Cygnus A)? — ✅
A **first-three-characters, case-insensitive** lookup against exactly three
legacy calibrators
([flux_calibration.py:32-50](../tauri-app/engine/src/radio_cartographer/flux_calibration.py#L32-L50)):
**VIR** = 213 Jy, **TAU** = 942 Jy, **CYG** = 1581 Jy (ported from
`vb/calform.frm`). The name is read from the `.scn` header; a match pre-fills the
"Known flux (Jy)" prompt. Anything else (e.g. Cassiopeia A) returns 0 Jy and the
user types the value manually. There is **no** broader radio-calibrate catalog —
just those three sources.
**Optional enhancement:** extend the known-source table.

### 13. Removing all calibration points then clicking Calibrate Survey does nothing — 🔧
The engine *does* raise a `ValueError` (empty cal → `cal == 0.0`) in
[workspace.py:286-291](../tauri-app/engine/src/radio_cartographer/workspace.py#L286-L291),
but the frontend renders it only as a small inline `plot-status error` snippet
inside a plot cell
([CalibrateSurveyView.tsx:319-320](../tauri-app/app/src/views/CalibrateSurveyView.tsx#L319-L320)),
which is easy to miss — hence "nothing happens."

**Fix:** validate up front and/or show a real warning dialog (reuse
`ConfirmDialog` / `AppDialog`).

### 12. "Cut Segment" (removes) vs "Select Declination" (keeps) is confusing — 🔧 (tooltips/help)
Confirmed opposite semantics: `cut_*` masks **out** the dragged RA range;
`select_*_declination` keeps **only** the dragged Dec band
([scan_workspace.py:356-370](../tauri-app/engine/src/radio_cartographer/scan_workspace.py#L356-L370)).
Renaming "Cut Segment" to "Select Segment" (as suggested) would hide that the two
do opposite things, so **keep the names** and instead **strengthen the tooltips
and help** so keep-vs-remove is unmistakable. Buttons live in
[ScanView.tsx:556-587](../tauri-app/app/src/views/ScanView.tsx#L556-L587) and
[CalibrateSurveyView.tsx:473-488](../tauri-app/app/src/views/CalibrateSurveyView.tsx#L473-L488).

---

## Image, palette, zoom & magnifier

### 15. Is there a way to save the image after creating it? — ✅ / 🔧
Yes, for **scalar** images: Image → **Save Image / Save Image As…** (`.img`,
`.fits`) and **Save Bitmap As…** (`.bmp`)
([MainWindow.tsx:1352-1369](../tauri-app/app/src/views/MainWindow.tsx#L1352-L1369)).

**Gap (fix):** **bi/tri-color RGB composites cannot be saved or exported** —
creating an RGB image sets the scalar `image` to null
([survey-context.tsx:437-438](../tauri-app/app/src/state/survey-context.tsx#L437-L438)),
and all save items are `disabled={!hasImage}`. Add a save/export path for RGB
composite images.

### 16. Nav bug: "Back to Pre Image" in bi/tri-color returns to the *survey* pre-image — 🔧
`setRgbImageAction` sets the RGB image + `viewMode='image'` but never clears the
survey workspace
([survey-context.tsx:430-447](../tauri-app/app/src/state/survey-context.tsx#L430-L447)),
so `ImageView`'s single back button
([ImageView.tsx:156-158](../tauri-app/app/src/views/ImageView.tsx#L156-L158))
routes to the survey's `PreImageView`, which regenerates the survey pre-image.

**Fix:** give the RGB composite its own correct back target. The tester suspected
"other small menu navigation concerns like this one" — worth auditing the other
menu-nav paths for similar stale-target issues.

### 17. Bi/tri-color zoom updates the axes but not the image; magnifier doesn't work — 🔧
`RgbImagePlot` draws the 3-channel bitmap as a Plotly **layout image in paper
coordinates** (pinned to the plot area), so zooming rescales the axes/ticks while
the bitmap stays put filling the plot
([RgbImagePlot.tsx:183-209](../tauri-app/app/src/lib/plots/RgbImagePlot.tsx#L183-L209)).
It also wires no hover/click/context handlers, so the magnifier never opens
([ImageView.tsx:260-270](../tauri-app/app/src/views/ImageView.tsx#L260-L270),
commented "intentionally not wired here yet").

**Fix:** render RGB in data coordinates (or sync the bitmap to the zoom range) and
wire the interaction props. Larger effort than the scalar path.

### 14. There is no magnifier inside the survey menu — 🔧 (tooltip) / 🎯 (magnifier)
The magnifier is implemented only in `ImageView`, and only after a scalar image is
built; `PreImageView` and `SurveyView` don't instantiate it
([PreImageView.tsx:198-208](../tauri-app/app/src/views/PreImageView.tsx#L198-L208)).

**Fix (now):** the pre-image already supports zooming in via **right-click and
drag** — just add a **tooltip on the pre-image noting that** so users can discover
it. This is a zoom, not a magnifier.

**Optional enhancement (later):** add an actual magnifier to the survey/pre-image
view. Faithful-first, so this is not required now.

### 18 + 21. Palette breaks on edge cases (stop to edge with no stop, stacked stops) and errors more near 50 stops — 🔧
Same root cause, in
[PaletteEditor.tsx](../tauri-app/app/src/views/PaletteEditor.tsx): stops are
stored **unsorted**, selection is by array **index** (which diverges from the
sorted render order), nothing prevents two stops from sharing an anchor, and the
only de-duplication is a downstream `epsilon = 1e-6` nudge in `paletteToColorscale`
([ImagePlot.tsx:54-85](../tauri-app/app/src/lib/plots/ImagePlot.tsx#L54-L85)).
Near ~50 stops those epsilon nudges collide and `Math.min(1, …)` clamps several
entries to 1, re-creating the duplicate anchors Plotly fails on.

**Fix (one change covers both):** in the editor, keep anchors sorted and clamped,
prevent stacking (dedupe/space on drop), and track selection by identity rather
than array index.

### 19. Zoom and magnifier only allow one shape, proportional to the image — ℹ️ / 🎯
Largely **intended**: the heatmap is aspect-locked (`scaleanchor:'y'` +
`constrain:'domain'`) so the sky keeps its correct proportions
([ImagePlot.tsx:291-322](../tauri-app/app/src/lib/plots/ImagePlot.tsx#L291-L322)),
and the magnifier is a fixed square window
([ImageView.tsx:65-135](../tauri-app/app/src/views/ImageView.tsx#L65-L135)).
Free-form (non-proportional) shapes would distort the scale.
**Optional:** allow an adjustable magnifier size/aspect (size is already tunable
via Image → "Change Magnifier Size…").

### 20. Flux is measured on click, but no marker is left on the image — 🔧
`pinnedPoint` drives only the text readout; the image heatmap draws no marker at
the clicked cell (the only overlay it can draw is the magnifier box). By contrast
the scatter plots *do* render a pinned marker
([PointScatter.tsx:226-232](../tauri-app/app/src/lib/plots/PointScatter.tsx#L226-L232)).

**Fix:** draw a crosshair/marker at `pinnedPoint` on the image so the user can see
where the flux was sampled without reading the coordinates. Handlers in
[ImageView.tsx:171-209](../tauri-app/app/src/views/ImageView.tsx#L171-L209) and
[ImagePlot.tsx](../tauri-app/app/src/lib/plots/ImagePlot.tsx).

### 24. Saving a survey image via the "Image" menu is confusing — 🔧
To save a survey image you go to the **Image** menu → **Save Image As…**
([MainWindow.tsx:1352-1369](../tauri-app/app/src/views/MainWindow.tsx#L1352-L1369)),
which is confusing because "Image" is also the name of the page/view you're
already on. The `ImageView` toolbar currently exposes no save control of its own.

**Fix:** add **Save / Save As / Export** controls directly to the `ImageView`
toolbar so saving doesn't require the menu. Reuse the existing
`saveImageAction` / `saveImage` / `saveBitmap` paths
([survey-context.tsx:480-522](../tauri-app/app/src/state/survey-context.tsx#L480-L522))
that the menu items already call. (Pairs naturally with **#15** — while adding
in-view save, also wire an export path for RGB bi/tri-color composites, which
currently have none.)

---

## About page

### 11. The About OG Radio Cartographer page is sparse — ℹ️
**Intended.** [AboutBox.tsx](../tauri-app/app/src/views/AboutBox.tsx) faithfully
recreates the legacy VB6 "About KaraLeah" dialog (credits Daniel E. Reichart /
ERIRA / NRAO / Green Bank, WV). The sparseness is deliberate fidelity.
**Optional:** add a version/build string.

---

## Summary

| # | Concern | Verdict |
|---|---------|---------|
| 1 | Layout degrades on shrink | 🔧 fix (responsive) |
| 2 | Upper x-axis overlaps lower panel | 🔧 fix (adopt ScanView pattern) |
| 3 | Readout freezes in Remove RFI | 🔧 fix (setStickyPoint on click) |
| 4 | Scroll above/below content | 🔧 fix (minor, clamp) |
| 5 | Make Image gated | ℹ️ intended |
| 6 | Smooth has no parameter | ℹ️ intended / 🎯 optional |
| 7–8 | No accept-all / remaining list | 🔧 shortcut + arrow keys + tutorial note (no exposed button) |
| 9a | Polynomial DOF "missing" | ✅ exists (Change Determine Peak Fit) |
| 9b | Fit uncertainty | 🎯 optional |
| 10 | Cal-source recognition | ✅ answered (VIR/TAU/CYG only) |
| 11 | About page sparse | ℹ️ intended |
| 12 | Cut vs Select naming | 🔧 tooltips/help |
| 13 | Empty-cal Calibrate does nothing | 🔧 fix (warning dialog) |
| 14 | No magnifier in survey | 🔧 tooltip (right-click-drag zoom) / 🎯 magnifier later |
| 15 | Save image | ✅ scalar yes / 🔧 add RGB export |
| 16 | Bi/tri back-button target | 🔧 fix (nav) |
| 17 | Bi/tri zoom + magnifier broken | 🔧 fix |
| 18 | Palette edge/stack bugs | 🔧 fix |
| 19 | Zoom/magnifier one shape | ℹ️ intended / 🎯 optional |
| 20 | No click marker on image | 🔧 fix |
| 21 | Palette errors near 50 stops | 🔧 fix (same as 18) |
| 22 | Undo doesn't restore model fit | 🔧 fix |
| 23 | Hard to remove edge RFI on a sweep | ℹ️ intended (leave as-is) |
| 24 | Save-via-Image-menu is confusing | 🔧 fix (add Save button on Image view) |

**Needs fix (13):** 1, 2, 3, 4, 12, 13, 15 (RGB export), 16, 17, 18/21, 20, 22,
24 — plus the accept-workflow keyboard/arrow-key additions (7–8).
**Answered / intended (8):** 5, 9a, 10, 11, 19, 23, plus the "Save image" (scalar)
and "DOF" answers.
**Optional enhancements (faithful-first):** 6, 9b, 10 (more sources), 14, 19.
