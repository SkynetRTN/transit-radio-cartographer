from __future__ import annotations

from pathlib import Path

import numpy as np

from radio_cartographer.image import GriddedImage
from radio_cartographer.models import Survey
from radio_cartographer.rpc import RpcServer

from .helpers import call

FIXTURE = Path(__file__).resolve().parents[4] / "fixtures" / "inputs" / "and0a.md2"


def _open_survey(server: RpcServer) -> int:
    opened = call(server, "open_survey", {"path": str(FIXTURE)})
    assert "error" not in opened, opened
    return int(opened["result"]["handle"])


def _flux_inline(server: RpcServer, handle: int, index: int = 0) -> np.ndarray:
    resp = call(server, "get_sweep_inline", {"handle": handle, "index": index, "max_points": 0})
    assert "error" not in resp, resp
    return np.asarray(resp["result"]["flux"], dtype=np.float64)


def test_smooth_returns_new_handle_and_alters_flux() -> None:
    server = RpcServer()
    h0 = _open_survey(server)
    raw = _flux_inline(server, h0)

    resp = call(server, "smooth", {"handle": h0, "width": 7})
    assert "error" not in resp, resp
    new_handle = int(resp["result"]["handle"])
    assert new_handle != h0
    assert resp["result"]["op"] == "smooth"
    assert resp["result"]["sweep_count"] > 0

    smoothed = _flux_inline(server, new_handle)
    assert smoothed.shape == raw.shape
    assert not np.allclose(smoothed, raw)
    # Smoothing should not change the mean substantially.
    assert abs(float(smoothed.mean()) - float(raw.mean())) < 1e-3


def test_baseline_returns_new_handle() -> None:
    server = RpcServer()
    h0 = _open_survey(server)
    raw = _flux_inline(server, h0)

    resp = call(server, "baseline", {"handle": h0, "degree": 1})
    assert "error" not in resp, resp
    new_handle = int(resp["result"]["handle"])
    assert new_handle != h0
    assert resp["result"]["op"] == "baseline"

    flat = _flux_inline(server, new_handle)
    # A degree-1 baseline subtraction must drive |mean| below the raw mean.
    assert abs(float(flat.mean())) < abs(float(raw.mean())) + 1e-6


def test_align_zero_offset_is_noop() -> None:
    server = RpcServer()
    h0 = _open_survey(server)
    raw = _flux_inline(server, h0)

    resp = call(server, "align", {"handle": h0, "factor": 0.0})
    assert "error" not in resp, resp
    new_handle = int(resp["result"]["handle"])
    assert resp["result"]["op"] == "align"

    same = _flux_inline(server, new_handle)
    assert np.array_equal(same, raw)


def test_make_image_returns_image_handle() -> None:
    server = RpcServer()
    h0 = _open_survey(server)

    resp = call(server, "make_image", {"handle": h0, "pix": 1})
    assert "error" not in resp, resp
    img_handle = int(resp["result"]["handle"])
    assert img_handle != h0
    assert resp["result"]["width"] == 399
    assert resp["result"]["height"] == 319
    # The image lookup should produce a GriddedImage in the registry.
    assert isinstance(server._handles.get(img_handle), GriddedImage)
    # Survey handle still resolves to a Survey.
    assert isinstance(server._handles.get(h0), Survey)


def test_get_image_pixels_shape_matches_descriptor() -> None:
    server = RpcServer()
    h0 = _open_survey(server)
    make_resp = call(server, "make_image", {"handle": h0, "pix": 1})
    img_handle = int(make_resp["result"]["handle"])

    resp = call(server, "get_image_pixels", {"handle": img_handle, "max_dim": 100})
    assert "error" not in resp, resp
    pixels = resp["result"]["pixels"]
    width = int(resp["result"]["width"])
    height = int(resp["result"]["height"])
    assert isinstance(pixels, list) and isinstance(pixels[0], list)
    assert len(pixels) == height
    assert len(pixels[0]) == width
    # Inline downsample must respect max_dim ceiling.
    assert max(width, height) <= 100


def test_close_old_handle_after_smooth_is_safe() -> None:
    server = RpcServer()
    h0 = _open_survey(server)
    new_handle = int(call(server, "smooth", {"handle": h0, "width": 5})["result"]["handle"])

    closed = call(server, "close_handle", {"handle": h0}, req_id=99)
    assert "error" not in closed, closed
    assert int(closed["result"]["closed"]) == h0

    # New handle should still be usable.
    inline = call(server, "get_sweep_inline", {"handle": new_handle, "index": 0, "max_points": 10}, req_id=100)
    assert "error" not in inline, inline


def test_smooth_with_invalid_handle_returns_structured_error() -> None:
    server = RpcServer()
    resp = call(server, "smooth", {"handle": 9999, "width": 5})
    assert "error" in resp
    assert resp["error"]["code"] == 1001
