from __future__ import annotations

import numpy as np

from radio_cartographer.models import CalibrationEntry, CalibrationTable


def fit_counts_to_jy(entries: tuple[CalibrationEntry, ...]) -> tuple[float, float]:
    measured = np.array([e.measured_flux for e in entries], dtype=np.float64)
    known = np.array([e.known_flux for e in entries], dtype=np.float64)
    slope, intercept = np.polyfit(measured, known, 1)
    return float(slope), float(intercept)


def calibrate_flux(flux_counts: np.ndarray, table: CalibrationTable) -> np.ndarray:
    slope, intercept = fit_counts_to_jy(table.entries)
    return flux_counts.astype(np.float64) * slope + intercept
