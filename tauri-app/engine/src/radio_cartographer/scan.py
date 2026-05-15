from __future__ import annotations

import numpy as np
from numpy.typing import NDArray

from .models import Scan


def fft_flux(scan: Scan) -> NDArray[np.complex128]:
    return np.fft.fft(scan.flux.astype(np.float64, copy=False))


def smooth_flux(scan: Scan, window: int = 5) -> Scan:
    if window <= 1:
        return scan
    if window % 2 == 0:
        raise ValueError("window must be odd")
    kernel = np.ones(window, dtype=np.float64) / float(window)
    flux = np.convolve(scan.flux, kernel, mode="same")
    return _replace_flux(scan, flux)


def baseline_subtract(scan: Scan, degree: int = 1) -> Scan:
    x = np.arange(scan.total, dtype=np.float64)
    coeffs = np.polyfit(x, scan.flux, deg=degree)
    trend = np.polyval(coeffs, x)
    return _replace_flux(scan, scan.flux - trend)


def align_dec(scan: Scan, offset_deg: float) -> Scan:
    return Scan(
        name=scan.name,
        channel=scan.channel,
        peak=scan.peak,
        min_dec=scan.min_dec + offset_deg,
        max_dec=scan.max_dec + offset_deg,
        min_flux=scan.min_flux,
        max_flux=scan.max_flux,
        check=scan.check,
        ra=scan.ra,
        dec=scan.dec + offset_deg,
        flux=scan.flux,
        raw_bytes=None,
    )


def _replace_flux(scan: Scan, flux: NDArray[np.float64]) -> Scan:
    return Scan(
        name=scan.name,
        channel=scan.channel,
        peak=scan.peak,
        min_dec=scan.min_dec,
        max_dec=scan.max_dec,
        min_flux=float(np.min(flux)),
        max_flux=float(np.max(flux)),
        check=scan.check,
        ra=scan.ra,
        dec=scan.dec,
        flux=flux,
        raw_bytes=None,
    )
