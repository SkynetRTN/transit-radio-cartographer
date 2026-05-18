from __future__ import annotations

import numpy as np
from numpy.typing import NDArray

from .models import Palette


def apply_palette(
    data: NDArray[np.float64], palette: Palette, flux_min: float, flux_max: float
) -> NDArray[np.uint8]:
    arr = np.asarray(data, dtype=np.float64)
    clipped = np.clip(arr, flux_min, flux_max)
    norm = (clipped - flux_min) / max(flux_max - flux_min, 1e-12)

    stops = sorted(palette.stops, key=lambda s: s.anchor)
    anchors = np.array([s.anchor for s in stops], dtype=np.float64)
    if anchors.max() > 1.0:
        anchors = anchors / 255.0
    r = np.array([s.r for s in stops], dtype=np.float64)
    g = np.array([s.g for s in stops], dtype=np.float64)
    b = np.array([s.b for s in stops], dtype=np.float64)
    rr = np.interp(norm, anchors, r)
    gg = np.interp(norm, anchors, g)
    bb = np.interp(norm, anchors, b)
    return np.stack([rr, gg, bb], axis=-1).clip(0, 255).astype(np.uint8)
