import numpy as np
from radio_cartographer._legacy.four1 import four1_real
from radio_cartographer.scan import fft_real
from tests._tolerances import FFT_ATOL


def test_fft_of_unit_impulse_is_flat() -> None:
    x = np.zeros(16)
    x[0] = 1.0
    out = fft_real(x)
    assert np.allclose(np.abs(out), 1.0, atol=FFT_ATOL)


def test_fft_of_pure_sinusoid_has_single_peak() -> None:
    n = 64
    k = 5
    t = np.arange(n)
    x = np.sin(2 * np.pi * k * t / n)
    out = np.abs(fft_real(x))
    assert int(np.argmax(out[: n // 2])) == k


def test_fft_matches_legacy_on_real_sweep() -> None:
    x = np.linspace(0, 1, 32) + 0.1 * np.sin(np.linspace(0, 8 * np.pi, 32))
    assert np.allclose(fft_real(x), four1_real(x), atol=FFT_ATOL)
