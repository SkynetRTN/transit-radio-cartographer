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
    return Sweep(ra=sweep.ra, dec=sweep.dec, flux=flux, calib=gain)


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
