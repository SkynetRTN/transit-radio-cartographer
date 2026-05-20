"""End-to-end RPC tests for `save_scan` / `save_survey`.

These exercise the JSON-RPC surface the Tauri front-end calls — the round-
trip starts with `open_scan` / `open_survey`, applies a few mutations, then
asks the engine to write a `.scn` / `.srv` file. The test asserts the file
appears on disk and that re-reading it preserves the edits.
"""

from __future__ import annotations

from pathlib import Path

from radio_cartographer.io.scn import read_scn
from radio_cartographer.io.srv import read_srv
from radio_cartographer.rpc import RpcServer

from .helpers import call

FIXTURES = Path(__file__).resolve().parents[4] / "fixtures" / "inputs"


def test_save_scan_after_calibration_and_peak(tmp_path: Path) -> None:
    server = RpcServer()
    opened = call(server, "open_scan", {"path": str(FIXTURES / "cyg0a.md1")})
    handle = int(opened["result"]["handle"])
    call(server, "apply_scan_calibration", {"handle": handle})
    call(server, "determine_scan_peak", {"handle": handle, "flux": 2.718})

    target = tmp_path / "out.scn"
    saved = call(server, "save_scan", {"handle": handle, "path": str(target)})
    assert "error" not in saved, saved
    assert saved["result"]["path"] == str(target)
    assert saved["result"]["bytes_written"] > 0
    assert target.exists()

    parsed = read_scn(target)
    assert parsed.channel == "B"
    assert parsed.peak == "Peak Flux: 2.718"


def test_save_scan_records_cuts_as_check_minus_one(tmp_path: Path) -> None:
    server = RpcServer()
    opened = call(server, "open_scan", {"path": str(FIXTURES / "cyg0a.md1")})
    handle = int(opened["result"]["handle"])
    overview = opened["result"]["overview"]
    source_count = int(overview["source_count"])
    call(server, "apply_scan_calibration", {"handle": handle})
    # Pick an RA window that definitely intersects the source (use the
    # midpoint range from the calibrated view).
    view = call(server, "get_scan_view", {"handle": handle})["result"]
    ras = view["source"]["ra"]
    cut = call(
        server,
        "cut_scan_segment",
        {"handle": handle, "ra_min": ras[10], "ra_max": ras[30]},
    )
    removed = int(cut["result"]["removed"])
    assert removed > 0

    target = tmp_path / "cut.scn"
    saved = call(server, "save_scan", {"handle": handle, "path": str(target)})
    assert "error" not in saved, saved
    parsed = read_scn(target)
    assert int(parsed.total) == source_count
    assert int((parsed.check == -1).sum()) == removed


def test_save_scan_rejects_missing_directory() -> None:
    server = RpcServer()
    opened = call(server, "open_scan", {"path": str(FIXTURES / "cyg0a.md1")})
    handle = int(opened["result"]["handle"])
    resp = call(
        server, "save_scan", {"handle": handle, "path": "/no/such/dir/out.scn"}
    )
    assert "error" in resp
    assert "directory does not exist" in resp["error"]["message"]


def test_save_scan_requires_path() -> None:
    server = RpcServer()
    opened = call(server, "open_scan", {"path": str(FIXTURES / "cyg0a.md1")})
    handle = int(opened["result"]["handle"])
    resp = call(server, "save_scan", {"handle": handle})
    assert "error" in resp
    assert resp["error"]["code"] == -32602


def test_save_survey_after_reduction(tmp_path: Path) -> None:
    server = RpcServer()
    opened = call(server, "open_survey", {"path": str(FIXTURES / "and0a.md2")})
    assert "workspace_handle" in opened["result"], opened
    ws_handle = int(opened["result"]["workspace_handle"])
    call(server, "apply_gain_calibration", {"handle": ws_handle})
    # Apply a smooth reduction via the workspace-aware path.
    survey_handle = int(opened["result"]["handle"])
    call(
        server,
        "smooth",
        {"handle": survey_handle, "workspace_handle": ws_handle, "width": 5},
    )

    target = tmp_path / "out.srv"
    saved = call(server, "save_survey", {"handle": ws_handle, "path": str(target)})
    assert "error" not in saved, saved
    assert target.exists()
    assert saved["result"]["bytes_written"] > 0

    parsed = read_srv(target)
    assert parsed.sweep0.ra.size == 240
    # workspace.swp == source_count → sweeps list length == source_count
    assert len(parsed.sweeps) == parsed.swp
    assert parsed.label2  # workspace name carried through
