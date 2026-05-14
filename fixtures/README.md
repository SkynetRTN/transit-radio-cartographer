# Tauri-app fixtures

Golden test data for the Radio Cartographer codec, numerics, and pipeline test
suites. These files are the regression oracle for backward compatibility with
the legacy VB5 application — see [agents/tauri_plan.md](../../agents/tauri_plan.md)
§4 and §8.2 for the strategy and §6.1 for what the tests assert.

`MANIFEST.sha256` records the SHA-256 of every fixture and is enforced by CI
(`shasum -a 256 -c MANIFEST.sha256`). Any change to a fixture file must be
accompanied by a manifest update in the same commit; an accidental edit
otherwise turns the CI red, by design.

## Layout

```
fixtures/
├── inputs/          # raw telescope input — never produced by the app
├── intermediates/   # reduced files emitted by the legacy app mid-pipeline
└── outputs/         # final artifacts emitted by the legacy app
```

## File-by-file provenance

The legacy authority for every byte in this tree is `vb/KARALEAH2002.exe`
running on Windows (10 x64 VM is sufficient). The "menu sequence" column
records what was clicked to produce that file. Where the field reads
"external", the file came off the telescope acquisition pipeline directly
(`.md1` and `.md2` are raw input formats that the app reads but does not
write).

> **Status note.** A subset of these fixtures (the ERIRA 2025 dataset) was
> captured from the legacy EXE on 2026-05-12 for Phase 0b. The remainder were
> imported from earlier ERIRA cohorts in `vb/` test data; their exact menu
> provenance has not yet been re-confirmed against the tutorial PDF. The
> SHA-256 manifest is authoritative for byte-equality; provenance refinements
> are tracked as a follow-up.

### `inputs/` — raw telescope data

| File | Format | Channel | Notes |
|---|---|---|---|
| `and0a.md2` | survey | A | Andromeda survey, A channel. Source for tutorial-style reductions. |
| `cal25a.cal` | calibration | A | A-channel calibration table, ERIRA 2025 cohort. Contains the Cyg A = 1581 Jy known-source constant. |
| `cal25b.cal` | calibration | B | B-channel calibration — present for completeness; the app warns users not to use B-channel calibration files. |
| `cas0a.md1` | scan | A | Cassiopeia scan, A channel. |
| `cassioa.md2` | survey | A | Cassiopeia survey. |
| `centera.md2` | survey | A | Galactic centre survey. |
| `cyg0a.md1` | scan | A | Cygnus A scan, A channel. Pairs with `intermediates/cyg0a.scn`. |
| `cygnus1a.md2` | survey | A | Cygnus survey #1. |
| `cygnus2a.md2` | survey | A | Cygnus survey #2. |
| `jupiter00a.md2` | survey | A | Jupiter survey, A channel. |
| `moon0a.md1` | scan | A | Moon scan, A channel. Smallest checked-in `.md1` (4688 lines) — useful as the "minimal" fixture for `test_md1_io.py`. |
| `morningb.md2` | survey | **B** | Morning B-channel survey. Exists deliberately so `test_md2_io.test_rejects_b_channel_filename` has a fixture to point at. |
| `mw_08b.md1` | scan | **B** | Milky Way scan, B channel. Used by `test_md1_io.test_rejects_b_channel`. |
| `mw_67b.md1` | scan | **B** | Milky Way scan, B channel. |
| `pulsar1b.md1` | scan | **B** | Pulsar scan, B channel. |

### `intermediates/` — reductions emitted by the legacy EXE

Every file here was written by `vb/KARALEAH2002.exe` at some midpoint of the
Survey or Scan workflow. They are the by-byte oracle for the corresponding
codec's `write` path.

| File | Format | Notes |
|---|---|---|
| `and0a.srv` | survey | Reduced Andromeda survey, A channel. |
| `and0b.srv` | survey | Reduced Andromeda survey, B channel — present so the test suite can verify B-channel survey serialization is byte-identical. |
| `and0_a.3.srv` / `and0_b.3.srv` | survey | Andromeda survey saved at a third reduction step (post-baseline). The `.3` infix is the legacy EXE's quirk: it appends `_3` (or similar) to disambiguate intermediate saves. |
| `cas0a.scn` | scan | Reduced Cassiopeia scan. |
| `cyg0a.scn` | scan | Final reduced Cygnus A scan. Header carries channel=`A`, peak label, MinDec/MaxDec/MinFlux/MaxFlux, Total record count. |
| `cyg0abaseline.scn` | scan | Cygnus scan after baseline subtraction only (pre-cut). |
| `cyg0adec.scn` | scan | Cygnus scan after declination correction. |
| `cyg0afull.scn` | scan | Full Cygnus reduction (all steps). |
| `jupiter0.srv` | survey | Reduced Jupiter survey. |
| `moon0a.scn` | scan | Reduced Moon scan. |
| `mw_08b.scn`, `mw_67b.scn`, `pulsar1b.scn` | scan | B-channel reductions — paired with the matching B-channel `.md1` inputs above. Confirms the legacy EXE *does* produce `.scn` files from B-channel `.md1` even though the tutorial discourages it. |
| `sun0a.srv`, `sun(1)_a.srv` | survey | Sun surveys. The parenthetical `(1)` is the legacy filename verbatim — preserved to exercise codecs against unusual names. |
| `test_a.srv`, `testa.srv` | survey | Small synthetic surveys, useful as smoke fixtures. |
| `virgo_a..srv` | survey | Note the double-dot — also legacy filename verbatim. Useful to confirm filename handling does not strip extensions. |

### `outputs/` — final products

These are `.img` (gridded survey image) files emitted from the legacy
`Make Image → Save Image As…` flow. The format is binary: a sequence of
length-prefixed strings for the header and palette, followed by a 2-D grid of
`Int16` color indices. See [tauri-app/engine/src/radio_cartographer/io/img.py](../engine/src/radio_cartographer/io/img.py)
and the read code in `vb/survform.frm:4632-4749` for the wire format.

| File | Notes |
|---|---|
| `cassio_a.img` | Cassiopeia image. |
| `center_a.img` | Galactic-centre image. |
| `crab_a.img` | Crab Nebula image. |
| `cygnus_a.img` | Cygnus A image — tutorial canonical output. |
| `erira2025.img` | Composite image used in the ERIRA 2025 cohort. |
| `morning_a.img` | Morning survey image. |
| `orion_a.img` | Orion image. |
| `spur_a.img` | Spur image (galactic plane feature). |
| `sun_a.img` | Sun image. |
| `virgo_a.img` | Virgo A image. Pairs with `intermediates/virgo_a..srv`. |

## Binary-equality policy (per format)

Phase 0b decision recap (§8.2 step 6), pinned here so the codec tests have an
unambiguous spec:

| Format | Line endings | Number representation | Other |
|---|---|---|---|
| `.md1` | CRLF (raw input — never re-emitted) | `Val()`-readable text, one number per line; record separator `"*"`-only lines | We read but never write `.md1`. |
| `.md2` | CRLF (raw input — never re-emitted) | As above, with one `"*"` line per sweep terminator | We read but never write `.md2`. |
| `.scn` | CRLF unconditionally on every line | Header strings as-is; integers via VB `Print #1` (leading space + trailing space); floats via `Format$(x, "#.####")` (no surrounding spaces); declination/min/max likewise but `"#.##"` for some fields | Channel flag is literally `"A"` or `"B"`. |
| `.srv` | CRLF unconditionally | Same as `.scn` for the body. Header has Label1.Caption (Windows path string, may contain backslashes), Label2.Caption (source name), then `SwpCnt%` and `Swp%` integers, then per-sweep blocks. | Some legacy writers emit a leading-zero-stripped value (`.3401` not `0.3401`); the helper matches VB's `Format$(_, "#.####")` rule. |
| `.cal` | CRLF unconditionally | Caption strings as-is; numeric body via `Print #1` (surrounding spaces) | Empty `Label2.Caption` produces an empty line (CRLF only). |
| `.pal` | CRLF unconditionally (file is one line + CRLF) | All numbers via `Str$(x)` (leading space for non-negatives), separated by single spaces; entire payload `Print #1`ed on a single line | Trailing space before CRLF is part of the format. |
| `.img` | n/a — binary mode (`Open … For Binary`) | Length-prefixed strings: `Int16` length followed by ASCII bytes. Pixel grid: row-major `Int16` per pixel. | No line endings inside the file. The legacy EXE re-opens the file `For Output` first to truncate, then `For Binary` to write — produces no BOM, no trailing pad. |
| `.bmp` | n/a — binary BMP | VB's `SavePicture` writes a 24-bit `BI_RGB` BMP with no colour table. | Byte-fidelity here is fragile; see Phase 1 risk note in `tauri_plan.md` §9. |

Anything not in this table is undocumented and a regression. Add a row before
adding a deviation.

## Verifying the manifest

```bash
cd fixtures
shasum -a 256 -c MANIFEST.sha256
```

CI runs the equivalent on every push.

## Adding a new fixture

1. Capture the file from `KARALEAH2002.exe` on a Windows VM.
2. Place it under the appropriate subdirectory.
3. Re-generate the manifest:
   ```bash
   cd fixtures
   {
     (cd inputs && shasum -a 256 *) | awk '{print $1"  inputs/"$2}'
     (cd intermediates && shasum -a 256 *) | awk '{print $1"  intermediates/"$2}'
     (cd outputs && shasum -a 256 *) | awk '{print $1"  outputs/"$2}'
   } > MANIFEST.sha256
   ```
4. Add a row in the table above documenting the provenance.
5. Add or extend the matching codec test in
   [tauri-app/engine/tests/io/](../engine/tests/io/).
