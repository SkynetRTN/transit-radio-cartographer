# AGENT.md

## Project: Karaleah / Radio Cartographer

A Visual Basic 5 desktop application for reducing and visualizing single-dish radio-astronomy survey data. Originally written by Daniel E. Reichart in 1996–1997 for the **Educational Research In Radio Astronomy (ERIRA)** program at the **National Radio Astronomy Observatory (NRAO)**, Green Bank, West Virginia. The app's window title is "Radio Cartographer"; the project itself has been carried forward through several VB project files (Kara96 → Kara97 → Karaleah 2002 → RC08) with the same core forms.

All source lives in [vb/](vb/). End-user documentation lives in [docs/](docs/) — currently just [docs/Radio Cartographer Tutorial.docx.pdf](docs/Radio Cartographer Tutorial.docx.pdf), a 7-page walkthrough that this file's "Intended workflow" section summarizes. This is a single-project repository.

## Intended workflow (from the tutorial)

The user manual treats the app as a Survey-reduction pipeline. The canonical path, with the form / button on each step:

1. **Pick the right input.** Use `.md2` files for surveys, `.md1` for scans. Channel-B files (filenames ending `…b.md2`) and B-channel calibration files are explicitly **not** to be used. If `File → New Survey` can't find the data, the file is probably an `.md1` — open it via `Scan → New Scan` instead.
2. **New Survey.** `Survey → New Survey…` → pick `.md2` → opens [vb/survform.frm](vb/survform.frm).
3. **Attach a calibration.** `Calibration → Select Calibration…` → pick a `.cal` file (the tutorial uses `cal18a.cal`) → click **Calibrate Survey**. Calibration files are produced by [vb/calform.frm](vb/calform.frm).
4. **Cut bad segments** on the survey picture. Click **Cut Segment**, drag from the cut point to the plot edge, double-click to confirm. The green-highlighted region is what gets removed. Cut anything that looks like a "jump" or "drop" plus any excess data at the ends. When done, click **Calibrate Survey** again.
5. **Walk every sweep individually** to remove RFI spikes and drop-outs. On each sweep click **Baseline Segment**, drag from start to end of the bad region, click to confirm. Right-click cancels a cut in progress. `Survey → GoTo Sweep…` navigates between sweeps (and is how you undo by returning to a sweep). Sweeps with too few points can be skipped.
6. **Save the survey** when prompted at the end of the sweep walk → produces `.srv`.
7. **Build the image** (still in `SurvForm` — do *not* click **Make Image** until the prior steps are done):
   - **Smooth Sweeps** → OK
   - **Baseline Sweeps** → OK
   - **Align Sweeps** → change the default prompt of `3` to `0.5` → OK
   - **Make Image** → change the default prompt of `2` to `1` → OK
8. **Inspect the image.** Hovering the mouse over the image displays RA, Dec, and Flux in the bottom-right of the window. Once the image exists, menu work shifts from the `Survey` menu to the `Image` menu (the tutorial calls this out explicitly).
9. **Tighten the palette** to suppress residual RFI. Hover to find the flux at the brightest "true" pixel of the source, then `Image → Show Palette…` ([vb/dataform.frm](vb/dataform.frm)) and set the Flux Range **max** slightly above that value → OK. The tutorial warns that the max-flux text box is fiddly to type into ("There's no way around it. Struggle through it!").
10. **Save** via `Image → Save Image As…` → `.img`. Optionally `Image → Save Bitmap As…` for a `.bmp` export.

For converting raw flux units to Janskys after the fact, the tutorial points back at `Calibration → Select Calibration` against a recent `.cal`.

## Build & run

This is a Windows 32-bit Visual Basic 5 project. It does not build on macOS/Linux natively and there is no modern build script — the `.OBJ` files in [vb/](vb/) are VB5 intermediate object files, not COFF/ELF objects.

- VB project files (open in VB5/VB6 IDE on Windows): [vb/Kara96.vbp](vb/Kara96.vbp), [vb/Kara97.vbp](vb/Kara97.vbp), [vb/Karaleah2002.vbp](vb/Karaleah2002.vbp), [vb/RC08.vbp](vb/RC08.vbp). [vb/KARALEAH.MAK](vb/KARALEAH.MAK) is the older VB4-era make file.
- Prebuilt executables: [vb/KARALEAH2002.exe](vb/KARALEAH2002.exe) and [vb/Kara97.exe](vb/Kara97.exe). Both depend on the VB5 runtime `MSVBVM50.DLL` (see [vb/KARALEAH2002.DEP](vb/KARALEAH2002.DEP)).
- Startup form is `Karaleah` (set in the `.vbp`); icon is also taken from that form.

The four `.vbp` files all reference the same set of `.frm` files — the variants differ only in EXE name, title, and version metadata. `RC08.vbp` is unusual in that it points to forms in `..\..\ERIRA2~1\KARALE~1\` (i.e., it expects to live inside an "ERIRA 2008" tree, not in `vb/`).

## Forms

All UI is in the eight `.frm` files in [vb/](vb/). VB stores both the visual layout and the code-behind in each `.frm`; the `Attribute VB_Name = "…"` line near the middle of each file marks the boundary between layout and code.

- [vb/karaleah.frm](vb/karaleah.frm) — **Main window.** Thin menu-driven shell ("File / Image / Survey / Scan / Calibration"). Each menu item is a `*_Click` handler that loads `LoadData` as a file picker and then opens the appropriate child form. Owns the global enable/disable state of menu items.
- [vb/backdrop.frm](vb/backdrop.frm) — Maximized grey background window that sits behind the other forms (acts like a pseudo-MDI parent).
- [vb/loaddata.frm](vb/loaddata.frm) — **Custom file dialog** built from `DriveListBox` + `DirListBox` + `FileListBox` (predates use of the common-dialog control). Its `Caption` property is overloaded as a state machine: callers set it to a verb like `"New Scan"`, `"Open Survey"`, `"Save Image As"`, `"Save Bitmap As"`, etc., and read it back as `"show"`, `"save"`, `"append"`, `"bicolor"`, `"renew2"`, or `""` to determine the user's action.
- [vb/scanform.frm](vb/scanform.frm) — **Single scan reduction.** Loads raw `.md1` sweep data, lets the user baseline-subtract, cut bad segments, mark peaks, apply calibration, and save as `.scn`.
- [vb/calform.frm](vb/calform.frm) — **Telescope calibration.** Reads peak fluxes from `.scn` files of known sources (special-cased: Virgo A = 213 Jy, Tau A = 942 Jy, Cyg A = 1581 Jy at this band), fits measured-vs-known, draws the calibration curve in `Picture1`, saves as `.cal`.
- [vb/survform.frm](vb/survform.frm) — **Survey + image workhorse** (~9.5k lines). Loads `.md2` multi-sweep raw data, manages an `Ra/Dec/Flux` cube up to 570 sweeps × 2000 samples, builds bitmap images of the sky region (with bi-color / tri-color / superimpose modes), and handles the magnifier, palette window, and bitmap export. Contains an inline Numerical-Recipes-style `four1` FFT (the `nn%, isign%, mmax%, theta#, wr#, wpr#, wpi#, wi#` block near the head of the module).
- [vb/dataform.frm](vb/dataform.frm) — **Palette editor.** RGB curve editor with up to 100 control points; round-trips through `SurvForm.Label8.Caption` as a space-delimited serialized palette.
- [vb/danform.frm](vb/danform.frm) — About box. Credits Daniel E. Reichart / ERIRA / NRAO / Green Bank, WV; carries the version string ("Karaleah Version 1.3", Copyright 2002).

## File formats handled

Plain-text line-oriented files written with VB `Print #1` / read with `Line Input #2`. There are no binary formats.

| Ext  | Role                                  | Produced by                                          |
| ---- | ------------------------------------- | ---------------------------------------------------- |
| .md1 | raw single-sweep input                | external (telescope acquisition)                     |
| .md2 | raw multi-sweep survey input          | external                                             |
| .scn | reduced scan                          | [vb/scanform.frm](vb/scanform.frm)                   |
| .srv | reduced survey                        | [vb/survform.frm](vb/survform.frm)                   |
| .img | gridded survey image                  | [vb/survform.frm](vb/survform.frm)                   |
| .cal | telescope calibration (fit Jy/count)  | [vb/calform.frm](vb/calform.frm)                     |
| .pal | RGB palette                           | [vb/dataform.frm](vb/dataform.frm)                   |
| .bmp | rendered survey image                 | `SavePicture SurvForm.Picture4.Image, ...`           |

## Conventions worth knowing before editing

- **Hungarian-suffix VB typing throughout:** `Num%` is `Integer`, `Flux!` is `Single`, `Tmp#` is `Double`, `Junk$` is `String`. Adding a new variable should follow the same convention or VB will silently treat it as `Variant`.
- **Inter-form communication via control captions.** Forms pass state to each other by writing to a label or text-box on a target form (e.g., `LoadData.Caption = "show"`, `SurvForm.Label5.Caption = path`, `SurvForm.Label8.Caption = serialized palette`). There are no shared modules or globals beyond what's stored on the forms themselves.
- **`LoadData.Caption` is a state machine**, not a window title — see the form list above for the verbs.
- **`*.OBJ` files in [vb/](vb/) are VB5-generated intermediate output**, not human-edited source. Several versions (`*1.OBJ` from 2002, `*2.OBJ` from 2005) coexist; treat them as build artifacts.
- **`.frx` files** ([vb/dataform.frx](vb/dataform.frx), [vb/survform.frx](vb/survform.frx)) are the binary resource sidecars VB writes for embedded `Picture` / icon data referenced from the corresponding `.frm`. Don't hand-edit.
- **Backup naming:** `karaleah1.OBJ` / `karaleah2.OBJ`, `dataform1.OBJ` / `dataform2.OBJ`, etc. are dated snapshots, not part of an active build pipeline.

## What this repo is *not*

- Not a modern build (no `Makefile`, no `package.json`, no Python/conda environment).
- Not under version control here — `/Users/reedfu/Skynet/ogrc/.git` does not exist.
- Not multi-platform — the code uses `\` path separators, `PrintForm`, `SavePicture`, and the VB5 runtime, all Windows-only.
