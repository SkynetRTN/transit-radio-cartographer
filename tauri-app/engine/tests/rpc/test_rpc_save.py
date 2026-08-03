"""End-to-end RPC tests for `save_scan` / `save_survey`.

These exercise the JSON-RPC surface the Tauri front-end calls — the round-
trip starts with `open_scan` / `open_survey`, applies a few mutations, then
asks the engine to write a `.scn` / `.srv` file. The test asserts the file
appears on disk and that re-reading it preserves the edits.
"""

from __future__ import annotations

import base64
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


def test_set_workspace_name_persists_through_save(tmp_path: Path) -> None:
    server = RpcServer()
    opened = call(server, "open_survey", {"path": str(FIXTURES / "and0a.md2")})
    ws_handle = int(opened["result"]["workspace_handle"])

    renamed = call(
        server, "set_workspace_name", {"handle": ws_handle, "name": "My Survey"}
    )
    assert "error" not in renamed, renamed
    assert renamed["result"]["name"] == "My Survey"

    target = tmp_path / "renamed.srv"
    saved = call(server, "save_survey", {"handle": ws_handle, "path": str(target)})
    assert "error" not in saved, saved
    parsed = read_srv(target)
    assert parsed.label2 == "My Survey"


def test_set_scan_workspace_name_persists_through_save(tmp_path: Path) -> None:
    server = RpcServer()
    opened = call(server, "open_scan", {"path": str(FIXTURES / "cyg0a.md1")})
    handle = int(opened["result"]["handle"])

    renamed = call(
        server, "set_scan_workspace_name", {"handle": handle, "name": "Cygnus Run"}
    )
    assert "error" not in renamed, renamed
    assert renamed["result"]["name"] == "Cygnus Run"

    target = tmp_path / "renamed.scn"
    saved = call(server, "save_scan", {"handle": handle, "path": str(target)})
    assert "error" not in saved, saved
    parsed = read_scn(target)
    assert parsed.name == "Cygnus Run"


def test_set_workspace_name_rejects_non_string() -> None:
    server = RpcServer()
    opened = call(server, "open_survey", {"path": str(FIXTURES / "and0a.md2")})
    ws_handle = int(opened["result"]["workspace_handle"])
    resp = call(server, "set_workspace_name", {"handle": ws_handle, "name": 42})
    assert "error" in resp
    assert resp["error"]["code"] == -32602


# ── save_rgb_png: the client renders the bi/tri-color composite to a PNG and
# the engine writes the decoded bytes verbatim (no handle / no scalar image).


def test_save_rgb_png_writes_decoded_bytes_from_data_url(tmp_path: Path) -> None:
    server = RpcServer()
    raw = b"\x89PNG\r\n\x1a\n fake composite payload"
    data_url = "data:image/png;base64," + base64.b64encode(raw).decode()
    target = tmp_path / "rgb.png"
    saved = call(server, "save_rgb_png", {"path": str(target), "data": data_url})
    assert "error" not in saved, saved
    assert saved["result"]["path"] == str(target)
    assert saved["result"]["bytes_written"] == len(raw)
    assert target.read_bytes() == raw


def test_save_rgb_png_accepts_raw_base64(tmp_path: Path) -> None:
    server = RpcServer()
    raw = b"payload-without-a-data-url-prefix"
    target = tmp_path / "rgb2.png"
    saved = call(
        server,
        "save_rgb_png",
        {"path": str(target), "data": base64.b64encode(raw).decode()},
    )
    assert "error" not in saved, saved
    assert target.read_bytes() == raw


def test_save_rgb_png_requires_path() -> None:
    server = RpcServer()
    resp = call(server, "save_rgb_png", {"data": "AAAA"})
    assert "error" in resp
    assert resp["error"]["code"] == -32602


def test_save_rgb_png_rejects_invalid_base64(tmp_path: Path) -> None:
    server = RpcServer()
    resp = call(
        server, "save_rgb_png", {"path": str(tmp_path / "x.png"), "data": "not!base64!"}
    )
    assert "error" in resp
    assert resp["error"]["code"] == -32602
