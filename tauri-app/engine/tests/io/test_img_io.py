"""§6.1 codec tests for `.img` (gridded survey image — binary format)."""

from __future__ import annotations

from pathlib import Path

import numpy as np
import pytest
from radio_cartographer.io.img import read_img, write_img

IMG_FIXTURES = [
    "cassio_a.img",
    "center_a.img",
    "crab_a.img",
    "cygnus_a.img",
    "erira2025.img",
    "morning_a.img",
    "orion_a.img",
    "spur_a.img",
    "sun_a.img",
    "virgo_a.img",
]


@pytest.mark.parametrize("name", IMG_FIXTURES)
def test_round_trip_img(outputs_dir: Path, tmp_path: Path, name: str) -> None:
    src = outputs_dir / name
    img = read_img(src)
    out = tmp_path / name
    write_img(img, out)
    assert out.read_bytes() == src.read_bytes()


def test_img_pixel_layout_matches_legacy(outputs_dir: Path) -> None:
    """Pixel grid shape derives from `Pix%` via VB's `Int(W/15/Pix%)+1` formula.

    With `Pix=1`, the legacy formula gives a `(319, 399)` grid of `Int16`s.
    """
    img = read_img(outputs_dir / "cygnus_a.img")
    assert img.pix == 1
    assert img.pixels.shape == (319, 399)
    assert img.pixels.dtype == np.int16


def test_img_header_fields_match_cygnus(outputs_dir: Path) -> None:
    img = read_img(outputs_dir / "cygnus_a.img")
    assert img.name == "Cygnus"
    assert img.min_ra == pytest.approx(71550.33)
    assert img.max_ra == pytest.approx(78318.17)
    assert img.min_dec == pytest.approx(24.88)
    assert img.max_dec == pytest.approx(60.15)
    assert img.palette.count == 9


def test_img_pixels_contain_signal(outputs_dir: Path) -> None:
    img = read_img(outputs_dir / "cygnus_a.img")
    # At least one bright pixel must be non-zero; otherwise the codec is
    # reading garbage or zeroing the grid.
    assert int(img.pixels.max()) > 0


def test_img_unit_roundtrip(outputs_dir: Path, tmp_path: Path) -> None:
    """When `unit` is set, `write_img` appends it after the pixel grid and
    `read_img` reads it back. When `unit` is None (legacy files) the suffix
    is omitted, preserving byte-exact round-trip with legacy fixtures."""
    from dataclasses import replace

    src = read_img(outputs_dir / "cygnus_a.img")
    # Legacy file: no unit on disk.
    assert src.unit is None
    # Round-trip with an explicit unit and verify it comes back.
    jy = replace(src, unit="Jy", raw_bytes=None)
    out = tmp_path / "with_unit.img"
    write_img(jy, out)
    re_read = read_img(out)
    assert re_read.unit == "Jy"
    # Pixels survive the read/write flip symmetrically.
    np.testing.assert_array_equal(re_read.pixels, jy.pixels)


def test_img_vertical_orientation_matches_legacy(outputs_dir: Path) -> None:
    """`read_img` flips rows so internally `pixels[0]` is at MinDec (matching
    `make_image`'s convention). The legacy file's first byte-row is MaxDec —
    so the read-side flip puts that byte-row at `pixels[-1]`. We can verify
    by comparing the raw file's first row against `pixels[-1]`."""
    src_path = outputs_dir / "cygnus_a.img"
    img = read_img(src_path)
    # Build the legacy byte order by re-writing without our flip, just to
    # sanity-check: legacy first row should equal our `pixels[-1]`.
    rows, cols = img.pixels.shape
    raw = src_path.read_bytes()
    # Skip header by replaying the read; easier path: rely on the existing
    # round-trip — if the flip is consistent on both sides, the second-to-last
    # byte pair of the FILE (counting from header end) is `pixels[0][0]`.
    # That's enough of a check: assert that pixels[0] is NOT identical to the
    # first byte-row of the raw file.
    header_end = len(raw) - rows * cols * 2 - (
        (2 + len(img.unit)) if img.unit else 0
    )
    first_legacy_row = np.frombuffer(raw, dtype="<i2", count=cols, offset=header_end)
    np.testing.assert_array_equal(first_legacy_row, img.pixels[-1])


def test_img_truncated_grid_raises(tmp_path: Path) -> None:
    """A truncated `.img` should error rather than silently zero-extend."""
    # 14 header strings + 0 palette, but no grid bytes for Pix=1.
    import struct

    out = bytearray()

    def add(s: str) -> None:
        encoded = s.encode("ascii")
        out.extend(struct.pack("<h", len(encoded)))
        out.extend(encoded)

    add("X")
    for value in (" 0", " 1", " 0", " 1", " 0", " 1", " 0", " 1", " 0", " 1", " 0", " 1"):
        add(value)
    add(" 1")  # pix
    add(" 0")  # pal_num
    p = tmp_path / "trunc.img"
    p.write_bytes(bytes(out))
    with pytest.raises(ValueError, match="grid size mismatch"):
        read_img(p)
