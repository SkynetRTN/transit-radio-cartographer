"""Tests for projecting an edited workspace back to a .scn / .srv file.

Covers `workspace_to_scan` and `workspace_to_survey` — the helpers that turn
the in-memory ScanWorkspace / SurveyWorkspace into a `Scan` / `Survey` model
that the existing `write_scn` / `write_srv` codecs can serialize.
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
import pytest

from radio_cartographer.io.md1 import read_md1
from radio_cartographer.io.md2 import read_md2
from radio_cartographer.io.scn import read_scn, write_scn
from radio_cartographer.io.srv import read_srv, write_srv
from radio_cartographer.scan_workspace import (
    apply_scan_calibration,
    baseline_scan_source,
    build_scan_workspace,
    cut_scan_segment,
    determine_peak,
    scan_from_scn,
    workspace_to_scan,
)
from radio_cartographer.workspace import (
    apply_gain_calibration,
    apply_workspace_reduction,
    build_workspace,
    survey_from_srv,
    workspace_to_survey,
)


def test_workspace_to_scan_raw_round_trip(inputs_dir: Path, tmp_path: Path) -> None:
    md1 = read_md1(inputs_dir / "cyg0a.md1")
    ws = build_scan_workspace(str(inputs_dir / "cyg0a.md1"), md1)
    scan = workspace_to_scan(ws)
    # No edits → channel 'A' (uncalibrated), no peak, every check==0.
    assert scan.channel == "A"
    assert scan.peak == ""
    assert int(scan.total) == ws.source_count
    assert np.all(scan.check == 0)
    # Bounds reflect the raw flux/dec range.
    assert scan.min_dec == pytest.approx(float(ws.source_dec.min()))
    assert scan.max_dec == pytest.approx(float(ws.source_dec.max()))
    # Round-trip via the writer/reader.
    out = tmp_path / "cyg0a_raw.scn"
    write_scn(scan, out)
    parsed = read_scn(out)
    assert parsed.name == ws.name
    assert parsed.channel == "A"
    assert parsed.total == scan.total
    assert np.all(parsed.check == 0)


def test_workspace_to_scan_after_full_pipeline(inputs_dir: Path, tmp_path: Path) -> None:
    """Mirrors the legacyuireferenceguide.md scan flow + Save Scan."""
    md1 = read_md1(inputs_dir / "cyg0a.md1")
    ws = build_scan_workspace(str(inputs_dir / "cyg0a.md1"), md1)
    apply_scan_calibration(ws)
    # Cut a small slice of the source so we see check==-1 rows on disk.
    ra_min = float(ws.source_ra[10])
    ra_max = float(ws.source_ra[30])
    removed = cut_scan_segment(ws, ra_min, ra_max)
    assert removed > 0
    # Baseline through the first/last current source samples.
    flux_now = ws.calibrated_source_flux
    assert flux_now is not None
    baseline_scan_source(
        ws,
        float(ws.source_ra[0]),
        float(flux_now[0]),
        float(ws.source_ra[-1]),
        float(flux_now[-1]),
    )
    determine_peak(ws, 3.14)

    scan = workspace_to_scan(ws)
    assert scan.channel == "B"
    assert scan.peak == "Peak Flux: 3.140"
    assert int(scan.total) == ws.source_count
    # Cut rows are emitted with check == -1, kept rows with check == 0.
    cut_rows = int(np.sum(scan.check == -1))
    assert cut_rows == removed
    assert int(np.sum(scan.check == 0)) == ws.source_count - removed

    out = tmp_path / "cyg0a_full.scn"
    write_scn(scan, out)
    parsed = read_scn(out)
    assert parsed.channel == "B"
    assert parsed.peak == "Peak Flux: 3.140"
    assert parsed.total == ws.source_count
    assert int(np.sum(parsed.check == -1)) == removed


def test_workspace_to_survey_raw_passthrough(inputs_dir: Path, tmp_path: Path) -> None:
    md2 = read_md2(inputs_dir / "and0a.md2")
    ws = build_workspace(str(inputs_dir / "and0a.md2"), md2)
    survey = workspace_to_survey(ws)
    # Structural invariants: sweep0 is exactly 240 cal samples, swp == source_count,
    # and the last sweep carries Cal2 while sweep0 carries Cal1.
    assert survey.sweep0.ra.size == 240
    assert survey.swp == ws.source_count
    assert survey.sweep_count == ws.source_count + 1
    assert survey.sweep0.calib == pytest.approx(ws.cal1())
    assert survey.sweeps[-1].calib == pytest.approx(ws.cal2())
    # Middle sweeps have calib == 0.0 (legacy convention from and0a.srv).
    for sweep in survey.sweeps[:-1]:
        assert sweep.calib == 0.0
    # Source sweep flux/ra/dec match the raw md2 source sweeps (no edits).
    for raw, sweep in zip(ws.source_sweeps, survey.sweeps):
        assert sweep.ra.size == raw.ra.size
        np.testing.assert_allclose(sweep.ra, raw.ra)
        np.testing.assert_allclose(sweep.flux, raw.flux)

    out = tmp_path / "and0a_passthrough.srv"
    write_srv(survey, out)
    re_read = read_srv(out)
    assert re_read.swp == survey.swp
    assert re_read.sweep0.ra.size == 240
    assert re_read.sweeps[-1].calib == pytest.approx(ws.cal2(), abs=1e-3)


@pytest.mark.parametrize("fixture", ["map3_a.md2", "sun1_a.md2"])
def test_workspace_to_survey_short_cal_brackets(
    inputs_dir: Path, tmp_path: Path, fixture: str
) -> None:
    """Cal brackets shorter than 60 samples round-trip without padding.

    Regression: map3_a.md2 / sun1_a.md2 have 59-sample cal brackets, so the
    naive concatenation was 237 samples and the (then) fixed-240 serializer
    overran with "index 237 is out of bounds for axis 0 with size 237". sweep0
    is now variable-length: every cal sample is emitted at its true length and
    the four quadrant counts are recorded in `#OGRC_SWEEP0`, so the cal brackets
    reload bit-for-bit (no synthetic samples).
    """
    md2 = read_md2(inputs_dir / fixture)
    ws = build_workspace(str(inputs_dir / fixture), md2)
    quad_lengths = (
        ws.initial.cal_on.ra.size,
        ws.initial.cal_off.ra.size,
        ws.terminal.cal_on.ra.size,
        ws.terminal.cal_off.ra.size,
    )
    assert sum(quad_lengths) != 240  # exercises the non-legacy path

    survey = workspace_to_survey(ws)
    assert survey.cal_lengths == quad_lengths
    assert survey.sweep0.ra.size == sum(quad_lengths)

    out = tmp_path / f"{fixture}.srv"
    write_srv(survey, out)  # would have raised before the fix
    reparsed = read_srv(out)
    assert reparsed.cal_lengths == quad_lengths
    loaded, _ = survey_from_srv(reparsed, str(out))
    # Cal brackets reconstruct exactly — same lengths and same samples.
    np.testing.assert_array_equal(loaded.initial.cal_on.flux, ws.initial.cal_on.flux)
    np.testing.assert_array_equal(loaded.terminal.cal_off.flux, ws.terminal.cal_off.flux)
    assert loaded.cal1() == pytest.approx(ws.cal1(), abs=1e-3)
    assert loaded.cal2() == pytest.approx(ws.cal2(), abs=1e-3)


def test_workspace_to_survey_after_calibration_and_smooth(
    inputs_dir: Path, tmp_path: Path
) -> None:
    md2 = read_md2(inputs_dir / "and0a.md2")
    ws = build_workspace(str(inputs_dir / "and0a.md2"), md2)
    apply_gain_calibration(ws)
    apply_workspace_reduction(ws, "smooth", window=5)

    survey = workspace_to_survey(ws)
    # Flux on every sweep should match the workspace's current (reduced) flux.
    assert ws.reduced_source_flux is not None
    for reduced, sweep in zip(ws.reduced_source_flux, survey.sweeps):
        np.testing.assert_allclose(sweep.flux, reduced)
    # Header bracket cals preserved.
    assert survey.sweep0.calib == pytest.approx(ws.cal1())
    assert survey.sweeps[-1].calib == pytest.approx(ws.cal2())

    out = tmp_path / "and0a_reduced.srv"
    write_srv(survey, out)
    assert out.read_bytes()  # non-empty file on disk


def test_survey_from_srv_round_trip_after_calibration(
    inputs_dir: Path, tmp_path: Path
) -> None:
    """Calibrate → save .srv (no accepted set) → load → all-accepted fallback."""
    md2 = read_md2(inputs_dir / "and0a.md2")
    ws = build_workspace(str(inputs_dir / "and0a.md2"), md2)
    apply_gain_calibration(ws)
    saved_flux = tuple(arr.copy() for arr in ws.calibrated_source_flux)  # type: ignore[union-attr]
    out = tmp_path / "and0a_calibrated.srv"
    write_srv(workspace_to_survey(ws), out)

    survey = read_srv(out)
    loaded, accepted_indices = survey_from_srv(survey, str(out))

    # No `accepted_sweeps` passed → no trailer → legacy header path with
    # SwpCnt% = Swp% + 1 → all accepted.
    assert accepted_indices == list(range(ws.source_count))
    assert loaded.calibrated is True
    assert loaded.source_count == ws.source_count
    # Brackets reconstructed: cal1/cal2 reproduce the original values.
    assert loaded.cal1() == pytest.approx(ws.cal1(), rel=1e-3)
    assert loaded.cal2() == pytest.approx(ws.cal2(), rel=1e-3)
    # Calibrated flux survives the round-trip (modulo the .srv format's
    # `#.####` 4-decimal truncation).
    assert loaded.calibrated_source_flux is not None
    for original, reloaded in zip(saved_flux, loaded.calibrated_source_flux):
        np.testing.assert_allclose(reloaded, original, atol=5e-4)


def test_workspace_to_survey_round_trips_accepted_set(
    inputs_dir: Path, tmp_path: Path
) -> None:
    """Non-contiguous accepted set survives save + reload via #OGRC_ACCEPTED."""
    md2 = read_md2(inputs_dir / "and0a.md2")
    ws = build_workspace(str(inputs_dir / "and0a.md2"), md2)
    apply_gain_calibration(ws)
    n = ws.source_count
    accepted = [0, 2, 5]
    out = tmp_path / "and0a_partial.srv"
    written = workspace_to_survey(ws, accepted_sweeps=accepted)
    # Header sweep_count = first_unaccepted + 1 = 1 + 1 = 2 (sweep index 1
    # is the first un-accepted). Legacy readers using SwpCnt% land on sweep 2.
    assert written.sweep_count == 2
    expected_flags = tuple(i in {0, 2, 5} for i in range(n))
    assert written.accepted == expected_flags
    write_srv(written, out)

    survey = read_srv(out)
    assert survey.accepted == expected_flags
    _ws, accepted_indices = survey_from_srv(survey, str(out))
    assert accepted_indices == accepted


def test_legacy_srv_without_trailer_defaults_to_all_accepted(
    intermediates_dir: Path,
) -> None:
    """A legacy fixture (no trailer, SwpCnt% > Swp%) → all sweeps accepted."""
    path = intermediates_dir / "and0a.srv"
    survey = read_srv(path)
    assert survey.accepted is None  # no trailer present
    assert survey.sweep_count > survey.swp
    _ws, accepted_indices = survey_from_srv(survey, str(path))
    assert accepted_indices == list(range(survey.swp))


def test_legacy_srv_with_partial_swpcnt_returns_prefix(
    inputs_dir: Path,
) -> None:
    """Legacy fixture with SwpCnt% <= Swp% → only sweeps before that index accepted."""
    survey = read_srv(inputs_dir / "cygnus1atest.srv")
    assert survey.accepted is None
    # cygnus1atest.srv has SwpCnt% = 1, Swp% = 56 → no source sweeps accepted.
    assert survey.sweep_count == 1
    _ws, accepted_indices = survey_from_srv(
        survey, str(inputs_dir / "cygnus1atest.srv")
    )
    assert accepted_indices == []


def test_scan_from_scn_round_trip_with_cuts_and_peak(
    inputs_dir: Path, tmp_path: Path
) -> None:
    """Calibrate + cut + baseline + peak → save .scn → load → state restored."""
    md1 = read_md1(inputs_dir / "cyg0a.md1")
    ws = build_scan_workspace(str(inputs_dir / "cyg0a.md1"), md1)
    apply_scan_calibration(ws)
    ra_min = float(ws.source_ra[10])
    ra_max = float(ws.source_ra[30])
    removed = cut_scan_segment(ws, ra_min, ra_max)
    assert removed > 0
    determine_peak(ws, 2.5)
    out = tmp_path / "cyg0a_round.scn"
    write_scn(workspace_to_scan(ws), out)

    scan = read_scn(out)
    loaded = scan_from_scn(scan, str(out))

    assert loaded.calibrated is True
    assert loaded.source_count == ws.source_count
    assert loaded.kept_count() == ws.kept_count()
    assert loaded.peak_flux == pytest.approx(2.5, abs=1e-3)
    # Cut samples are masked, kept samples are not.
    assert int(loaded.source_mask.sum()) == int(ws.source_mask.sum())
    np.testing.assert_array_equal(loaded.source_mask, ws.source_mask)


def test_scan_from_scn_raw_channel_a(inputs_dir: Path, tmp_path: Path) -> None:
    """Raw `.scn` (channel='A') reloads as uncalibrated workspace."""
    md1 = read_md1(inputs_dir / "cyg0a.md1")
    ws = build_scan_workspace(str(inputs_dir / "cyg0a.md1"), md1)
    out = tmp_path / "cyg0a_raw.scn"
    write_scn(workspace_to_scan(ws), out)

    scan = read_scn(out)
    assert scan.channel == "A"
    loaded = scan_from_scn(scan, str(out))
    assert loaded.calibrated is False
    assert loaded.peak_flux is None
