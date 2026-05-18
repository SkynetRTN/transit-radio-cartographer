from __future__ import annotations

import json

from .helpers import run_serve_lines


def test_ping_pong_and_shutdown_within_1s() -> None:
    lines, elapsed = run_serve_lines(
        [
            {"jsonrpc": "2.0", "id": 1, "method": "ping", "params": {}},
            {"jsonrpc": "2.0", "id": 2, "method": "shutdown", "params": {}},
        ]
    )
    assert elapsed < 1.0
    responses = [json.loads(line) for line in lines]
    assert responses[0]["result"] == "pong"
    assert responses[1]["result"]["ok"] is True
    assert all("\n" not in line for line in lines)
