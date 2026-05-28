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


def _install_synthetic_quadratic(
    server: RpcServer, handle: int, *, peak_flux: float, peak_ra: float
) -> None:
    """Overwrite a calibrated workspace with a known-quadratic source.

    Replaces `source_ra` and `reduced_source_flux` with `flux = peak_flux - 0.1·(ra - peak_ra)²`
    so the polynomial-fit RPC has an analytical truth value to compare against.
    """
    ws = server._handles.get(handle)
    assert isinstance(ws, ScanWorkspace)
    assert ws.calibrated
    ra = np.linspace(peak_ra - 5.0, peak_ra + 5.0, 51)
    flux = peak_flux - 0.1 * (ra - peak_ra) ** 2
    ws.source_ra = ra
    ws.source_mask = np.ones(ra.shape, dtype=np.bool_)
    ws.reduced_source_flux = flux


def test_determine_scan_peak_fit_recovers_known_quadratic() -> None:
    server = RpcServer()
    handle, _ = _open(server)
    call(server, "apply_scan_calibration", {"handle": handle})
    _install_synthetic_quadratic(server, handle, peak_flux=5.0, peak_ra=10.0)
    resp = call(
        server,
        "determine_scan_peak_fit",
        {"handle": handle, "ra_min": 7.0, "ra_max": 13.0, "degree": 2},
    )
    assert "error" not in resp, resp
    result = resp["result"]
    # Quadratic recovery is essentially exact (modulo float epsilon + grid step).
    assert abs(result["peak_flux"] - 5.0) < 1e-3
    assert abs(result["peak_ra"] - 10.0) < 0.05
    assert result["overview"]["peak_flux"] == result["peak_flux"]
    assert len(result["fit_ra"]) == len(result["fit_flux"]) == 200
    assert result["fit_ra"][0] == 7.0
    assert result["fit_ra"][-1] == 13.0


def test_determine_scan_peak_fit_undo_restores_prior_peak_flux() -> None:
    server = RpcServer()
    handle, _ = _open(server)
    call(server, "apply_scan_calibration", {"handle": handle})
    # Seed a prior peak value so we can verify undo restores it.
    call(server, "determine_scan_peak", {"handle": handle, "flux": 3.0})
    _install_synthetic_quadratic(server, handle, peak_flux=7.0, peak_ra=20.0)
    fit = call(
        server,
        "determine_scan_peak_fit",
        {"handle": handle, "ra_min": 17.0, "ra_max": 23.0, "degree": 2},
    )
    assert "error" not in fit, fit
    assert abs(fit["result"]["peak_flux"] - 7.0) < 1e-3
    undone = call(server, "undo_scan", {"handle": handle})
    assert "error" not in undone, undone
    assert undone["result"]["overview"]["peak_flux"] == 3.0


def test_determine_scan_peak_fit_rejects_too_few_samples() -> None:
    server = RpcServer()
    handle, _ = _open(server)
    call(server, "apply_scan_calibration", {"handle": handle})
    _install_synthetic_quadratic(server, handle, peak_flux=5.0, peak_ra=10.0)
    # A 0.1-wide window catches only ~1 sample from the 51-sample synthetic
    # source — fewer than degree+1=5 required for a degree-4 fit.
    resp = call(
        server,
        "determine_scan_peak_fit",
        {"handle": handle, "ra_min": 9.95, "ra_max": 10.05, "degree": 4},
    )
    assert "error" in resp, resp
    assert "kept samples" in resp["error"]["message"]


def _install_synthetic_gaussian(
    server: RpcServer, handle: int, *, peak_flux: float, peak_ra: float, stddev: float
) -> None:
    """Overwrite a calibrated workspace with a known Gaussian source.

    Replaces `source_ra` and `reduced_source_flux` with
    `flux = peak_flux · exp(-((ra - peak_ra)/stddev)²/2)` so the Gaussian-fit
    RPC has an analytical truth value to compare against.
    """
    ws = server._handles.get(handle)
    assert isinstance(ws, ScanWorkspace)
    assert ws.calibrated
    ra = np.linspace(peak_ra - 5 * stddev, peak_ra + 5 * stddev, 51)
    flux = peak_flux * np.exp(-0.5 * ((ra - peak_ra) / stddev) ** 2)
    ws.source_ra = ra
    ws.source_mask = np.ones(ra.shape, dtype=np.bool_)
    ws.reduced_source_flux = flux


def test_determine_scan_peak_gaussian_recovers_known_gaussian() -> None:
    server = RpcServer()
    handle, _ = _open(server)
    call(server, "apply_scan_calibration", {"handle": handle})
    _install_synthetic_gaussian(
        server, handle, peak_flux=7.5, peak_ra=20.0, stddev=1.5
    )
    resp = call(
        server,
        "determine_scan_peak_gaussian",
        {"handle": handle, "ra_min": 15.0, "ra_max": 25.0},
    )
    assert "error" not in resp, resp
    result = resp["result"]
    # The log-quadratic fit has small intrinsic bias from the
    # baseline-subtraction step (the synthetic has no offset, but the
    # estimator still subtracts `min(flux)` from the band, which clips the
    # tail samples). 1% of peak is well inside the noise floor of any real
    # telescope scan; we just want to confirm we're in the right neighborhood.
    assert abs(result["peak_flux"] - 7.5) < 0.05
    assert abs(result["peak_ra"] - 20.0) < 0.05
    assert result["overview"]["peak_flux"] == result["peak_flux"]
    assert len(result["fit_ra"]) == len(result["fit_flux"]) == 200


def test_determine_scan_peak_gaussian_undo_restores_prior_peak_flux() -> None:
    server = RpcServer()
    handle, _ = _open(server)
    call(server, "apply_scan_calibration", {"handle": handle})
    call(server, "determine_scan_peak", {"handle": handle, "flux": 2.0})
    _install_synthetic_gaussian(
        server, handle, peak_flux=6.0, peak_ra=10.0, stddev=2.0
    )
    fit = call(
        server,
        "determine_scan_peak_gaussian",
        {"handle": handle, "ra_min": 4.0, "ra_max": 16.0},
    )
    assert "error" not in fit, fit
    undone = call(server, "undo_scan", {"handle": handle})
    assert undone["result"]["overview"]["peak_flux"] == 2.0


def test_determine_scan_peak_gaussian_rejects_too_few_samples() -> None:
    server = RpcServer()
    handle, _ = _open(server)
    call(server, "apply_scan_calibration", {"handle": handle})
    _install_synthetic_gaussian(
        server, handle, peak_flux=5.0, peak_ra=10.0, stddev=1.0
    )
    # Narrow window catches < 4 samples → not enough for a 4-param Gaussian.
    resp = call(
        server,
        "determine_scan_peak_gaussian",
        {"handle": handle, "ra_min": 9.99, "ra_max": 10.01},
    )
    assert "error" in resp, resp
    assert "kept samples" in resp["error"]["message"]


def test_determine_scan_peak_fit_rejects_invalid_degree() -> None:
    server = RpcServer()
    handle, _ = _open(server)
    call(server, "apply_scan_calibration", {"handle": handle})
    _install_synthetic_quadratic(server, handle, peak_flux=5.0, peak_ra=10.0)
    resp = call(
        server,
        "determine_scan_peak_fit",
        {"handle": handle, "ra_min": 7.0, "ra_max": 13.0, "degree": 5},
    )
    assert "error" in resp
    assert "degree" in resp["error"]["message"].lower()


def _install_synthetic_squared_cosine(
    server: RpcServer,
    handle: int,
    *,
    peak_flux: float,
    peak_ra: float,
    half_width: float,
    baseline: float = 0.0,
) -> None:
    """Overwrite a calibrated workspace with a known cos² lobe.

    The synthetic spans exactly one lobe centred on `peak_ra` with
    `flux = peak_flux · cos²(π(ra − peak_ra)/(2·half_width)) + baseline`
    over `[peak_ra − half_width, peak_ra + half_width]`.
    """
    ws = server._handles.get(handle)
    assert isinstance(ws, ScanWorkspace)
    assert ws.calibrated
    ra = np.linspace(peak_ra - half_width, peak_ra + half_width, 51)
    flux = peak_flux * np.cos(np.pi * (ra - peak_ra) / (2.0 * half_width)) ** 2 + baseline
    ws.source_ra = ra
    ws.source_mask = np.ones(ra.shape, dtype=np.bool_)
    ws.reduced_source_flux = flux


def test_determine_scan_peak_squared_cosine_recovers_known_cos2() -> None:
    server = RpcServer()
    handle, _ = _open(server)
    call(server, "apply_scan_calibration", {"handle": handle})
    _install_synthetic_squared_cosine(
        server, handle, peak_flux=4.0, peak_ra=12.0, half_width=3.0, baseline=0.5
    )
    resp = call(
        server,
        "determine_scan_peak_squared_cosine",
        {"handle": handle, "ra_min": 9.0, "ra_max": 15.0},
    )
    assert "error" not in resp, resp
    result = resp["result"]
    # `peak_flux` is A + baseline = 4.0 + 0.5 = 4.5. The linear lstsq is exact
    # in noise-free synthetics (within float epsilon + 200-point grid step).
    assert abs(result["peak_flux"] - 4.5) < 1e-3
    assert abs(result["peak_ra"] - 12.0) < 0.05
    assert result["overview"]["peak_flux"] == result["peak_flux"]
    assert len(result["fit_ra"]) == len(result["fit_flux"]) == 200


def test_determine_scan_peak_squared_cosine_undo_restores_prior_peak_flux() -> None:
    server = RpcServer()
    handle, _ = _open(server)
    call(server, "apply_scan_calibration", {"handle": handle})
    call(server, "determine_scan_peak", {"handle": handle, "flux": 1.5})
    _install_synthetic_squared_cosine(
        server, handle, peak_flux=3.0, peak_ra=8.0, half_width=2.0
    )
    fit = call(
        server,
        "determine_scan_peak_squared_cosine",
        {"handle": handle, "ra_min": 6.0, "ra_max": 10.0},
    )
    assert "error" not in fit, fit
    undone = call(server, "undo_scan", {"handle": handle})
    assert undone["result"]["overview"]["peak_flux"] == 1.5


def test_determine_scan_peak_squared_cosine_rejects_too_few_samples() -> None:
    server = RpcServer()
    handle, _ = _open(server)
    call(server, "apply_scan_calibration", {"handle": handle})
    _install_synthetic_squared_cosine(
        server, handle, peak_flux=2.0, peak_ra=10.0, half_width=2.0
    )
    # Narrow window catches < 4 samples → too few for the 3-param lstsq.
    resp = call(
        server,
        "determine_scan_peak_squared_cosine",
        {"handle": handle, "ra_min": 9.99, "ra_max": 10.01},
    )
    assert "error" in resp, resp
    assert "kept samples" in resp["error"]["message"]


def test_determine_scan_peak_max_value_returns_max_sample() -> None:
    server = RpcServer()
    handle, _ = _open(server)
    call(server, "apply_scan_calibration", {"handle": handle})
    _install_synthetic_quadratic(server, handle, peak_flux=5.0, peak_ra=10.0)
    resp = call(
        server,
        "determine_scan_peak_max_value",
        {"handle": handle, "ra_min": 7.0, "ra_max": 13.0},
    )
    assert "error" not in resp, resp
    result = resp["result"]
    # The synthetic samples a quadratic over [5, 15] with 51 points; the
    # sample nearest 10.0 hits exactly 5.0.
    assert abs(result["peak_flux"] - 5.0) < 1e-6
    assert abs(result["peak_ra"] - 10.0) < 1e-6
    assert result["overview"]["peak_flux"] == result["peak_flux"]
    # Max-value returns a single-point "grid" so the UI can branch on it.
    assert len(result["fit_ra"]) == len(result["fit_flux"]) == 1


def test_determine_scan_peak_max_value_undo_restores_prior_peak_flux() -> None:
    server = RpcServer()
    handle, _ = _open(server)
    call(server, "apply_scan_calibration", {"handle": handle})
    call(server, "determine_scan_peak", {"handle": handle, "flux": 2.5})
    _install_synthetic_quadratic(server, handle, peak_flux=8.0, peak_ra=15.0)
    pick = call(
        server,
        "determine_scan_peak_max_value",
        {"handle": handle, "ra_min": 12.0, "ra_max": 18.0},
    )
    assert "error" not in pick, pick
    assert abs(pick["result"]["peak_flux"] - 8.0) < 1e-6
    undone = call(server, "undo_scan", {"handle": handle})
    assert undone["result"]["overview"]["peak_flux"] == 2.5


def test_determine_scan_peak_max_value_rejects_empty_range() -> None:
    server = RpcServer()
    handle, _ = _open(server)
    call(server, "apply_scan_calibration", {"handle": handle})
    _install_synthetic_quadratic(server, handle, peak_flux=5.0, peak_ra=10.0)
    # A range outside the [5, 15] synthetic catches no samples at all.
    resp = call(
        server,
        "determine_scan_peak_max_value",
        {"handle": handle, "ra_min": 100.0, "ra_max": 101.0},
    )
    assert "error" in resp, resp
    assert "kept sample" in resp["error"]["message"]


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
