"""Unit tests for the flux-calibration helper module and workspace methods."""

from __future__ import annotations

import math
from pathlib import Path

import numpy as np
import pytest

from radio_cartographer.flux_calibration import (
    default_known_jy,
    fit_counts_to_jy,
    fit_error,
    read_scn_peak,
)
from radio_cartographer.io.md1 import read_md1
from radio_cartographer.io.md2 import read_md2
from radio_cartographer.models import CalibrationEntry, CalibrationTable
from radio_cartographer.scan_workspace import (
    apply_flux_calibration_scan,
    apply_scan_calibration,
    build_scan_workspace,
    determine_peak,
    revert_flux_calibration_scan,
)
from radio_cartographer.workspace import (
    apply_flux_calibration,
    apply_gain_calibration,
    build_workspace,
    revert_flux_calibration,
)


def _make_table(pairs: list[tuple[str, float, float]]) -> CalibrationTable:
    entries = tuple(
        CalibrationEntry(name=n, measured_flux=m, known_flux=k) for n, m, k in pairs
    )
    max_mf = max((e.measured_flux for e in entries), default=0.0)
    max_kf = max((e.known_flux for e in entries), default=0.0)
    return CalibrationTable(
        caption="test",
        fit_annotation="",
        fit_result="",
        max_measured_flux=max_mf,
        max_known_flux=max_kf,
        entries=entries,
    )


def test_default_known_jy_matches_legacy_table() -> None:
    # Legacy vb/calform.frm:156-164 maps the first three name characters.
    assert default_known_jy("VIR A") == 213.0
    assert default_known_jy("Virgo A") == 213.0  # case-insensitive
    assert default_known_jy("TAU A") == 942.0
    assert default_known_jy("CYG A") == 1581.0
    assert default_known_jy("cyg0a") == 1581.0
    assert default_known_jy("CAS A") == 0.0  # not in legacy table
    assert default_known_jy("") == 0.0


def test_fit_counts_to_jy_zero_for_empty_or_zero_measured() -> None:
    assert fit_counts_to_jy(_make_table([])) == 0.0
    assert fit_counts_to_jy(_make_table([("A", 0.0, 100.0)])) == 0.0


def test_fit_counts_to_jy_matches_closed_form() -> None:
    table = _make_table([("A", 1.0, 10.0), ("B", 2.0, 22.0), ("C", 3.0, 27.0)])
    # G* = (m . k) / (m . m) = (10 + 44 + 81) / (1 + 4 + 9) = 135 / 14
    expected = 135.0 / 14.0
    assert fit_counts_to_jy(table) == pytest.approx(expected)


def test_fit_error_zero_for_single_entry() -> None:
    assert fit_error(_make_table([("A", 1.0, 1.0)])) == 0.0


def test_fit_error_rms_formula() -> None:
    table = _make_table([("A", 1.0, 10.0), ("B", 2.0, 22.0), ("C", 3.0, 27.0)])
    slope = 135.0 / 14.0
    residuals = np.array([slope * 1 - 10, slope * 2 - 22, slope * 3 - 27])
    expected = math.sqrt(float(np.dot(residuals, residuals)) / 2.0)
    assert fit_error(table) == pytest.approx(expected)


def test_read_scn_peak_pulls_value_from_header(intermediates_dir: Path) -> None:
    # cas0awpeak.scn carries a "Peak Flux: <X>" header — the value is what the
    # legacy "Add Source" gesture would write into MFlux for this calibrator.
    name, peak = read_scn_peak(intermediates_dir / "cas0awpeak.scn")
    assert isinstance(name, str) and name
    assert peak > 0.0


def test_read_scn_peak_empty_header_yields_zero(intermediates_dir: Path, tmp_path: Path) -> None:
    from dataclasses import replace

    from radio_cartographer.io.scn import read_scn, write_scn

    src = read_scn(intermediates_dir / "cas0awpeak.scn")
    cleared = replace(src, peak="", raw_bytes=None)
    out = tmp_path / "nopeak.scn"
    write_scn(cleared, out)
    name, peak = read_scn_peak(out)
    assert name == src.name
    assert peak == 0.0


def test_apply_flux_calibration_requires_gain_calibrated_workspace(inputs_dir: Path) -> None:
    md2 = read_md2(inputs_dir / "cygnus1a.md2")
    ws = build_workspace(str(inputs_dir / "cygnus1a.md2"), md2)
    with pytest.raises(ValueError):
        apply_flux_calibration(ws, 0.5)


def test_apply_and_revert_flux_calibration_survey_round_trip(inputs_dir: Path) -> None:
    md2 = read_md2(inputs_dir / "cygnus1a.md2")
    ws = build_workspace(str(inputs_dir / "cygnus1a.md2"), md2)
    apply_gain_calibration(ws)
    before = tuple(arr.copy() for arr in ws.calibrated_source_flux or ())

    apply_flux_calibration(ws, 2.5)
    assert ws.flux_calibrated is True
    assert ws.flux_slope == 2.5
    assert ws.calibrated_source_flux is not None
    for after, prior in zip(ws.calibrated_source_flux, before):
        assert np.allclose(after, prior * 2.5)

    # Second apply is a no-op (idempotent guard) — slope must stay 2.5.
    apply_flux_calibration(ws, 99.0)
    assert ws.flux_slope == 2.5

    revert_flux_calibration(ws)
    assert ws.flux_calibrated is False
    assert ws.flux_slope is None
    assert ws.calibrated_source_flux is not None
    for after, prior in zip(ws.calibrated_source_flux, before):
        assert np.allclose(after, prior, rtol=1e-12, atol=1e-12)


def test_apply_flux_calibration_zero_slope_rejected(inputs_dir: Path) -> None:
    md2 = read_md2(inputs_dir / "cygnus1a.md2")
    ws = build_workspace(str(inputs_dir / "cygnus1a.md2"), md2)
    apply_gain_calibration(ws)
    with pytest.raises(ValueError):
        apply_flux_calibration(ws, 0.0)


def test_gain_recalibration_clears_flux_state(inputs_dir: Path) -> None:
    md2 = read_md2(inputs_dir / "cygnus1a.md2")
    ws = build_workspace(str(inputs_dir / "cygnus1a.md2"), md2)
    apply_gain_calibration(ws)
    apply_flux_calibration(ws, 3.0)
    assert ws.flux_calibrated is True

    apply_gain_calibration(ws)  # re-running gain cal must reset flux-cal state
    assert ws.flux_calibrated is False
    assert ws.flux_slope is None


def test_apply_and_revert_flux_calibration_scan_round_trip(inputs_dir: Path) -> None:
    md1 = read_md1(inputs_dir / "cas0a.md1")
    ws = build_scan_workspace(str(inputs_dir / "cas0a.md1"), md1)
    apply_scan_calibration(ws)
    before = ws.calibrated_source_flux.copy()  # type: ignore[union-attr]
    determine_peak(ws, 12.5)

    apply_flux_calibration_scan(ws, 0.4)
    assert ws.flux_calibrated is True
    assert ws.flux_slope == 0.4
    assert ws.peak_flux == pytest.approx(12.5 * 0.4)
    assert ws.calibrated_source_flux is not None
    assert np.allclose(ws.calibrated_source_flux, before * 0.4)

    # Idempotent: second apply does nothing.
    apply_flux_calibration_scan(ws, 99.0)
    assert ws.flux_slope == 0.4

    revert_flux_calibration_scan(ws)
    assert ws.flux_calibrated is False
    assert ws.peak_flux == pytest.approx(12.5)
    assert np.allclose(ws.calibrated_source_flux, before, rtol=1e-12, atol=1e-12)
