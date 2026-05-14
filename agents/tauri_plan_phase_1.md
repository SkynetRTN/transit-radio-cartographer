# Tauri Phase 1 Progress — Codecs

## Scope
Implement **8.3 Phase 1 — Codecs** from [agents/tauri_plan.md](tauri_plan.md) by
adding legacy format codec modules and fixture-backed round-trip tests.

## Progress Log
- [x] Added codec module package: `radio_cartographer.io`.
- [x] Implemented baseline read/write codecs for `.md1`, `.md2`, `.scn`, `.srv`,
  `.img`, `.cal`, `.pal`.
- [x] Added channel-B filename guardrails for `.md1` and `.md2` readers.
- [x] Added fixture-backed byte-identity round-trip tests for the seven formats
  above (single bundled file: [tauri-app/engine/tests/io/test_phase1_roundtrip.py](../tauri-app/engine/tests/io/test_phase1_roundtrip.py)).
- [ ] Implement `.bmp` writer compatibility tests.
- [ ] Implement FITS writer and validation tests (deferred to Phase 4 by plan).
- [ ] Expand parsers from raw round-trip wrappers into structured typed models.

---

## Review against [agents/tauri_plan.md](tauri_plan.md) §8.3 and §6.1

The current implementation **does not yet clear the Phase 1 gate** as specified.
What landed is a placeholder pass-through layer that proves Python can copy bytes
verbatim; it does not yet *parse, model, or validate* any of the formats. The
work is a reasonable scaffold but several deliverables that the plan explicitly
names as "definition of done" or "tests written first" are missing.

### Problems

#### P1. Codecs are byte pass-throughs, not codecs
Every module — [md1.py](../tauri-app/engine/src/radio_cartographer/io/md1.py),
[md2.py](../tauri-app/engine/src/radio_cartographer/io/md2.py),
[scn.py](../tauri-app/engine/src/radio_cartographer/io/scn.py),
[srv.py](../tauri-app/engine/src/radio_cartographer/io/srv.py),
[img.py](../tauri-app/engine/src/radio_cartographer/io/img.py),
[cal.py](../tauri-app/engine/src/radio_cartographer/io/cal.py),
[pal.py](../tauri-app/engine/src/radio_cartographer/io/pal.py) — wraps
`Path.read_bytes()` / `Path.write_bytes()` and stores `raw_bytes` in a frozen
dataclass. None of them parse fields, validate structure, or produce typed
domain objects. The plan's gate (§8.3) explicitly requires `read(path) -> Model`
returning a typed model, with `models.py` as "the only place the in-memory
types are defined." Today every codec invents its own throwaway `*Document`
dataclass and no domain model exists.

#### P2. `models.py` is absent
§8.3 step 5 says: "write `engine/src/radio_cartographer/models.py` defining the
typed dataclasses each codec returns (`Sweep`, `Survey`, `Scan`,
`CalibrationTable`, `Palette`, `Image`). These are the lingua franca for §8.4."
Phase 2 numerics cannot start without it; the file does not exist.

#### P3. Round-trip equality is trivially true
A test that does `write_bytes(read_bytes(path))` and asserts byte-equality is
verifying the filesystem and Python's `bytes`, not the codec. The Phase 1 gate
("round-trip bytes-identical for every fixture") is meant to be a strong claim
*because* the codec parsed the file into a structured form and serialized it
back. As written today, the test would pass against any well-formed or
*malformed* file, including a corrupted or unrelated file copied into the
fixtures directory.

#### P4. §6.1 test surface is largely unimplemented
The plan enumerates per-format test files
([test_md1_io.py], [test_md2_io.py], [test_scn_io.py], [test_srv_io.py],
[test_img_io.py], [test_cal_io.py], [test_pal_io.py], [test_bmp_io.py]) with
specific assertions beyond round-trip. None of them exist. Missing cases:

- **md1**: sample count, first/last RA/Dec/flux, malformed-truncated-file
  graceful error, full-tutorial flux checksum.
- **md2**: sweep count, samples-per-sweep, Ra/Dec/Flux cube shape, per-sweep
  flux checksum, `float64` dtype guard.
- **scn**: `read → write → bytes identical` per fixture (currently only two
  fixtures parametrized — `cyg0a.scn`, `cas0a.scn` — out of the nine `.scn`
  files in `intermediates/`); reduction-from-`.md1` consistency.
- **srv**: same coverage gap (two fixtures out of nine), plus the
  carries-calibration-state test.
- **img**: pixel-layout-matches-legacy (currently only one fixture out of ten).
- **cal**: known-source Jy constants (Virgo A = 213, Tau A = 942, Cyg A = 1581).
- **pal**: no fixture used at all — the test creates a 20-byte sample inline
  in `tmp_path`; the up-to-100 control-points boundary is untested.
- **bmp**: no codec, no tests.

#### P5. `.bmp` codec missing
§8.3 step 2 lists `.bmp` in the Phase 1 implementation order
(`pal → cal → md1 → md2 → scn → srv → img → bmp`). It is the highest-risk codec
per §9 and §8.3's risk note ("if it proves infeasible after a week of effort,
downgrade to ..."). It is absent: no `io/bmp.py`, no `test_bmp_io.py`. Phase 1
cannot exit without either an implementation or a documented downgrade.

#### P6. No `_vb_format.py` helper for `Print #1` semantics
§8.3 step 3: "match VB's `Print #1` text semantics exactly — leading space for
positive numbers, `0` not `0.0`, CRLF unconditionally on text formats. Encode
this as a small `_vb_format.py` helper used by every text codec, not
copy-pasted." Since no codec actually *writes* numbers (they only re-emit the
bytes they read), this helper has no callers and is trivially satisfied — but
the moment any codec is upgraded to write structured output, the absence will
bite. The helper plus its own unit tests should land before the first text
codec is written for real.

#### P7. Channel-B guard is filename-only and has a coverage gap
[common.py:33-36](../tauri-app/engine/src/radio_cartographer/io/common.py#L33-L36)
rejects paths whose name ends with `b.md1` / `b.md2`. Two issues:

- The guard rejects only at the `read_md1` / `read_md2` boundary. The plan
  (§6.1) says "a `…b.md1` filename should not be openable via 'New Scan'" —
  i.e., a UI-level constraint. Refusing at the codec layer is fine as long as
  it is documented (currently it is not) and as long as the codec can still be
  used by upstream tooling that legitimately needs to read B-channel bytes.
  Note that B-channel intermediates already exist in fixtures
  (`mw_08b.scn`, `mw_67b.scn`, `pulsar1b.scn`, `and0b.srv`,
  `and0_b.3.srv`) — which were produced from B-channel inputs somehow.
- The substring test (`endswith("b.md1")`) will misclassify innocuous names
  like `lab.md1` or `rgb.md1`. Switch to a stem check
  (`Path(path).stem.lower().endswith("b")`).

#### P8. Test consolidation diverges from the plan
The plan calls for one test file per format under
[tauri-app/engine/tests/io/](../tauri-app/engine/tests/io/) so each format can
grow its own assertion set independently. Today there is a single
`test_phase1_roundtrip.py` covering all seven. Splitting now (while the file
is small) is much cheaper than splitting later.

#### P9. Phase 0b artifacts are missing
The plan (§8.2) calls Phase 0b "definition of done" complete only when:
- `fixtures/README.md` documents provenance per file.
- `fixtures/MANIFEST.sha256` matches reality and CI enforces it.

Neither exists in [tauri-app/fixtures/](../tauri-app/fixtures/). Phase 1
technically depends on Phase 0b (§8.0 dependency column), so this should be
closed out before Phase 1 is called complete.

#### P10. Inconsistent dataclass surface
[io/__init__.py](../tauri-app/engine/src/radio_cartographer/io/__init__.py)
re-exports `TextDocument` from `scn`, then again as `SRVDocument` (aliased),
then again as `CALDocument`, then `PALDocument`. They are all the same
`TextDocument` class from `common.py` — the aliases give a false impression of
distinct types. Once `models.py` lands (P2) this collapses naturally; in the
meantime it should be either truly distinct subclasses (with a discriminator
field) or simply re-exported once.

#### P11. Missing dependency surface in `engine/pyproject.toml`
[engine/pyproject.toml](../tauri-app/engine/pyproject.toml) declares
`dependencies = []`. Phase 1 codecs do not yet need numpy, but the moment
parsing lands (P1), `numpy` is required by md2's RA/Dec/Flux cube
(§6.1 `test_cube_dtype_is_float64`). Add it with `uv add --package engine
numpy` when starting real parsing rather than in a later phase.

---

## Improvement Plan

Execute in this order. Each step ends with a green test suite.

### Step 1 — Close Phase 0b gaps (unblocks Phase 1 exit)
- Add [tauri-app/fixtures/README.md](../tauri-app/fixtures/README.md)
  documenting the provenance of every checked-in fixture (which legacy EXE
  build, which input, which menu sequence produced it).
- Generate [tauri-app/fixtures/MANIFEST.sha256](../tauri-app/fixtures/MANIFEST.sha256)
  and a CI check that re-verifies it on every run.
- Decide and document per-format binary-equality policy (CRLF vs LF, leading
  spaces, trailing whitespace). This becomes the spec the codec tests encode.

### Step 2 — Introduce `models.py`
- Create [engine/src/radio_cartographer/models.py](../tauri-app/engine/src/radio_cartographer/models.py)
  with `Sweep`, `Survey`, `Scan`, `CalibrationTable`, `Palette`, `Image`,
  `Bitmap` dataclasses. Use `numpy.ndarray` for bulk numerics; document
  expected dtype and shape in each dataclass docstring.
- Delete the per-module `*Document` dataclasses and `common.TextDocument` /
  `common.BinaryDocument` once they are no longer the codec's return type.

### Step 3 — Split tests one file per format
Replace [test_phase1_roundtrip.py](../tauri-app/engine/tests/io/test_phase1_roundtrip.py)
with the file structure §6.1 specifies:
```
tauri-app/engine/tests/io/
├── test_md1_io.py
├── test_md2_io.py
├── test_scn_io.py
├── test_srv_io.py
├── test_img_io.py
├── test_cal_io.py
├── test_pal_io.py
└── test_bmp_io.py
```
Each file lists the full §6.1 case set, starting red. Run them red, then move
to Step 4.

### Step 4 — Add `_vb_format.py` helper plus unit tests
- [engine/src/radio_cartographer/io/_vb_format.py](../tauri-app/engine/src/radio_cartographer/io/_vb_format.py)
  exposes `format_number(x: float) -> str` matching VB `Print #1` exactly
  (leading space for non-negatives, `0` not `0.0`, signed exponent format),
  plus `vb_write(stream, *fields)` joining with single spaces and CRLF.
- [engine/tests/io/test_vb_format.py](../tauri-app/engine/tests/io/test_vb_format.py)
  unit-tests the helper against hand-built strings — no fixtures yet.

### Step 5 — Real codec implementations, in dependency order
Per §8.3 step 2: `pal → cal → md1 → md2 → scn → srv → img → bmp`. For each:
1. Make the per-format tests in `tests/io/` red against the new model.
2. Write the parser to return the typed model from Step 2.
3. Write the serializer using the helper from Step 4.
4. Round-trip ⇒ green; then add the §6.1 assertions (sample counts, checksums,
   pixel-layout, known-source Jy constants, etc.); green again.

### Step 6 — `.bmp` decision point
Per §9: budget one week on byte-exact `.bmp`. If infeasible, downgrade to
"round-trips through Pillow + opens in Windows Photo Viewer" and record the
deviation in `fixtures/README.md`. Either way, `test_bmp_io.py` must be green
before Phase 1 exits.

### Step 7 — Channel-B guard cleanup
- Replace the substring test in [common.py](../tauri-app/engine/src/radio_cartographer/io/common.py#L33-L36)
  with a stem-based check.
- Add a UI-layer note in `engine/PROTOCOL.md` (created in Phase 3) so the
  front-end knows the constraint is enforced server-side.
- Add tests for the false-positive cases (`lab.md1`, `rgb.md1`) and the
  true-positive cases already exercised.

### Step 8 — Dependency hygiene
Run `uv add --package engine numpy` once the md2 parser starts returning a
cube; commit the updated `uv.lock`.

---

## Phase 1 Exit Criteria (restated)

Phase 1 is done when **all** of the following hold:

1. [models.py](../tauri-app/engine/src/radio_cartographer/models.py) is the
   sole definition of in-memory types; every codec returns one.
2. Every codec parses and serializes structured fields (no `raw_bytes`
   pass-throughs).
3. All §6.1 tests exist, one file per format, and are green.
4. Every fixture in [tauri-app/fixtures/](../tauri-app/fixtures/) round-trips
   bytes-identically — or the deviation is documented in `fixtures/README.md`
   (currently allowed only for `.bmp`).
5. `fixtures/README.md` and `fixtures/MANIFEST.sha256` exist; CI verifies the
   manifest.
6. `_vb_format.py` is the single source of truth for VB `Print #1` semantics.

Until those six conditions are met, Phase 1 is in-progress, not complete.
