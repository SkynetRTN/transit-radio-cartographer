from __future__ import annotations

from .models import Scan, Survey, Sweep
from .scan import align_dec, baseline_subtract, smooth_flux


def sweep_to_scan(sweep: Sweep, name: str = "", channel: str = "a", peak: str = "") -> Scan:
    return Scan(
        name=name,
        channel=channel,
        peak=peak,
        min_dec=float(sweep.dec.min()),
        max_dec=float(sweep.dec.max()),
        min_flux=float(sweep.flux.min()),
        max_flux=float(sweep.flux.max()),
        check=(sweep.ra * 0).astype(int),
        ra=sweep.ra,
        dec=sweep.dec,
        flux=sweep.flux,
    )


def reduce_sweep(sweep: Sweep, *, smooth_window: int = 5, baseline_degree: int = 1, align_offset: float = 0.0) -> Sweep:
    scan = sweep_to_scan(sweep)
    scan = smooth_flux(scan, smooth_window)
    scan = baseline_subtract(scan, baseline_degree)
    scan = align_dec(scan, align_offset)
    return Sweep(
        ra=scan.ra,
        dec=scan.dec,
        flux=scan.flux,
        min_dec=float(scan.dec.min()),
        max_dec=float(scan.dec.max()),
        min_flux=float(scan.flux.min()),
        max_flux=float(scan.flux.max()),
    )


def apply_to_survey(survey: Survey, **kwargs: float) -> Survey:
    sweeps = tuple(reduce_sweep(s, **kwargs) for s in survey.sweeps)
    return Survey(survey.label1, survey.label2, survey.sweep_count, survey.swp, survey.sweep0, sweeps)
