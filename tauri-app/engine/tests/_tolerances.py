FFT_ATOL = 1e-9
BASELINE_ATOL = 1e-6
SMOOTH_RTOL = 1e-2
ALIGN_ATOL = 5e-2
CALIBRATION_RTOL = 1e-6
IMAGE_ATOL = 1e-6

# Pipeline tolerances vs. legacy `.scn` fixtures. The legacy `Calibrate Scan`
# and `Baseline Source` operations carry quirks (in-place VB array shifting
# during cal, drag-endpoint-defined baseline) that we approximate rather than
# reproduce bit-for-bit — see `test_scan_pipeline.py` for the gap analysis.
SCAN_CAL_RTOL = 1e-2  # ~1% systematic gain offset between our cal and legacy
SCAN_BASELINE_ATOL = 0.5  # Jy; legacy uses drag endpoints, we use LS fit
