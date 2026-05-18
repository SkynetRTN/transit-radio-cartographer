from __future__ import annotations

import numpy as np

from radio_cartographer.rpc import BinaryChannel, RpcServer

from .helpers import call, decode_npy_bytes, unpack_frame


def test_large_array_round_trip_byte_for_byte() -> None:
    channel = BinaryChannel()
    arr = np.arange(1000 * 2000, dtype=np.float64).reshape(1000, 2000)
    outbound = channel.put_array(arr)
    raw = unpack_frame(channel, outbound["token"])
    decoded = decode_npy_bytes(raw)
    assert np.array_equal(arr, decoded)


def test_echo_array_uses_binary_tokens() -> None:
    server = RpcServer()
    arr = np.linspace(0.0, 1.0, 128, dtype=np.float64)
    token = server._binary.put_array(arr)["token"]
    resp = call(server, "echo_array", {"token": token})
    echoed = server._binary.get_array(resp["result"]["array"]["token"])
    assert np.array_equal(arr, echoed)
