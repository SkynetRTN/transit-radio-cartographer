from __future__ import annotations

from collections.abc import Callable
from dataclasses import replace

import numpy as np

from .models import RawSweep, Survey, Sweep
from .scan import align_dec_shifts, smooth_flux, subtract_baseline


def reduce_raw_sweep(raw: RawSweep) -> Sweep:
    return Sweep(
        ra=np.asarray(raw.ra, dtype=np.float64),
        dec=np.asarray(raw.dec, dtype=np.float64),
        flux=np.asarray(raw.flux, dtype=np.float64),
    )


def smooth_sweep(sweep: Sweep, window: int = 5) -> Sweep:
    return replace(sweep, flux=smooth_flux(sweep.flux, window=window))


def baseline_sweep(sweep: Sweep, degree: int = 1) -> Sweep:
    return replace(sweep, flux=subtract_baseline(sweep.dec, sweep.flux, degree=degree))


def align_survey(survey: Survey, max_delta_deg: float) -> Survey:
    """Apply the legacy Align Sweeps algorithm to every adjacent sweep pair.

    `max_delta_deg` is the bound on the lag the FFT cross-correlation may
    pick — not a fixed shift. See [scan.align_dec_shifts][] for details.
    """
    decs = [s.dec for s in survey.sweeps]
    fluxes = [s.flux for s in survey.sweeps]
    deltas = align_dec_shifts(decs, fluxes, max_delta_deg=max_delta_deg)
    sweeps = tuple(
        replace(s, dec=np.asarray(s.dec, dtype=np.float64) + d)
        for s, d in zip(survey.sweeps, deltas)
    )
    return replace(survey, sweeps=sweeps)


def apply_to_survey(survey: Survey, op: str, **kwargs: float | int) -> Survey:
    if op == "align":
        return align_survey(survey, max_delta_deg=float(kwargs.get("offset", 0.0)))
    ops: dict[str, Callable[[Sweep], Sweep]] = {
        "smooth": lambda s: smooth_sweep(s, int(kwargs.get("window", 5))),
        "baseline": lambda s: baseline_sweep(s, int(kwargs.get("degree", 1))),
    }
    fn = ops[op]
    sweeps: tuple[Sweep, ...] = tuple(fn(s) for s in survey.sweeps)
    return replace(survey, sweeps=sweeps)
