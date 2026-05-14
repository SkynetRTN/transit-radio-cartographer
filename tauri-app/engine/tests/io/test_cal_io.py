"""§6.1 codec tests for `.cal` (telescope calibration table)."""

from __future__ import annotations

from pathlib import Path

import pytest
from radio_cartographer.io.cal import read_cal, write_cal


def test_round_trip_cal(inputs_dir: Path, tmp_path: Path) -> None:
    """Every checked-in `.cal` round-trips bytes-identically."""
    src = inputs_dir / "cal25a.cal"
    table = read_cal(src)
    out = tmp_path / src.name
    write_cal(table, out)
    assert out.read_bytes() == src.read_bytes()


def test_round_trip_cal_b_channel(inputs_dir: Path, tmp_path: Path) -> None:
    src = inputs_dir / "cal25b.cal"
    table = read_cal(src)
    out = tmp_path / src.name
    write_cal(table, out)
    assert out.read_bytes() == src.read_bytes()


def test_header_fields_match_fixture(inputs_dir: Path) -> None:
    table = read_cal(inputs_dir / "cal25a.cal")
    assert table.caption == "Telescope Calibration"
    assert table.fit_annotation == "Slope: 440 Jy"
    assert table.fit_result == ""
    assert table.max_measured_flux == pytest.approx(3.594)
    assert table.max_known_flux == pytest.approx(1581.0)


def test_known_source_jy_values(inputs_dir: Path) -> None:
    """`cal25a.cal` was fit against Cyg A; that known Jy value surfaces.

    The tutorial pins the canonical brightness constants: Virgo A = 213 Jy,
    Tau A = 942 Jy, Cyg A = 1581 Jy. The ERIRA 2025 calibration fixture used
    Cyg A alone, so we check the Cyg A entry directly.
    """
    table = read_cal(inputs_dir / "cal25a.cal")
    assert table.count == 1
    cyg = table.entries[0]
    assert cyg.name == "CYG0A"
    assert cyg.known_flux == pytest.approx(1581.0)
    assert cyg.measured_flux == pytest.approx(3.594)
