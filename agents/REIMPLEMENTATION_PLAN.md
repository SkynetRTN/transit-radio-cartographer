# Radio Cartographer — Modern Reimplementation Design Brief

A design brainstorm for porting the existing VB5 "Karaleah / Radio Cartographer" desktop
application off Windows-only Visual Basic and onto a modern, cross-platform stack.
This document proposes several candidate architectures, compares them against the
stated priorities, and ends with a recommendation and migration strategy.

---

## 1. What we are porting

The current app (see [AGENT.md](../AGENT.md) for the full inventory) is roughly:

- **~17,000 lines of VB5** across 8 forms — the bulk in
  [vb/survform.frm](../vb/survform.frm) (~9.5k lines, survey + image workhorse) and
  [vb/scanform.frm](../vb/scanform.frm) (~3.4k lines, single-scan reduction).
- A **pseudo-MDI desktop UI** with menu-driven workflow (File / Survey / Scan /
  Calibration / Image) and a maximized grey "backdrop" form acting as parent.
- **Heavy interactive picture-box plotting** — every reduction step is driven by
  dragging on a `Picture` control and double-clicking to confirm (cut segments,
  baseline segments, peak marking, RFI suppression, palette editing).
- **Plain-text line-oriented file formats** (`.md1` `.md2` `.scn` `.srv` `.img`
  `.cal` `.pal`), plus a `.bmp` export written via `SavePicture`.
- **In-line numerics** — a Numerical-Recipes `four1` FFT, hand-rolled baseline
  fits, and an `Ra/Dec/Flux` cube up to 570 sweeps × 2000 samples.
- **No external dependencies** beyond the VB5 runtime (`MSVBVM50.DLL`) — but
  also no shared modules: all state lives on form controls
  (`SurvForm.Label5.Caption = path`, `LoadData.Caption = "save"`, etc.).
- **Single-user, single-machine workflow** — the tutorial walks one scientist
  through one survey at a time.

The constraints to honor:

1. **Complete backward compatibility** — every existing `.md1`/`.md2`/`.scn`/`.srv`/
   `.img`/`.cal`/`.pal`/`.bmp` file must round-trip byte-for-byte (or at least
   value-for-value, since these are text files with VB number formatting).
2. **Modern, popular framework** — community size matters for longevity.
3. **Interactive UI** — drag-to-select on plots is the core interaction; that
   must feel as good or better than the VB original.
4. **Easy maintenance** — small team / single maintainer; code must read clearly
   in 2026 and still in 2036.
5. **Cross-platform** — Windows, macOS, Linux from one codebase.

---

## 2. Architectural principles (independent of stack)

Before choosing a framework, these decisions apply to every candidate:

- **Separate the *engine* from the *UI*.** Today, FFTs, baselining, calibration
  fits, and image gridding are inlined inside form event handlers. The
  reimplementation should have a pure-data **core library** (no UI imports) and
  a thin **UI layer** that calls into it. This is what makes maintenance easy
  *and* makes testing possible — the VB code has no automated tests because
  there is no seam.
- **Treat file I/O as a versioned codec.** Write parsers + serializers for each
  legacy format with a golden-file round-trip test against every `.md2`/`.srv`/
  `.cal`/`.img` we can lay hands on. This is the only way to credibly claim
  "complete backward compatibility."
- **In-memory model = NumPy-style array.** The Ra/Dec/Flux cube is naturally
  an `(n_sweeps, n_samples, 3)` array. Whatever language we land on, the core
  should expose that shape so libraries (astropy, scipy, etc.) drop in.
- **State lives in a model object, not in widget captions.** Eliminating the
  "`LoadData.Caption = "show"`" pattern is non-negotiable for maintainability.
- **No automatic auto-save / hidden serialization.** Match the VB UX: explicit
  Save Survey / Save Image steps.

These principles cost roughly the same regardless of framework — they are
all about *not* recreating the VB5 code structure verbatim.

---

## 3. Candidate architectures

Each candidate below is presented at the same depth: stack, what the UI looks
like, what the engine looks like, packaging story, and honest weaknesses.

### A. Python + PyQt6 (or PySide6) + pyqtgraph + NumPy/SciPy/Astropy

**Stack.** Python 3.12+, Qt 6 via PyQt6 or PySide6, pyqtgraph for interactive
plots, NumPy/SciPy for numerics, Astropy for coordinate handling
(`SkyCoord` / `WCS`), packaged with `briefcase` or PyInstaller into `.exe`/
`.app`/`AppImage`.

**UI.** A `QMainWindow` with a menu bar that mirrors the existing
File / Survey / Scan / Calibration / Image structure; a `QMdiArea` (or tabbed
docks) replaces the `backdrop.frm` pseudo-MDI. Each form becomes a
`QWidget` subclass:

- `SurveyView` (formerly `survform.frm`) — pyqtgraph `ImageView` for the gridded
  image; `PlotWidget` panels for the current sweep, the all-sweeps strip, and
  the magnifier. pyqtgraph's built-in `LinearRegionItem` and `ROI` classes give
  drag-to-select and double-click-to-confirm for free.
- `ScanView`, `CalibrationView`, `PaletteEditor` likewise.
- Native file dialogs (`QFileDialog`) replace `loaddata.frm` — no more state
  machine on a window caption.

**Engine.** A `radio_cartographer/` Python package with submodules:
`io/` (one parser per extension), `survey.py` (the Ra/Dec/Flux cube and its
reductions), `calibration.py`, `image.py` (gridding + palette application),
`palette.py`. Numerics use `numpy.fft.fft`, `scipy.signal.savgol_filter`, and
`numpy.polyfit` — replacing the hand-rolled `four1` and baseline fits.

**Packaging.** `briefcase` produces signed `.app`, `.msi`, and `.AppImage` /
`.deb` from one project file. PyInstaller is the fallback.

**Pros.**
- Best-in-class scientific Python ecosystem — `astropy.wcs`, `scipy.ndimage`,
  `photutils` all available if/when the science grows.
- pyqtgraph is built specifically for the kind of fast, draggable, large-data
  plotting this app does; it outperforms matplotlib for interactive work.
- Qt is *the* battle-tested cross-platform desktop framework; native look on
  all three OSes; 25+ years of stability.
- Python is universally readable by physics grad students — keeps the bus
  factor low.
- Same numerics can be reused from a Jupyter notebook for power users.

**Cons.**
- Python packaging on macOS (notarization) and Windows (code-signing) is a
  one-time pain.
- PyQt6 is GPL/commercial; PySide6 is LGPL (use PySide6 to avoid licensing
  questions).
- Cold-start time ~1–2 s — slower than VB5's instant launch.

---

### B. Python + Dash (or Streamlit) + Plotly — browser-delivered local app

**Stack.** Python core identical to (A), but the UI is a single-page web app
served by Dash (Flask-based) or Streamlit running on `localhost`. Launch
script opens the user's default browser at `http://127.0.0.1:8050`. Optionally
wrap with `pywebview` so it *feels* like a desktop app.

**UI.** Plotly figures with built-in pan/zoom/box-select; Dash callbacks
handle the reduction-step state machine. Plotly's `selectedData` event covers
drag-to-cut segments cleanly.

**Engine.** Same Python core library as (A) — the only difference is the
presentation layer.

**Packaging.** `pyinstaller` bundles the Python server; on launch it picks a
free port and opens the browser. With `pywebview`, the app gets an OS-native
window with no browser chrome.

**Pros.**
- Lowest UI-code surface area — Plotly's defaults give a slick, modern feel
  with very little code.
- Engine and UI are physically separated by an HTTP boundary, making the
  engine trivially reusable from notebooks, scripts, or a future hosted
  deployment.
- Same code can later be deployed as a shared web service if the lab ever
  wants multi-user.

**Cons.**
- Two-process model (Python server + browser) is more fragile than a single
  desktop binary — antivirus and corporate firewalls sometimes flag
  `localhost` servers.
- Plotly's interactive performance degrades on large heatmaps (the
  `image` view at full survey resolution may be sluggish without WebGL
  tricks).
- Drag-to-select-and-double-click-to-confirm is harder to replicate exactly
  than in pyqtgraph; will likely need a slightly different UX gesture.
- "Web app pretending to be desktop" is a known UX papercut category
  (window-sizing oddities, file-system access via download/upload only —
  somewhat mitigated by `pywebview`).

---

### C. Electron + TypeScript/React + Plotly.js, with Python sidecar for numerics

**Stack.** Electron app with React + TypeScript front-end; numerics in a
Python sidecar process (spawned by Electron, talked to over JSON-RPC or a
local socket). Optionally replace Electron with **Tauri** to get a much
smaller binary (~10 MB vs ~150 MB) at the cost of a Rust learning curve.

**UI.** React component tree mirroring the form hierarchy; Plotly.js or
`uPlot` for plots; standard web tooling (Vite, ESLint, Vitest).

**Engine.** Python package as in (A). The Electron/Tauri front-end IPCs into
it for every reduction step.

**Pros.**
- Largest available pool of UI developers (web stack).
- Slick, modern look with very little CSS.
- Tauri specifically produces tiny, fast binaries.

**Cons.**
- **Two-language stack.** Adding a feature usually touches both TypeScript
  and Python — the worst case for "easy maintenance" with a small team.
- IPC serialization is a real cost for the 570 × 2000 cube (must use binary
  formats: msgpack / Arrow / shared memory). Easy to get wrong.
- Electron bundles a full Chromium (~150 MB); Tauri avoids that but
  introduces Rust.
- Most overkill option for a single-scientist app — its strengths shine in
  team and collaborative settings that don't apply here.

---

### D. JupyterLab extension / Jupyter widget app (ipywidgets + bqplot)

**Stack.** Pure Python core (same as A); UI built from `ipywidgets` +
`bqplot` (or `plotly`/`ipycanvas`) inside JupyterLab. Distribute as a
`jupyter-lab-desktop` bundle for a desktop feel, or as a notebook for
power-user reproducibility.

**Pros.**
- The most natural home for "scientist + interactive data" workflows.
- Every reduction step is automatically reproducible — the notebook *is* the
  log.
- Zero packaging work if users already have a Python/conda environment.

**Cons.**
- Notebook UX is not a polished application UX — enforcing the linear
  workflow ("don't click Make Image until you've baselined") is hard when
  cells can be run in any order.
- `bqplot` is less performant than pyqtgraph for the magnifier / live
  hover use case.
- Asking the user to install Anaconda is a much higher barrier than
  double-clicking an `.exe`.

---

### E. .NET 8 / Avalonia (or WinUI 3 + Uno) — staying closest to the original

**Stack.** C# 12 on .NET 8, Avalonia UI for cross-platform XAML; OxyPlot or
ScottPlot for plots; MathNet.Numerics for FFT/fits.

**Pros.**
- Of all options, this is the most "VB5-shaped" — XAML resembles `.frm`
  layout files; event-driven code-behind survives.
- Single self-contained binary per platform (`dotnet publish -p:PublishSingleFile=true`).
- Excellent IDE tooling (Rider / Visual Studio).

**Cons.**
- Smallest scientific-library ecosystem of all five candidates — no Astropy,
  weaker FITS / WCS support.
- Avalonia is mature but its community is much smaller than Qt's or React's;
  hiring/recruiting a maintainer is harder.
- Loses the "I can also drive this from a notebook" benefit of every
  Python-based option.

---

## 4. Comparison

Scoring is qualitative, on the stated priorities. ★★★ = strong, ★★ = adequate,
★ = weak.

| Priority                          | A. PyQt6 + pyqtgraph | B. Dash/Plotly local | C. Electron+Python | D. JupyterLab    | E. .NET + Avalonia |
|-----------------------------------|----------------------|----------------------|--------------------|------------------|--------------------|
| Backward-compat file I/O          | ★★★ (Python is great at text I/O; numpy round-trips) | ★★★ (same Python core) | ★★★ (same Python core) | ★★★ (same Python core) | ★★ (C# fine, less astro-tooling) |
| Modern, popular framework         | ★★★ (Qt + scientific Python) | ★★ (Dash niche; Plotly common) | ★★★ (web stack, huge) | ★★ (popular in science only) | ★★ (Avalonia growing) |
| Interactive UI quality            | ★★★ (pyqtgraph excels at this) | ★★ (Plotly OK, large heatmaps slow) | ★★ (Plotly.js; IPC latency) | ★ (notebook gestures awkward) | ★★ (OxyPlot/ScottPlot solid) |
| Easy maintenance / small team     | ★★★ (one language) | ★★★ (one language) | ★ (two languages) | ★★ (notebook discipline needed) | ★★ (one language, smaller ecosystem) |
| Cross-platform packaging          | ★★ (briefcase / PyInstaller; signing chores) | ★★ (same + browser dependency) | ★★ (Electron heavy; Tauri smaller but Rust) | ★ (asks user to install Python) | ★★★ (single-file publish) |
| Performance on 570×2000 cube      | ★★★ (NumPy + pyqtgraph) | ★★ (Plotly slows at scale) | ★★ (IPC overhead) | ★★ (bqplot OK) | ★★★ (compiled .NET) |
| Path to notebooks / reproducibility | ★★★ | ★★★ | ★★★ | ★★★ (it *is* the notebook) | ★ |
| Long-term hireability of maintainers | ★★★ (Python everywhere) | ★★★ | ★★★ (web stack) | ★★ | ★★ |

### Trade-off summary

- **(A) PyQt6 + pyqtgraph** is the strongest all-rounder for a single-machine
  scientific desktop app — best interactive plots, single language, deep
  astronomy ecosystem, modest packaging pain.
- **(B) Dash/Plotly local** is (A)'s twin with a web-UI face: lower UI code,
  higher infrastructure brittleness, weaker drag-select fidelity.
- **(C) Electron/Tauri + Python** wins on UI polish and developer pool but
  loses badly on "easy maintenance" because every feature crosses a language
  boundary. Hard to justify for one app, one user.
- **(D) JupyterLab** is the most scientifically idiomatic but the least like
  a polished application — best as a *companion* (a notebook API on top of
  the core library), not as the primary UI.
- **(E) .NET + Avalonia** is the cleanest "1:1 VB port" but throws away the
  scientific-Python ecosystem that would otherwise come for free.

---

## 5. Recommendation

**Primary: build option (A) — Python 3.12 + PySide6 + pyqtgraph + NumPy/SciPy
+ Astropy, packaged with briefcase.**

Reasons:

1. The app is fundamentally *one scientist, one machine, lots of interactive
   plotting* — Qt + pyqtgraph is purpose-built for that workload.
2. The bulk of the VB code is numerical (FFT, baseline fits, gridding) — the
   scientific-Python ecosystem replaces those with vetted, tested
   implementations rather than hand-rolled Numerical Recipes ports.
3. Python is the universal language of working astronomers in 2026, which
   minimizes the bus factor and maximizes the chance the next maintainer can
   pick it up cold.
4. A clean Python core library (the engine, option D's natural shape) **falls
   out of (A) for free** — we get the notebook story without committing to it
   as the primary UI.

**Companion: ship the engine package on its own.** Same wheel installable via
`pip install radio-cartographer` for power users who want to drive reduction
from a Jupyter notebook or a script. This is the "best of both worlds" path
between (A) and (D).

**De-prioritize but reconsider later:**

- **(B) Dash/Plotly** — revisit only if a multi-user / web-hosted deployment
  becomes a requirement.
- **(C) Electron/Tauri** — revisit only if a TypeScript-fluent contributor
  joins and wants to own the UI.

---

## 6. Migration strategy (regardless of stack)

Sketched as concrete, sequenced phases. Each phase ends in a working artifact.

### Phase 0 — Capture ground truth

- Run the existing `KARALEAH2002.exe` under a Windows VM (or Wine) on a
  representative tutorial dataset and capture every intermediate file
  (`.srv`, `.img`, `.cal`, etc.) **plus** screenshots of the resulting plots.
- These become **golden fixtures** for every later phase. Without them, "fully
  backward-compatible" is unverifiable.

### Phase 1 — Engine core, headless

- Write the Python package `radio_cartographer/`, no UI at all.
- Implement readers/writers for all 8 file extensions (`io/md1.py`,
  `io/md2.py`, `io/scn.py`, `io/srv.py`, `io/img.py`, `io/cal.py`,
  `io/pal.py`, `io/bmp.py`).
- Port the reduction routines: baseline, smooth, align, make-image,
  calibrate, palette-apply.
- Round-trip every Phase-0 fixture through `read → write` and compare.
- Image-build pipeline: run on the tutorial `.md2`, assert pixel-level
  agreement (within float tolerance) with the captured `.img`.
- **Definition of done:** `pytest` green on the full fixture corpus.

### Phase 2 — Interactive UI

- Build the PySide6 application around the engine.
- Recreate the menus and workflow described in the AGENT.md tutorial section
  exactly — same labels, same order, same prompts. The user manual stays
  valid.
- Replace `loaddata.frm` with `QFileDialog`. Replace `backdrop.frm` with a
  `QMdiArea` (or tabbed docks — TBD by usability test with the original user).
- Replace each picture-box-with-drag with a pyqtgraph `PlotWidget` + `ROI`.
- **Definition of done:** a domain user can complete the tutorial walkthrough
  end-to-end and the output `.img` matches the VB output within tolerance.

### Phase 3 — Packaging & distribution

- `briefcase` build targets for Win/Mac/Linux.
- Set up CI (GitHub Actions) to build and sign per-platform artifacts on tag.
- Code-signing certificates (Apple Developer ID, Windows EV cert) — one-time
  setup; this is the biggest non-technical cost.

### Phase 4 — Optional: notebook companion + niceties

- Publish `radio-cartographer` to PyPI.
- Write a "drive Radio Cartographer from a notebook" tutorial.
- Quality-of-life features the VB version lacks: undo/redo stack, session
  log, FITS export (in addition to legacy `.img`), automated regression
  tests on the user's own historical surveys.

---

## 7. Open questions

These should be answered before Phase 1 starts:

1. **Who is the primary user post-port?** If it's still Daniel Reichart and a
   handful of ERIRA students, the UX choices (preserve every menu label,
   keep the slightly-fiddly palette text box) lean conservative. If new
   users are expected, more UX modernization is warranted.
2. **Is bitmap export sufficient, or do we also want FITS/PNG?** The current
   `.bmp` from `SavePicture` is lossy and Windows-only in the BMP variant
   it writes. Adding PNG and FITS is trivial in Python; worth doing.
3. **How many historical `.srv` / `.img` / `.cal` files exist for fixture
   capture?** This sets the bar for "fully backward-compatible."
4. **Is there appetite for a sky-coordinate upgrade?** The VB app does its
   own RA/Dec math. Switching to `astropy.coordinates` + `astropy.wcs`
   would unlock overlays with other surveys but is a behavior change.
5. **Code signing budget?** Apple ($99/yr) + Windows EV cert ($200–400/yr).
   Required for friction-free installs on macOS and Windows SmartScreen.

---

## 8. TL;DR

| Question | Answer |
|---|---|
| Best overall stack? | **Python + PySide6 + pyqtgraph + NumPy/SciPy/Astropy**, packaged with briefcase. |
| Why? | Best interactive-plot library for this workload, single language, deepest scientific ecosystem, lowest bus factor among working astronomers. |
| What does the architecture look like? | A pure `radio_cartographer` Python package (engine + codecs) under a thin PySide6 UI. The engine is publishable to PyPI on its own, which gives the JupyterLab story for free. |
| How do we guarantee backward compatibility? | Capture golden fixtures from the existing EXE in Phase 0; round-trip every legacy file format and assert pixel-level image agreement before any UI work begins. |
| Biggest non-technical cost? | Apple + Windows code-signing certificates and one-time CI packaging setup. |
