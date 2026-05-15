from __future__ import annotations

import numpy as np

from .models import Image, Palette


def apply_palette(image: Image, palette: Palette) -> np.ndarray:
    if palette.count == 0:
        gray = np.clip(image.pixels, 0, 255).astype(np.uint8)
        return np.stack([gray, gray, gray], axis=-1)
    anchors = np.array([s.anchor for s in palette.stops], dtype=np.float64)
    r = np.array([s.r for s in palette.stops], dtype=np.float64)
    g = np.array([s.g for s in palette.stops], dtype=np.float64)
    b = np.array([s.b for s in palette.stops], dtype=np.float64)
    vals = image.pixels.astype(np.float64)
    rr = np.interp(vals, anchors, r)
    gg = np.interp(vals, anchors, g)
    bb = np.interp(vals, anchors, b)
    return np.clip(np.stack([rr, gg, bb], axis=-1), 0, 255).astype(np.uint8)
