"""Minimal PNG writer for the rendered survey image.

BUG-005 (dan): the Image menu's raster export is now "Save as PNG" instead of
"Save Bitmap As". Rather than pull in Pillow, this emits a straightforward
8-bit truecolor (RGB) PNG using only numpy + the stdlib ``zlib``/``struct`` —
the same (H, W, 3) uint8 array ``apply_palette`` already produces for the BMP
path. Rows are top-down with a per-row filter byte of 0 (no filtering).
"""

from __future__ import annotations

import struct
import zlib
from pathlib import Path

import numpy as np
from numpy.typing import NDArray


def _chunk(tag: bytes, data: bytes) -> bytes:
    return (
        struct.pack(">I", len(data))
        + tag
        + data
        + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
    )


def write_png_from_rgb(rgb: NDArray[np.uint8], path: str | Path) -> None:
    """Write an 8-bit truecolor PNG from an (H, W, 3) RGB uint8 array."""
    if rgb.ndim != 3 or rgb.shape[2] != 3:
        raise ValueError(f"rgb array must be (H, W, 3), got {rgb.shape}")
    h, w, _ = rgb.shape
    arr = np.ascontiguousarray(rgb, dtype=np.uint8)
    # Prepend a zero filter byte to each scanline (filter type 0 = None).
    filtered = np.zeros((h, w * 3 + 1), dtype=np.uint8)
    filtered[:, 1:] = arr.reshape(h, w * 3)
    compressed = zlib.compress(filtered.tobytes(), 9)

    signature = b"\x89PNG\r\n\x1a\n"
    # IHDR: width, height, bit depth 8, color type 2 (RGB), no compression/
    # filter/interlace variants.
    ihdr = struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0)
    out = (
        signature
        + _chunk(b"IHDR", ihdr)
        + _chunk(b"IDAT", compressed)
        + _chunk(b"IEND", b"")
    )
    Path(path).write_bytes(out)
