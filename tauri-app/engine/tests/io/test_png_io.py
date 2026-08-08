"""Tests for the PNG writer (BUG-005 dan: scalar image raster export).

No third-party PNG decoder is available (numpy-only engine), so the test
decodes the file by hand: verify the signature, parse IHDR/IDAT/IEND, inflate
the image data, strip the per-row filter byte, and compare pixels.
"""

from __future__ import annotations

import struct
import zlib
from pathlib import Path

import numpy as np
import pytest

from radio_cartographer.io.png import write_png_from_rgb


def _decode_png(data: bytes) -> tuple[int, int, np.ndarray]:
    assert data[:8] == b"\x89PNG\r\n\x1a\n"
    pos = 8
    width = height = 0
    idat = b""
    while pos < len(data):
        (length,) = struct.unpack(">I", data[pos : pos + 4])
        pos += 4
        tag = data[pos : pos + 4]
        pos += 4
        chunk = data[pos : pos + length]
        pos += length + 4  # skip chunk data + CRC
        if tag == b"IHDR":
            width, height, bit_depth, color_type = struct.unpack(">IIBB", chunk[:10])
            assert bit_depth == 8 and color_type == 2  # 8-bit truecolor RGB
        elif tag == b"IDAT":
            idat += chunk
        elif tag == b"IEND":
            break
    raw = zlib.decompress(idat)
    stride = width * 3
    out = np.zeros((height, width, 3), dtype=np.uint8)
    for r in range(height):
        base = r * (stride + 1)
        assert raw[base] == 0  # filter type 0 (None)
        row = raw[base + 1 : base + 1 + stride]
        out[r] = np.frombuffer(row, dtype=np.uint8).reshape(width, 3)
    return width, height, out


def test_write_png_round_trips_rgb(tmp_path: Path) -> None:
    rgb = np.array(
        [[[10, 20, 30], [40, 50, 60]], [[70, 80, 90], [100, 110, 120]]],
        dtype=np.uint8,
    )
    path = tmp_path / "image.png"
    write_png_from_rgb(rgb, path)
    w, h, decoded = _decode_png(path.read_bytes())
    assert (w, h) == (2, 2)
    assert np.array_equal(decoded, rgb)


def test_write_png_rejects_non_rgb_shape(tmp_path: Path) -> None:
    with pytest.raises(ValueError):
        write_png_from_rgb(np.zeros((2, 2), dtype=np.uint8), tmp_path / "bad.png")
