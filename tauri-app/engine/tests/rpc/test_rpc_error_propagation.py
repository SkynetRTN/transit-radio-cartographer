from __future__ import annotations

from pathlib import Path

from radio_cartographer.rpc import ERR_INVALID_HANDLE, ERR_IO, RpcServer

from .helpers import call


def test_malformed_md2_surfaces_structured_error(tmp_path: Path) -> None:
    bad = tmp_path / "bad.md2"
    bad.write_text("1\n2\n*\n", encoding="utf-8")
    server = RpcServer()
    resp = call(server, "open_survey", {"path": str(bad)})
    assert resp["error"]["code"] == ERR_IO
    assert "failed to open survey" in resp["error"]["message"]


def test_invalid_handle_is_structured_error() -> None:
    server = RpcServer()
    resp = call(server, "get_sweep", {"handle": 9999, "index": 0})
    assert resp["error"]["code"] == ERR_INVALID_HANDLE
