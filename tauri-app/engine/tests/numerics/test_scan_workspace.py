"""Unit tests for `radio_cartographer.scan_workspace`.

Exercises the same building blocks the RPC layer relies on, but at the
function level so a math bug surfaces with a precise stack rather than as a
generic "RPC returned wrong number".
"""

from __future__ import annotations

import numpy as np
import pytest

from radio_cartographer.models import MD1Document, RawSweep
from radio_cartographer.scan_workspace import (
    CAL_BLOCK,
    apply_scan_calibration,
    baseline_scan_source,
    build_scan_workspace,
    cut_calibration_segment_scan,
    cut_scan_segment,
    determine_peak,
    select_calibration_declination_scan,
    select_scan_declination,
    undo_scan,
)


def _make_md1(source_count: int = 100) -> MD1Document:
    """Synthesize a 240-cal + N-source MD1 with predictable values.

    Layout: initial cal-on flux = 2.0, cal-off flux = 1.0 → Cal1 = 1.0.
            terminal cal-on flux = 4.0, cal-off flux = 1.0 → Cal2 = 3.0.
            source flux = 5.0 (constant).
    Dec column is unique per sample so masks can be exercised without
    collisions. RA is monotonically increasing.
    """
    total = 4 * CAL_BLOCK + source_count
    ra = np.linspace(0.0, 1.0, total)
    dec = np.linspace(10.0, 20.0, total)
    flux = np.zeros(total, dtype=np.float64)
    flux[0:CAL_BLOCK] = 2.0  # initial cal-on
    flux[CAL_BLOCK : 2 * CAL_BLOCK] = 1.0  # initial cal-off
    flux[2 * CAL_BLOCK : 2 * CAL_BLOCK + source_count] = 5.0  # source
    flux[2 * CAL_BLOCK + source_count : 3 * CAL_BLOCK + source_count] = 4.0  # term on
    flux[3 * CAL_BLOCK + source_count :] = 1.0  # term off
    samples = RawSweep(ra=ra, dec=dec, flux=flux)
    return MD1Document(samples=samples, raw_bytes=b"", trailing_metadata=())


def test_build_scan_workspace_partitions_cal_and_source() -> None:
    md1 = _make_md1(source_count=42)
    ws = build_scan_workspace("/tmp/fake.md1", md1)
    assert ws.name == "FAKE"
    assert ws.source_count == 42
    assert ws.initial.on_flux.shape == (CAL_BLOCK,)
    assert ws.initial.off_flux.shape == (CAL_BLOCK,)
    assert ws.terminal.on_flux.shape == (CAL_BLOCK,)
    assert ws.terminal.off_flux.shape == (CAL_BLOCK,)
    assert ws.cal1() == pytest.approx(1.0)
    assert ws.cal2() == pytest.approx(3.0)
    assert ws.calibrated is False


def test_build_rejects_short_scan() -> None:
    md1 = MD1Document(
        samples=RawSweep(ra=np.zeros(10), dec=np.zeros(10), flux=np.zeros(10)),
        raw_bytes=b"",
    )
    with pytest.raises(ValueError, match="at least"):
        build_scan_workspace("/tmp/short.md1", md1)


def test_apply_scan_calibration_lerps_cal_voltage_across_ra() -> None:
    md1 = _make_md1(source_count=4)
    ws = build_scan_workspace("/tmp/fake.md1", md1)
    apply_scan_calibration(ws)
    # 4 source samples with linear t∈[0,1]: cal = 1 + 2t → 1, 1.667, 2.333, 3.
    assert ws.calibrated
    expected_cal = np.array([1.0, 1.0 + 2.0 / 3.0, 1.0 + 4.0 / 3.0, 3.0])
    assert ws.calibrated_source_flux is not None
    assert np.allclose(ws.calibrated_source_flux, 5.0 / expected_cal)


def test_cut_calibration_segment_then_undo_round_trips() -> None:
    md1 = _make_md1()
    ws = build_scan_workspace("/tmp/fake.md1", md1)
    ra_min = ws.initial.on_ra[10]
    ra_max = ws.initial.on_ra[20]
    removed = cut_calibration_segment_scan(ws, ra_min, ra_max)
    assert removed > 0
    assert int(ws.initial.on_mask.sum()) < CAL_BLOCK
    assert undo_scan(ws) is True
    assert int(ws.initial.on_mask.sum()) == CAL_BLOCK


def test_select_calibration_declination_only_one_bracket() -> None:
    md1 = _make_md1()
    ws = build_scan_workspace("/tmp/fake.md1", md1)
    decs = ws.initial.on_dec
    select_calibration_declination_scan(ws, float(decs.min()), float(decs.min()) + 0.001, "initial")
    # Initial shrinks; terminal unchanged.
    assert int(ws.initial.on_mask.sum()) < CAL_BLOCK
    assert int(ws.terminal.on_mask.sum()) == CAL_BLOCK


def test_select_calibration_declination_rejects_unknown_bracket() -> None:
    md1 = _make_md1()
    ws = build_scan_workspace("/tmp/fake.md1", md1)
    with pytest.raises(ValueError):
        select_calibration_declination_scan(ws, 0.0, 1.0, "middle")


def test_select_scan_declination_marks_outside_samples_as_cut() -> None:
    md1 = _make_md1(source_count=10)
    ws = build_scan_workspace("/tmp/fake.md1", md1)
    apply_scan_calibration(ws)
    dec_min = float(ws.source_dec[2])
    dec_max = float(ws.source_dec[7])
    removed = select_scan_declination(ws, dec_min, dec_max)
    assert removed > 0
    assert int(ws.source_mask.sum()) < ws.source_count
    # The kept samples should all sit in the requested band.
    kept_decs = ws.source_dec[ws.source_mask]
    assert kept_decs.min() >= dec_min
    assert kept_decs.max() <= dec_max


def test_cut_scan_segment_marks_inside_samples_as_cut() -> None:
    md1 = _make_md1(source_count=10)
    ws = build_scan_workspace("/tmp/fake.md1", md1)
    apply_scan_calibration(ws)
    ra_min = float(ws.source_ra[2])
    ra_max = float(ws.source_ra[7])
    removed = cut_scan_segment(ws, ra_min, ra_max)
    assert removed == 6  # samples 2..7 inclusive
    kept_ras = ws.source_ra[ws.source_mask]
    assert ((kept_ras < ra_min) | (kept_ras > ra_max)).all()


def test_baseline_scan_source_zeros_endpoints() -> None:
    md1 = _make_md1(source_count=20)
    ws = build_scan_workspace("/tmp/fake.md1", md1)
    apply_scan_calibration(ws)
    ra0, ra1 = float(ws.source_ra[0]), float(ws.source_ra[-1])
    f0 = float(ws.calibrated_source_flux[0])  # type: ignore[index]
    f1 = float(ws.calibrated_source_flux[-1])  # type: ignore[index]
    baseline_scan_source(ws, ra0, f0, ra1, f1)
    assert ws.reduced_source_flux is not None
    assert ws.reduced_source_flux[0] == pytest.approx(0.0, abs=1e-12)
    assert ws.reduced_source_flux[-1] == pytest.approx(0.0, abs=1e-12)


def test_baseline_rejects_identical_ra_endpoints() -> None:
    md1 = _make_md1(source_count=5)
    ws = build_scan_workspace("/tmp/fake.md1", md1)
    apply_scan_calibration(ws)
    with pytest.raises(ValueError):
        baseline_scan_source(ws, 1.0, 0.0, 1.0, 1.0)


def test_determine_peak_stores_y_value() -> None:
    md1 = _make_md1(source_count=5)
    ws = build_scan_workspace("/tmp/fake.md1", md1)
    apply_scan_calibration(ws)
    assert determine_peak(ws, 3.14) == 3.14
    assert ws.peak_flux == 3.14


def test_undo_after_source_op_restores_mask_and_reduced_flux() -> None:
    md1 = _make_md1(source_count=10)
    ws = build_scan_workspace("/tmp/fake.md1", md1)
    apply_scan_calibration(ws)
    pre_mask = ws.source_mask.copy()
    cut_scan_segment(ws, float(ws.source_ra[2]), float(ws.source_ra[7]))
    assert undo_scan(ws) is True
    assert np.array_equal(ws.source_mask, pre_mask)


def test_apply_scan_calibration_resets_reductions() -> None:
    md1 = _make_md1(source_count=5)
    ws = build_scan_workspace("/tmp/fake.md1", md1)
    apply_scan_calibration(ws)
    ws.reduced_source_flux = np.ones(5, dtype=np.float64)
    ws.peak_flux = 1.5
    apply_scan_calibration(ws)  # re-calibrate
    assert ws.reduced_source_flux is None
    assert ws.peak_flux is None
