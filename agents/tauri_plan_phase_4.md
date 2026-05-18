# Radio Cartographer — Phase 4 Implementation Notes

## Scope
Implement **8.6 Phase 4 — Pipeline glue + FITS export** from `agents/tauri_plan.md`.

## Summary
Phase 4 adds explicit headless tutorial-pipeline orchestration for scan/survey workflows, introduces write-only FITS export with WCS headers sourced from Phase 2 image metadata, and wires `export_fits` through the JSON-RPC sidecar.

## Files added or changed
- `tauri-app/engine/src/radio_cartographer/io/fits.py` (new)
- `tauri-app/engine/src/radio_cartographer/io/__init__.py`
- `tauri-app/engine/src/radio_cartographer/survey.py`
- `tauri-app/engine/src/radio_cartographer/scan.py`
- `tauri-app/engine/src/radio_cartographer/rpc.py`
- `tauri-app/engine/PROTOCOL.md`
- `tauri-app/engine/tests/io/test_fits_io.py` (new)
- `tauri-app/engine/tests/pipeline/test_tutorial_pipeline_scan.py` (new)
- `tauri-app/engine/tests/pipeline/test_tutorial_pipeline_survey.py` (new)
- `tauri-app/engine/tests/pipeline/test_tutorial_pipeline_fits_export.py` (new)

## Tests added or updated
- Added FITS unit tests for file validity, WCS header presence, array-shape consistency, and Astropy reopen/verify.
- Added headless pipeline tests for tutorial-style scan/survey flows and FITS export integration.

## Pipeline glue implemented
- `run_tutorial_scan_pipeline(...)` in `scan.py`:
  - loads `.md1`
  - applies calibration
  - optionally applies off-source baseline subtraction using mask
  - returns reduced `Scan`
- `run_tutorial_survey_pipeline(...)` in `survey.py`:
  - loads `.md2`
  - applies `.cal` gain
  - applies optional scripted cuts
  - baselines/smooths/baselines/alignment in tutorial order
  - returns reduced `Survey` and `GriddedImage`

## FITS export implementation details
- Added write-only exporter `write_fits(image, path)`.
- Uses `astropy.wcs.WCS` and `astropy.io.fits.PrimaryHDU`.
- Writes image pixels as float32 and emits WCS header from Phase 2 `GriddedImage.wcs`.
- Enforces FITS output verification via `output_verify="exception"`.

## RPC changes
- `export_fits` now implemented in `rpc.py`.
- Accepts survey handle + output path.
- Grids the survey via `make_image`, writes FITS, and returns structured metadata (`ok`, `path`, `shape`).
- Returns structured errors for invalid handle, missing params, and I/O failures.

## WCS/FITS convention notes
- WCS header uses TAN celestial axes (`RA---TAN`, `DEC--TAN`).
- `CRVAL*`, `CRPIX*`, `CDELT*` are sourced from Phase 2 WCS metadata (not recomputed).
- FITS `CRPIX` is 1-indexed by convention; the writer preserves the already FITS-oriented values from `make_image`.

## Deviations from plan
- The scan/survey pipeline tests assert numerical/structural compatibility with fixtures and workflow outputs rather than strict full byte identity for every generated artifact.
- FITS export is wired from survey handles (server-side image creation) rather than requiring a distinct image handle lifecycle.

## Verification commands and results
- `uv run pytest engine/tests` ✅
- `uv run ruff check .` ✅
- `uv run mypy engine/src` ✅

## Remaining risks / follow-up
- Tightening tutorial survey replay assertions to pixel-parity against a one-to-one `.md2`→`.img` fixture chain can be added once exact per-step cut scripts are formalized in fixtures metadata.
- Optional future RPC expansion: expose explicit image handles for multi-export workflows.
