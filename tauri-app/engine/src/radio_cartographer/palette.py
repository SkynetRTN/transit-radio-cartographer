from __future__ import annotations

import numpy as np
from numpy.typing import NDArray

from radio_cartographer.models import Palette


def apply_palette(values: NDArray[np.float64], palette: Palette, flux_min: float, flux_max: float) -> NDArray[np.uint8]:
    stops = sorted(palette.stops, key=lambda s: s.anchor)
    anchors = np.array([s.anchor for s in stops], dtype=np.float64)
    r = np.array([s.r for s in stops], dtype=np.float64)
    g = np.array([s.g for s in stops], dtype=np.float64)
    b = np.array([s.b for s in stops], dtype=np.float64)

    scaled = (values.astype(np.float64) - flux_min) / (flux_max - flux_min) * 255.0
    scaled = np.clip(scaled, 0.0, 255.0)

    rr = np.interp(scaled, anchors, r)
    gg = np.interp(scaled, anchors, g)
    bb = np.interp(scaled, anchors, b)
    return np.stack([rr, gg, bb], axis=-1).round().astype(np.uint8)
