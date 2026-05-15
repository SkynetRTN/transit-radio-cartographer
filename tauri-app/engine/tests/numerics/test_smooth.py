import numpy as np

from radio_cartographer.scan import smooth_flux
from tests._tolerances import SMOOTH_MEAN_ATOL


def test_smooth_preserves_mean() -> None:
    x = np.random.default_rng(0).normal(0, 1, size=400)
    y = smooth_flux(x, window=9)
    np.testing.assert_allclose(np.mean(x), np.mean(y), atol=SMOOTH_MEAN_ATOL)


def test_smooth_reduces_noise() -> None:
    x = np.random.default_rng(1).normal(0, 1, size=400)
    y = smooth_flux(x, window=9)
    assert np.std(y) < np.std(x)
