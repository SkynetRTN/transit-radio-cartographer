from __future__ import annotations

import numpy as np

from .models import CalibrationTable, Survey, Sweep


def fit_counts_to_jy(calibration: CalibrationTable) -> float:
    measured = np.array([e.measured_flux for e in calibration.entries], dtype=np.float64)
    known = np.array([e.known_flux for e in calibration.entries], dtype=np.float64)
    denom = float(np.dot(measured, measured))
    if denom == 0.0:
        return 0.0
    return float(np.dot(measured, known) / denom)


def apply_gain_to_sweep(sweep: Sweep, gain: float) -> Sweep:
    flux = np.asarray(sweep.flux, dtype=np.float64) * gain
    # Preserve the sweep metadata: dec bounds are untouched by a flux scale,
    # and the flux bounds scale with the data (min/max swap if gain < 0).
    # Dropping them would make the calibrated Survey unserializable — the
    # .srv writer requires every bound. `calib` records the applied gain so
    # downstream code can introspect what calibration the survey carries.
    scaled = [
        b * gain for b in (sweep.min_flux, sweep.max_flux) if b is not None
    ]
    return Sweep(
        ra=sweep.ra,
        dec=sweep.dec,
        flux=flux,
        min_dec=sweep.min_dec,
        max_dec=sweep.max_dec,
        min_flux=min(scaled) if scaled else None,
        max_flux=max(scaled) if scaled else None,
        calib=gain,
    )


def apply_calibration(survey: Survey, calibration: CalibrationTable) -> Survey:
    gain = fit_counts_to_jy(calibration)
    sweeps = tuple(apply_gain_to_sweep(s, gain) for s in survey.sweeps)
    return Survey(
        label1=survey.label1,
        label2=survey.label2,
        sweep_count=survey.sweep_count,
        swp=survey.swp,
        sweep0=apply_gain_to_sweep(survey.sweep0, gain),
        sweeps=sweeps,
    )
