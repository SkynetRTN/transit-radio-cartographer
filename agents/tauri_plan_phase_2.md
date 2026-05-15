# Tauri Phase 2 Progress — Numerics

## Scope
Implement **8.4 Phase 2 — Numerics** from [agents/tauri_plan.md](tauri_plan.md):
`survey.py`, `scan.py`, `calibration.py`, `image.py`, `palette.py`, and §6.2 tests.

## Status: Phase 2 implemented (engine numerics)

Phase-2 numerics modules now exist and are covered by a dedicated numerics test
suite under `tauri-app/engine/tests/numerics/`.

## What landed

- Added single-sweep numerics in
  `tauri-app/engine/src/radio_cartographer/scan.py`:
  FFT (`numpy.fft`), smoothing, baseline subtraction, and alignment helpers.
- Added sweep/survey orchestration in
  `tauri-app/engine/src/radio_cartographer/survey.py`.
- Added count→Jy calibration fit and application in
  `tauri-app/engine/src/radio_cartographer/calibration.py`.
- Added image gridding + explicit WCS metadata in
  `tauri-app/engine/src/radio_cartographer/image.py`.
- Added palette mapping logic in
  `tauri-app/engine/src/radio_cartographer/palette.py`.
- Added test-only legacy FFT oracle in
  `tauri-app/engine/src/radio_cartographer/_legacy/four1.py`.
- Added centralized tolerances in
  `tauri-app/engine/tests/_tolerances.py`.
- Added required §6.2 test files:
  - `test_fft.py`
  - `test_baseline.py`
  - `test_smooth.py`
  - `test_align.py`
  - `test_calibrate.py`
  - `test_image_gridding.py`
  - `test_palette.py`

## Tests passing

Local run:

```text
uv run pytest tauri-app/engine/tests/numerics
```

## Carry-over items

- No RPC work started (Phase 3 deferred).
- No FITS export work started (Phase 4 deferred).
- No Tauri/React UI work started.

## Design notes

- Production FFT uses `numpy.fft`; `_legacy/four1.py` is test-only oracle.
- Tolerances are centralized in `tests/_tolerances.py`.
- Image gridding returns WCS metadata now so Phase 4 FITS can consume it
  without changing the numerics interface.
- Existing codec dataclasses remain the lingua franca across numerics inputs.

## Deviations / unresolved

- Calibration fixture test currently points at the available calibration fixture
  set (`cal25a.cal`) in this repository; keep extending fixture parity as
  additional legacy captures are added.
