"""Scan workspace — stateful container that backs the interactive Scan UI.

A `.md1` scan file contains one continuous telescope sweep with the following
fixed layout (legacy `vb/scanform.frm:1257-1364`):

- 60 samples of initial cal-on
- 60 samples of initial cal-off
- ``Total`` samples of source data (variable length, ends at the next ``*``)
- 60 samples of terminal cal-on
- 60 samples of terminal cal-off

`Cal1 = mean(initial_on.flux) - mean(initial_off.flux)` is the gain voltage at
the start of the scan, `Cal2` at the end. These match the "Initial: V" /
"Terminal: V" readouts in the legacy "Calibrate Scan" screen.

The `ScanWorkspace` keeps the raw samples untouched and tracks per-sample
masks: which cal samples are kept (analogous to `SurveyWorkspace`) and which
source samples are kept (the legacy ``Check%(Num%) = -1`` "cut" flag).
Reductions stack and an undo stack lets the user revert.

Pipeline-relevant state transitions:

1. **build_scan_workspace(path, md1)** — fresh workspace, no calibration.
2. **cut_calibration_segment_scan / select_calibration_declination_scan** —
   pre-cal cleanup on the cal brackets, mirroring the survey workflow.
3. **apply_scan_calibration** — divide every source sample by the linearly-
   interpolated cal voltage between ``Cal1`` and ``Cal2``; marks the workspace
   calibrated and switches its `unit` from ``"volts"`` to ``"gain"``.
4. **select_scan_declination(ws, dec_min, dec_max)** — keep only source
   samples whose Dec falls inside the band (post-cal source reduction).
5. **cut_scan_segment(ws, ra_min, ra_max)** — remove source samples whose RA
   falls inside the range (post-cal source reduction).
6. **baseline_scan_source(ws, ra0, flux0, ra1, flux1)** — subtract a straight
   line through the two click endpoints from every kept source sample. The
   legacy "Baseline Source" gesture (`vb/scanform.frm:1690-1740`).
7. **determine_peak(ws, flux_y)** — record the user-chosen peak-flux level so
   the UI can display ``Peak Flux: X``.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np
from numpy.typing import NDArray

from .models import MD1Document, RawSweep, Scan


# Each scan file dedicates exactly 60 samples per cal-on/cal-off block. The
# legacy parser (`vb/scanform.frm:1257-1322`) hard-codes the same number.
CAL_BLOCK = 60
CAL_TOTAL = 4 * CAL_BLOCK  # 240 cal samples bracketing every scan


@dataclass(frozen=True)
class ScanCalBracket:
    """One cal bracket — the cal-on / cal-off slice and their kept masks."""

    on_flux: NDArray[np.float64]
    off_flux: NDArray[np.float64]
    on_ra: NDArray[np.float64]
    off_ra: NDArray[np.float64]
    on_dec: NDArray[np.float64]
    off_dec: NDArray[np.float64]
    on_mask: NDArray[np.bool_]
    off_mask: NDArray[np.bool_]

    def cal_value(self) -> float:
        on = self.on_flux[self.on_mask]
        off = self.off_flux[self.off_mask]
        if on.size == 0 or off.size == 0:
            return 0.0
        return float(on.mean() - off.mean())


@dataclass
class ScanWorkspace:
    """Interactive workspace wrapping a parsed `.md1` scan."""

    name: str
    path: str
    md1: MD1Document
    initial: ScanCalBracket
    terminal: ScanCalBracket
    source_ra: NDArray[np.float64]
    source_dec: NDArray[np.float64]
    source_flux: NDArray[np.float64]
    source_mask: NDArray[np.bool_]
    calibrated_source_flux: NDArray[np.float64] | None = None
    reduced_source_flux: NDArray[np.float64] | None = None
    peak_flux: float | None = None
    undo_stack: list[dict[str, object]] = field(default_factory=list)
    initial_enabled: bool = True
    terminal_enabled: bool = True
    # Flux calibration (.cal slope) state — applied on top of gain calibration.
    flux_calibrated: bool = False
    flux_slope: float | None = None

    @property
    def calibrated(self) -> bool:
        return self.calibrated_source_flux is not None

    @property
    def source_count(self) -> int:
        return int(self.source_ra.shape[0])

    def cal1(self) -> float:
        return self.initial.cal_value() if self.initial_enabled else 0.0

    def cal2(self) -> float:
        return self.terminal.cal_value() if self.terminal_enabled else 0.0

    def kept_count(self) -> int:
        return int(self.source_mask.sum())


def build_scan_workspace(path: str, md1: MD1Document) -> ScanWorkspace:
    """Classify cal vs source samples and produce a fresh scan workspace."""
    raw = md1.samples
    total = int(raw.flux.shape[0])
    if total < CAL_TOTAL + 1:
        raise ValueError(
            f".md1 scan must have at least {CAL_TOTAL + 1} samples "
            f"(240 cal + ≥1 source), got {total}"
        )
    source_total = total - CAL_TOTAL

    def _slice(lo: int, hi: int) -> tuple[NDArray[np.float64], NDArray[np.float64], NDArray[np.float64]]:
        return (
            np.asarray(raw.ra[lo:hi], dtype=np.float64).copy(),
            np.asarray(raw.dec[lo:hi], dtype=np.float64).copy(),
            np.asarray(raw.flux[lo:hi], dtype=np.float64).copy(),
        )

    init_on_ra, init_on_dec, init_on_flux = _slice(0, CAL_BLOCK)
    init_off_ra, init_off_dec, init_off_flux = _slice(CAL_BLOCK, 2 * CAL_BLOCK)
    src_ra, src_dec, src_flux = _slice(2 * CAL_BLOCK, 2 * CAL_BLOCK + source_total)
    term_on_ra, term_on_dec, term_on_flux = _slice(
        2 * CAL_BLOCK + source_total, 3 * CAL_BLOCK + source_total
    )
    term_off_ra, term_off_dec, term_off_flux = _slice(
        3 * CAL_BLOCK + source_total, 4 * CAL_BLOCK + source_total
    )

    initial = ScanCalBracket(
        on_flux=init_on_flux,
        off_flux=init_off_flux,
        on_ra=init_on_ra,
        off_ra=init_off_ra,
        on_dec=init_on_dec,
        off_dec=init_off_dec,
        on_mask=np.ones(CAL_BLOCK, dtype=bool),
        off_mask=np.ones(CAL_BLOCK, dtype=bool),
    )
    terminal = ScanCalBracket(
        on_flux=term_on_flux,
        off_flux=term_off_flux,
        on_ra=term_on_ra,
        off_ra=term_off_ra,
        on_dec=term_on_dec,
        off_dec=term_off_dec,
        on_mask=np.ones(CAL_BLOCK, dtype=bool),
        off_mask=np.ones(CAL_BLOCK, dtype=bool),
    )
    name = path.rsplit("/", 1)[-1].rsplit("\\", 1)[-1].rsplit(".", 1)[0].upper()
    return ScanWorkspace(
        name=name,
        path=path,
        md1=md1,
        initial=initial,
        terminal=terminal,
        source_ra=src_ra,
        source_dec=src_dec,
        source_flux=src_flux,
        source_mask=np.ones(source_total, dtype=bool),
    )


def _push_cal_undo(workspace: ScanWorkspace) -> None:
    workspace.undo_stack.append(
        {
            "kind": "cal",
            "initial_on": workspace.initial.on_mask.copy(),
            "initial_off": workspace.initial.off_mask.copy(),
            "terminal_on": workspace.terminal.on_mask.copy(),
            "terminal_off": workspace.terminal.off_mask.copy(),
        }
    )


def _push_source_undo(workspace: ScanWorkspace) -> None:
    workspace.undo_stack.append(
        {
            "kind": "source",
            "source_mask": workspace.source_mask.copy(),
            "reduced": (
                workspace.reduced_source_flux.copy()
                if workspace.reduced_source_flux is not None
                else None
            ),
            "peak_flux": workspace.peak_flux,
        }
    )


def cut_calibration_segment_scan(
    workspace: ScanWorkspace, ra_min: float, ra_max: float
) -> int:
    """Mask cal samples whose RA falls in [ra_min, ra_max]. Returns # removed."""
    if ra_min > ra_max:
        ra_min, ra_max = ra_max, ra_min
    _push_cal_undo(workspace)

    def _apply(ra: NDArray[np.float64], mask: NDArray[np.bool_]) -> tuple[NDArray[np.bool_], int]:
        in_range = (ra >= ra_min) & (ra <= ra_max)
        removed = int((mask & in_range).sum())
        return mask & ~in_range, removed

    new_init_on, r1 = _apply(workspace.initial.on_ra, workspace.initial.on_mask)
    new_init_off, r2 = _apply(workspace.initial.off_ra, workspace.initial.off_mask)
    new_term_on, r3 = _apply(workspace.terminal.on_ra, workspace.terminal.on_mask)
    new_term_off, r4 = _apply(workspace.terminal.off_ra, workspace.terminal.off_mask)
    removed = r1 + r2 + r3 + r4
    if removed == 0:
        workspace.undo_stack.pop()
        return 0
    workspace.initial = ScanCalBracket(
        on_flux=workspace.initial.on_flux,
        off_flux=workspace.initial.off_flux,
        on_ra=workspace.initial.on_ra,
        off_ra=workspace.initial.off_ra,
        on_dec=workspace.initial.on_dec,
        off_dec=workspace.initial.off_dec,
        on_mask=new_init_on,
        off_mask=new_init_off,
    )
    workspace.terminal = ScanCalBracket(
        on_flux=workspace.terminal.on_flux,
        off_flux=workspace.terminal.off_flux,
        on_ra=workspace.terminal.on_ra,
        off_ra=workspace.terminal.off_ra,
        on_dec=workspace.terminal.on_dec,
        off_dec=workspace.terminal.off_dec,
        on_mask=new_term_on,
        off_mask=new_term_off,
    )
    return removed


def select_calibration_declination_scan(
    workspace: ScanWorkspace, dec_min: float, dec_max: float, bracket: str
) -> int:
    """Keep cal samples whose Dec falls in [dec_min, dec_max] for one bracket."""
    if bracket not in ("initial", "terminal"):
        raise ValueError(f"bracket must be 'initial' or 'terminal', got {bracket!r}")
    if dec_min > dec_max:
        dec_min, dec_max = dec_max, dec_min
    _push_cal_undo(workspace)

    def _apply(dec: NDArray[np.float64], mask: NDArray[np.bool_]) -> tuple[NDArray[np.bool_], int]:
        in_range = (dec >= dec_min) & (dec <= dec_max)
        removed = int((mask & ~in_range).sum())
        return mask & in_range, removed

    if bracket == "initial":
        new_on, r1 = _apply(workspace.initial.on_dec, workspace.initial.on_mask)
        new_off, r2 = _apply(workspace.initial.off_dec, workspace.initial.off_mask)
        removed = r1 + r2
        if removed == 0:
            workspace.undo_stack.pop()
            return 0
        workspace.initial = ScanCalBracket(
            on_flux=workspace.initial.on_flux,
            off_flux=workspace.initial.off_flux,
            on_ra=workspace.initial.on_ra,
            off_ra=workspace.initial.off_ra,
            on_dec=workspace.initial.on_dec,
            off_dec=workspace.initial.off_dec,
            on_mask=new_on,
            off_mask=new_off,
        )
    else:
        new_on, r1 = _apply(workspace.terminal.on_dec, workspace.terminal.on_mask)
        new_off, r2 = _apply(workspace.terminal.off_dec, workspace.terminal.off_mask)
        removed = r1 + r2
        if removed == 0:
            workspace.undo_stack.pop()
            return 0
        workspace.terminal = ScanCalBracket(
            on_flux=workspace.terminal.on_flux,
            off_flux=workspace.terminal.off_flux,
            on_ra=workspace.terminal.on_ra,
            off_ra=workspace.terminal.off_ra,
            on_dec=workspace.terminal.on_dec,
            off_dec=workspace.terminal.off_dec,
            on_mask=new_on,
            off_mask=new_off,
        )
    return removed


def apply_scan_calibration(workspace: ScanWorkspace) -> None:
    """Apply noise-injection bracket gain calibration to the source samples.

    For each source sample with fractional RA position
    ``t = (RA - RA_first) / (RA_last - RA_first)`` the per-sample cal voltage
    is ``cal(t) = (1 - t) * Cal1 + t * Cal2``. Mirrors
    `vb/scanform.frm:1042-1090`. The calibrated flux replaces the raw flux for
    every downstream view; the source mask is preserved.
    """
    cal1 = workspace.cal1()
    cal2 = workspace.cal2()
    if not workspace.initial_enabled and not workspace.terminal_enabled:
        raise ValueError("at least one cal bracket must remain enabled to calibrate")
    if workspace.initial_enabled and cal1 == 0.0:
        raise ValueError("initial Cal1 is zero — too many samples cut")
    if workspace.terminal_enabled and cal2 == 0.0:
        raise ValueError("terminal Cal2 is zero — too many samples cut")
    if not workspace.initial_enabled:
        cal1 = cal2
    if not workspace.terminal_enabled:
        cal2 = cal1
    # See workspace.apply_gain_calibration: opposite-sign endpoints mean the
    # interpolation crosses zero and some sample divides by ~0.
    if cal1 * cal2 < 0.0:
        raise ValueError(
            "Cal1 and Cal2 have opposite signs — the interpolated cal voltage "
            "crosses zero mid-scan; re-check the cal bracket cuts"
        )
    if workspace.source_count == 0:
        raise ValueError("no source samples to calibrate")
    if workspace.source_count == 1:
        cal = np.array([(cal1 + cal2) / 2.0])
    else:
        ra = workspace.source_ra
        span = ra[-1] - ra[0]
        if span == 0.0:
            cal = np.full(workspace.source_count, cal1, dtype=np.float64)
        else:
            # Non-monotonic RA can push t outside [0, 1], where even same-sign
            # endpoints extrapolate through zero.
            t = (ra - ra[0]) / span
            cal = (1.0 - t) * cal1 + t * cal2
    if np.any(cal == 0.0):
        raise ValueError(
            "interpolated cal voltage is zero at one or more samples — "
            "re-check the cal bracket cuts"
        )
    workspace.calibrated_source_flux = workspace.source_flux / cal
    # A fresh calibration drops any prior reductions/peak and any previously-
    # applied flux scaling — the caller can re-apply the slope.
    workspace.reduced_source_flux = None
    workspace.peak_flux = None
    workspace.flux_calibrated = False
    workspace.flux_slope = None


def current_source_flux(workspace: ScanWorkspace) -> NDArray[np.float64]:
    """Return the most-recent source flux array (reduced > calibrated > raw)."""
    if workspace.reduced_source_flux is not None:
        return workspace.reduced_source_flux
    if workspace.calibrated_source_flux is not None:
        return workspace.calibrated_source_flux
    return workspace.source_flux


def cut_scan_segment(workspace: ScanWorkspace, ra_min: float, ra_max: float) -> int:
    """Mask source samples whose RA falls in [ra_min, ra_max] (post-cal cut)."""
    if ra_min > ra_max:
        ra_min, ra_max = ra_max, ra_min
    _push_source_undo(workspace)
    in_range = (workspace.source_ra >= ra_min) & (workspace.source_ra <= ra_max)
    removed = int((workspace.source_mask & in_range).sum())
    if removed == 0:
        workspace.undo_stack.pop()
        return 0
    workspace.source_mask = workspace.source_mask & ~in_range
    return removed


def select_scan_declination(
    workspace: ScanWorkspace, dec_min: float, dec_max: float
) -> int:
    """Keep source samples whose Dec falls in [dec_min, dec_max]."""
    if dec_min > dec_max:
        dec_min, dec_max = dec_max, dec_min
    _push_source_undo(workspace)
    in_range = (workspace.source_dec >= dec_min) & (workspace.source_dec <= dec_max)
    removed = int((workspace.source_mask & ~in_range).sum())
    if removed == 0:
        workspace.undo_stack.pop()
        return 0
    workspace.source_mask = workspace.source_mask & in_range
    return removed


def baseline_scan_source(
    workspace: ScanWorkspace,
    ra0: float,
    flux0: float,
    ra1: float,
    flux1: float,
) -> None:
    """Subtract a straight line through (ra0, flux0)-(ra1, flux1) from source.

    Mirrors the legacy "Baseline Source" gesture
    (`vb/scanform.frm:1690-1740`): the line is `flux = m·RA + b` fitted
    exactly to the two click endpoints, and `flux(RA)` is subtracted from
    every source sample's current flux. The result lands on
    `reduced_source_flux` so subsequent operations stack.
    """
    if ra0 == ra1:
        raise ValueError("baseline endpoints must have different RA")
    _push_source_undo(workspace)
    slope = (flux1 - flux0) / (ra1 - ra0)
    base = workspace.source_ra * slope + (flux0 - slope * ra0)
    current = current_source_flux(workspace)
    workspace.reduced_source_flux = current - base
    workspace.peak_flux = None


def determine_peak(workspace: ScanWorkspace, flux_y: float) -> float:
    """Record the user's "Peak Flux: X" readout.

    The legacy gesture (`vb/scanform.frm:1568-1581`) reads off the Y value of
    the user's click on the flux-vs-RA plot — the user is expected to place
    the horizontal cursor line at the peak of the source they care about.
    This helper just stores the value so the UI can render it; no math.

    Superseded by `determine_peak_fit`, which actually computes the peak from
    a polynomial fit instead of trusting the user's eyeball. Kept so the
    `determine_scan_peak` RPC and its existing tests keep working.
    """
    workspace.peak_flux = float(flux_y)
    return workspace.peak_flux


def determine_peak_gaussian(
    workspace: ScanWorkspace,
    ra_min: float,
    ra_max: float,
    *,
    grid_size: int = 200,
) -> tuple[float, NDArray[np.float64], NDArray[np.float64], float]:
    """Fit a Gaussian + constant baseline over a user-selected RA range.

    Counterpart to `determine_peak_fit` for symmetric, peak-shaped sources
    (the common case for point-source scans).

    Uses the log-quadratic trick rather than a nonlinear solver so we don't
    have to pull in `scipy`: subtract a baseline (min flux in the band), take
    `log(flux - baseline)`, fit a degree-2 polynomial with `np.polyfit`, then
    recover `(σ, μ, amplitude)` analytically from the quadratic coefficients
    (`a·x² + b·x + c`: `σ = √(-1/2a)`, `μ = -b/2a`, `amplitude = exp(c - b²/4a)`).
    Works well for clean point-source peaks; if the user needs robustness
    against asymmetry/noise, the polynomial-fit path is still available.

    Same contract as the polynomial variant: validate, snapshot undo, store
    `peak_flux`, return the curve grid for the UI to draw.
    """
    if ra_min == ra_max:
        raise ValueError("peak-fit range must be non-empty")
    if ra_min > ra_max:
        ra_min, ra_max = ra_max, ra_min
    region = (
        (workspace.source_ra >= ra_min)
        & (workspace.source_ra <= ra_max)
        & workspace.source_mask
    )
    n = int(region.sum())
    if n < 4:
        raise ValueError(
            f"need at least 4 kept samples in the range to fit a Gaussian (found {n})"
        )
    ra = workspace.source_ra[region]
    flux = current_source_flux(workspace)[region]
    baseline = float(np.min(flux))
    above = flux - baseline
    # Strictly-positive subset for the log. Pre-allocating a tiny epsilon
    # before discarding loses one degree of freedom and biases the fit; better
    # to just drop the at-baseline samples.
    positive = above > 1e-12
    if int(positive.sum()) < 3:
        raise ValueError(
            "not enough above-baseline samples in the range to fit a Gaussian "
            "(try widening the range or use the polynomial fit instead)"
        )
    pos_flux = above[positive]
    log_above = np.log(pos_flux)
    # Weight by flux² — equal-variance noise in linear space becomes
    # `1/flux`-variance in log space, so weights ∝ flux² give the right
    # least-squares cost. Without this the tails dominate the fit and shift
    # the recovered peak.
    coeff = np.polyfit(ra[positive], log_above, deg=2, w=pos_flux)
    a, b, c = float(coeff[0]), float(coeff[1]), float(coeff[2])
    if a >= 0:
        raise ValueError(
            "selected range does not contain a Gaussian-shaped peak "
            "(log-quadratic fit was non-concave); try a different range "
            "or use the polynomial fit"
        )
    mu = -b / (2.0 * a)
    log_amp = c - (b * b) / (4.0 * a)
    amplitude = float(np.exp(log_amp))
    sigma_sq = -1.0 / (2.0 * a)
    sigma = float(np.sqrt(sigma_sq))
    ra_grid = np.linspace(ra_min, ra_max, grid_size)
    flux_grid = amplitude * np.exp(-0.5 * ((ra_grid - mu) / sigma) ** 2) + baseline
    max_idx = int(np.argmax(flux_grid))
    peak_flux = float(flux_grid[max_idx])
    peak_ra = float(ra_grid[max_idx])
    _push_source_undo(workspace)
    workspace.peak_flux = peak_flux
    return peak_flux, ra_grid, flux_grid, peak_ra


def determine_peak_fit(
    workspace: ScanWorkspace,
    ra_min: float,
    ra_max: float,
    degree: int,
    *,
    grid_size: int = 200,
) -> tuple[float, NDArray[np.float64], NDArray[np.float64], float]:
    """Fit a polynomial over a user-selected RA range and record its peak.

    The user drags a band on the flux plot; this routine fits
    `np.polyfit(ra, flux, deg=degree)` to the kept source samples inside that
    band, evaluates the fit on a dense grid, and stores the grid's maximum on
    `workspace.peak_flux`. Returns `(peak_flux, ra_grid, flux_grid, peak_ra)`
    — the grid arrays are returned so the UI can draw the fit on top of the
    data; nothing about the grid is persisted on the workspace.

    Uses the same `np.polyfit` pattern as `scan.subtract_baseline` so we don't
    invent a second polynomial-fit code path.
    """
    if degree not in (2, 3, 4):
        raise ValueError(f"degree must be 2, 3, or 4 (got {degree})")
    if ra_min == ra_max:
        raise ValueError("peak-fit range must be non-empty")
    if ra_min > ra_max:
        ra_min, ra_max = ra_max, ra_min
    region = (
        (workspace.source_ra >= ra_min)
        & (workspace.source_ra <= ra_max)
        & workspace.source_mask
    )
    n = int(region.sum())
    if n < degree + 1:
        raise ValueError(
            f"need at least {degree + 1} kept samples in the range to fit a "
            f"degree-{degree} polynomial (found {n})"
        )
    ra = workspace.source_ra[region]
    flux = current_source_flux(workspace)[region]
    coeff = np.polyfit(ra, flux, deg=degree)
    ra_grid = np.linspace(ra_min, ra_max, grid_size)
    flux_grid = np.polyval(coeff, ra_grid)
    max_idx = int(np.argmax(flux_grid))
    peak_flux = float(flux_grid[max_idx])
    peak_ra = float(ra_grid[max_idx])
    _push_source_undo(workspace)
    workspace.peak_flux = peak_flux
    return peak_flux, ra_grid, flux_grid, peak_ra


def determine_peak_squared_cosine(
    workspace: ScanWorkspace,
    ra_min: float,
    ra_max: float,
    *,
    grid_size: int = 200,
) -> tuple[float, NDArray[np.float64], NDArray[np.float64], float]:
    """Fit a squared-cosine lobe `A·cos²(π(x − x₀)/W) + B` over a user range.

    The drag width is taken as the lobe width `W = ra_max − ra_min` so the
    three free parameters are `A`, `B`, and the center `x₀`. With `W`
    fixed the identity `cos²θ = (1 + cos 2θ)/2` linearizes the model:

        f(x) = c₀ + c₁·cos(2π x / W) + c₂·sin(2π x / W)

    which we solve with `np.linalg.lstsq` and convert back:
    `A = 2·√(c₁² + c₂²)`, `B = c₀ − A/2`,
    `x₀ = atan2(c₂, c₁) · W / (2π)`.  Pure numpy, like the log-quadratic
    Gaussian path — no scipy dependency.
    """
    if ra_min == ra_max:
        raise ValueError("peak-fit range must be non-empty")
    if ra_min > ra_max:
        ra_min, ra_max = ra_max, ra_min
    region = (
        (workspace.source_ra >= ra_min)
        & (workspace.source_ra <= ra_max)
        & workspace.source_mask
    )
    n = int(region.sum())
    if n < 4:
        raise ValueError(
            f"need at least 4 kept samples in the range to fit a squared "
            f"cosine (found {n})"
        )
    ra = workspace.source_ra[region]
    flux = current_source_flux(workspace)[region]
    width = float(ra_max - ra_min)
    omega = 2.0 * np.pi / width
    design = np.column_stack(
        [np.ones_like(ra), np.cos(omega * ra), np.sin(omega * ra)]
    )
    coeff, *_ = np.linalg.lstsq(design, flux, rcond=None)
    c0, c1, c2 = float(coeff[0]), float(coeff[1]), float(coeff[2])
    amplitude = 2.0 * float(np.hypot(c1, c2))
    if amplitude <= 0.0:
        raise ValueError(
            "selected range does not contain a squared-cosine-shaped peak"
        )
    baseline = c0 - amplitude / 2.0
    center = float(np.arctan2(c2, c1)) * width / (2.0 * np.pi)
    ra_grid = np.linspace(ra_min, ra_max, grid_size)
    flux_grid = amplitude * np.cos(np.pi * (ra_grid - center) / width) ** 2 + baseline
    max_idx = int(np.argmax(flux_grid))
    peak_flux = float(flux_grid[max_idx])
    peak_ra = float(ra_grid[max_idx])
    _push_source_undo(workspace)
    workspace.peak_flux = peak_flux
    return peak_flux, ra_grid, flux_grid, peak_ra


def determine_peak_max_value(
    workspace: ScanWorkspace,
    ra_min: float,
    ra_max: float,
) -> tuple[float, NDArray[np.float64], NDArray[np.float64], float]:
    """Pick the largest kept sample in the user-selected RA band.

    No curve fit — just `argmax` over the kept source flux in the range.
    Returns single-element `ra_grid`/`flux_grid` arrays so the response
    shape matches the other peak-fit operations; the UI branches on the
    selected kind to decide whether to draw a curve or a single highlight.
    """
    if ra_min == ra_max:
        raise ValueError("peak-fit range must be non-empty")
    if ra_min > ra_max:
        ra_min, ra_max = ra_max, ra_min
    region = (
        (workspace.source_ra >= ra_min)
        & (workspace.source_ra <= ra_max)
        & workspace.source_mask
    )
    n = int(region.sum())
    if n < 1:
        raise ValueError("need at least 1 kept sample in the range to pick a max")
    ra = workspace.source_ra[region]
    flux = current_source_flux(workspace)[region]
    max_idx = int(np.argmax(flux))
    peak_flux = float(flux[max_idx])
    peak_ra = float(ra[max_idx])
    ra_grid = np.array([peak_ra], dtype=np.float64)
    flux_grid = np.array([peak_flux], dtype=np.float64)
    _push_source_undo(workspace)
    workspace.peak_flux = peak_flux
    return peak_flux, ra_grid, flux_grid, peak_ra


def undo_scan(workspace: ScanWorkspace) -> bool:
    """Revert the most recent cal-side or source-side mutation."""
    if not workspace.undo_stack:
        return False
    snap = workspace.undo_stack.pop()
    kind = snap.get("kind")
    if kind == "cal":
        workspace.initial = ScanCalBracket(
            on_flux=workspace.initial.on_flux,
            off_flux=workspace.initial.off_flux,
            on_ra=workspace.initial.on_ra,
            off_ra=workspace.initial.off_ra,
            on_dec=workspace.initial.on_dec,
            off_dec=workspace.initial.off_dec,
            on_mask=snap["initial_on"],  # type: ignore[arg-type]
            off_mask=snap["initial_off"],  # type: ignore[arg-type]
        )
        workspace.terminal = ScanCalBracket(
            on_flux=workspace.terminal.on_flux,
            off_flux=workspace.terminal.off_flux,
            on_ra=workspace.terminal.on_ra,
            off_ra=workspace.terminal.off_ra,
            on_dec=workspace.terminal.on_dec,
            off_dec=workspace.terminal.off_dec,
            on_mask=snap["terminal_on"],  # type: ignore[arg-type]
            off_mask=snap["terminal_off"],  # type: ignore[arg-type]
        )
        return True
    if kind == "source":
        workspace.source_mask = snap["source_mask"]  # type: ignore[assignment]
        workspace.reduced_source_flux = snap["reduced"]  # type: ignore[assignment]
        workspace.peak_flux = snap["peak_flux"]  # type: ignore[assignment]
        return True
    return False


def apply_flux_calibration_scan(workspace: ScanWorkspace, slope: float) -> None:
    """Multiply gain-calibrated scan flux by `slope` (Jy/GCU). Idempotent guard.

    Requires the scan to already be gain-calibrated. Also rescales any
    reduced flux array and the stored peak so the displayed value stays in
    the same unit as the underlying samples.
    """
    if not workspace.calibrated or workspace.calibrated_source_flux is None:
        raise ValueError("scan must be gain-calibrated before flux calibration")
    if workspace.flux_calibrated:
        return
    if slope == 0.0:
        raise ValueError("flux calibration slope must be nonzero")
    workspace.calibrated_source_flux = workspace.calibrated_source_flux * slope
    if workspace.reduced_source_flux is not None:
        workspace.reduced_source_flux = workspace.reduced_source_flux * slope
    if workspace.peak_flux is not None:
        workspace.peak_flux = float(workspace.peak_flux) * slope
    workspace.flux_calibrated = True
    workspace.flux_slope = float(slope)


def revert_flux_calibration_scan(workspace: ScanWorkspace) -> None:
    """Undo a previously-applied flux calibration, returning flux to GCU."""
    if not workspace.flux_calibrated or workspace.flux_slope in (None, 0.0):
        return
    slope = workspace.flux_slope
    assert slope is not None
    if workspace.calibrated_source_flux is not None:
        workspace.calibrated_source_flux = workspace.calibrated_source_flux / slope
    if workspace.reduced_source_flux is not None:
        workspace.reduced_source_flux = workspace.reduced_source_flux / slope
    if workspace.peak_flux is not None:
        workspace.peak_flux = float(workspace.peak_flux) / slope
    workspace.flux_calibrated = False
    workspace.flux_slope = None


def set_bracket_enabled_scan(workspace: ScanWorkspace, bracket: str, enabled: bool) -> None:
    if bracket == "initial":
        workspace.initial_enabled = bool(enabled)
    elif bracket == "terminal":
        workspace.terminal_enabled = bool(enabled)
    else:
        raise ValueError(f"bracket must be 'initial' or 'terminal', got {bracket!r}")


def workspace_to_scan(workspace: ScanWorkspace) -> Scan:
    """Project the workspace's current state into a `Scan` for .scn writing.

    Cut source samples are emitted with `check = -1` (legacy "removed" marker
    from `vb/scanform.frm:1296-1304`) rather than dropped — the total sample
    count is preserved so the file's row count matches the original
    acquisition. Flux uses the most-recent pipeline output
    (reduced > calibrated > raw). The dec bounds span every source sample
    (cuts don't shrink them, matching the fixtures where `cyg0afull.scn` and
    `cyg0a.scn` share an identical 39.3269 / 42.5123 envelope).
    """
    flux = current_source_flux(workspace)
    check = np.where(workspace.source_mask, 0, -1).astype(np.int_)
    peak = (
        f"Peak Flux: {workspace.peak_flux:.3f}"
        if workspace.peak_flux is not None
        else ""
    )
    return Scan(
        name=workspace.name,
        channel="B" if workspace.calibrated else "A",
        peak=peak,
        min_dec=float(workspace.source_dec.min()),
        max_dec=float(workspace.source_dec.max()),
        min_flux=float(flux.min()),
        max_flux=float(flux.max()),
        check=check,
        ra=np.asarray(workspace.source_ra, dtype=np.float64),
        dec=np.asarray(workspace.source_dec, dtype=np.float64),
        flux=np.asarray(flux, dtype=np.float64),
        raw_bytes=None,
    )


# VB's Format$(x, "#.###") omits the leading zero for |x| < 1, so legacy
# files carry "Peak Flux: .456" / "Peak Flux: -.456" — the integer part must
# be optional or sub-unity peaks parse to None and get destroyed on the next
# save (bug #37).
_PEAK_RE = re.compile(r"Peak Flux:\s*(-?(?:\d+(?:\.\d+)?|\.\d+))", re.IGNORECASE)


def _parse_scn_peak(peak: str) -> float | None:
    match = _PEAK_RE.search(peak or "")
    return float(match.group(1)) if match else None


def scan_from_scn(scan: Scan, path: str) -> ScanWorkspace:
    """Reconstruct a `ScanWorkspace` from a parsed `.scn` file.

    Inverts `workspace_to_scan`. The `.scn` format does not carry the 240
    cal-bracket samples, so the workspace gets empty `ScanCalBracket`
    instances — `cal_value()` returns 0.0 for empty inputs and the UI keeps
    "Calibrate Scan" disabled while `workspace.calibrated == True`.

    `channel == "B"` is the legacy gain-calibrated flag (see
    `workspace_to_scan` at line 526); the file's flux arrays are seeded into
    `calibrated_source_flux` so the workspace presents itself as already
    calibrated. `channel == "A"` is the raw case (uncommon) — we leave
    `calibrated_source_flux = None`.

    Cut samples (`check == -1`) become `source_mask = False`; `source_flux`
    stores the same flux values for both kept and cut rows (matching what's
    on disk).
    """
    n = int(scan.ra.shape[0])
    empty_bracket = ScanCalBracket(
        on_flux=np.zeros(0, dtype=np.float64),
        off_flux=np.zeros(0, dtype=np.float64),
        on_ra=np.zeros(0, dtype=np.float64),
        off_ra=np.zeros(0, dtype=np.float64),
        on_dec=np.zeros(0, dtype=np.float64),
        off_dec=np.zeros(0, dtype=np.float64),
        on_mask=np.zeros(0, dtype=bool),
        off_mask=np.zeros(0, dtype=bool),
    )
    source_flux = np.asarray(scan.flux, dtype=np.float64).copy()
    workspace = ScanWorkspace(
        name=scan.name or Path(path).stem.upper(),
        path=path,
        md1=MD1Document(
            samples=RawSweep(
                ra=np.zeros(0, dtype=np.float64),
                dec=np.zeros(0, dtype=np.float64),
                flux=np.zeros(0, dtype=np.float64),
            ),
            raw_bytes=scan.raw_bytes or b"",
        ),
        initial=empty_bracket,
        terminal=empty_bracket,
        source_ra=np.asarray(scan.ra, dtype=np.float64).copy(),
        source_dec=np.asarray(scan.dec, dtype=np.float64).copy(),
        source_flux=source_flux,
        source_mask=(np.asarray(scan.check, dtype=np.int_) == 0),
    )
    if scan.channel == "B":
        workspace.calibrated_source_flux = source_flux.copy()
    workspace.peak_flux = _parse_scn_peak(scan.peak)
    return workspace
