"""RPC tests for the flux-calibration (.cal) methods."""

from __future__ import annotations

from pathlib import Path

from radio_cartographer.io.cal import read_cal
from radio_cartographer.rpc import RpcServer

from .helpers import call

FIXTURES_ROOT = Path(__file__).resolve().parents[4] / "fixtures"
INPUTS = FIXTURES_ROOT / "inputs"
INTERMEDIATES = FIXTURES_ROOT / "intermediates"
SURVEY_FIXTURE = INPUTS / "cygnus1a.md2"
SCAN_FIXTURE = INPUTS / "cas0a.md1"
CAL_FIXTURE = INPUTS / "cal25a.cal"
# Reduced .scn fixtures live under intermediates/ — they're outputs of the
# legacy reduction pipeline, not raw telescope captures.
PEAK_SCN = INTERMEDIATES / "cas0awpeak.scn"


def test_flux_cal_read_file_returns_table_slope_and_error() -> None:
    server = RpcServer()
    resp = call(server, "flux_cal_read_file", {"path": str(CAL_FIXTURE)})
    assert "error" not in resp, resp
    result = resp["result"]
    assert result["slope"] > 0
    assert result["error"] >= 0
    assert "table" in result
    table = result["table"]
    assert len(table["entries"]) >= 1
    for entry in table["entries"]:
        assert "name" in entry
        assert "measured_flux" in entry
        assert "known_flux" in entry


def test_flux_cal_fit_recomputes_from_payload() -> None:
    server = RpcServer()
    entries = [
        {"name": "A", "measured_flux": 1.0, "known_flux": 10.0},
        {"name": "B", "measured_flux": 2.0, "known_flux": 22.0},
        {"name": "C", "measured_flux": 3.0, "known_flux": 27.0},
    ]
    resp = call(server, "flux_cal_fit", {"caption": "demo", "entries": entries})
    assert "error" not in resp, resp
    result = resp["result"]
    # G* = (1*10 + 2*22 + 3*27) / (1 + 4 + 9) = 135 / 14
    assert abs(result["slope"] - 135.0 / 14.0) < 1e-9
    assert result["error"] > 0
    assert result["table"]["caption"] == "demo"
    assert result["table"]["max_measured_flux"] == 3.0
    assert result["table"]["max_known_flux"] == 27.0


def test_flux_cal_write_file_round_trips(tmp_path: Path) -> None:
    server = RpcServer()
    entries = [
        {"name": "CYG A", "measured_flux": 0.5, "known_flux": 1581.0},
        {"name": "TAU A", "measured_flux": 0.3, "known_flux": 942.0},
    ]
    out = tmp_path / "demo.cal"
    resp = call(
        server,
        "flux_cal_write_file",
        {"path": str(out), "caption": "demo", "entries": entries},
    )
    assert "error" not in resp, resp
    assert out.exists()
    # Round-trip: reading the written file back through the codec must yield
    # the same entries.
    parsed = read_cal(out)
    names = [e.name for e in parsed.entries]
    assert names == ["CYG A", "TAU A"]
    assert parsed.fit_annotation.startswith("Slope: ")


def test_flux_cal_read_scn_peak_returns_name_and_peak() -> None:
    server = RpcServer()
    resp = call(server, "flux_cal_read_scn_peak", {"path": str(PEAK_SCN)})
    assert "error" not in resp, resp
    result = resp["result"]
    assert isinstance(result["name"], str) and result["name"]
    assert result["peak_flux"] > 0


def test_flux_cal_apply_to_survey_marks_workspace() -> None:
    server = RpcServer()
    opened = call(server, "open_survey", {"path": str(SURVEY_FIXTURE)})
    assert "error" not in opened, opened
    ws_handle = opened["result"]["workspace_handle"]
    apply = call(server, "apply_gain_calibration", {"handle": ws_handle})
    assert "error" not in apply, apply
    assert apply["result"]["flux_calibrated"] is False

    flux = call(
        server,
        "flux_cal_apply_to_survey",
        {"handle": ws_handle, "slope": 1.25},
    )
    assert "error" not in flux, flux
    assert flux["result"]["flux_calibrated"] is True
    assert flux["result"]["flux_slope"] == 1.25

    # Revert returns flux_calibrated to false.
    revert = call(server, "flux_cal_revert_from_survey", {"handle": ws_handle})
    assert "error" not in revert, revert
    assert revert["result"]["flux_calibrated"] is False
    assert revert["result"]["flux_slope"] is None


def test_flux_cal_apply_to_survey_rejects_uncalibrated() -> None:
    server = RpcServer()
    opened = call(server, "open_survey", {"path": str(SURVEY_FIXTURE)})
    ws_handle = opened["result"]["workspace_handle"]
    resp = call(
        server,
        "flux_cal_apply_to_survey",
        {"handle": ws_handle, "slope": 1.0},
    )
    assert "error" in resp
    assert "gain-calibrated" in resp["error"]["message"]


def test_flux_cal_apply_to_scan_updates_overview_and_peak() -> None:
    server = RpcServer()
    opened = call(server, "open_scan", {"path": str(SCAN_FIXTURE)})
    sc_handle = opened["result"]["handle"]
    call(server, "apply_scan_calibration", {"handle": sc_handle})
    call(server, "determine_scan_peak", {"handle": sc_handle, "flux": 5.0})

    resp = call(
        server,
        "flux_cal_apply_to_scan",
        {"handle": sc_handle, "slope": 0.5},
    )
    assert "error" not in resp, resp
    assert resp["result"]["flux_calibrated"] is True
    assert resp["result"]["flux_slope"] == 0.5
    assert abs(resp["result"]["peak_flux"] - 2.5) < 1e-9


def test_flux_cal_apply_to_image_scales_pixels_and_marks_state() -> None:
    """Standalone image: opening a `.cal` while an image is loaded should
    multiply pixels by the slope and report the image as flux-calibrated.

    Regression for the Phase 4 plan §Calibration item — the auto-apply effect
    needs the image to expose `flux_calibrated`/`flux_slope` so it doesn't
    double-apply on subsequent renders.
    """
    server = RpcServer()
    opened = call(server, "open_survey", {"path": str(SURVEY_FIXTURE)})
    sv_handle = opened["result"]["handle"]
    ws_handle = opened["result"]["workspace_handle"]
    call(server, "apply_gain_calibration", {"handle": ws_handle})
    img_resp = call(
        server, "make_image", {"handle": sv_handle, "pix": 4, "workspace_handle": ws_handle}
    )
    assert "error" not in img_resp, img_resp
    img_handle = img_resp["result"]["handle"]
    assert img_resp["result"]["unit"] == "GCU"
    assert img_resp["result"]["flux_calibrated"] is False
    before_max = img_resp["result"]["max_flux"]

    flux = call(server, "flux_cal_apply_to_image", {"handle": img_handle, "slope": 2.5})
    assert "error" not in flux, flux
    assert flux["result"]["flux_calibrated"] is True
    assert flux["result"]["flux_slope"] == 2.5
    assert flux["result"]["unit"] == "Jy"
    assert abs(flux["result"]["max_flux"] - before_max * 2.5) < 1e-6

    # Idempotent: applying again is a no-op (matches the survey/scan guard).
    again = call(server, "flux_cal_apply_to_image", {"handle": img_handle, "slope": 2.5})
    assert "error" not in again, again
    assert again["result"]["flux_slope"] == 2.5
    assert abs(again["result"]["max_flux"] - flux["result"]["max_flux"]) < 1e-6

    revert = call(server, "flux_cal_revert_from_image", {"handle": img_handle})
    assert "error" not in revert, revert
    assert revert["result"]["flux_calibrated"] is False
    assert revert["result"]["flux_slope"] is None
    assert abs(revert["result"]["max_flux"] - before_max) < 1e-6


def test_flux_cal_apply_to_image_rejects_zero_slope() -> None:
    server = RpcServer()
    opened = call(server, "open_survey", {"path": str(SURVEY_FIXTURE)})
    sv_handle = opened["result"]["handle"]
    ws_handle = opened["result"]["workspace_handle"]
    call(server, "apply_gain_calibration", {"handle": ws_handle})
    img_resp = call(
        server, "make_image", {"handle": sv_handle, "pix": 4, "workspace_handle": ws_handle}
    )
    img_handle = img_resp["result"]["handle"]
    resp = call(server, "flux_cal_apply_to_image", {"handle": img_handle, "slope": 0.0})
    assert "error" in resp
    assert "nonzero" in resp["error"]["message"]
