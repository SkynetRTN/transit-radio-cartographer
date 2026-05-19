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
from .image import GriddedImage, make_image
from .io.md2 import read_md2
from .models import Survey, Sweep
from .survey import apply_to_survey, reduce_raw_sweep
from .workspace import (
    SurveyWorkspace,
    apply_gain_calibration,
    apply_workspace_reduction,
    build_workspace,
    cut_calibration_segment,
    select_calibration_declination,
    undo_cut,
)


def _maybe_downsample(
    ra: np.ndarray, dec: np.ndarray, flux: np.ndarray, max_points: int
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    n = flux.shape[0]
    if max_points <= 0 or n <= max_points:
        return ra, dec, flux
    step = max(1, n // max_points)
    return ra[::step], dec[::step], flux[::step]


def _survey_from_workspace_sources(ws: "SurveyWorkspace") -> Survey:
    """Build an in-memory Survey containing only the workspace's source sweeps.

    Skips the initial and terminal cal brackets so pre-image bounds and pixels
    reflect the *swept region*, not the calibrator's RA/Dec. Pre-image
    reductions win over calibration which wins over raw — for both flux
    (Smooth/Baseline) and dec (Align Sweeps).
    """
    if ws.reduced_source_flux is not None:
        flux_arrays = ws.reduced_source_flux
    elif ws.calibrated and ws.calibrated_source_flux is not None:
        flux_arrays = ws.calibrated_source_flux
    else:
        flux_arrays = tuple(np.asarray(raw.flux, dtype=np.float64) for raw in ws.source_sweeps)
    if ws.reduced_source_dec is not None:
        dec_arrays = ws.reduced_source_dec
    else:
        dec_arrays = tuple(np.asarray(raw.dec, dtype=np.float64) for raw in ws.source_sweeps)
    sweeps: list[Sweep] = []
    for raw, dec, flux in zip(ws.source_sweeps, dec_arrays, flux_arrays):
        sweeps.append(
            Sweep(
                ra=np.asarray(raw.ra, dtype=np.float64),
                dec=np.asarray(dec, dtype=np.float64),
                flux=np.asarray(flux, dtype=np.float64),
            )
        )
    return Survey(
        label1=ws.name,
        label2="",
        sweep_count=len(sweeps),
        swp=0,
        sweep0=sweeps[0],
        sweeps=tuple(sweeps),
    )


_REDUCTION_PARAMS: dict[str, tuple[str, str, float]] = {
    # rpc_key -> (front-end param name, apply_to_survey kwarg, default)
    "smooth": ("width", "window", 5.0),
    "baseline": ("degree", "degree", 1.0),
    "align": ("factor", "offset", 0.5),
}


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
            elif method == "get_sweep_inline":
                result = self._get_sweep_inline(params)
            elif method == "close_handle":
                result = self._close_handle(params)
            elif method == "echo_array":
                result = self._echo_array(params)
            elif method in _REDUCTION_PARAMS:
                result = self._reduce(method, params)
            elif method == "make_image":
                result = self._make_image(params)
            elif method == "get_image_pixels":
                result = self._get_image_pixels(params)
            elif method == "get_workspace_overview":
                result = self._get_workspace_overview(params)
            elif method == "get_source_sweep":
                result = self._get_source_sweep(params)
            elif method == "get_calibration_view":
                result = self._get_calibration_view(params)
            elif method == "cut_calibration_segment":
                result = self._cut_calibration_segment(params)
            elif method == "select_calibration_declination":
                result = self._select_calibration_declination(params)
            elif method == "undo_calibration_cut":
                result = self._undo_calibration_cut(params)
            elif method == "apply_gain_calibration":
                result = self._apply_gain_calibration(params)
            elif method == "set_bracket_enabled":
                result = self._set_bracket_enabled(params)
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
        survey = Survey(
            label1=Path(path).name,
            label2="",
            sweep_count=len(sweeps),
            swp=0,
            sweep0=sweeps[0],
            sweeps=sweeps,
        )
        handle = self._handles.create(survey)
        result: dict[str, Any] = {
            "handle": handle,
            "metadata": {"sweep_count": len(sweeps), "path": str(path)},
        }
        # Best-effort workspace build (requires the standard cal-bracket
        # layout — short files produce a survey handle without a workspace,
        # which is fine for non-interactive callers).
        try:
            workspace = build_workspace(str(path), md2)
        except ValueError:
            return result
        ws_handle = self._handles.create(workspace)
        result["workspace_handle"] = ws_handle
        result["workspace"] = self._workspace_overview(workspace)
        return result

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

    def _get_sweep_inline(self, params: dict[str, Any]) -> dict[str, Any]:
        handle = int(params.get("handle", -1))
        index = int(params.get("index", -1))
        max_points = int(params.get("max_points", 2000))
        try:
            survey = self._handles.get(handle)
        except UnknownHandleError as exc:
            raise RpcError(ERR_INVALID_HANDLE, f"unknown handle: {handle}") from exc
        if not isinstance(survey, Survey):
            raise RpcError(ERR_INVALID_HANDLE, f"handle {handle} is not a survey")
        if index < 0 or index >= len(survey.sweeps):
            raise RpcError(ERR_INVALID_PARAMS, f"index out of range: {index}")
        sweep = survey.sweeps[index]
        n = int(sweep.flux.shape[0])
        if max_points > 0 and n > max_points:
            step = max(1, n // max_points)
            ra = sweep.ra[::step]
            dec = sweep.dec[::step]
            flux = sweep.flux[::step]
        else:
            ra, dec, flux = sweep.ra, sweep.dec, sweep.flux
        return {
            "ra": ra.tolist(),
            "dec": dec.tolist(),
            "flux": flux.tolist(),
            "sample_count": n,
            "returned_count": int(flux.shape[0]),
        }

    def _close_handle(self, params: dict[str, Any]) -> dict[str, Any]:
        handle = int(params.get("handle", -1))
        try:
            self._handles.pop(handle)
        except UnknownHandleError as exc:
            raise RpcError(ERR_INVALID_HANDLE, f"unknown handle: {handle}") from exc
        return {"closed": handle}

    def _resolve_survey(self, handle: int) -> Survey:
        try:
            obj = self._handles.get(handle)
        except UnknownHandleError as exc:
            raise RpcError(ERR_INVALID_HANDLE, f"unknown handle: {handle}") from exc
        if not isinstance(obj, Survey):
            raise RpcError(ERR_INVALID_HANDLE, f"handle {handle} is not a survey")
        return obj

    def _resolve_image(self, handle: int) -> GriddedImage:
        try:
            obj = self._handles.get(handle)
        except UnknownHandleError as exc:
            raise RpcError(ERR_INVALID_HANDLE, f"unknown handle: {handle}") from exc
        if not isinstance(obj, GriddedImage):
            raise RpcError(ERR_INVALID_HANDLE, f"handle {handle} is not an image")
        return obj

    def _reduce(self, op: str, params: dict[str, Any]) -> dict[str, Any]:
        rpc_key, kwarg_name, default = _REDUCTION_PARAMS[op]
        raw_value = params.get(rpc_key, default)
        try:
            value = float(raw_value)
        except (TypeError, ValueError) as exc:
            raise RpcError(
                ERR_INVALID_PARAMS, f"{op}: {rpc_key} must be numeric, got {raw_value!r}"
            ) from exc
        kwargs: dict[str, float | int] = {kwarg_name: int(value) if op != "align" else value}
        # Workspace-aware path: when the caller passes `workspace_handle`, the
        # reduction lands on the workspace's source sweeps so the next
        # `make_image(workspace_handle=...)` call grids the reduced flux.
        # This is what the Pre Image screen's Smooth/Baseline/Align buttons
        # use — operating on a detached `Survey` would leave the pre-image
        # untouched because that path is driven by `workspace.source_sweeps`.
        ws_handle = params.get("workspace_handle")
        if ws_handle is not None:
            ws = self._resolve_workspace(int(ws_handle))
            apply_workspace_reduction(ws, op, **kwargs)
            return {
                "op": op,
                "sweep_count": int(ws.source_count),
                "overview": self._workspace_overview(ws),
            }
        handle = int(params.get("handle", -1))
        survey = self._resolve_survey(handle)
        reduced = apply_to_survey(survey, op, **kwargs)
        new_handle = self._handles.create(reduced)
        return {
            "handle": new_handle,
            "sweep_count": int(reduced.sweep_count),
            "op": op,
        }

    def _make_image(self, params: dict[str, Any]) -> dict[str, Any]:
        try:
            pix = int(params.get("pix", 1))
        except (TypeError, ValueError) as exc:
            raise RpcError(ERR_INVALID_PARAMS, "pix must be an integer") from exc
        ws_handle = params.get("workspace_handle")
        if ws_handle is not None:
            # Pre-image is built from source sweeps only — the cal brackets
            # point at a different calibrator, so including them stretches the
            # RA/Dec extent and dumps cal-voltage samples onto an unrelated
            # part of the sky. After Apply Gain Calibration the workspace's
            # `calibrated_source_flux` is in gain units; we prefer those.
            ws = self._resolve_workspace(int(ws_handle))
            survey = _survey_from_workspace_sources(ws)
        else:
            handle = int(params.get("handle", -1))
            survey = self._resolve_survey(handle)
        image = make_image(survey, pix=pix)
        new_handle = self._handles.create(image)
        height, width = image.pixels.shape
        return {
            "handle": new_handle,
            "width": int(width),
            "height": int(height),
            "min_ra": float(image.min_ra),
            "max_ra": float(image.max_ra),
            "min_dec": float(image.min_dec),
            "max_dec": float(image.max_dec),
            "min_flux": float(np.min(image.pixels)),
            "max_flux": float(np.max(image.pixels)),
        }

    def _get_image_pixels(self, params: dict[str, Any]) -> dict[str, Any]:
        handle = int(params.get("handle", -1))
        image = self._resolve_image(handle)
        try:
            max_dim = int(params.get("max_dim", 400))
        except (TypeError, ValueError) as exc:
            raise RpcError(ERR_INVALID_PARAMS, "max_dim must be an integer") from exc
        pixels = image.pixels
        height, width = pixels.shape
        if max_dim > 0:
            longest = max(height, width)
            step = -(-longest // max_dim)  # ceil division
            step = max(1, step)
            if step > 1:
                pixels = pixels[::step, ::step]
                height, width = pixels.shape
        return {
            "pixels": pixels.tolist(),
            "width": int(width),
            "height": int(height),
        }

    def _resolve_workspace(self, handle: int) -> SurveyWorkspace:
        try:
            obj = self._handles.get(handle)
        except UnknownHandleError as exc:
            raise RpcError(ERR_INVALID_HANDLE, f"unknown handle: {handle}") from exc
        if not isinstance(obj, SurveyWorkspace):
            raise RpcError(ERR_INVALID_HANDLE, f"handle {handle} is not a workspace")
        return obj

    def _workspace_overview(self, ws: SurveyWorkspace) -> dict[str, Any]:
        return {
            "name": ws.name,
            "path": ws.path,
            "source_count": int(ws.source_count),
            "initial_cal_samples": int(ws.initial.cal_on.flux.shape[0] + ws.initial.cal_off.flux.shape[0]),
            "terminal_cal_samples": int(ws.terminal.cal_on.flux.shape[0] + ws.terminal.cal_off.flux.shape[0]),
            "initial_kept": int(int(ws.initial.cal_on_mask.sum()) + int(ws.initial.cal_off_mask.sum())),
            "terminal_kept": int(int(ws.terminal.cal_on_mask.sum()) + int(ws.terminal.cal_off_mask.sum())),
            "cal1": float(ws.cal1()),
            "cal2": float(ws.cal2()),
            "calibrated": bool(ws.calibrated),
            "initial_enabled": bool(ws.initial_enabled),
            "terminal_enabled": bool(ws.terminal_enabled),
            "can_undo": bool(ws.undo_stack),
        }

    def _get_workspace_overview(self, params: dict[str, Any]) -> dict[str, Any]:
        return self._workspace_overview(self._resolve_workspace(int(params.get("handle", -1))))

    def _get_source_sweep(self, params: dict[str, Any]) -> dict[str, Any]:
        ws = self._resolve_workspace(int(params.get("handle", -1)))
        index = int(params.get("index", 0))
        if index < 0 or index >= ws.source_count:
            raise RpcError(
                ERR_INVALID_PARAMS,
                f"source sweep index out of range: {index} (0..{ws.source_count - 1})",
            )
        raw = ws.source_sweeps[index]
        if ws.calibrated and ws.calibrated_source_flux is not None:
            flux = ws.calibrated_source_flux[index]
            # After noise-injection bracket gain calibration the values are
            # raw_volts / cal_volts — dimensionless. The legacy app didn't
            # label this state; we call it "gain calibration units" until a
            # `.cal` file (flux calibration) converts the survey to janskies.
            unit = "gain"
        else:
            flux = raw.flux
            unit = "volts"
        max_points = int(params.get("max_points", 4000))
        ra, dec, flux_d = _maybe_downsample(raw.ra, raw.dec, flux, max_points)
        return {
            "ra": ra.tolist(),
            "dec": dec.tolist(),
            "flux": flux_d.tolist(),
            "sample_count": int(raw.flux.shape[0]),
            "returned_count": int(flux_d.shape[0]),
            "index": index,
            "source_count": int(ws.source_count),
            "unit": unit,
            "label": f"{ws.name} - Sweep {index + 1}",
            "calibrated": bool(ws.calibrated),
        }

    def _get_calibration_view(self, params: dict[str, Any]) -> dict[str, Any]:
        ws = self._resolve_workspace(int(params.get("handle", -1)))

        def bracket_payload(bracket_label: str, on, off, on_mask, off_mask) -> dict[str, Any]:
            return {
                "label": bracket_label,
                "on": {
                    "ra": on.ra.tolist(),
                    "dec": on.dec.tolist(),
                    "flux": on.flux.tolist(),
                    "mask": on_mask.astype(bool).tolist(),
                },
                "off": {
                    "ra": off.ra.tolist(),
                    "dec": off.dec.tolist(),
                    "flux": off.flux.tolist(),
                    "mask": off_mask.astype(bool).tolist(),
                },
            }

        return {
            "name": ws.name,
            "initial": bracket_payload(
                "initial",
                ws.initial.cal_on,
                ws.initial.cal_off,
                ws.initial.cal_on_mask,
                ws.initial.cal_off_mask,
            ),
            "terminal": bracket_payload(
                "terminal",
                ws.terminal.cal_on,
                ws.terminal.cal_off,
                ws.terminal.cal_on_mask,
                ws.terminal.cal_off_mask,
            ),
            "cal1": float(ws.cal1()),
            "cal2": float(ws.cal2()),
            "initial_enabled": bool(ws.initial_enabled),
            "terminal_enabled": bool(ws.terminal_enabled),
            "can_undo": bool(ws.undo_stack),
        }

    def _cut_calibration_segment(self, params: dict[str, Any]) -> dict[str, Any]:
        ws = self._resolve_workspace(int(params.get("handle", -1)))
        try:
            ra_min = float(params["ra_min"])
            ra_max = float(params["ra_max"])
        except (KeyError, TypeError, ValueError) as exc:
            raise RpcError(ERR_INVALID_PARAMS, "ra_min and ra_max are required numbers") from exc
        removed = cut_calibration_segment(ws, ra_min, ra_max)
        return {"removed": int(removed), "overview": self._workspace_overview(ws)}

    def _select_calibration_declination(self, params: dict[str, Any]) -> dict[str, Any]:
        ws = self._resolve_workspace(int(params.get("handle", -1)))
        try:
            dec_min = float(params["dec_min"])
            dec_max = float(params["dec_max"])
        except (KeyError, TypeError, ValueError) as exc:
            raise RpcError(
                ERR_INVALID_PARAMS, "dec_min and dec_max are required numbers"
            ) from exc
        bracket = params.get("bracket")
        if bracket not in ("initial", "terminal"):
            raise RpcError(ERR_INVALID_PARAMS, "bracket must be 'initial' or 'terminal'")
        removed = select_calibration_declination(ws, dec_min, dec_max, bracket)
        return {"removed": int(removed), "overview": self._workspace_overview(ws)}

    def _undo_calibration_cut(self, params: dict[str, Any]) -> dict[str, Any]:
        ws = self._resolve_workspace(int(params.get("handle", -1)))
        undone = undo_cut(ws)
        return {"undone": bool(undone), "overview": self._workspace_overview(ws)}

    def _apply_gain_calibration(self, params: dict[str, Any]) -> dict[str, Any]:
        ws = self._resolve_workspace(int(params.get("handle", -1)))
        try:
            apply_gain_calibration(ws)
        except ValueError as exc:
            raise RpcError(ERR_INVALID_PARAMS, str(exc)) from exc
        return self._workspace_overview(ws)

    def _set_bracket_enabled(self, params: dict[str, Any]) -> dict[str, Any]:
        ws = self._resolve_workspace(int(params.get("handle", -1)))
        which = params.get("bracket")
        if which not in ("initial", "terminal"):
            raise RpcError(ERR_INVALID_PARAMS, "bracket must be 'initial' or 'terminal'")
        enabled = bool(params.get("enabled", True))
        if which == "initial":
            ws.initial_enabled = enabled
        else:
            ws.terminal_enabled = enabled
        return self._workspace_overview(ws)

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
