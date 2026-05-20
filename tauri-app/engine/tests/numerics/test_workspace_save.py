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
    workspace_to_scan,
)
from radio_cartographer.workspace import (
    apply_gain_calibration,
    apply_workspace_reduction,
    build_workspace,
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
