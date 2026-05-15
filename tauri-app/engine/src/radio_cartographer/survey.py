from __future__ import annotations

from dataclasses import replace

import numpy as np

from .models import RawSweep, Survey, Sweep
from .scan import align_by_offset, smooth_flux, subtract_baseline


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


def align_sweep(sweep: Sweep, offset: float) -> Sweep:
    return replace(sweep, flux=align_by_offset(sweep.dec, sweep.flux, offset=offset))


def apply_to_survey(survey: Survey, op: str, **kwargs: float | int) -> Survey:
    fn = {
        "smooth": lambda s: smooth_sweep(s, int(kwargs.get("window", 5))),
        "baseline": lambda s: baseline_sweep(s, int(kwargs.get("degree", 1))),
        "align": lambda s: align_sweep(s, float(kwargs.get("offset", 0.0))),
    }[op]
    sweeps = tuple(fn(s) for s in survey.sweeps)
    return replace(survey, sweeps=sweeps)
