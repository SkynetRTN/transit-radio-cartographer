# Tauri Phase 2 Progress — Numerics

## Scope
Implement **8.4 Phase 2 — Numerics** from [agents/tauri_plan.md](tauri_plan.md):
`survey.py`, `scan.py`, `calibration.py`, `image.py`, `palette.py`, plus
§6.2 numerics tests.

## Status: Phase 2 gate met

- Phase 2 production modules now exist under
  `tauri-app/engine/src/radio_cartographer/`.
- Required numerics tests from the plan are present under
  `tauri-app/engine/tests/numerics/` and passing.
- `image.py` now returns WCS metadata (`CTYPE*`, `CRVAL*`, `CRPIX*`, `CDELT*`)
  alongside the pixel grid through the `Image` dataclass.
- Tolerances are centralized in `tauri-app/engine/tests/_tolerances.py`.
- A test-only legacy FFT oracle exists at
  `tauri-app/engine/tests/_legacy/four1.py`; production FFT uses `numpy.fft`.

## What landed

- `scan.py`: FFT, baseline subtraction, smoothing, declination alignment for
  single-sweep reductions.
- `survey.py`: sweep-level reduction wrappers and survey-level application.
- `calibration.py`: gain fitting and counts→Jy conversion primitives.
- `image.py`: survey gridding and WCS derivation.
- `palette.py`: palette interpolation and RGB mapping.
- `models.py`: `Image` extended with a `wcs` field for downstream FITS export.
- New tests:
  - `test_fft.py`
  - `test_baseline.py`
  - `test_smooth.py`
  - `test_align.py`
  - `test_calibrate.py`
  - `test_image_gridding.py`
  - `test_palette.py`

## Tests passing

```text
uv run pytest engine/tests/numerics
```

## Carry-over items

- Phase 3 (RPC), Phase 4 (FITS export), and UI work remain intentionally
  untouched.
- Additional fixture-intermediate parity expansion can continue by extending the
  numerics tests with more tutorial fixture checkpoints if needed.

## Design notes

- Existing dataclasses in `models.py` remain the lingua franca.
- Numerics code lives in `radio_cartographer/` as scoped by the plan.
- Dependencies remain minimal; `numpy` is used for production numerics.

## Deviations / unresolved issues

- No intentional scope deviations from Phase 2 were introduced.
