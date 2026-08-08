"""LF line-ending tolerance across the text codecs (dan round 2).

Files written by the legacy VB app terminate lines with CRLF, but newer
Skynet exports use bare LF. The strict-CRLF split saw an LF file as one
giant line, so every codec silently parsed it as empty (0 sweeps /
0 samples). Readers now accept both; writers still emit byte-exact CRLF
(round-trip tests elsewhere cover that).

Each test rewrites a checked-in CRLF fixture with LF terminators and
asserts the parse is identical to the CRLF original.
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
import pytest
from radio_cartographer.io.cal import read_cal
from radio_cartographer.io.md1 import read_md1
from radio_cartographer.io.md2 import read_md2
from radio_cartographer.io.pal import read_pal
from radio_cartographer.io.scn import read_scn
from radio_cartographer.io.srv import read_srv


def _lf_copy(src: Path, tmp_dir: Path) -> Path:
    tmp_dir.mkdir(parents=True, exist_ok=True)
    dst = tmp_dir / src.name
    dst.write_bytes(src.read_bytes().replace(b"\r\n", b"\n"))
    return dst


def test_md2_lf_parses_identically(inputs_dir: Path, tmp_path: Path) -> None:
    crlf = read_md2(inputs_dir / "and0a.md2")
    lf = read_md2(_lf_copy(inputs_dir / "and0a.md2", tmp_path))
    assert len(lf.sweeps) == len(crlf.sweeps) == 65
    for a, b in zip(crlf.sweeps, lf.sweeps):
        np.testing.assert_array_equal(a.ra, b.ra)
        np.testing.assert_array_equal(a.dec, b.dec)
        np.testing.assert_array_equal(a.flux, b.flux)


def test_md1_lf_parses_identically(inputs_dir: Path, tmp_path: Path) -> None:
    crlf = read_md1(inputs_dir / "cyg0a.md1")
    lf = read_md1(_lf_copy(inputs_dir / "cyg0a.md1", tmp_path))
    assert lf.samples.ra.size == crlf.samples.ra.size > 0
    np.testing.assert_array_equal(lf.samples.flux, crlf.samples.flux)


def test_scn_lf_parses_identically(inputs_dir: Path, tmp_path: Path) -> None:
    src = inputs_dir.parent / "intermediates" / "cyg0apeak.scn"
    crlf = read_scn(src)
    lf = read_scn(_lf_copy(src, tmp_path))
    assert list(lf.ra) == list(crlf.ra)
    assert list(lf.flux) == list(crlf.flux)
    assert lf.channel == crlf.channel


def test_srv_lf_parses_identically(inputs_dir: Path, tmp_path: Path) -> None:
    crlf = read_srv(inputs_dir / "and0arenamed.srv")
    lf = read_srv(_lf_copy(inputs_dir / "and0arenamed.srv", tmp_path))
    assert len(lf.sweeps) == len(crlf.sweeps)


def test_cal_lf_parses_identically(inputs_dir: Path, tmp_path: Path) -> None:
    crlf = read_cal(inputs_dir / "cal25a.cal")
    lf = read_cal(_lf_copy(inputs_dir / "cal25a.cal", tmp_path))
    assert lf.entries == crlf.entries
    assert lf.max_known_flux == pytest.approx(crlf.max_known_flux)


def test_pal_lf_parses_identically(tmp_path: Path) -> None:
    from radio_cartographer.io._vb_format import vb_format_pal

    flat: list[float | int] = []
    for stop in [(0, 0, 0, 0), (128, 255, 0, 64), (255, 255, 255, 255)]:
        flat.extend(stop)
    src = tmp_path / "tiny.pal"
    src.write_bytes(vb_format_pal(flat, count=3))
    crlf = read_pal(src)
    lf = read_pal(_lf_copy(src, tmp_path / "lf"))
    assert lf.stops == crlf.stops
