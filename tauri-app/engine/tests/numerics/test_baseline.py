import numpy as np

from radio_cartographer.scan import baseline_subtract
from tests._tolerances import BASELINE_ATOL


def test_baseline_subtracts_constant_offset() -> None:
    y = np.full(100, 7.0)
    np.testing.assert_allclose(baseline_subtract(y), 0.0, atol=BASELINE_ATOL)


def test_baseline_subtracts_linear_drift() -> None:
    x = np.arange(200, dtype=np.float64)
    y = 3.0 + 0.7 * x
    np.testing.assert_allclose(baseline_subtract(y, x=x), 0.0, atol=BASELINE_ATOL)


def test_baseline_preserves_source_peak() -> None:
    x = np.linspace(-5, 5, 501)
    y = 0.2 * x + np.exp(-(x**2))
    out = baseline_subtract(y, x=x)
    assert out.max() > 0.95
