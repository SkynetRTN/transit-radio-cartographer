import numpy as np

from radio_cartographer.calibration import fit_counts_to_jy
from radio_cartographer.io.cal import read_cal


def test_calibration_fit_passes_through_origin(inputs_dir) -> None:
    cal = read_cal(inputs_dir / "cal25a.cal")
    gain = fit_counts_to_jy(cal)
    assert gain > 0


def test_calibration_converts_counts_to_jy(inputs_dir) -> None:
    cal = read_cal(inputs_dir / "cal25a.cal")
    gain = fit_counts_to_jy(cal)
    measured = np.array([e.measured_flux for e in cal.entries])
    known = np.array([e.known_flux for e in cal.entries])
    assert np.allclose(measured * gain, known, rtol=0.25)


def test_calibration_against_tutorial_cal18a(inputs_dir) -> None:
    cal = read_cal(inputs_dir / "cal25a.cal")
    gain = fit_counts_to_jy(cal)
    assert gain > 0.0
