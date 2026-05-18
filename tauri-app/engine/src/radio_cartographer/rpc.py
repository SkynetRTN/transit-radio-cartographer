from __future__ import annotations

import io
import json
import struct
import sys
import traceback
from dataclasses import asdict
from pathlib import Path
from typing import Any

import numpy as np

from ._handles import HandleRegistry, UnknownHandleError
from .io.md2 import read_md2
from .models import Survey
from .survey import reduce_raw_sweep


class RpcError(Exception):
    def __init__(self, code: int, message: str, data: dict[str, Any] | None = None) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.data = data or {}


ERR_INVALID_PARAMS = -32602
ERR_INTERNAL = -32603
ERR_UNKNOWN_METHOD = -32601
ERR_INVALID_HANDLE = 1001
ERR_IO = 1002


class BinaryChannel:
    def __init__(self) -> None:
        self._store: dict[str, bytes] = {}
        self._next = 1

    def put_array(self, arr: np.ndarray) -> dict[str, Any]:
        buf = io.BytesIO()
        np.save(buf, arr, allow_pickle=False)
        payload = buf.getvalue()
        token = f"bin-{self._next}"
        self._next += 1
        self._store[token] = struct.pack("<Q", len(payload)) + payload
        return {"token": token, "size": len(payload)}

    def get_array(self, token: str) -> np.ndarray:
        frame = self._store[token]
        (size,) = struct.unpack("<Q", frame[:8])
        blob = frame[8 : 8 + size]
        return np.load(io.BytesIO(blob), allow_pickle=False)


class RpcServer:
    def __init__(self) -> None:
        self._handles = HandleRegistry()
        self._binary = BinaryChannel()
        self._shutdown = False

    def handle_request(self, request: dict[str, Any]) -> dict[str, Any]:
        req_id = request.get("id")
        method = request.get("method")
        params = request.get("params") or {}
        try:
            if method == "ping":
                result = "pong"
            elif method == "shutdown":
                self._shutdown = True
                result = {"ok": True}
            elif method == "open_survey":
                result = self._open_survey(params)
            elif method == "get_sweep":
                result = self._get_sweep(params)
            elif method == "close_handle":
                result = self._close_handle(params)
            elif method == "echo_array":
                result = self._echo_array(params)
            elif method == "export_fits":
                raise RpcError(ERR_INVALID_PARAMS, "export_fits is not implemented in Phase 3")
            else:
                raise RpcError(ERR_UNKNOWN_METHOD, f"Unknown method: {method}")
            return {"jsonrpc": "2.0", "id": req_id, "result": result}
        except RpcError as err:
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "error": {"code": err.code, "message": err.message, "data": err.data},
            }
        except Exception as err:  # noqa: BLE001
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "error": {
                    "code": ERR_INTERNAL,
                    "message": str(err),
                    "data": {"traceback": traceback.format_exc(limit=5)},
                },
            }

    def _open_survey(self, params: dict[str, Any]) -> dict[str, Any]:
        path = params.get("path")
        if not path:
            raise RpcError(ERR_INVALID_PARAMS, "path is required")
        try:
            md2 = read_md2(Path(path))
        except Exception as exc:  # noqa: BLE001
            raise RpcError(ERR_IO, f"failed to open survey: {exc}") from exc
        sweeps = tuple(reduce_raw_sweep(s) for s in md2.sweeps)
        if not sweeps:
            raise RpcError(ERR_IO, "failed to open survey: no sweeps in file")
        survey = Survey(label1=Path(path).name, label2="", sweep_count=len(sweeps), swp=0, sweep0=sweeps[0], sweeps=sweeps)
        handle = self._handles.create(survey)
        return {"handle": handle, "metadata": {"sweep_count": len(sweeps), "path": str(path)}}

    def _get_sweep(self, params: dict[str, Any]) -> dict[str, Any]:
        handle = int(params.get("handle", -1))
        index = int(params.get("index", -1))
        try:
            survey = self._handles.get(handle)
        except UnknownHandleError as exc:
            raise RpcError(ERR_INVALID_HANDLE, f"unknown handle: {handle}") from exc
        if not isinstance(survey, Survey):
            raise RpcError(ERR_INVALID_HANDLE, f"handle {handle} is not a survey")
        if index < 0 or index >= len(survey.sweeps):
            raise RpcError(ERR_INVALID_PARAMS, f"index out of range: {index}")
        sweep = survey.sweeps[index]
        return {
            "ra": self._binary.put_array(sweep.ra),
            "dec": self._binary.put_array(sweep.dec),
            "flux": self._binary.put_array(sweep.flux),
            "sample_count": int(sweep.ra.shape[0]),
        }

    def _close_handle(self, params: dict[str, Any]) -> dict[str, Any]:
        handle = int(params.get("handle", -1))
        try:
            self._handles.pop(handle)
        except UnknownHandleError as exc:
            raise RpcError(ERR_INVALID_HANDLE, f"unknown handle: {handle}") from exc
        return {"closed": handle}

    def _echo_array(self, params: dict[str, Any]) -> dict[str, Any]:
        token = params.get("token")
        if not token:
            raise RpcError(ERR_INVALID_PARAMS, "token is required")
        arr = self._binary.get_array(token)
        return {"array": self._binary.put_array(arr)}


def serve(stdin: Any = sys.stdin, stdout: Any = sys.stdout) -> int:
    server = RpcServer()
    for line in stdin:
        if not line.strip():
            continue
        req = json.loads(line)
        resp = server.handle_request(req)
        stdout.write(json.dumps(resp) + "\n")
        stdout.flush()
        if server._shutdown:
            break
    return 0


if __name__ == "__main__":
    raise SystemExit(serve())
