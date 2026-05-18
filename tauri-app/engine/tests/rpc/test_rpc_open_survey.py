from __future__ import annotations

from pathlib import Path

import numpy as np

from radio_cartographer.rpc import RpcServer

from .helpers import call


def test_open_survey_and_get_sweep() -> None:
    server = RpcServer()
    md2_path = Path(__file__).resolve().parents[4] / "fixtures" / "inputs" / "and0a.md2"
    opened = call(server, "open_survey", {"path": str(md2_path)})
    assert "error" not in opened
    handle = opened["result"]["handle"]
    assert opened["result"]["metadata"]["sweep_count"] > 0

    sweep_resp = call(server, "get_sweep", {"handle": handle, "index": 0}, req_id=2)
    assert "error" not in sweep_resp
    token = sweep_resp["result"]["flux"]["token"]
    arr = server._binary.get_array(token)
    assert isinstance(arr, np.ndarray)
    assert arr.dtype == np.float64
    assert arr.size == sweep_resp["result"]["sample_count"]
