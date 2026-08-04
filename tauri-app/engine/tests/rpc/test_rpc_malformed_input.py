from __future__ import annotations

import io
import json

from radio_cartographer.rpc import ERR_INVALID_REQUEST, ERR_PARSE, serve


def _serve_raw(text: str) -> list[dict]:
    stdout = io.StringIO()
    serve(stdin=io.StringIO(text), stdout=stdout)
    return [json.loads(line) for line in stdout.getvalue().strip().splitlines()]


def test_invalid_json_returns_parse_error_and_keeps_serving() -> None:
    responses = _serve_raw(
        "{not json\n"
        '{"jsonrpc": "2.0", "id": 1, "method": "ping", "params": {}}\n'
        '{"jsonrpc": "2.0", "id": 2, "method": "shutdown", "params": {}}\n'
    )
    assert responses[0]["error"]["code"] == ERR_PARSE
    assert responses[0]["id"] is None
    assert responses[1]["result"] == "pong"
    assert responses[2]["result"]["ok"] is True


def test_non_object_json_returns_invalid_request_and_keeps_serving() -> None:
    responses = _serve_raw(
        "[1, 2, 3]\n"
        '"ping"\n'
        "42\n"
        '{"jsonrpc": "2.0", "id": 1, "method": "ping", "params": {}}\n'
        '{"jsonrpc": "2.0", "id": 2, "method": "shutdown", "params": {}}\n'
    )
    for resp in responses[:3]:
        assert resp["error"]["code"] == ERR_INVALID_REQUEST
        assert resp["id"] is None
    assert responses[3]["result"] == "pong"
    assert responses[4]["result"]["ok"] is True
