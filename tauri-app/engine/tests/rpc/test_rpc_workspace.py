from __future__ import annotations

from pathlib import Path

import numpy as np

from radio_cartographer.rpc import RpcServer
from radio_cartographer.workspace import SurveyWorkspace

from .helpers import call

FIXTURE = Path(__file__).resolve().parents[4] / "fixtures" / "inputs" / "and0a.md2"


def _open(server: RpcServer) -> tuple[int, dict]:
    opened = call(server, "open_survey", {"path": str(FIXTURE)})
    assert "error" not in opened, opened
    return int(opened["result"]["workspace_handle"]), opened["result"]["workspace"]


def test_open_survey_creates_workspace_handle() -> None:
    server = RpcServer()
    ws_handle, overview = _open(server)
    assert isinstance(server._handles.get(ws_handle), SurveyWorkspace)
    # and0a.md2 has 65 sweeps: 2 cal + 61 source + 2 cal.
    assert overview["source_count"] == 61
    assert overview["initial_cal_samples"] == 120
    assert overview["terminal_cal_samples"] == 120
    assert overview["calibrated"] is False
    # Cal1 and Cal2 should match the legacy screenshot (~.340 V / ~.360 V).
    assert abs(overview["cal1"] - 0.340) < 0.01
    assert abs(overview["cal2"] - 0.360) < 0.01


def test_get_source_sweep_returns_uncalibrated_volts() -> None:
    server = RpcServer()
    ws_handle, _ = _open(server)
    resp = call(server, "get_source_sweep", {"handle": ws_handle, "index": 0, "max_points": 0})
    assert "error" not in resp
    r = resp["result"]
    assert r["unit"] == "volts"
    assert r["calibrated"] is False
    assert r["source_count"] == 61
    assert r["index"] == 0
    assert r["label"].startswith("AND0A - Sweep 1")
    # The first source sweep in and0a is the third sweep of the file.
    assert r["sample_count"] > 0
    assert len(r["flux"]) == r["sample_count"]


def test_get_sweep_paths_returns_one_polyline_per_source_sweep() -> None:
    server = RpcServer()
    ws_handle, overview = _open(server)
    resp = call(server, "get_sweep_paths", {"handle": ws_handle, "max_points": 32})
    assert "error" not in resp, resp
    r = resp["result"]
    assert r["source_count"] == 61
    assert len(r["sweeps"]) == 61
    # Indices are 0-based and contiguous — the frontend adds 1 for display.
    assert [s["index"] for s in r["sweeps"]] == list(range(61))
    for s in r["sweeps"]:
        assert len(s["ra"]) == len(s["dec"])
        assert 0 < len(s["ra"]) <= 32
    # Sweeps step through RA as the earth rotates, so consecutive source sweeps
    # sit at increasing (or at least distinct) mean RA — the property the hover
    # readout relies on to map a cell's RA back to a sweep.
    means = [float(np.mean(s["ra"])) for s in r["sweeps"]]
    assert means[0] != means[-1]


def test_get_sweep_paths_tracks_align_dec_shift() -> None:
    server = RpcServer()
    ws_handle, _ = _open(server)
    before = call(server, "get_sweep_paths", {"handle": ws_handle, "max_points": 0})
    dec_before = [np.array(s["dec"]) for s in before["result"]["sweeps"]]
    # Align Sweeps rewrites the source dec; the paths must follow so the readout
    # stays aligned with the regenerated pre-image.
    aligned = call(server, "align", {"handle": ws_handle, "factor": 0.5, "workspace_handle": ws_handle})
    assert "error" not in aligned, aligned
    after = call(server, "get_sweep_paths", {"handle": ws_handle, "max_points": 0})
    dec_after = [np.array(s["dec"]) for s in after["result"]["sweeps"]]
    # Sample counts are preserved, but at least one sweep's dec shifted — the
    # align output flowed through into the paths rather than being ignored.
    assert [d.shape for d in dec_before] == [d.shape for d in dec_after]
    assert any(not np.array_equal(b, a) for b, a in zip(dec_before, dec_after))


def test_get_calibration_view_shape() -> None:
    server = RpcServer()
    ws_handle, _ = _open(server)
    resp = call(server, "get_calibration_view", {"handle": ws_handle})
    assert "error" not in resp
    r = resp["result"]
    for label, bracket in (("initial", r["initial"]), ("terminal", r["terminal"])):
        assert len(bracket["on"]["ra"]) == 60, label
        assert len(bracket["off"]["flux"]) == 60, label
        assert all(bracket["on"]["mask"]), label
        assert all(bracket["off"]["mask"]), label


def test_cut_calibration_segment_then_undo() -> None:
    server = RpcServer()
    ws_handle, overview = _open(server)
    cal1_pre = overview["cal1"]

    cut = call(server, "cut_calibration_segment", {"handle": ws_handle, "ra_min": 800, "ra_max": 820})
    assert "error" not in cut
    assert cut["result"]["removed"] > 0
    overview_post = cut["result"]["overview"]
    assert overview_post["can_undo"] is True
    # Cal1 may have shifted slightly because some initial samples are masked.
    assert overview_post["initial_kept"] < overview["initial_kept"]

    undone = call(server, "undo_calibration_cut", {"handle": ws_handle})
    assert "error" not in undone
    assert undone["result"]["undone"] is True
    assert undone["result"]["overview"]["initial_kept"] == overview["initial_kept"]
    assert abs(undone["result"]["overview"]["cal1"] - cal1_pre) < 1e-12


def test_select_calibration_declination_only_affects_one_bracket() -> None:
    server = RpcServer()
    ws_handle, overview = _open(server)

    view = call(server, "get_calibration_view", {"handle": ws_handle})
    # The legacy "Select Declination" gesture drags a horizontal band on the
    # dec-vs-RA plot of ONE bracket panel. Initial and terminal brackets sit
    # at different declinations, so applying one panel's band to both would
    # over-cut — we scope to the panel the user dragged on.
    decs = view["result"]["initial"]["on"]["dec"]
    lo = min(decs)
    hi = max(decs)
    span = hi - lo
    sel_lo = lo + 0.25 * span
    sel_hi = hi - 0.25 * span

    selected = call(
        server,
        "select_calibration_declination",
        {
            "handle": ws_handle,
            "dec_min": sel_lo,
            "dec_max": sel_hi,
            "bracket": "initial",
        },
    )
    assert "error" not in selected
    assert selected["result"]["removed"] > 0
    overview_post = selected["result"]["overview"]
    assert overview_post["can_undo"] is True
    # Only the initial bracket should have shrunk.
    assert overview_post["initial_kept"] < overview["initial_kept"]
    assert overview_post["terminal_kept"] == overview["terminal_kept"]

    undone = call(server, "undo_calibration_cut", {"handle": ws_handle})
    assert undone["result"]["undone"] is True
    assert undone["result"]["overview"]["initial_kept"] == overview["initial_kept"]


def test_select_calibration_declination_rejects_unknown_bracket() -> None:
    server = RpcServer()
    ws_handle, _ = _open(server)
    resp = call(
        server,
        "select_calibration_declination",
        {"handle": ws_handle, "dec_min": 0, "dec_max": 1, "bracket": "middle"},
    )
    assert "error" in resp
    assert resp["error"]["code"] == -32602


def test_undo_when_stack_empty_is_safe() -> None:
    server = RpcServer()
    ws_handle, _ = _open(server)
    undone = call(server, "undo_calibration_cut", {"handle": ws_handle})
    assert "error" not in undone
    assert undone["result"]["undone"] is False


def test_apply_gain_calibration_sets_calibrated_flag_and_changes_units() -> None:
    server = RpcServer()
    ws_handle, _ = _open(server)
    pre = call(server, "get_source_sweep", {"handle": ws_handle, "index": 0, "max_points": 0})
    pre_flux = np.array(pre["result"]["flux"])

    overview = call(server, "apply_gain_calibration", {"handle": ws_handle})
    assert "error" not in overview, overview
    assert overview["result"]["calibrated"] is True

    post = call(server, "get_source_sweep", {"handle": ws_handle, "index": 0, "max_points": 0})
    assert post["result"]["unit"] == "gain"
    post_flux = np.array(post["result"]["flux"])
    # Calibrated flux must be the raw flux divided by ~0.35 V (Cal1/Cal2 ~= .34/.36).
    ratio = post_flux / pre_flux
    assert 1.0 < float(ratio.mean()) < 5.0
    assert float(ratio.std()) < 0.05


def test_set_bracket_enabled_toggles_cal_value() -> None:
    server = RpcServer()
    ws_handle, overview = _open(server)
    cal1_pre = overview["cal1"]

    disabled = call(server, "set_bracket_enabled", {"handle": ws_handle, "bracket": "initial", "enabled": False})
    assert "error" not in disabled
    assert disabled["result"]["cal1"] == 0.0
    assert disabled["result"]["initial_enabled"] is False

    enabled = call(server, "set_bracket_enabled", {"handle": ws_handle, "bracket": "initial", "enabled": True})
    assert "error" not in enabled
    assert abs(enabled["result"]["cal1"] - cal1_pre) < 1e-12


def _open_calibrated(server: RpcServer) -> int:
    ws_handle, _ = _open(server)
    cal = call(server, "apply_gain_calibration", {"handle": ws_handle})
    assert "error" not in cal, cal
    return ws_handle


def test_set_source_sweep_flux_writes_to_calibrated_layer(tmp_path: Path) -> None:
    server = RpcServer()
    ws_handle = _open_calibrated(server)
    sweep = call(server, "get_source_sweep", {"handle": ws_handle, "index": 1, "max_points": 0})
    n = sweep["result"]["sample_count"]
    new_flux = [0.5] * n
    resp = call(
        server,
        "set_source_sweep_flux",
        {"handle": ws_handle, "index": 1, "flux": new_flux},
    )
    assert "error" not in resp, resp
    # The workspace's calibrated layer for that sweep should match what we sent.
    ws = server._handles.get(ws_handle)
    assert isinstance(ws, SurveyWorkspace)
    assert ws.calibrated_source_flux is not None
    np.testing.assert_allclose(ws.calibrated_source_flux[1], np.asarray(new_flux))


def test_set_source_sweep_flux_round_trips_through_save_and_load(tmp_path: Path) -> None:
    server = RpcServer()
    ws_handle = _open_calibrated(server)
    sweep = call(server, "get_source_sweep", {"handle": ws_handle, "index": 2, "max_points": 0})
    n = sweep["result"]["sample_count"]
    # Use a non-trivial pattern so the round-trip can't accidentally pass via
    # an unrelated constant value.
    new_flux = [float(i % 7) * 0.1 for i in range(n)]

    set_resp = call(
        server,
        "set_source_sweep_flux",
        {"handle": ws_handle, "index": 2, "flux": new_flux},
    )
    assert "error" not in set_resp, set_resp

    out = tmp_path / "round.srv"
    save = call(server, "save_survey", {"handle": ws_handle, "path": str(out)})
    assert "error" not in save, save

    reopen = call(server, "open_saved_survey", {"path": str(out)})
    assert "error" not in reopen, reopen
    reloaded_ws = int(reopen["result"]["workspace_handle"])
    reloaded_sweep = call(
        server, "get_source_sweep", {"handle": reloaded_ws, "index": 2, "max_points": 0}
    )
    # Round-trip through the .srv format truncates to 4 decimal places (#.####).
    np.testing.assert_allclose(
        reloaded_sweep["result"]["flux"], new_flux, atol=5e-4
    )


def test_set_source_sweep_flux_rejects_wrong_length() -> None:
    server = RpcServer()
    ws_handle = _open_calibrated(server)
    resp = call(
        server,
        "set_source_sweep_flux",
        {"handle": ws_handle, "index": 0, "flux": [1.0, 2.0, 3.0]},
    )
    assert "error" in resp
    assert resp["error"]["code"] == -32602  # ERR_INVALID_PARAMS


def test_set_source_sweep_flux_rejects_uncalibrated_workspace() -> None:
    server = RpcServer()
    ws_handle, _ = _open(server)
    sweep = call(server, "get_source_sweep", {"handle": ws_handle, "index": 0, "max_points": 0})
    n = sweep["result"]["sample_count"]
    resp = call(
        server,
        "set_source_sweep_flux",
        {"handle": ws_handle, "index": 0, "flux": [0.0] * n},
    )
    assert "error" in resp
    assert resp["error"]["code"] == -32602


def test_get_source_sweep_returns_processed_flux_after_reduction() -> None:
    # BUG-015 (dan): a Pre Image reduction (smooth) processes the workspace
    # sweeps into `reduced_source_flux`; get_source_sweep must return that
    # processed layer so "Back to Sweeps" shows the reduced data rather than the
    # pre-reduction calibrated values.
    server = RpcServer()
    ws_handle = _open_calibrated(server)
    ws = server._handles.get(ws_handle)

    before = call(server, "get_source_sweep", {"handle": ws_handle, "index": 0, "max_points": 0})
    before_flux = np.array(before["result"]["flux"])
    assert ws.calibrated_source_flux is not None
    assert np.allclose(before_flux, ws.calibrated_source_flux[0])

    smoothed = call(
        server, "smooth", {"handle": ws_handle, "width": 5, "workspace_handle": ws_handle}
    )
    assert "error" not in smoothed, smoothed

    after = call(server, "get_source_sweep", {"handle": ws_handle, "index": 0, "max_points": 0})
    after_flux = np.array(after["result"]["flux"])
    assert ws.reduced_source_flux is not None
    assert np.allclose(after_flux, ws.reduced_source_flux[0])


def test_get_source_sweep_returns_reduction_without_calibration() -> None:
    # BUG-015 (dan) round 2: reductions must surface from get_source_sweep even
    # when the workspace was never gain-calibrated — previously the guard
    # required `ws.calibrated`, silently dropping the processed layer.
    server = RpcServer()
    ws_handle, _ = _open(server)
    ws = server._handles.get(ws_handle)
    assert not ws.calibrated

    smoothed = call(
        server, "smooth", {"handle": ws_handle, "width": 5, "workspace_handle": ws_handle}
    )
    assert "error" not in smoothed, smoothed

    resp = call(server, "get_source_sweep", {"handle": ws_handle, "index": 0, "max_points": 0})
    assert "error" not in resp
    r = resp["result"]
    assert r["unit"] == "volts"
    assert ws.reduced_source_flux is not None
    assert np.allclose(np.array(r["flux"]), ws.reduced_source_flux[0])


def test_get_source_sweep_returns_aligned_dec_after_align() -> None:
    # BUG-015 (dan) round 2: Align Sweeps shifts the per-sweep declinations
    # into `reduced_source_dec`; Back to Sweeps must show the shifted decs.
    server = RpcServer()
    ws_handle = _open_calibrated(server)
    ws = server._handles.get(ws_handle)

    aligned = call(
        server, "align", {"handle": ws_handle, "factor": 0.5, "workspace_handle": ws_handle}
    )
    assert "error" not in aligned, aligned
    assert ws.reduced_source_dec is not None

    resp = call(server, "get_source_sweep", {"handle": ws_handle, "index": 0, "max_points": 0})
    assert "error" not in resp
    assert np.allclose(np.array(resp["result"]["dec"]), ws.reduced_source_dec[0])
