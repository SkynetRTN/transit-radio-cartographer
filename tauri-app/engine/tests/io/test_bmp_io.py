"""§6.1 codec tests for `.bmp` (rendered survey bitmap).

No `.bmp` fixture is checked in for Phase 1. The legacy `SavePicture` write
path is byte-fragile (plan §9), and we have not yet captured a reference
artifact from `KARALEAH2002.exe`. For now `.bmp` is opaque-bytes round-trip
only; this file pins that contract so we notice if it regresses.

Upgrade-path: when a `.bmp` fixture lands, replace `_synth_bmp` below with a
real fixture file and add a `test_write_bmp_matches_legacy_bytes` case.
"""

from __future__ import annotations

import struct
from pathlib import Path

from radio_cartographer.io.bmp import read_bmp, write_bmp
from radio_cartographer.models import Bitmap


def _synth_bmp() -> bytes:
    """Minimal 24-bit BI_RGB BMP. 1×1 pixel, single black entry."""
    width = height = 1
    row = bytes([0, 0, 0, 0])  # 3 RGB bytes + 1 pad byte (4-byte aligned)
    pixels = row * height
    bmp_size = 14 + 40 + len(pixels)
    header = b"BM" + struct.pack("<I", bmp_size) + b"\x00\x00\x00\x00"
    header += struct.pack("<I", 14 + 40)
    dib = struct.pack(
        "<IIIHHIIIIII",
        40,  # DIB header size
        width,
        height,
        1,  # planes
        24,  # bits-per-pixel
        0,  # BI_RGB
        len(pixels),  # image size
        2835,  # x ppm
        2835,  # y ppm
        0,
        0,
    )
    return header + dib + pixels


def test_round_trip_bmp_bytes(tmp_path: Path) -> None:
    raw = _synth_bmp()
    src = tmp_path / "tiny.bmp"
    src.write_bytes(raw)
    bitmap = read_bmp(src)
    out = tmp_path / "tiny_out.bmp"
    write_bmp(bitmap, out)
    assert out.read_bytes() == src.read_bytes()


def test_bitmap_dataclass_carries_raw_bytes(tmp_path: Path) -> None:
    raw = _synth_bmp()
    bitmap = Bitmap(raw_bytes=raw)
    out = tmp_path / "from_dataclass.bmp"
    write_bmp(bitmap, out)
    assert out.read_bytes() == raw
