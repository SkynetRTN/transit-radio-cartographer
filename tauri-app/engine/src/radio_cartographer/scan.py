from __future__ import annotations

import numpy as np
from numpy.typing import NDArray


def fft_spectrum(flux: NDArray[np.float64]) -> NDArray[np.complex128]:
    return np.fft.fft(flux.astype(np.float64))


def baseline_subtract(flux: NDArray[np.float64], x: NDArray[np.float64] | None = None, degree: int = 1) -> NDArray[np.float64]:
    xv = np.arange(flux.size, dtype=np.float64) if x is None else x.astype(np.float64)
    coeffs = np.polyfit(xv, flux.astype(np.float64), deg=degree)
    baseline = np.polyval(coeffs, xv)
    return flux.astype(np.float64) - baseline


def smooth_flux(flux: NDArray[np.float64], window: int = 5) -> NDArray[np.float64]:
    if window <= 1:
        return flux.astype(np.float64).copy()
    kernel = np.ones(window, dtype=np.float64) / float(window)
    return np.convolve(flux.astype(np.float64), kernel, mode="same")


def align_flux(flux: NDArray[np.float64], shift_samples: float) -> NDArray[np.float64]:
    x = np.arange(flux.size, dtype=np.float64)
    return np.interp(x, x - shift_samples, flux.astype(np.float64), left=flux[0], right=flux[-1])
