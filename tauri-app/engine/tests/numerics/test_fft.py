import numpy as np

from radio_cartographer._legacy.four1 import four1_real
from radio_cartographer.scan import fft_spectrum
from tests._tolerances import FFT_ATOL, FFT_RTOL


def test_fft_of_unit_impulse_is_flat() -> None:
    x = np.zeros(32, dtype=np.float64)
    x[0] = 1.0
    y = fft_spectrum(x)
    np.testing.assert_allclose(np.abs(y), np.ones(32), rtol=FFT_RTOL, atol=FFT_ATOL)


def test_fft_of_pure_sinusoid_has_single_peak() -> None:
    n = 64
    k = 5
    t = np.arange(n)
    x = np.sin(2 * np.pi * k * t / n)
    y = np.abs(fft_spectrum(x))
    assert int(np.argmax(y[: n // 2])) == k


def test_fft_matches_legacy_on_real_sweep() -> None:
    x = np.linspace(0, 1, 128, dtype=np.float64)
    signal = np.sin(2 * np.pi * 9 * x) + 0.2 * np.cos(2 * np.pi * 2 * x)
    np.testing.assert_allclose(fft_spectrum(signal), four1_real(signal), rtol=FFT_RTOL, atol=FFT_ATOL)
