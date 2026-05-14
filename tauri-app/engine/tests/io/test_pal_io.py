"""§6.1 codec tests for `.pal` (RGB palette)."""

from __future__ import annotations

from pathlib import Path

import pytest
from radio_cartographer.io._vb_format import vb_format_pal
from radio_cartographer.io.pal import read_pal, write_pal
from radio_cartographer.models import Palette, PaletteStop


def _synth(stops: list[tuple[int, int, int, int]]) -> bytes:
    flat: list[float | int] = []
    for stop in stops:
        flat.extend(stop)
    return vb_format_pal(flat, count=len(stops))


def test_round_trip_pal_minimal(tmp_path: Path) -> None:
    raw = _synth([(0, 0, 0, 0), (255, 255, 255, 255)])
    src = tmp_path / "tiny.pal"
    src.write_bytes(raw)
    palette = read_pal(src)
    assert palette.count == 2
    assert palette.stops[0] == PaletteStop(0.0, 0.0, 0.0, 0.0)
    assert palette.stops[-1] == PaletteStop(255.0, 255.0, 255.0, 255.0)
    out = tmp_path / "tiny_out.pal"
    write_pal(palette, out)
    assert out.read_bytes() == src.read_bytes()


def test_round_trip_pal_realistic(tmp_path: Path) -> None:
    """Palette from `outputs/cygnus_a.img` header — used in the tutorial."""
    raw = _synth(
        [
            (1, 0, 0, 0),
            (2, 0, 0, 0),
            (6, 255, 0, 255),
            (27, 0, 0, 255),
            (54, 0, 255, 255),
            (91, 0, 255, 0),
            (137, 255, 255, 0),
            (192, 255, 0, 0),
            (255, 255, 255, 255),
        ]
    )
    src = tmp_path / "tutorial.pal"
    src.write_bytes(raw)
    palette = read_pal(src)
    assert palette.count == 9
    out = tmp_path / "tutorial_out.pal"
    write_pal(palette, out)
    assert out.read_bytes() == src.read_bytes()


def test_palette_up_to_100_control_points(tmp_path: Path) -> None:
    """Boundary case from `vb/dataform.frm`: maximum supported palette size."""
    stops = [(i, i % 256, (2 * i) % 256, (3 * i) % 256) for i in range(100)]
    raw = _synth(stops)
    src = tmp_path / "max.pal"
    src.write_bytes(raw)
    palette = read_pal(src)
    assert palette.count == 100
    out = tmp_path / "max_out.pal"
    write_pal(palette, out)
    assert out.read_bytes() == src.read_bytes()


def test_token_count_mismatch_raises(tmp_path: Path) -> None:
    src = tmp_path / "broken.pal"
    src.write_bytes(b" 2  1  2  3 \r\n")  # claims 2 stops but only 1 worth of values
    with pytest.raises(ValueError, match="token count mismatch"):
        read_pal(src)


def test_missing_crlf_raises(tmp_path: Path) -> None:
    src = tmp_path / "no_crlf.pal"
    src.write_bytes(b" 1  0  0  0  0 ")
    with pytest.raises(ValueError, match="terminate with CRLF"):
        read_pal(src)


def test_palette_constructed_from_scratch_serializes(tmp_path: Path) -> None:
    """A Palette built without raw_bytes still serializes through `vb_format_pal`."""
    palette = Palette(
        stops=(PaletteStop(0, 0, 0, 0), PaletteStop(255, 255, 255, 255)),
    )
    out = tmp_path / "scratch.pal"
    write_pal(palette, out)
    assert out.read_bytes() == b" 2  0  0  0  0  255  255  255  255 \r\n"
