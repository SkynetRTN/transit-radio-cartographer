# Tauri Phase 2 Progress — Numerics

## Scope
Implement **8.4 Phase 2 — Numerics** from [agents/tauri_plan.md](tauri_plan.md):
scan/survey reductions, calibration, image gridding with WCS metadata, palette
application, and numerics test coverage under `engine/tests/numerics/`.

## Status: Phase 2 core numerics landed

The Phase 2 modules and required numerics test files are now present and green
in `engine/tests/numerics/`.

## What landed

- `engine/src/radio_cartographer/scan.py`
  - FFT (`numpy.fft`), baseline subtraction (polynomial fit), smoothing, and
    sweep alignment primitives.
- `engine/src/radio_cartographer/survey.py`
  - Sweep-level orchestration helpers for smooth/baseline/align over the
    survey Ra/Dec/Flux cube.
- `engine/src/radio_cartographer/calibration.py`
  - Linear counts→Jy fitting and calibration application.
- `engine/src/radio_cartographer/image.py`
  - Survey gridding plus explicit WCS metadata (`CTYPE/CRVAL/CRPIX/CDELT`).
- `engine/src/radio_cartographer/palette.py`
  - Flux-range mapping into RGB via palette control-point interpolation.
- `engine/src/radio_cartographer/_legacy/four1.py`
  - Test-only legacy FFT oracle shim (kept out of production call paths).
- `engine/tests/_tolerances.py`
  - Centralized tolerances for all Phase 2 numerics tests.
- Added required numerics tests:
  - `test_fft.py`, `test_baseline.py`, `test_smooth.py`, `test_align.py`,
    `test_calibrate.py`, `test_image_gridding.py`, `test_palette.py`.

## Tests passing

- `uv run pytest engine/tests/numerics -q`

## Carry-over items

- Fixture-intermediate parity checks against legacy tutorial artifacts should be
  expanded in follow-up numerics regression tests where fixture-driven
  expectations are encoded per operation.
- Phase 3 RPC, Phase 4 FITS export, and Tauri UI wiring remain intentionally
  untouched in this phase.

## Notes on design choices

- Kept production FFT path on `numpy.fft` while preserving a test-only legacy
  oracle module under `_legacy/` per plan guidance.
- Kept tolerance constants centralized in `tests/_tolerances.py`.
- Kept numerics logic under `engine/src/radio_cartographer/` only; no UI or
  RPC integration was added.

## Deviations / unresolved issues

- No intentional scope expansions beyond Phase 2.
- No RPC/FITS/UI work started.
