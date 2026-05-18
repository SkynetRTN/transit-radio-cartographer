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


def calibrate_scan(
    raw_flux: NDArray[np.float64], raw_ra: NDArray[np.float64]
) -> NDArray[np.float64]:
    """Apply the legacy `Calibrate Scan` noise-injection bracket to raw `.md1` data.

    The `.md1` layout is 60 cal-off / 60 cal-on samples, then `Total` source
    samples, then 60 cal-off / 60 cal-on samples. `Cal1` is the mean of the
    initial off-on differences; `Cal2` is the same for the terminal bracket.
    Source flux is divided by a linear interpolation between `Cal1` and
    `Cal2` in RA — see `vb/scanform.frm:355-489` (Cal computation) and
    `:1042-1090` (the per-sample division).

    Returns the calibrated source flux of length `total = len(raw_flux) - 240`.
    """
    flux = np.asarray(raw_flux, dtype=np.float64)
    ra = np.asarray(raw_ra, dtype=np.float64)
    if flux.size < 240:
        raise ValueError(f"calibrate_scan needs at least 240 samples, got {flux.size}")
    total = flux.size - 240

    cal1 = float(np.mean(flux[0:60] - flux[60:120]))
    cal2 = float(np.mean(flux[total + 120 : total + 180] - flux[total + 180 : total + 240]))

    src_flux = flux[120 : 120 + total]
    src_ra = ra[120 : 120 + total]
    span = src_ra[-1] - src_ra[0]
    if span == 0.0:
        cal_lerp = np.full(total, cal1, dtype=np.float64)
    else:
        t = (src_ra - src_ra[0]) / span
        cal_lerp = cal1 + t * (cal2 - cal1)
    return src_flux / cal_lerp


def subtract_baseline_off_source(
    ra: NDArray[np.float64],
    flux: NDArray[np.float64],
    off_source: NDArray[np.bool_] | NDArray[np.int_],
) -> NDArray[np.float64]:
    """Subtract a straight-line baseline fit through the off-source samples.

    The legacy `Baseline Source` button (`vb/scanform.frm:1690-1740`) draws
    the baseline as the line connecting two mouse-drag endpoints chosen by
    the user. The drag endpoints are not preserved on disk, so this helper
    approximates the legacy behaviour by least-squares-fitting a line in RA
    space through the samples the user marked off-source — i.e. those whose
    `.scn.check == -1` flag was set during the `Select Declination` step.
    """
    ra_arr = np.asarray(ra, dtype=np.float64)
    flux_arr = np.asarray(flux, dtype=np.float64)
    mask = np.asarray(off_source).astype(bool)
    if mask.sum() < 2:
        raise ValueError("subtract_baseline_off_source needs >=2 off-source samples")
    coeff = np.polyfit(ra_arr[mask], flux_arr[mask], deg=1)
    baseline = np.polyval(coeff, ra_arr)
    return flux_arr - baseline
