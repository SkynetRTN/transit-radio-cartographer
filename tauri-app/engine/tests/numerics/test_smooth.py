import numpy as np
from radio_cartographer.scan import smooth_flux


def test_smooth_preserves_mean() -> None:
    x = np.linspace(0, 1, 1000)
    y = smooth_flux(x, window=9)
    assert np.isclose(np.mean(x), np.mean(y), rtol=1e-2)


def test_smooth_reduces_noise() -> None:
    rng = np.random.default_rng(42)
    x = rng.normal(size=5000)
    y = smooth_flux(x, window=9)
    assert np.std(y) < np.std(x)
