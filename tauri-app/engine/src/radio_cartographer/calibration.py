from __future__ import annotations

import numpy as np

from .models import CalibrationTable


def fit_gain(table: CalibrationTable) -> float:
    measured = np.array([e.measured_flux for e in table.entries], dtype=np.float64)
    known = np.array([e.known_flux for e in table.entries], dtype=np.float64)
    if measured.size == 0:
        raise ValueError("empty calibration table")
    return float(np.dot(measured, known) / np.dot(measured, measured))


def counts_to_jy(flux_counts: np.ndarray, gain: float) -> np.ndarray:
    return flux_counts.astype(np.float64, copy=False) * float(gain)
