import numpy as np

from radio_cartographer.calibration import calibrate_flux, fit_counts_to_jy
from radio_cartographer.models import CalibrationEntry, CalibrationTable
from tests._tolerances import CALIBRATION_ATOL


def _table() -> CalibrationTable:
    return CalibrationTable("c", "", "", 10.0, 20.0, (CalibrationEntry("a", 1.0, 2.0), CalibrationEntry("b", 2.0, 4.0)))


def test_fit_counts_to_jy_is_linear() -> None:
    slope, intercept = fit_counts_to_jy(_table().entries)
    np.testing.assert_allclose([slope, intercept], [2.0, 0.0], atol=CALIBRATION_ATOL)


def test_calibration_converts_counts_to_jy() -> None:
    out = calibrate_flux(np.array([0.0, 1.5, 3.0]), _table())
    np.testing.assert_allclose(out, np.array([0.0, 3.0, 6.0]), atol=CALIBRATION_ATOL)
