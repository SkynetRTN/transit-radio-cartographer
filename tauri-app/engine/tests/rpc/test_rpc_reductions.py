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

    resp = call(server, "make_image", {"handle": h0})
    assert "error" not in resp, resp
    img_handle = int(resp["result"]["handle"])
    assert img_handle != h0
    # Grid is sized from a fixed angular pixel size, so the descriptor dims
    # just have to be non-degenerate and match the stored GriddedImage.
    image = server._handles.get(img_handle)
    assert isinstance(image, GriddedImage)
    assert resp["result"]["width"] == image.pixels.shape[1] > 1
    assert resp["result"]["height"] == image.pixels.shape[0] > 1
    # Survey handle still resolves to a Survey.
    assert isinstance(server._handles.get(h0), Survey)


def test_make_image_fill_param() -> None:
    # The Pre Image view passes fill="bars" (legacy pre-image horizontal
    # bars); the Make Image commit omits the param and gets the interpolated
    # strip-fill. Both must succeed and produce different grids; an unknown
    # fill is an invalid-params error.
    server = RpcServer()
    h0 = _open_survey(server)

    interp = call(server, "make_image", {"handle": h0, "pix": 1})
    bars = call(server, "make_image", {"handle": h0, "pix": 1, "fill": "bars"})
    assert "error" not in interp, interp
    assert "error" not in bars, bars
    interp_px = server._handles.get(int(interp["result"]["handle"])).pixels
    bars_px = server._handles.get(int(bars["result"]["handle"])).pixels
    assert interp_px.shape == bars_px.shape
    assert not np.array_equal(interp_px, bars_px)

    bad = call(server, "make_image", {"handle": h0, "fill": "nearest"})
    assert "error" in bad
    assert bad["error"]["code"] == -32602  # ERR_INVALID_PARAMS


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


def test_make_image_with_workspace_excludes_cal_sweeps() -> None:
    # Pre-image must reflect the *swept region* — the legacy app paints
    # source sweeps only, never the cal brackets (their RA/Dec point at a
    # different calibrator). When `workspace_handle` is provided the engine
    # builds the grid from source sweeps only, so the bounds tighten relative
    # to the full-survey grid.
    server = RpcServer()
    opened = call(server, "open_survey", {"path": str(FIXTURE)})
    assert "error" not in opened, opened
    survey_handle = int(opened["result"]["handle"])
    ws_handle = int(opened["result"]["workspace_handle"])

    full = call(server, "make_image", {"handle": survey_handle, "pix": 1})
    src_only = call(
        server,
        "make_image",
        {"handle": survey_handle, "workspace_handle": ws_handle, "pix": 1},
    )
    assert "error" not in full, full
    assert "error" not in src_only, src_only

    # The cal brackets at the head and tail of and0a.md2 sit at different
    # Dec (≈31° and ≈52°) than the source sweeps (≈33.5°-48.5°). Source-only
    # bounds must land strictly inside the full-survey bounds.
    assert src_only["result"]["min_dec"] > full["result"]["min_dec"]
    assert src_only["result"]["max_dec"] < full["result"]["max_dec"]
    assert src_only["result"]["min_ra"] > full["result"]["min_ra"]
    assert src_only["result"]["max_ra"] < full["result"]["max_ra"]


def test_reductions_with_workspace_handle_change_pre_image() -> None:
    # Smoke test for the Pre Image screen wiring: calling smooth/baseline/
    # align with `workspace_handle` must mutate the workspace's source flux
    # so the next `make_image(workspace_handle=...)` returns a different
    # grid. Without this path the UI buttons fire but the rendered image is
    # unchanged.
    server = RpcServer()
    opened = call(server, "open_survey", {"path": str(FIXTURE)})
    survey_handle = int(opened["result"]["handle"])
    ws_handle = int(opened["result"]["workspace_handle"])

    baseline_img = call(
        server,
        "make_image",
        {"handle": survey_handle, "workspace_handle": ws_handle, "pix": 1},
    )
    assert "error" not in baseline_img, baseline_img
    baseline_pix = call(
        server,
        "get_image_pixels",
        {"handle": int(baseline_img["result"]["handle"]), "max_dim": 0},
    )
    before = np.asarray(baseline_pix["result"]["pixels"], dtype=np.float64)

    reduce_resp = call(
        server,
        "smooth",
        {"handle": survey_handle, "workspace_handle": ws_handle, "width": 11},
    )
    assert "error" not in reduce_resp, reduce_resp
    # Workspace-aware reductions don't mint a new survey handle — the
    # mutation lives on the workspace and is picked up by the next
    # `make_image`.
    assert "handle" not in reduce_resp["result"]
    assert reduce_resp["result"]["op"] == "smooth"
    assert "overview" in reduce_resp["result"]

    after_img = call(
        server,
        "make_image",
        {"handle": survey_handle, "workspace_handle": ws_handle, "pix": 1},
    )
    after_pix = call(
        server,
        "get_image_pixels",
        {"handle": int(after_img["result"]["handle"]), "max_dim": 0},
    )
    after = np.asarray(after_pix["result"]["pixels"], dtype=np.float64)

    assert before.shape == after.shape
    assert not np.allclose(before, after)

    # Baseline subtraction stacks on top of the smoothing — the mean of the
    # gridded image should drop sharply once a per-sweep linear baseline is
    # removed.
    base_resp = call(
        server,
        "baseline",
        {"handle": survey_handle, "workspace_handle": ws_handle, "degree": 1},
    )
    assert "error" not in base_resp, base_resp
    baselined_img = call(
        server,
        "make_image",
        {"handle": survey_handle, "workspace_handle": ws_handle, "pix": 1},
    )
    baselined_pix = call(
        server,
        "get_image_pixels",
        {"handle": int(baselined_img["result"]["handle"]), "max_dim": 0},
    )
    baselined = np.asarray(baselined_pix["result"]["pixels"], dtype=np.float64)
    assert abs(float(baselined.mean())) < abs(float(after.mean()))
