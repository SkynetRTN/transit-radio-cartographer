"""Flux calibration — convert gain-calibrated counts (GCU) to Janskies.

A `.cal` file holds a list of (source_name, measured_flux, known_flux) entries
collected from observations of known calibrators. Fitting them produces a
single slope `Jy / GCU` that the survey/scan workspaces apply on top of their
already-gain-calibrated flux arrays.

The legacy KaraLeah app (vb/calform.frm) let the user manually drag a pink
line to set the slope. We replace that with a least-squares fit through the
origin, which is the natural automatic equivalent (0 GCU = 0 Jy is physically
required) — see `radio_cartographer.calibration.fit_counts_to_jy`.
"""

from __future__ import annotations

import math
from pathlib import Path

import numpy as np

from .calibration import fit_counts_to_jy
from .io.scn import read_scn
from .models import CalibrationTable

__all__ = [
    "fit_counts_to_jy",
    "default_known_jy",
    "fit_error",
    "read_scn_peak",
]

# Known-flux defaults for the standard calibrators. Keys are the first
# three characters of the source name, matched case-insensitively.
_DEFAULT_JY: dict[str, float] = {
    "VIR": 226.1,
    "TAU": 841.7,
    "CYG": 1566.8,
}


def default_known_jy(name: str) -> float:
    """Return the legacy default known-Jy value for a calibrator name.

    Matches the first three characters of `name` against the known table
    (VIR=230.8, TAU=846.3, CYG=1605.9). Anything else returns 0, matching the
    legacy "user must type it in" behavior.
    """
    if not name:
        return 0.0
    return _DEFAULT_JY.get(name[:3].upper(), 0.0)


def fit_error(table: CalibrationTable) -> float:
    """RMS error of the least-squares fit, matching legacy calform.frm:554-559.

    `Errr = sqrt(sum((Slope*MF_i - KF_i)^2) / (N - 1))`. Returns 0.0 when
    there is at most one entry (legacy guards the same way).
    """
    if table.count <= 1:
        return 0.0
    slope = fit_counts_to_jy(table)
    measured = np.array([e.measured_flux for e in table.entries], dtype=np.float64)
    known = np.array([e.known_flux for e in table.entries], dtype=np.float64)
    residuals = slope * measured - known
    return float(math.sqrt(float(np.dot(residuals, residuals)) / (table.count - 1)))


def read_scn_peak(path: str | Path) -> tuple[str, float]:
    """Open a `.scn` file and return (name, peak_flux).

    The legacy "Add Source" gesture (vb/calform.frm:139-198) reads the
    second header line of the `.scn` (which has the form `"Peak Flux: X"`)
    and parses the trailing number into `MFlux`. Empty peak strings yield
    0.0 — same as the legacy `Val("")`.
    """
    scan = read_scn(path)
    return scan.name, _parse_peak(scan.peak)


def _parse_peak(peak: str) -> float:
    """Extract the numeric part of a `"Peak Flux: X"` string. `""` -> 0.0."""
    text = peak.strip()
    if not text:
        return 0.0
    _, _, tail = text.partition(":")
    tail = tail.strip()
    if not tail:
        return 0.0
    try:
        return float(tail)
    except ValueError:
        return 0.0
