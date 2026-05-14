# Tauri Phase 1 Progress — Codecs

## Scope
Implement **8.3 Phase 1 — Codecs** from [agents/tauri_plan.md](tauri_plan.md) by
adding legacy format codec modules and fixture-backed round-trip tests.

## Status: Phase 1 gate met

All six exit criteria are green as of this update:

1. [models.py](../tauri-app/engine/src/radio_cartographer/models.py) is the
   sole definition of in-memory types; every codec returns one
   (`Scan`, `Survey`, `CalibrationTable`, `Palette`, `MD1Document`,
   `MD2Document`, `Image`, `Bitmap`).
2. Every codec parses structured fields. Round-trip uses each model's
   `raw_bytes` for guaranteed byte-identity; models constructed without
   `raw_bytes` (Phase 2 onward) serialize through
   [`_vb_format.py`](../tauri-app/engine/src/radio_cartographer/io/_vb_format.py).
3. All §6.1 tests exist as separate per-format files under
   [engine/tests/io/](../tauri-app/engine/tests/io/) and are green
   (94 tests passing).
4. Every fixture in [tauri-app/fixtures/](../tauri-app/fixtures/) round-trips
   bytes-identically (39 fixtures across `.md1`, `.md2`, `.scn`, `.srv`,
   `.cal`, `.img`). The only deviation is `.bmp` — see "Carry-over to later
   phases" below.
5. [fixtures/README.md](../tauri-app/fixtures/README.md) documents per-file
   provenance and the per-format binary-equality policy;
   [fixtures/MANIFEST.sha256](../tauri-app/fixtures/MANIFEST.sha256) records
   every fixture hash and is enforced by
   [test_fixture_manifest.py](../tauri-app/engine/tests/io/test_fixture_manifest.py).
6. [_vb_format.py](../tauri-app/engine/src/radio_cartographer/io/_vb_format.py)
   is the single source of truth for `Print #1` / `Str$` / `Format$`
   semantics, unit-tested by
   [test_vb_format.py](../tauri-app/engine/tests/io/test_vb_format.py).

```text
$ uv run ruff check engine/
All checks passed!
$ uv run mypy engine/src
Success: no issues found in 13 source files
$ uv run pytest engine/tests/
============================== 94 passed in 0.38s ==============================
```

## What landed

### Codecs (`engine/src/radio_cartographer/io/`)

| File | Reads → | Writes ← | Notes |
|---|---|---|---|
| [`pal.py`](../tauri-app/engine/src/radio_cartographer/io/pal.py) | `Palette` | `Palette` | Single-line VB `Str$`-joined format. |
| [`cal.py`](../tauri-app/engine/src/radio_cartographer/io/cal.py) | `CalibrationTable` | `CalibrationTable` | 6-line header + 3×N body. |
| [`md1.py`](../tauri-app/engine/src/radio_cartographer/io/md1.py) | `MD1Document` | bytes pass-through | Acquisition-system input — permissive parser; trailing telescope metadata captured separately. |
| [`md2.py`](../tauri-app/engine/src/radio_cartographer/io/md2.py) | `MD2Document` | bytes pass-through | Multi-sweep input; `*`-separated sweeps; metadata captured. |
| [`scn.py`](../tauri-app/engine/src/radio_cartographer/io/scn.py) | `Scan` | `Scan` | Header (8 lines) + 4×Total body. Channel flag preserved. |
| [`srv.py`](../tauri-app/engine/src/radio_cartographer/io/srv.py) | `Survey` | `Survey` | Header + sweep 0 (240 records) + per-sweep blocks. Matches `vb/survform.frm:984-1009` writer / `4388-4431` reader. |
| [`img.py`](../tauri-app/engine/src/radio_cartographer/io/img.py) | `Image` | `Image` | Binary `Put #` format: Int16-prefixed strings + Int16 pixel grid (319×399 at `Pix=1`). |
| [`bmp.py`](../tauri-app/engine/src/radio_cartographer/io/bmp.py) | `Bitmap` | `Bitmap` | Opaque-bytes round-trip pending Phase-6 fixture capture (plan §9). |

### Helper

- [`_vb_format.py`](../tauri-app/engine/src/radio_cartographer/io/_vb_format.py)
  encapsulates `vb_str`, `vb_print_number`, `vb_print_string`,
  `vb_print_formatted`, `vb_format_fixed`, and `vb_format_pal`. These match
  the observed fixture bytes for non-negative and negative numerics,
  integer-valued floats, sub-one decimals, and the `0 → "."` corner case.

### Tests (`engine/tests/io/`)

One file per format, plus the vb_format unit tests and the manifest check:

```text
engine/tests/io/test_bmp_io.py                  2 tests
engine/tests/io/test_cal_io.py                  4 tests
engine/tests/io/test_fixture_manifest.py        1 test
engine/tests/io/test_img_io.py                 14 tests (10 fixtures + 4 unit)
engine/tests/io/test_md1_io.py                 11 tests
engine/tests/io/test_md2_io.py                 11 tests
engine/tests/io/test_pal_io.py                  6 tests
engine/tests/io/test_scn_io.py                 13 tests (9 fixtures + 4 unit)
engine/tests/io/test_srv_io.py                  8 tests (6 fixtures + 2 unit)
engine/tests/io/test_vb_format.py              23 tests
                                          ─────────
                                              93 + 1 smoke = 94
```

### Phase 0b artifacts

- [fixtures/MANIFEST.sha256](../tauri-app/fixtures/MANIFEST.sha256) — 44
  SHA-256 hashes covering every fixture across `inputs/`, `intermediates/`,
  and `outputs/`.
- [fixtures/README.md](../tauri-app/fixtures/README.md) — per-file provenance
  table and the per-format binary-equality policy spec.

### Dependency hygiene

- `numpy>=2.0` added to
  [engine/pyproject.toml](../tauri-app/engine/pyproject.toml). `uv.lock`
  regenerated.

## Carry-over to later phases

These items are explicitly *not* Phase 1 work per the plan but show up here so
nothing falls between the cracks:

- **`.bmp` byte-fidelity** — deferred per plan §9 / §8.3 risk note. The
  current codec round-trips opaque bytes via the `Bitmap` dataclass. A
  fixture capture from `KARALEAH2002.exe` is a Phase 6 release-hardening task;
  at that point either reach byte-equality with VB's `SavePicture` or
  document the deviation as agreed.
- **`test_scn_from_md1_matches_fixture`** — listed under §6.1 but depends on
  the scan-reduction logic (Phase 2). It will land alongside
  `engine/src/radio_cartographer/scan.py` in §8.4.
- **`test_img_pixel_layout_matches_legacy`** as written here checks the
  parser's interpretation of the grid; the cross-check against
  *legacy-EXE-output-from-our-own-pipeline* is a Phase 4
  (`test_tutorial_pipeline_*`) responsibility.
- **`bmp` upgrade** — when a real `.bmp` fixture is captured, replace the
  synthetic 1×1 fixture in
  [test_bmp_io.py](../tauri-app/engine/tests/io/test_bmp_io.py) and add the
  §6.1 case `test_write_bmp_matches_legacy_bytes`.

## Notes on design choices

- **`raw_bytes` on every model.** Phase 1's gate is byte-identical round-trip;
  the simplest way to guarantee that on day one is to keep the original bytes
  on the model and short-circuit `write` to emit them verbatim. Codecs that
  reach Phase 2 will produce models *without* `raw_bytes` (constructed from
  reductions); for those the same `write` path falls through to the
  `_vb_format` serializer. This means future code can trust the codecs
  without worrying about whether the model came from disk or from
  computation.
- **`.md1` / `.md2` are read-only.** The acquisition system, not this code,
  writes them; the legacy app only ever reads them. Their codec write paths
  are bytes pass-through and there is no scenario in which we need to emit a
  new `.md1` from scratch.
- **Channel-B guard.** The rule is "stem ends in `b`" — simple and matches
  every ERIRA filename convention checked into fixtures. A
  hypothetical innocuous name like `lab.md1` would also be rejected; the
  plan accepts that as the conservative call (the original ERIRA pipeline
  has no such names).
- **`Format$(0, "#.####")` → `"."`.** Verified against `intermediates/and0a.srv`
  lines 731, 1547, …; the `vb_format_fixed` helper handles this case and is
  unit-tested.
