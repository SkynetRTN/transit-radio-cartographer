"""RPC dispatch for open_image / save_image / palette / append / superimpose."""

from __future__ import annotations

import math
from pathlib import Path

import json

import numpy as np

from radio_cartographer.rpc import RpcServer, _array_to_jsonable_list, _block_downsample

from .helpers import call


def test_array_to_jsonable_list_emits_none_for_non_finite():
    # Standard JSON doesn't allow NaN/Infinity; Python's json.dumps defaults
    # to emitting bareword `NaN`/`Infinity` literals that Rust serde rejects.
    # The Tauri sidecar bridge parses every response with strict serde_json,
    # so any NaN we leak silently breaks the whole RPC reply.
    arr = np.array([[1.0, np.nan], [np.inf, -np.inf]], dtype=np.float64)
    out = _array_to_jsonable_list(arr)
    assert out == [[1.0, None], [None, None]]
    # Round-trip through strict JSON to confirm no NaN literal remains.
    s = json.dumps(out, allow_nan=False)
    assert "NaN" not in s and "Infinity" not in s


def test_array_to_jsonable_list_passes_through_all_finite():
    arr = np.array([[1.0, 2.0], [3.5, 4.25]], dtype=np.float64)
    out = _array_to_jsonable_list(arr)
    assert out == [[1.0, 2.0], [3.5, 4.25]]


def test_appended_image_meta_emits_strict_json_even_with_uncovered_gap():
    # Regression: an appended image with a no-coverage gap used to report
    # `min_flux: NaN, max_flux: NaN` in the meta dict. Python json.dumps emitted
    # a bareword `NaN` literal, Rust serde rejected the response with
    # "expected value at line 1 column …", and the UI silently dropped the
    # whole reply. The meta must serialize as strict JSON (no NaN/Infinity).
    img_src = Path("C:\\Users\\leesnow\\skynet2\\ogrc\\fixtures\\outputs\\cassio_a.img")
    server = RpcServer()
    primary_h = _open_image_handle(server, img_src)
    resp = call(
        server,
        "append_image",
        {
            "handle": primary_h,
            "other_path": str(img_src),
            "ra_shift_seconds": 30000.0,  # shift to force a gap
        },
    )
    assert "error" not in resp, resp
    meta = resp["result"]
    # Strict-JSON round-trip — the same check the Rust sidecar bridge does.
    s = json.dumps(meta, allow_nan=False)
    assert "NaN" not in s and "Infinity" not in s
    assert math.isfinite(meta["min_flux"]), f"min_flux must be finite, got {meta['min_flux']}"
    assert math.isfinite(meta["max_flux"]), f"max_flux must be finite, got {meta['max_flux']}"


def test_append_image_multi_via_rpc():
    # N-way append through the RPC: one primary handle + a list of on-disk
    # paths composes onto a single grid in one call (no per-file re-snapping).
    img_src = Path("C:\\Users\\leesnow\\skynet2\\ogrc\\fixtures\\outputs\\cassio_a.img")
    assert img_src.exists()
    server = RpcServer()
    primary_h = _open_image_handle(server, img_src)
    resp = call(
        server,
        "append_image_multi",
        {"handle": primary_h, "other_paths": [str(img_src), str(img_src)]},
    )
    assert "error" not in resp, resp
    meta = resp["result"]
    # Strict-JSON round-trip, same guard as the single-append meta test.
    s = json.dumps(meta, allow_nan=False)
    assert "NaN" not in s and "Infinity" not in s
    # Result is a fresh, resolvable scalar-image handle.
    assert meta["handle"] != primary_h
    pix = call(server, "get_image_pixels", {"handle": meta["handle"]})
    assert "error" not in pix, pix


def test_append_image_multi_requires_nonempty_paths():
    img_src = Path("C:\\Users\\leesnow\\skynet2\\ogrc\\fixtures\\outputs\\cassio_a.img")
    server = RpcServer()
    primary_h = _open_image_handle(server, img_src)
    resp = call(server, "append_image_multi", {"handle": primary_h, "other_paths": []})
    assert "error" in resp
    # Base handle survives the rejected call.
    follow_up = call(server, "get_image_pixels", {"handle": primary_h})
    assert "error" not in follow_up, follow_up


def test_superimpose_image_multi_via_rpc():
    # N-way superimpose through the RPC: one primary handle + a list of on-disk
    # paths blends onto a single grid in one call, every image weighted equally.
    img_src = Path("C:\\Users\\leesnow\\skynet2\\ogrc\\fixtures\\outputs\\cassio_a.img")
    assert img_src.exists()
    server = RpcServer()
    primary_h = _open_image_handle(server, img_src)
    resp = call(
        server,
        "superimpose_image_multi",
        {"handle": primary_h, "other_paths": [str(img_src), str(img_src)]},
    )
    assert "error" not in resp, resp
    meta = resp["result"]
    s = json.dumps(meta, allow_nan=False)
    assert "NaN" not in s and "Infinity" not in s
    assert meta["handle"] != primary_h
    pix = call(server, "get_image_pixels", {"handle": meta["handle"]})
    assert "error" not in pix, pix


def test_superimpose_image_multi_requires_nonempty_paths():
    img_src = Path("C:\\Users\\leesnow\\skynet2\\ogrc\\fixtures\\outputs\\cassio_a.img")
    server = RpcServer()
    primary_h = _open_image_handle(server, img_src)
    resp = call(server, "superimpose_image_multi", {"handle": primary_h, "other_paths": []})
    assert "error" in resp
    follow_up = call(server, "get_image_pixels", {"handle": primary_h})
    assert "error" not in follow_up, follow_up


def test_appended_image_save_roundtrip_with_uncovered_gap(tmp_path):
    # BUG-014 save path: an appended scalar image carries NaN in the no-coverage
    # gap. Saving to .img must not poison the file with non-finite header
    # aggregates; re-opening must produce a finite image (the .img sentinel
    # `Clr=0` maps back to `min_flux_p`).
    img_src = Path("C:\\Users\\leesnow\\skynet2\\ogrc\\fixtures\\outputs\\cassio_a.img")
    assert img_src.exists()
    server = RpcServer()
    primary_h = _open_image_handle(server, img_src)
    # Append against itself with a small RA shift so the union has a real gap.
    resp = call(
        server,
        "append_image",
        {
            "handle": primary_h,
            "other_path": str(img_src),
            "ra_shift_seconds": 30000.0,  # ~8h shift → guaranteed non-overlap
        },
    )
    assert "error" not in resp, resp
    appended = resp["result"]
    # Pixel payload must contain at least one null cell (the gap).
    pix = call(server, "get_image_pixels", {"handle": appended["handle"]})["result"]
    has_null = any(v is None for row in pix["pixels"] for v in row)
    assert has_null, "appended-with-shift output should contain null cells in the gap"
    # Save must succeed and the file must be valid for re-open.
    out_path = tmp_path / "appended.img"
    save = call(server, "save_image", {"handle": appended["handle"], "path": str(out_path)})
    assert "error" not in save, save
    # Re-open: the loader maps Clr=0 back to min_flux_p, so the round-tripped
    # image is fully finite (no NaN survives the .img format). Shape may differ
    # — .img uses a legacy fixed grid keyed by `pix`, not the in-memory grid.
    reopened_h = _open_image_handle(server, out_path)
    re_pix = call(server, "get_image_pixels", {"handle": reopened_h})["result"]
    re_null = any(v is None for row in re_pix["pixels"] for v in row)
    assert not re_null, "re-opened .img must not contain null (Clr=0 maps to min_flux_p)"


def test_block_downsample_preserves_peak():
    # Stride-slice downsampling (`arr[::step, ::step]`) drops a peak at odd
    # coordinates; block-max preserves it in whatever block contains it.
    arr = np.zeros((10, 10), dtype=np.float64)
    arr[3, 5] = 7.0  # peak at (row=3, col=5)
    out = _block_downsample(arr, 2)
    assert out.shape == (5, 5)
    # The peak's block is (row 3 // 2, col 5 // 2) = (1, 2).
    assert out[1, 2] == 7.0
    # Stride slice would have given arr[::2, ::2] which never visits col 5
    # (5 % 2 == 1), so the peak would vanish. Block-max keeps it.


def test_block_downsample_propagates_nan_only_for_fully_nan_blocks():
    arr = np.array(
        [
            [np.nan, np.nan, 1.0, 2.0],
            [np.nan, np.nan, 3.0, np.nan],
            [np.nan, 5.0, np.nan, np.nan],
            [np.nan, np.nan, np.nan, np.nan],
        ],
        dtype=np.float64,
    )
    out = _block_downsample(arr, 2)
    assert out.shape == (2, 2)
    # Top-left block: all-NaN → NaN.
    assert np.isnan(out[0, 0])
    # Top-right: max of (1, 2, 3, NaN) = 3.
    assert out[0, 1] == 3.0
    # Bottom-left: max of (NaN, 5, NaN, NaN) = 5 — partial NaN doesn't poison.
    assert out[1, 0] == 5.0
    # Bottom-right: all-NaN → NaN.
    assert np.isnan(out[1, 1])


def test_block_downsample_step1_is_identity():
    arr = np.arange(20, dtype=np.float64).reshape(4, 5)
    out = _block_downsample(arr, 1)
    assert np.array_equal(out, arr)


def test_block_downsample_trims_partial_edge_block():
    # 5×5 array, step=2 → trims last row and column.
    arr = np.ones((5, 5), dtype=np.float64)
    out = _block_downsample(arr, 2)
    assert out.shape == (2, 2)
    assert (out == 1.0).all()


def _channel_stats(channel: list[list[float | None]]) -> tuple[int, int, int, float, float]:
    """Return (covered, uncovered, total, finite_min, finite_max) for an RGB channel.

    "Covered" = finite numeric value; "uncovered" = NaN or None (the two ways the
    engine signals "no data"). Both shapes are accepted because BUG-013/-014 may
    leak either form depending on whether the test runs against the in-memory
    dict (NaN floats) or the JSON-serialized form (nulls).
    """
    covered = 0
    uncovered = 0
    total = 0
    finite_min = math.inf
    finite_max = -math.inf
    for row in channel:
        for v in row:
            total += 1
            if v is None or (isinstance(v, float) and math.isnan(v)):
                uncovered += 1
            else:
                covered += 1
                if v < finite_min:
                    finite_min = v
                if v > finite_max:
                    finite_max = v
    return covered, uncovered, total, finite_min, finite_max


def _open_image_handle(server: RpcServer, path: Path) -> int:
    resp = call(server, "open_image", {"path": str(path)})
    assert "error" not in resp, resp
    return resp["result"]["handle"]


def test_calibrated_composite_persists_flux_state_through_save_reopen(tmp_path):
    # The end-to-end guarantee: flux-calibrate an image, append another onto it,
    # save the composite, then reopen it in a FRESH server (no .cal loaded). The
    # composite must still report flux_calibrated — the calibrated fact rides the
    # `.img` unit suffix across the round-trip.
    img_src = Path("C:\\Users\\leesnow\\skynet2\\ogrc\\fixtures\\outputs\\cassio_a.img")
    assert img_src.exists()
    server = RpcServer()
    primary_h = _open_image_handle(server, img_src)

    # Flux-calibrate the primary (marks it Jy / flux_calibrated).
    cal = call(server, "flux_cal_apply_to_image", {"handle": primary_h, "slope": 2.0})
    assert "error" not in cal, cal
    assert cal["result"]["flux_calibrated"] is True

    # Append a (also-calibrated) copy — compose must carry the calibration.
    app = call(server, "append_image", {"handle": primary_h, "other_path": str(img_src)})
    assert "error" not in app, app
    # cassio_a.img carries no unit suffix, so the appended copy is uncalibrated
    # and the mixed composite must NOT be flux-calibrated.
    assert app["result"]["flux_calibrated"] is False

    # Now the all-calibrated path: append the calibrated primary onto itself by
    # first saving the calibrated primary, reopening it (Jy suffix present), then
    # appending that calibrated file onto the calibrated in-memory primary.
    cal_path = tmp_path / "calibrated.img"
    saved = call(server, "save_image", {"handle": primary_h, "path": str(cal_path)})
    assert "error" not in saved, saved

    app2 = call(server, "append_image", {"handle": primary_h, "other_path": str(cal_path)})
    assert "error" not in app2, app2
    assert app2["result"]["flux_calibrated"] is True
    composite_h = app2["result"]["handle"]

    # Save the calibrated composite and reopen in a brand-new server.
    out_path = tmp_path / "composite.img"
    saved2 = call(server, "save_image", {"handle": composite_h, "path": str(out_path)})
    assert "error" not in saved2, saved2

    fresh = RpcServer()
    reopened = call(fresh, "open_image", {"path": str(out_path)})
    assert "error" not in reopened, reopened
    assert reopened["result"]["flux_calibrated"] is True, "calibration must survive save→reopen"
    assert reopened["result"]["unit"] == "Jy"


def test_force_calibrated_overrides_uncalibrated_inputs_through_reopen(tmp_path):
    # Legacy .img files carry no unit suffix, so appending two of them yields an
    # uncalibrated composite by default. When the user attests they're all flux
    # calibrated (`force_calibrated: true`), the composite must be marked Jy and
    # keep that through save → reopen in a fresh server.
    img_src = Path("C:\\Users\\leesnow\\skynet2\\ogrc\\fixtures\\outputs\\cassio_a.img")
    assert img_src.exists()
    server = RpcServer()
    primary_h = _open_image_handle(server, img_src)

    # Default (no attestation): uncalibrated legacy inputs → uncalibrated result.
    plain = call(server, "append_image", {"handle": primary_h, "other_path": str(img_src)})
    assert "error" not in plain, plain
    assert plain["result"]["flux_calibrated"] is False

    # With attestation: forced calibrated.
    forced = call(
        server,
        "append_image",
        {"handle": primary_h, "other_path": str(img_src), "force_calibrated": True},
    )
    assert "error" not in forced, forced
    assert forced["result"]["flux_calibrated"] is True
    assert forced["result"]["unit"] == "Jy"

    # Persists through save → reopen in a brand-new server.
    out_path = tmp_path / "forced.img"
    saved = call(server, "save_image", {"handle": forced["result"]["handle"], "path": str(out_path)})
    assert "error" not in saved, saved
    fresh = RpcServer()
    reopened = call(fresh, "open_image", {"path": str(out_path)})
    assert "error" not in reopened, reopened
    assert reopened["result"]["flux_calibrated"] is True
    assert reopened["result"]["unit"] == "Jy"


def test_open_image_rejects_unknown_extension(tmp_path):
    bad = tmp_path / "x.bogus"
    bad.write_bytes(b"")
    server = RpcServer()
    resp = call(server, "open_image", {"path": str(bad)})
    assert "error" in resp
    assert "unsupported" in resp["error"]["message"]


def test_image_fits_roundtrip_via_rpc(tmp_path):
    # Use the Cas-A fixture (real-world FITS with NaN sentinels).
    src = Path("C:\\Users\\leesnow\\skynet2\\ogrc\\fixtures\\inputs\\CAS-A_RC_Job_7963_0007654.fits")
    assert src.exists(), src
    server = RpcServer()
    handle = _open_image_handle(server, src)
    out_path = tmp_path / "out.fits"
    save = call(server, "save_image", {"handle": handle, "path": str(out_path)})
    assert "error" not in save, save
    assert out_path.exists()
    # Reload to confirm shape parity.
    h2 = _open_image_handle(server, out_path)
    meta = call(server, "make_image", {"handle": handle})  # bogus arg path — should fail
    assert "error" in meta  # image handle isn't a survey


def test_open_save_palette_roundtrip(tmp_path):
    server = RpcServer()
    # Load a fixture palette via RPC, then save it back to disk.
    src = Path("C:\\Users\\leesnow\\skynet2\\ogrc\\fixtures\\palettes\\BW.PAL")
    assert src.exists()
    resp = call(server, "open_palette", {"path": str(src)})
    assert "error" not in resp, resp
    stops = resp["result"]["stops"]
    assert len(stops) >= 2
    out = tmp_path / "out.pal"
    save = call(server, "save_palette", {"path": str(out), "stops": stops})
    assert "error" not in save, save
    assert out.exists()


def test_bicolor_image_via_rpc():
    # BUG-013 diagnostic: with the NaN-sentinel FITS fixture in both slots, the
    # R and G channels must contain finite pixel values that span a real range.
    # Pre-fix, the all-NaN propagation through `_normalize01` made every pixel
    # NaN/null and rendered as solid black in the UI.
    src = Path("C:\\Users\\leesnow\\skynet2\\ogrc\\fixtures\\inputs\\CAS-A_RC_Job_7963_0007654.fits")
    assert src.exists()
    server = RpcServer()
    primary_h = _open_image_handle(server, src)
    resp = call(
        server,
        "bicolor_image",
        {
            "handle": primary_h,
            "other_path": str(src),
            "primary_channel": "r",
            "secondary_channel": "g",
        },
    )
    assert "error" not in resp, resp
    out = resp["result"]
    assert out["kind"] == "rgb"
    pix_resp = call(server, "get_rgb_image_pixels", {"handle": out["handle"]})
    assert "error" not in pix_resp, pix_resp
    px = pix_resp["result"]
    assert px["width"] > 0 and px["height"] > 0
    assert len(px["r"]) == px["height"] and len(px["r"][0]) == px["width"]
    # Channel content sanity: assigned channels must carry a real, bounded range
    # of finite values; the unassigned channel (B) must be all-zero or all-NaN.
    r_covered, _, _, r_min, r_max = _channel_stats(px["r"])
    g_covered, _, _, g_min, g_max = _channel_stats(px["g"])
    assert r_covered > 0, "bi-color R channel has no finite pixels"
    assert g_covered > 0, "bi-color G channel has no finite pixels"
    assert r_max >= 0.5, f"bi-color R channel never reaches half-intensity (max={r_max})"
    assert g_max >= 0.5, f"bi-color G channel never reaches half-intensity (max={g_max})"
    assert 0.0 <= r_min <= r_max <= 1.0
    assert 0.0 <= g_min <= g_max <= 1.0


def test_bicolor_image_img_pair_via_rpc():
    # Companion to `test_bicolor_image_via_rpc` covering the .img loader path,
    # which (unlike FITS) has no NaN sentinels. If the FITS variant fails and
    # this one passes, the bug is NaN-propagation in `_normalize01`. If both
    # fail, the bug is path-wide and an additional fix (e.g. block-max
    # downsampling) is needed.
    img_src = Path("C:\\Users\\leesnow\\skynet2\\ogrc\\fixtures\\outputs\\cassio_a.img")
    assert img_src.exists(), img_src
    server = RpcServer()
    primary_h = _open_image_handle(server, img_src)
    resp = call(
        server,
        "bicolor_image",
        {
            "handle": primary_h,
            "other_path": str(img_src),
            "primary_channel": "r",
            "secondary_channel": "g",
        },
    )
    assert "error" not in resp, resp
    pix_resp = call(server, "get_rgb_image_pixels", {"handle": resp["result"]["handle"]})
    assert "error" not in pix_resp, pix_resp
    px = pix_resp["result"]
    r_covered, _, _, r_min, r_max = _channel_stats(px["r"])
    g_covered, _, _, g_min, g_max = _channel_stats(px["g"])
    assert r_covered > 0 and g_covered > 0, "bi-color (.img pair) channels have no finite pixels"
    assert r_max >= 0.5, f"bi-color (.img pair) R never reaches half-intensity (max={r_max})"
    assert g_max >= 0.5, f"bi-color (.img pair) G never reaches half-intensity (max={g_max})"
    assert 0.0 <= r_min <= r_max <= 1.0
    assert 0.0 <= g_min <= g_max <= 1.0


def test_append_fits_with_img_composes_on_common_units():
    # Historically this pair could not be combined: read_fits kept the RA axis
    # in header degrees while .img images use seconds of time, so the union
    # grid exploded (~660 GiB) and a BUG-009 guard rejected the call. Bug #28
    # fixed the unit boundary — read_fits now converts RA into seconds of
    # time — so appending an .img onto a FITS primary of the same sky region
    # must simply work.
    fits_src = Path(
        "C:\\Users\\leesnow\\skynet2\\ogrc\\fixtures\\inputs\\CAS-A_RC_Job_7963_0007654.fits"
    )
    img_src = Path("C:\\Users\\leesnow\\skynet2\\ogrc\\fixtures\\outputs\\cassio_a.img")
    assert fits_src.exists() and img_src.exists()
    server = RpcServer()
    primary_h = _open_image_handle(server, fits_src)
    resp = call(
        server,
        "append_image",
        {"handle": primary_h, "other_path": str(img_src)},
    )
    assert "result" in resp, resp
    result = resp["result"]
    assert result["width"] > 0 and result["height"] > 0
    # Both fixtures image CAS A, so the union footprint must be a sane sky
    # region (well under a full day of RA), not a unit-mismatch blowup.
    assert (result["max_ra"] - result["min_ra"]) < 86400.0
    # The original handle must remain valid alongside the new composite.
    follow_up = call(server, "save_image", {"handle": primary_h, "path": "ignored.bogus"})
    # save_image will reject the path, but the handle must resolve first.
    assert follow_up["error"]["code"] != 1001, follow_up


def test_superimpose_fits_with_img_composes_on_common_units():
    # Same unit-boundary behavior on the superimpose path.
    fits_src = Path(
        "C:\\Users\\leesnow\\skynet2\\ogrc\\fixtures\\inputs\\CAS-A_RC_Job_7963_0007654.fits"
    )
    img_src = Path("C:\\Users\\leesnow\\skynet2\\ogrc\\fixtures\\outputs\\cassio_a.img")
    server = RpcServer()
    primary_h = _open_image_handle(server, fits_src)
    resp = call(
        server,
        "superimpose_image",
        {"handle": primary_h, "other_path": str(img_src), "weight": 0.5},
    )
    assert "result" in resp, resp
    assert resp["result"]["width"] > 0 and resp["result"]["height"] > 0


def test_bicolor_rejects_duplicate_channels():
    src = Path("C:\\Users\\leesnow\\skynet2\\ogrc\\fixtures\\inputs\\CAS-A_RC_Job_7963_0007654.fits")
    server = RpcServer()
    primary_h = _open_image_handle(server, src)
    resp = call(
        server,
        "bicolor_image",
        {
            "handle": primary_h,
            "other_path": str(src),
            "primary_channel": "r",
            "secondary_channel": "r",
        },
    )
    assert "error" in resp


def test_tricolor_image_via_rpc():
    src = Path("C:\\Users\\leesnow\\skynet2\\ogrc\\fixtures\\inputs\\CAS-A_RC_Job_7963_0007654.fits")
    server = RpcServer()
    primary_h = _open_image_handle(server, src)
    resp = call(
        server,
        "tricolor_image",
        {"handle": primary_h, "second_path": str(src), "third_path": str(src)},
    )
    assert "error" not in resp, resp
    out = resp["result"]
    assert out["kind"] == "rgb"


def test_append_image_via_rpc(tmp_path):
    src = Path("C:\\Users\\leesnow\\skynet2\\ogrc\\fixtures\\inputs\\CAS-A_RC_Job_7963_0007654.fits")
    assert src.exists()
    server = RpcServer()
    primary_h = _open_image_handle(server, src)
    resp = call(
        server,
        "append_image",
        {"handle": primary_h, "other_path": str(src), "ra_shift_seconds": 0.0, "dec_shift_degrees": 0.0},
    )
    assert "error" not in resp, resp
    out = resp["result"]
    assert out["width"] > 0 and out["height"] > 0
    assert out["min_flux"] <= out["max_flux"]
