from __future__ import annotations

import numpy as np
from numpy.typing import NDArray


def fft_real(signal: NDArray[np.float64]) -> NDArray[np.complex128]:
    return np.fft.fft(np.asarray(signal, dtype=np.float64))


def smooth_flux(flux: NDArray[np.float64], window: int = 5) -> NDArray[np.float64]:
    x = np.asarray(flux, dtype=np.float64)
    if window <= 1 or x.size == 0:
        return x.copy()
    kernel = np.ones(window, dtype=np.float64) / float(window)
    pad = window // 2
    xp = np.pad(x, (pad, pad), mode="edge")
    return np.convolve(xp, kernel, mode="valid")[: x.size]


def subtract_baseline(
    dec: NDArray[np.float64], flux: NDArray[np.float64], degree: int = 1
) -> NDArray[np.float64]:
    deca = np.asarray(dec, dtype=np.float64)
    fluxa = np.asarray(flux, dtype=np.float64)
    coeff = np.polyfit(deca, fluxa, deg=degree)
    baseline = np.polyval(coeff, deca)
    return fluxa - baseline


def align_by_offset(
    dec: NDArray[np.float64], flux: NDArray[np.float64], offset: float
) -> NDArray[np.float64]:
    deca = np.asarray(dec, dtype=np.float64)
    fluxa = np.asarray(flux, dtype=np.float64)
    if fluxa.size == 0 or offset == 0.0:
        return fluxa.copy()
    interpolated = np.interp(deca - offset, deca, fluxa, left=fluxa[0], right=fluxa[-1])
    return np.asarray(interpolated, dtype=np.float64)
