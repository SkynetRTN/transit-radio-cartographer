"""`.bmp` codec — rendered survey image.

The legacy app writes this via Visual Basic's `SavePicture` against a
24-bit `BI_RGB` bitmap. Byte-exact fidelity to that path is documented as
fragile (see [agents/tauri_plan.md](../../../../agents/tauri_plan.md) §9 and
§8.3 risk note). No `.bmp` fixture is checked in yet, so for Phase 1 we
treat `.bmp` as opaque bytes — `read_bmp` returns a `Bitmap` that wraps the
file content, `write_bmp` emits those bytes verbatim. Round-trip is
byte-identical by construction.

When a fixture is captured (Phase 6 risk-mitigation work), upgrade this
module to parse the BMP header and pixel array, and add a writer that emits
the same byte sequence as `SavePicture` does on the legacy EXE.
"""

from __future__ import annotations

import struct
from pathlib import Path

import numpy as np
from numpy.typing import NDArray

from ..models import Bitmap


def read_bmp(path: str | Path) -> Bitmap:
    return Bitmap(raw_bytes=Path(path).read_bytes())


def write_bmp(bitmap: Bitmap, path: str | Path) -> None:
    Path(path).write_bytes(bitmap.raw_bytes)


def write_bmp_from_rgb(rgb: NDArray[np.uint8], path: str | Path) -> None:
    """Write a 24-bit BI_RGB bitmap from an (H, W, 3) RGB uint8 array.

    BMP rows are bottom-up and each row is padded to a multiple of 4 bytes —
    so we flip vertically and add the per-row pad before writing. This is a
    fresh writer for the new Save Bitmap As path; the legacy `write_bmp` for
    pre-captured opaque-byte fixtures stays untouched.
    """
    if rgb.ndim != 3 or rgb.shape[2] != 3:
        raise ValueError(f"rgb array must be (H, W, 3), got {rgb.shape}")
    h, w, _ = rgb.shape
    row_bytes = w * 3
    pad = (4 - (row_bytes % 4)) % 4
    padded_row = row_bytes + pad
    pixel_bytes = padded_row * h
    file_size = 14 + 40 + pixel_bytes  # BITMAPFILEHEADER + BITMAPINFOHEADER + pixels.

    out = bytearray()
    # BITMAPFILEHEADER (14 bytes).
    out += b"BM"
    out += struct.pack("<I", file_size)
    out += struct.pack("<HH", 0, 0)
    out += struct.pack("<I", 14 + 40)
    # BITMAPINFOHEADER (40 bytes).
    out += struct.pack("<I", 40)
    out += struct.pack("<i", w)
    out += struct.pack("<i", h)
    out += struct.pack("<H", 1)
    out += struct.pack("<H", 24)
    out += struct.pack("<I", 0)  # BI_RGB
    out += struct.pack("<I", pixel_bytes)
    out += struct.pack("<i", 2835)  # ~72 DPI
    out += struct.pack("<i", 2835)
    out += struct.pack("<I", 0)
    out += struct.pack("<I", 0)
    # Pixel data: bottom-up, BGR order.
    flipped = rgb[::-1]
    bgr = flipped[..., ::-1].astype(np.uint8, copy=False)
    row_pad = b"\x00" * pad
    for row in bgr:
        out += row.tobytes()
        out += row_pad
    Path(path).write_bytes(bytes(out))
