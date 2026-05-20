"""End-to-end RPC tests for the Scan pipeline.

Covers the legacy `vb/scanform.frm` flow against a real `.md1` fixture:
``open_scan`` → ``get_scan_view`` → ``cut_scan_calibration_segment`` →
``apply_scan_calibration`` → ``select_scan_declination`` →
``baseline_scan_source`` → ``determine_scan_peak`` → ``cut_scan_segment`` →
``undo_scan``.
"""

from __future__ import annotations

from pathlib import Path

import numpy as np

from radio_cartographer.rpc import RpcServer
from radio_cartographer.scan_workspace import CAL_BLOCK, ScanWorkspace

from .helpers import call

FIXTURE = Path(__file__).resolve().parents[4] / "fixtures" / "inputs" / "cas0a.md1"


def _open(server: RpcServer) -> tuple[int, dict]:
    opened = call(server, "open_scan", {"path": str(FIXTURE)})
    assert "error" not in opened, opened
    return int(opened["result"]["handle"]), opened["result"]["overview"]


def test_open_scan_creates_workspace_with_240_cal_samples() -> None:
    server = RpcServer()
    handle, overview = _open(server)
    assert isinstance(server._handles.get(handle), ScanWorkspace)
    # Every .md1 dedicates 60 cal-on + 60 cal-off per bracket, top and tail.
    assert overview["initial_cal_samples"] == 2 * CAL_BLOCK
    assert overview["terminal_cal_samples"] == 2 * CAL_BLOCK
    assert overview["source_count"] > 0
    assert overview["calibrated"] is False
    assert overview["cal1"] != 0.0
    assert overview["cal2"] != 0.0


def test_get_scan_view_precal_returns_brackets_and_source() -> None:
    server = RpcServer()
    handle, _ = _open(server)
    resp = call(server, "get_scan_view", {"handle": handle})
    assert "error" not in resp
    v = resp["result"]
    assert v["calibrated"] is False
    assert v["unit"] == "volts"
    for key in ("initial_on", "initial_off", "terminal_on", "terminal_off"):
        block = v[key]
        assert len(block["ra"]) == CAL_BLOCK
        assert len(block["dec"]) == CAL_BLOCK
        assert len(block["flux"]) == CAL_BLOCK
        assert all(block["mask"])
    src = v["source"]
    assert len(src["ra"]) > 0
    assert len(src["ra"]) == len(src["dec"]) == len(src["flux"])
    assert all(src["mask"])


def test_apply_scan_calibration_switches_unit_and_drops_brackets() -> None:
    server = RpcServer()
    handle, overview = _open(server)
    pre_view = call(server, "get_scan_view", {"handle": handle})["result"]
    raw_flux = np.array(pre_view["source"]["flux"])

    cal = call(server, "apply_scan_calibration", {"handle": handle})
    assert "error" not in cal, cal
    assert cal["result"]["calibrated"] is True

    post_view = call(server, "get_scan_view", {"handle": handle})["result"]
    assert post_view["calibrated"] is True
    assert post_view["unit"] == "gain"
    assert "initial_on" not in post_view  # cal blocks hidden once calibrated.
    post_flux = np.array(post_view["source"]["flux"])
    # cal voltages are ~0.3..0.7 V; calibrated flux should be O(raw/cal) — a
    # noticeably different scale from the raw volts.
    assert np.allclose(post_flux, raw_flux / np.linspace(
        overview["cal1"], overview["cal2"], len(raw_flux)
    ), rtol=1e-6, atol=1e-6)


def test_cut_scan_calibration_segment_then_undo_restores_kept_count() -> None:
    server = RpcServer()
    handle, overview = _open(server)
    initial_kept = overview["initial_kept"]
    terminal_kept = overview["terminal_kept"]

    view = call(server, "get_scan_view", {"handle": handle})["result"]
    ra0 = view["initial_on"]["ra"][10]
    ra1 = view["initial_on"]["ra"][30]
    cut = call(
        server, "cut_scan_calibration_segment", {"handle": handle, "ra_min": ra0, "ra_max": ra1}
    )
    assert cut["result"]["removed"] > 0
    assert cut["result"]["overview"]["can_undo"] is True
    assert cut["result"]["overview"]["initial_kept"] < initial_kept

    undone = call(server, "undo_scan", {"handle": handle})
    assert undone["result"]["undone"] is True
    assert undone["result"]["overview"]["initial_kept"] == initial_kept
    assert undone["result"]["overview"]["terminal_kept"] == terminal_kept


def test_select_scan_calibration_declination_scopes_to_one_bracket() -> None:
    server = RpcServer()
    handle, overview = _open(server)
    view = call(server, "get_scan_calibration_view", {"handle": handle})["result"]
    decs = view["initial"]["on"]["dec"]
    lo = min(decs) + 0.01
    hi = max(decs) - 0.01
    if lo >= hi:
        # Tightly-clustered cal samples — pick a wider band so the test still
        # exercises the scoping logic.
        lo, hi = min(decs), max(decs)
    selected = call(
        server,
        "select_scan_calibration_declination",
        {"handle": handle, "dec_min": lo, "dec_max": hi, "bracket": "initial"},
    )
    assert "error" not in selected, selected
    overview_post = selected["result"]["overview"]
    # Initial bracket may shrink, terminal must be untouched.
    assert overview_post["terminal_kept"] == overview["terminal_kept"]


def test_source_reductions_require_calibration() -> None:
    server = RpcServer()
    handle, _ = _open(server)
    # Before calibration these should all reject with -32602.
    for method, params in (
        ("select_scan_declination", {"handle": handle, "dec_min": 0, "dec_max": 1}),
        ("cut_scan_segment", {"handle": handle, "ra_min": 0, "ra_max": 1}),
        (
            "baseline_scan_source",
            {"handle": handle, "ra0": 0, "flux0": 0, "ra1": 1, "flux1": 1},
        ),
        ("determine_scan_peak", {"handle": handle, "flux": 1.0}),
    ):
        resp = call(server, method, params)
        assert "error" in resp, (method, resp)
        assert resp["error"]["code"] == -32602


def test_select_scan_declination_filters_source_and_undo_restores() -> None:
    server = RpcServer()
    handle, _ = _open(server)
    call(server, "apply_scan_calibration", {"handle": handle})
    view = call(server, "get_scan_view", {"handle": handle})["result"]
    decs = np.array(view["source"]["dec"])
    lo = float(decs.min())
    hi = float(decs.mean())
    selected = call(
        server, "select_scan_declination", {"handle": handle, "dec_min": lo, "dec_max": hi}
    )
    assert "error" not in selected, selected
    assert selected["result"]["removed"] > 0
    overview_post = selected["result"]["overview"]
    assert overview_post["source_kept"] < overview_post["source_count"]

    undone = call(server, "undo_scan", {"handle": handle})
    assert undone["result"]["undone"] is True
    assert undone["result"]["overview"]["source_kept"] == overview_post["source_count"]


def test_baseline_scan_source_subtracts_line_through_two_clicks() -> None:
    server = RpcServer()
    handle, _ = _open(server)
    call(server, "apply_scan_calibration", {"handle": handle})
    view = call(server, "get_scan_view", {"handle": handle})["result"]
    ras = view["source"]["ra"]
    fluxes = view["source"]["flux"]
    ra0, flux0 = ras[0], fluxes[0]
    ra1, flux1 = ras[-1], fluxes[-1]
    resp = call(
        server,
        "baseline_scan_source",
        {"handle": handle, "ra0": ra0, "flux0": flux0, "ra1": ra1, "flux1": flux1},
    )
    assert "error" not in resp, resp
    post = call(server, "get_scan_view", {"handle": handle})["result"]
    new_flux = np.array(post["source"]["flux"])
    # Endpoints should sit on the subtracted baseline → ~0.
    assert abs(new_flux[0]) < 1e-6
    assert abs(new_flux[-1]) < 1e-6


def test_determine_scan_peak_records_the_click_y_value() -> None:
    server = RpcServer()
    handle, _ = _open(server)
    call(server, "apply_scan_calibration", {"handle": handle})
    resp = call(server, "determine_scan_peak", {"handle": handle, "flux": 4.2})
    assert "error" not in resp, resp
    assert resp["result"]["peak_flux"] == 4.2
    assert resp["result"]["overview"]["peak_flux"] == 4.2


def test_full_scan_pipeline_round_trip() -> None:
    """Drive the entire `legacyuireferenceguide.md` § Scan Processing flow."""
    server = RpcServer()
    handle, _ = _open(server)
    # 1. Pre-cal cleanup — cut a slice of the initial cal bracket.
    view = call(server, "get_scan_view", {"handle": handle})["result"]
    cut = call(
        server,
        "cut_scan_calibration_segment",
        {
            "handle": handle,
            "ra_min": view["initial_on"]["ra"][5],
            "ra_max": view["initial_on"]["ra"][15],
        },
    )
    assert "error" not in cut, cut
    # 2. Calibrate Scan.
    cal = call(server, "apply_scan_calibration", {"handle": handle})
    assert cal["result"]["calibrated"] is True
    # 3. Select Declination on the source.
    post_view = call(server, "get_scan_view", {"handle": handle})["result"]
    decs = np.array(post_view["source"]["dec"])
    sel = call(
        server,
        "select_scan_declination",
        {"handle": handle, "dec_min": float(decs.min()), "dec_max": float(decs.max())},
    )
    # Even a full-range select is accepted (removed may be 0 if every sample
    # is in-band) — just ensure no error.
    assert "error" not in sel, sel
    # 4. Baseline Source on the first/last source RA.
    src = call(server, "get_scan_view", {"handle": handle})["result"]["source"]
    base = call(
        server,
        "baseline_scan_source",
        {
            "handle": handle,
            "ra0": src["ra"][0],
            "flux0": src["flux"][0],
            "ra1": src["ra"][-1],
            "flux1": src["flux"][-1],
        },
    )
    assert "error" not in base, base
    # 5. Determine Peak — pick the max flux of the baselined source.
    src2 = call(server, "get_scan_view", {"handle": handle})["result"]["source"]
    peak_val = max(src2["flux"])
    peak = call(server, "determine_scan_peak", {"handle": handle, "flux": peak_val})
    assert peak["result"]["peak_flux"] == peak_val
    # 6. Cut Segment on the source.
    cut2 = call(
        server,
        "cut_scan_segment",
        {"handle": handle, "ra_min": src2["ra"][0], "ra_max": src2["ra"][10]},
    )
    assert "error" not in cut2, cut2
    overview = cut2["result"]["overview"]
    assert overview["source_kept"] < overview["source_count"]
    assert overview["peak_flux"] == peak_val
