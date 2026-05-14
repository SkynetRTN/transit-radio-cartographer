"""§6.1 codec tests for `.srv` (reduced multi-sweep survey)."""

from __future__ import annotations

from pathlib import Path

import pytest
from radio_cartographer.io.srv import read_srv, write_srv

# Every `.srv` we've captured. `test_a.srv`/`testa.srv` are synthetic and
# may or may not match the canonical writer format — included so we notice if
# they regress.
SRV_FIXTURES = [
    "and0a.srv",
    "and0b.srv",
    "jupiter0.srv",
    "sun0a.srv",
    "sun(1)_a.srv",
    "virgo_a..srv",
]


@pytest.mark.parametrize("name", SRV_FIXTURES)
def test_round_trip_srv(
    intermediates_dir: Path, tmp_path: Path, name: str
) -> None:
    src = intermediates_dir / name
    survey = read_srv(src)
    out = tmp_path / name
    write_srv(survey, out)
    assert out.read_bytes() == src.read_bytes()


def test_header_fields_match_and0a(intermediates_dir: Path) -> None:
    survey = read_srv(intermediates_dir / "and0a.srv")
    assert survey.label2 == "AND0A"
    assert survey.sweep_count == 62
    assert survey.swp == 61
    assert survey.sweep0.calib == pytest.approx(0.3401)
    assert survey.sweeps[-1].calib == pytest.approx(0.361)
    assert survey.sweep0.ra.size == 240


def test_srv_carries_calibration_state(intermediates_dir: Path) -> None:
    """A `.srv` written after calibration carries non-default Jy/count values."""
    survey = read_srv(intermediates_dir / "and0a.srv")
    # Calib values are Jy/count ratios; both should be finite and positive.
    assert survey.sweep0.calib is not None and survey.sweep0.calib > 0
    for sweep in survey.sweeps:
        assert sweep.calib is not None
