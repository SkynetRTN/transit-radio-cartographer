# Third-Party Software & License Inventory — Radio Cartographer

Prepared for copyright registration. Generated from the **actually-installed
package metadata** in each ecosystem (not from memory):

- **Python** — `importlib.metadata` over the project virtualenv (`tauri-app/.venv`)
- **JavaScript/TypeScript** — `license` field of every `package.json` under `tauri-app/app/node_modules` (478 packages)
- **Rust** — `cargo metadata` license field for every crate in the dependency graph (448 crates)

Generated 2026-06-08.

> **Collapsing rule used below:** one entry per **distinct project / vendor**,
> not per published package. Many packages are sub-components of a single
> project (e.g. `astropy` + `astropy-iers-data`, the dozens of `serde_*` crates,
> the `@babel/*` packages) and share one author and one license. They are listed
> once. Per-package detail remains in §4 for verification.

---

## 1. Summary

The project's own code is original work. All third-party code is obtained through
standard package managers (PyPI / npm / crates.io) and is, with the noted
exceptions, under **permissive licenses** (MIT, BSD-2/3-Clause, Apache-2.0, ISC,
Zlib, Unicode-3.0, PSF) that permit use, modification, and distribution in a
registered work provided upstream notices are retained.

**Items needing explicit attention** (details in §3):

| Item | License | Ships in product? | Note |
|---|---|---|---|
| PyInstaller (+ helpers) | GPL-2.0 **with bootloader exception** | No (build tool) | Exception explicitly permits distributing bundled apps under any license |
| Servo CSS crates (`cssparser`, `selectors`, …) | MPL-2.0 | Yes (compiled in) | File-level copyleft; used unmodified — only notice retention required |
| `@plotly/mapbox-gl` 1.13.4 + `maplibre-gl` 4.7.1 (via plotly.js) | BSD-3-Clause (confirmed from LICENSE files) | Present in bundle, **but app uses no maps** | Could be dropped via a partial plotly build — see §3 |
| Legacy VB5 source (`vb/`) | in-house (D. Reichart / NRAO-ERIRA) | No | Preexisting work the port derives from — not OSS third-party |
| `_legacy/four1.py` FFT | algorithm traceable to Numerical Recipes | Yes (engine) | Reimplementation, not copied source |

---

## 2. Simplified list (collapsed by project — recommended for submission)

### 2a. SHIPPED in the distributed application

**Python sidecar engine** (bundled by PyInstaller)

| Project | License |
|---|---|
| NumPy | BSD-3-Clause |
| Astropy *(incl. its `astropy-iers-data` data package)* | BSD-3-Clause |
| PyERFA | BSD-3-Clause |
| PyYAML | MIT |
| packaging | Apache-2.0 OR BSD-2-Clause |

**JavaScript frontend** (bundled by Vite)

| Project | License |
|---|---|
| React *(react, react-dom, scheduler, …)* | MIT |
| Plotly.js *(plotly.js, react-plotly.js, @plotly/\*)* | MIT |
| D3 *(d3-\* family)* | BSD-3-Clause |
| Mapbox GL JS v1 + Mapbox utility libs *(@mapbox/\*, @plotly/mapbox-gl 1.13.x)* | BSD-3-Clause / ISC (see §3) |
| MapLibre GL *(maplibre-gl, @maplibre/\*)* | BSD-3-Clause / ISC |
| Tauri JS API + dialog plugin | MIT OR Apache-2.0 |
| WebGL stack *(regl, gl-\*, glsl-\*)* | MIT |
| Numerous small utility libraries | MIT / ISC / BSD-2/3-Clause / Zlib / 0BSD |

**Rust desktop shell** (compiled into the binary)

| Project / vendor | License |
|---|---|
| Tauri framework *(tauri, wry, tao, muda, tray-icon, window-vibrancy, plugins, …)* | Apache-2.0 OR MIT |
| Serde *(serde, serde_json, serde_derive, serde_with, …)* | MIT OR Apache-2.0 |
| Tokio async stack *(tokio, mio, bytes, hyper, http, tower, tracing)* | MIT |
| Microsoft `windows-rs` bindings *(windows, windows-sys, windows_\*)* | MIT OR Apache-2.0 |
| Apple bindings *(objc2 family, core-foundation, core-graphics)* | MIT / (Zlib OR Apache-2.0 OR MIT) |
| gtk-rs *(glib, gtk, gdk, gio, cairo, pango, atk + -sys)* — Linux | MIT |
| ICU4X / Unicode *(icu_\*, zerovec, yoke, tinystr, …)* | Unicode-3.0 |
| Rust/WASM bindings *(wasm-bindgen, web-sys, js-sys)* | MIT OR Apache-2.0 |
| Bytecode Alliance WASM tooling *(wasmparser, wit-\*, wasm-encoder)* | Apache-2.0 WITH LLVM-exception OR Apache-2.0 OR MIT |
| Servo CSS engine *(cssparser, selectors, servo_arc)* | **MPL-2.0** (see §3) |
| Servo HTML stack *(html5ever, markup5ever, string_cache, tendril)* | MIT OR Apache-2.0 |
| rust-lang official + RustCrypto + general utility crates *(libc, log, regex, url, chrono, sha2, …)* | MIT OR Apache-2.0 (a few also offer BSD/Zlib/Unlicense) |

### 2b. BUILD / TEST only (not shipped)

| Project | License |
|---|---|
| **PyInstaller** *(+ pyinstaller-hooks-contrib, altgraph, macholib, pefile, pywin32-ctypes)* | **GPL-2.0 with bootloader exception** (helpers are MIT/BSD) |
| pytest *(pytest, pytest-cov, pluggy, iniconfig)* | MIT |
| mypy *(mypy, mypy_extensions, ast_serialize, librt)* | MIT |
| Ruff | MIT |
| coverage.py | Apache-2.0 |
| typing_extensions | PSF-2.0 |
| pathspec | MPL-2.0 |
| Pygments | BSD-2-Clause |
| colorama | BSD-3-Clause |
| setuptools | MIT |
| TypeScript | Apache-2.0 |
| Vite + Rollup + esbuild | MIT |
| Vitest | MIT |
| Babel *(@babel/\*)* | MIT |
| webpack | MIT |
| jsdom | MIT |
| Testing Library *(@testing-library/\*)* | MIT |
| DefinitelyTyped type stubs *(@types/\*)* | MIT |
| Numerous small build/test utility libraries | MIT / ISC / BSD / Apache-2.0 |

---

## 3. Items needing attention in the registration

1. **PyInstaller (GPL-2.0).** Used only to package the Python sidecar into a
   binary; not part of the registered source. It carries an explicit
   *bootloader/runtime exception* allowing bundled applications to be distributed
   under any terms, including proprietary. No GPL obligation on the work.

2. **MPL-2.0 crates** (Servo CSS: `cssparser`, `selectors`, `dtoa-short`,
   `servo_arc`; plus `option-ext`) are compiled into the desktop binary. MPL-2.0
   is *file-level* copyleft: it covers only modifications to those crates' own
   files and imposes nothing on surrounding original code. Used unmodified, the
   only obligation is to retain their notices.

3. **Mapbox / MapLibre GL (via plotly.js).** plotly.js@2.35 depends on both
   `@plotly/mapbox-gl` 1.13.4 (legacy `*mapbox` traces) and `maplibre-gl` 4.7.1
   (new `*map` traces). Their LICENSE files were read directly and are **both
   BSD-3-Clause** — the v1.13 Mapbox code predates the v2.0 proprietary relicense,
   so this is *not* the closed-source Mapbox. **The application uses no map
   features** (no map trace types appear in the source); this code is present
   only because the app imports the full `plotly.js-dist-min` bundle. Switching
   to a partial bundle (e.g. `plotly.js-basic-dist-min`) would remove Mapbox,
   MapLibre, and the associated `@mapbox/*` / `d3-geo` dependencies from the
   shipped product entirely.

4. **Legacy VB5 source (`vb/`)** — original "Radio Cartographer" by
   **Daniel E. Reichart (1996–1997)**, ERIRA / NRAO Green Bank. The modern code
   is a port/derivative. This is *preexisting in-house material*, not
   open-source third-party code; describe the relationship and the new
   authorship boundary in the filing.

5. **`tauri-app/engine/src/radio_cartographer/_legacy/four1.py`** is a
   test-only reimplementation of the `four1` Cooley-Tukey FFT, translated from
   the legacy VB which used the **Numerical Recipes** trigonometric recurrence.
   The algorithm is not copyrightable and this is a fresh implementation (not
   copied source); disclosed for completeness.

---

## 4. Per-package detail (verification reference)

The collapse in §2 is derived from full, verified per-package data:

- **Python:** 26 installed distributions (5 shipped projects + dev tooling).
- **JavaScript:** 478 packages in `node_modules`. Predominantly **MIT**, plus
  ISC, BSD-2/3-Clause, Apache-2.0, Zlib, 0BSD, BlueOak-1.0.0 (isexe, sax),
  MIT-0, Unlicense (mumath), CC-BY-4.0 (caniuse-lite, dev data). Two state
  "SEE LICENSE IN LICENSE.txt" (mapbox-gl 1.13.3, @plotly/mapbox-gl); two state
  no license field (@mapbox/jsonlint-lines-primitives, stack-trace).
  **No GPL/LGPL/MPL in the JS tree.**
- **Rust:** 448 crates. SPDX breakdown:
  ```
  211  MIT OR Apache-2.0          4  Unlicense OR MIT
  100  MIT                        3  Apache-2.0/MIT
   33  Apache-2.0 OR MIT          2  Apache-2.0
   20  MIT/Apache-2.0             2  BSD-3-Clause
   18  Unicode-3.0                2  BSD-3-Clause OR MIT OR Apache-2.0
   17  Zlib OR Apache-2.0 OR MIT  2  MIT OR Apache-2.0 OR LGPL-2.1-or-later (permissive option)
   13  Apache WITH LLVM-exc/...   2  MIT OR Apache-2.0 OR Zlib
    5  MPL-2.0  (ships)           2  Unlicense/MIT
                                  + 12 single-crate combos (Zlib, ISC, CC0, etc.)
  ```
  No pure GPL/LGPL/AGPL crate is compiled into the product; the only copyleft is
  MPL-2.0 (file-level).

To regenerate the full per-package tables, see §5.

---

## 5. How to regenerate

```
# Python (installed distributions + licenses)
tauri-app/.venv/Scripts/python.exe -c "import importlib.metadata as m; [print(d.metadata['Name'], d.metadata['Version'], d.metadata['License-Expression'] or d.metadata['License']) for d in m.distributions()]"

# Rust (no extra tooling needed)
cargo metadata --format-version 1 --manifest-path tauri-app/app/src-tauri/Cargo.toml

# JavaScript (license field of every installed package.json)
node -e "/* walk tauri-app/app/node_modules, read each package.json .license */"
```

For a formal attribution bundle **with full license texts**, install and run
`cargo about` (Rust), `license-checker` (npm), and `pip-licenses` (Python).
