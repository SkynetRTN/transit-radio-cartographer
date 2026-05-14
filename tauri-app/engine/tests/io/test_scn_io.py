"""§6.1 codec tests for `.scn` (reduced single-sweep scan)."""

from __future__ import annotations

from pathlib import Path

import pytest
from radio_cartographer.io.scn import read_scn, write_scn

# Every `.scn` we've captured — both A and B channel intermediates.
SCN_FIXTURES = [
    "cas0a.scn",
    "cyg0a.scn",
    "cyg0abaseline.scn",
    "cyg0adec.scn",
    "cyg0afull.scn",
    "moon0a.scn",
    "mw_08b.scn",
    "mw_67b.scn",
    "pulsar1b.scn",
]


@pytest.mark.parametrize("name", SCN_FIXTURES)
def test_round_trip_scn(
    intermediates_dir: Path, tmp_path: Path, name: str
) -> None:
    src = intermediates_dir / name
    scan = read_scn(src)
    out = tmp_path / name
    write_scn(scan, out)
    assert out.read_bytes() == src.read_bytes()


def test_header_fields_match_cyg_fixture(intermediates_dir: Path) -> None:
    scan = read_scn(intermediates_dir / "cyg0a.scn")
    assert scan.name == "CYG0A"
    assert scan.channel == "A"
    assert scan.peak == ""
    assert scan.min_dec == pytest.approx(39.3269)
    assert scan.max_dec == pytest.approx(42.5123)
    assert scan.min_flux == pytest.approx(4.5684)
    assert scan.max_flux == pytest.approx(8.3106)
    assert scan.total == 1319


def test_record_arrays_match_fixture(intermediates_dir: Path) -> None:
    scan = read_scn(intermediates_dir / "cyg0a.scn")
    assert scan.ra[0] == pytest.approx(71221.0)
    assert scan.dec[0] == pytest.approx(40.9094)
    assert scan.flux[0] == pytest.approx(4.5905)
    assert int(scan.check[0]) == 0
    assert float(scan.flux.sum()) == pytest.approx(7511.1863, rel=1e-6)


def test_b_channel_named_scn_still_carries_reduction_flag(
    intermediates_dir: Path,
) -> None:
    """The `.scn` channel field is set by `Command2.Enabled` in scanform.frm —
    a reduction-state flag — *not* by the source filename. All checked-in
    `b`-named `.scn` fixtures were reduced into channel-`A` state."""
    scan = read_scn(intermediates_dir / "pulsar1b.scn")
    assert scan.channel == "A"


def test_unexpected_channel_flag_raises(tmp_path: Path) -> None:
    p = tmp_path / "bad.scn"
    p.write_bytes(
        b"NAME\r\nX\r\n\r\n 0 \r\n 0 \r\n0\r\n0\r\n 0 \r\n",
    )
    with pytest.raises(ValueError, match="channel flag"):
        read_scn(p)
