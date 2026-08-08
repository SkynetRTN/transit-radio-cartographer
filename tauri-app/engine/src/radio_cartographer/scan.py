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


def subtract_baseline_envelope(
    dec: NDArray[np.float64], flux: NDArray[np.float64], base_deg: float = 5.0
) -> NDArray[np.float64]:
    """Subtract the legacy *Baseline Sweeps* lower envelope from one sweep.

    Literal port of the legacy Command14 loop (`vb/survform.frm:2420-2449`).
    For each sample the legacy code draws a support line to the first sample
    at least ``base_deg`` declination degrees further along the sweep, then
    walks the interior backwards, re-anchoring the far endpoint to any sample
    that falls below the current line (each re-anchor rotates the line down
    about the left endpoint). A sample's baseline is the pointwise minimum of
    every support line covering it, so the baseline hugs the off-source noise
    floor and passes *under* any source narrower than ``base_deg`` —
    subtracting it preserves the source (disk, shoulders, Airy rings) rather
    than fitting through it. The residual is >= 0 wherever a line covers the
    sample: no line's final segment has data below it.

    The legacy program normalises each sweep at load time before this loop
    runs: a flat sweep gets its last dec nudged by +0.01
    (`vb/survform.frm:757-758`), descending sweeps are reversed (`:760-779`)
    and samples are bubble-sorted into ascending dec order (`:780-791`,
    stable). This port applies the same normalisation to a working copy and
    scatters the subtracted flux back to the caller's sample order, so every
    ``(dec, flux)`` pair receives exactly the value the legacy code would
    give it without reordering the caller's arrays.

    Two deliberate deviations from the VB source, both in its "impossible"
    regime: the uncovered-sample sentinel is ``inf`` rather than ``1000`` (a
    literal 1000 would clamp the baseline under any flux brighter than 1000
    and inject ``flux - 1000`` spikes at uncovered samples), and samples no
    line covers — possible only with duplicated maximum dec — keep their
    flux unchanged instead of having 1000 subtracted.

    For speed the two VB inner loops are evaluated in vectorised form; both
    reformulations are exact:

    * The forward walk (`While Dec(Number)+BaseDeg > Dec(Num) And Num<Total`)
      stops at the first index whose dec reaches ``dec[number] + base_deg``,
      capped at the last index — one ``np.searchsorted`` for every window.
    * The backward re-anchoring scan replaces the endpoint whenever a sample
      lies below the current line. Every candidate line pivots on the fixed
      left anchor ``(d0, f0)``, so "sample below the line" is exactly "sample
      whose slope from the anchor is smaller than the current endpoint's
      slope", and scanning right-to-left with strict-inequality updates lands
      on the rightmost minimum-slope sample. Same-dec samples are excluded
      just like the VB `Dec(Numb%) <> Dec(Number%)` guard. (Comparing slopes
      instead of evaluating ``a*d + b`` can differ in the last float ulp for
      razor-edge ties; the affected lines agree to ~1 ulp over the window, so
      any divergence from the sequential scan is far below data precision.)
    """
    if base_deg <= 0:
        raise ValueError(f"base_deg must be positive (got {base_deg})")
    deca = np.asarray(dec, dtype=np.float64)
    fluxa = np.asarray(flux, dtype=np.float64)
    n = deca.size
    if n < 2:
        return fluxa.copy()
    d = deca.copy()
    f = fluxa.copy()
    flipped = d[0] > d[-1]
    if flipped:
        d = d[::-1].copy()
        f = f[::-1].copy()
    if d.min() == d.max():
        d[-1] += 0.01
    order = np.argsort(d, kind="stable")
    d = d[order]
    f = f[order]
    base = np.full(n, np.inf)
    # Every window's forward-walk endpoint in one shot: first index whose dec
    # reaches d[i] + base_deg, capped at the last sample. d[i] < d[i]+base_deg
    # guarantees ends[i] >= i+1.
    ends = np.minimum(np.searchsorted(d, d + base_deg, side="left"), n - 1)
    number = 0  # Number% (0-based)
    while d[number] < d[n - 1]:
        end = int(ends[number])
        dd = d[number + 1 : end + 1] - d[number]
        with np.errstate(divide="ignore", invalid="ignore"):
            slopes = (f[number + 1 : end + 1] - f[number]) / dd
        # Same-dec samples can never anchor a line (VB guard); the window
        # endpoint itself always has dd > 0, so a finite slope exists.
        slopes[dd == 0.0] = np.inf
        # Rightmost minimum — np.argmin takes the first occurrence, so scan
        # the reversed view.
        k = slopes.size - 1 - int(np.argmin(slopes[::-1]))
        num = number + 1 + k  # final Num%
        a = slopes[k]
        b = f[num] - a * d[num]
        segment = a * d[number : num + 1] + b
        np.minimum(base[number : num + 1], segment, out=base[number : num + 1])
        number += 1
    base[np.isinf(base)] = 0.0
    residual = f - base
    out = np.empty(n, dtype=np.float64)
    out[order] = residual
    return out[::-1].copy() if flipped else out


def align_by_offset(
    dec: NDArray[np.float64], flux: NDArray[np.float64], offset: float
) -> NDArray[np.float64]:
    deca = np.asarray(dec, dtype=np.float64)
    fluxa = np.asarray(flux, dtype=np.float64)
    if fluxa.size == 0 or offset == 0.0:
        return fluxa.copy()
    interpolated = np.interp(deca - offset, deca, fluxa, left=fluxa[0], right=fluxa[-1])
    return np.asarray(interpolated, dtype=np.float64)


def align_dec_shifts(
    decs: list[NDArray[np.float64]],
    fluxes: list[NDArray[np.float64]],
    max_delta_deg: float,
    n_grid: int = 384,
    n_fft: int = 512,
) -> list[float]:
    """Compute per-sweep dec shifts that align adjacent sweeps via FFT cross-correlation.

    Mirrors `vb/survform.frm:2612-2818` (the legacy *Align Sweeps* button).
    For each adjacent pair `(i, i+1)`:

    1. Interpolate each sweep's flux onto a regular dec grid spanning the
       *union* of their dec extents (zero where the sweep doesn't cover
       that dec). The legacy uses 384 grid samples zero-padded to a
       512-point FFT.
    2. Cross-correlate the two tracks via FFT. The peak's lag in degrees
       (positive or negative, with FFT wrap-around for negative lag) is the
       dec offset between sweep `i` and sweep `i+1`.
    3. Restrict the peak search to lags within `±max_delta_deg`.
    4. Distribute the lag as `±lag/2` across the pair so they move toward
       each other; subsequent pairs blend the prior shift using the
       correlation strength as the weight (`vb/survform.frm:2723-2728`).

    Returns a list of length `len(decs)`; element `i` is the dec value to
    *add* to sweep `i`'s declinations to put it on the global aligned grid.
    A `max_delta_deg` of 0 yields all-zero shifts.
    """
    n = len(decs)
    if n < 2:
        return [0.0] * n
    deltas = [0.0] * n
    max_flx_old = 0.0
    for i in range(n - 1):
        dec_a = np.asarray(decs[i], dtype=np.float64)
        dec_b = np.asarray(decs[i + 1], dtype=np.float64)
        flux_a = np.asarray(fluxes[i], dtype=np.float64)
        flux_b = np.asarray(fluxes[i + 1], dtype=np.float64)
        if dec_a.size < 2 or dec_b.size < 2:
            continue
        oa = np.argsort(dec_a)
        ob = np.argsort(dec_b)
        da, fa = dec_a[oa], flux_a[oa]
        db, fb = dec_b[ob], flux_b[ob]
        # Legacy uses the OUTER bounds (min-of-mins, max-of-maxes) and zeros
        # the sweep where it doesn't cover the grid. The wider grid leaves
        # room for shifts up to ±max_delta_deg in the FFT buffer.
        outer_lo = min(float(da[0]), float(db[0]))
        outer_hi = max(float(da[-1]), float(db[-1]))
        if outer_hi <= outer_lo:
            continue
        grid = np.linspace(outer_lo, outer_hi, n_grid)
        a_grid = np.where(
            (grid < da[0]) | (grid > da[-1]), 0.0, np.interp(grid, da, fa)
        )
        b_grid = np.where(
            (grid < db[0]) | (grid > db[-1]), 0.0, np.interp(grid, db, fb)
        )
        a_pad = np.zeros(n_fft, dtype=np.float64)
        b_pad = np.zeros(n_fft, dtype=np.float64)
        a_pad[:n_grid] = a_grid
        b_pad[:n_grid] = b_grid
        # Cross-correlation: corr[p] = sum_n a[n] * b[n-p]. With numpy's
        # forward FFT using `e^{-iωnk}` (opposite sign of the legacy VB
        # FFT routine's isign=+1 forward), `ifft(fft(a) · conj(fft(b)))` is
        # what matches the legacy's `conj(dat) · Temp` followed by an
        # isign=-1 inverse — see vb/survform.frm:2702-2708.
        #
        # The peak's lag is `p* = k_a - k_b`, so positive means sweep b's
        # feature sits at HIGHER dec than sweep a's. The legacy then moves
        # sweep a UP by p/2 and sweep b DOWN by p/2, closing the gap
        # (vb/survform.frm:2723-2728).
        corr = np.fft.ifft(np.fft.fft(a_pad) * np.conj(np.fft.fft(b_pad))).real
        dec_range = outer_hi - outer_lo
        break_n = int(max_delta_deg / dec_range * n_grid)
        break_n = max(1, min(break_n, n_fft // 2))
        # Positive lags k in [0, break_n): dec = k/(n_grid-1) * range.
        # Negative lags k in [n_fft-break_n, n_fft): dec = (k+1-n_fft)/(n_grid-1)*range.
        # Matches vb/survform.frm:2710-2722 exactly (k=Num%-1).
        pos_idx = np.arange(break_n)
        neg_idx = np.arange(n_fft - break_n, n_fft)
        pos_corr = corr[pos_idx]
        neg_corr = corr[neg_idx]
        all_corr = np.concatenate([pos_corr, neg_corr])
        all_lags = np.concatenate(
            [
                pos_idx / (n_grid - 1) * dec_range,
                (neg_idx + 1 - n_fft) / (n_grid - 1) * dec_range,
            ]
        )
        best = int(np.argmax(all_corr))
        dec_val = float(all_lags[best])
        max_flx = float(all_corr[best])
        if i == 0:
            deltas[0] = -dec_val / 2.0
            deltas[1] = dec_val / 2.0
        else:
            denom = max_flx_old + max_flx
            if denom != 0.0:
                deltas[i] = (
                    max_flx_old / denom * deltas[i]
                    - max_flx / denom * dec_val / 2.0
                )
            deltas[i + 1] = dec_val / 2.0
        max_flx_old = max_flx
    return deltas


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
    # 241, not 240: the four 60-sample cal blocks alone leave zero source
    # samples, and the RA-span interpolation below needs at least one.
    if flux.size < 241:
        raise ValueError(
            f"calibrate_scan needs at least 241 samples "
            f"(240 cal + 1 source), got {flux.size}"
        )
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
