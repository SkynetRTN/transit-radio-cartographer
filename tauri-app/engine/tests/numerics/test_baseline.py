import numpy as np

from radio_cartographer.scan import subtract_baseline
from tests._tolerances import BASELINE_ATOL


def test_baseline_subtracts_constant_offset() -> None:
    dec = np.linspace(0, 1, 100)
    flux = np.full(100, 3.0)
    y = subtract_baseline(dec, flux, degree=0)
    assert np.allclose(y, 0.0, atol=BASELINE_ATOL)


def test_baseline_subtracts_linear_drift() -> None:
    dec = np.linspace(-1, 1, 100)
    flux = 2.0 + 0.7 * dec
    y = subtract_baseline(dec, flux, degree=1)
    assert np.allclose(y, 0.0, atol=BASELINE_ATOL)


def test_baseline_preserves_source_peak() -> None:
    dec = np.linspace(-2, 2, 400)
    peak = np.exp(-dec**2 / 0.02)
    flux = 0.5 + 0.2 * dec + peak
    y = subtract_baseline(dec, flux, degree=1)
    assert np.max(y) > 0.9 * np.max(peak)
