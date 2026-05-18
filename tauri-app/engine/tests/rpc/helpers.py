from __future__ import annotations

import io
import json
import struct
import time

import numpy as np

from radio_cartographer.rpc import BinaryChannel, RpcServer


def call(server: RpcServer, method: str, params: dict, req_id: int = 1):
    return server.handle_request({"jsonrpc": "2.0", "id": req_id, "method": method, "params": params})


def unpack_frame(channel: BinaryChannel, token: str) -> bytes:
    frame = channel._store[token]
    (size,) = struct.unpack("<Q", frame[:8])
    return frame[8 : 8 + size]


def run_serve_lines(lines: list[dict]):
    from radio_cartographer.rpc import serve

    stdin = io.StringIO("\n".join(json.dumps(item) for item in lines) + "\n")
    stdout = io.StringIO()
    start = time.perf_counter()
    serve(stdin=stdin, stdout=stdout)
    elapsed = time.perf_counter() - start
    return stdout.getvalue().strip().splitlines(), elapsed


def decode_npy_bytes(blob: bytes) -> np.ndarray:
    return np.load(io.BytesIO(blob), allow_pickle=False)
