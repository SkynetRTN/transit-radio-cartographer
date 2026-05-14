from __future__ import annotations

from pathlib import Path

import pytest

from radio_cartographer.io.cal import read_cal, write_cal
from radio_cartographer.io.img import read_img, write_img
from radio_cartographer.io.md1 import read_md1, write_md1
from radio_cartographer.io.md2 import read_md2, write_md2
from radio_cartographer.io.pal import read_pal, write_pal
from radio_cartographer.io.scn import read_scn, write_scn
from radio_cartographer.io.srv import read_srv, write_srv

FIXTURES = Path(__file__).resolve().parents[3] / "fixtures"


def _roundtrip(read_fn, write_fn, source: Path, tmp_path: Path) -> None:
    out = tmp_path / source.name
    write_fn(read_fn(source), out)
    assert out.read_bytes() == source.read_bytes()


def test_md1_roundtrip(tmp_path: Path) -> None:
    _roundtrip(read_md1, write_md1, FIXTURES / "inputs" / "moon0a.md1", tmp_path)


def test_md2_roundtrip(tmp_path: Path) -> None:
    _roundtrip(read_md2, write_md2, FIXTURES / "inputs" / "and0a.md2", tmp_path)


@pytest.mark.parametrize("name", ["cyg0a.scn", "cas0a.scn"])
def test_scn_roundtrip(name: str, tmp_path: Path) -> None:
    _roundtrip(read_scn, write_scn, FIXTURES / "intermediates" / name, tmp_path)


@pytest.mark.parametrize("name", ["and0a.srv", "sun0a.srv"])
def test_srv_roundtrip(name: str, tmp_path: Path) -> None:
    _roundtrip(read_srv, write_srv, FIXTURES / "intermediates" / name, tmp_path)


def test_img_roundtrip(tmp_path: Path) -> None:
    _roundtrip(read_img, write_img, FIXTURES / "outputs" / "cygnus_a.img", tmp_path)


def test_cal_roundtrip(tmp_path: Path) -> None:
    _roundtrip(read_cal, write_cal, FIXTURES / "inputs" / "cal25a.cal", tmp_path)


def test_pal_roundtrip(tmp_path: Path) -> None:
    sample = tmp_path / "sample.pal"
    sample.write_bytes(b"0 0 0\r\n255 255 255\r\n")
    _roundtrip(read_pal, write_pal, sample, tmp_path)


def test_rejects_b_channel() -> None:
    with pytest.raises(ValueError):
        read_md1(FIXTURES / "inputs" / "mw_08b.md1")
    with pytest.raises(ValueError):
        read_md2(FIXTURES / "inputs" / "morningb.md2")
