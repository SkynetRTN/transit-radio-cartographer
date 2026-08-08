from __future__ import annotations

from collections.abc import Callable
from dataclasses import replace

import numpy as np

from .models import RawSweep, Survey, Sweep
from .scan import align_dec_shifts, smooth_flux, subtract_baseline_envelope


def reduce_raw_sweep(raw: RawSweep) -> Sweep:
    return Sweep(
        ra=np.asarray(raw.ra, dtype=np.float64),
        dec=np.asarray(raw.dec, dtype=np.float64),
        flux=np.asarray(raw.flux, dtype=np.float64),
    )


def _replace_flux(sweep: Sweep, flux: np.ndarray) -> Sweep:
    # The legacy oracle recomputes per-sweep MinFlux/MaxFlux inside both the
    # Smooth Sweeps and Baseline Sweeps loops (vb/survform.frm:2182, 2449-2456).
    if flux.size == 0:
        return replace(sweep, flux=flux)
    return replace(
        sweep,
        flux=flux,
        min_flux=float(np.min(flux)),
        max_flux=float(np.max(flux)),
    )


def smooth_sweep(sweep: Sweep, window: int = 5) -> Sweep:
    return _replace_flux(sweep, smooth_flux(sweep.flux, window=window))


def baseline_sweep(sweep: Sweep, base_deg: float = 5.0) -> Sweep:
    # `base_deg` is the legacy "Baseline Length (Degrees)" — an angular
    # window in declination, NOT a polynomial degree.
    return _replace_flux(
        sweep, subtract_baseline_envelope(sweep.dec, sweep.flux, base_deg=base_deg)
    )


def align_survey(survey: Survey, max_delta_deg: float) -> Survey:
    """Apply the legacy Align Sweeps algorithm to every adjacent sweep pair.

    `max_delta_deg` is the bound on the lag the FFT cross-correlation may
    pick — not a fixed shift. See [scan.align_dec_shifts][] for details.
    """
    decs = [s.dec for s in survey.sweeps]
    fluxes = [s.flux for s in survey.sweeps]
    deltas = align_dec_shifts(decs, fluxes, max_delta_deg=max_delta_deg)
    sweeps = tuple(
        replace(
            s,
            dec=np.asarray(s.dec, dtype=np.float64) + d,
            # The oracle shifts the per-sweep dec bounds along with the samples
            # (vb/survform.frm:2734-2735).
            min_dec=None if s.min_dec is None else s.min_dec + d,
            max_dec=None if s.max_dec is None else s.max_dec + d,
        )
        for s, d in zip(survey.sweeps, deltas)
    )
    # raw_bytes must not survive a reduction: write_srv short-circuits to it
    # verbatim, which would silently discard the reduced data.
    return replace(survey, sweeps=sweeps, raw_bytes=None)


def apply_to_survey(survey: Survey, op: str, **kwargs: float | int) -> Survey:
    if op == "align":
        return align_survey(survey, max_delta_deg=float(kwargs.get("offset", 0.0)))
    ops: dict[str, Callable[[Sweep], Sweep]] = {
        "smooth": lambda s: smooth_sweep(s, int(kwargs.get("window", 5))),
        "baseline": lambda s: baseline_sweep(s, float(kwargs.get("base_deg", 5.0))),
    }
    fn = ops[op]
    sweeps: tuple[Sweep, ...] = tuple(fn(s) for s in survey.sweeps)
    # See align_survey: a reduced survey must never keep the pre-reduction
    # raw_bytes, or write_srv would emit the original file unchanged.
    return replace(survey, sweeps=sweeps, raw_bytes=None)
