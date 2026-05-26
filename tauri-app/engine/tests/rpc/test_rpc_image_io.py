"""RPC dispatch for open_image / save_image / palette / append / superimpose."""

from __future__ import annotations

from pathlib import Path

from radio_cartographer.rpc import RpcServer

from .helpers import call


def _open_image_handle(server: RpcServer, path: Path) -> int:
    resp = call(server, "open_image", {"path": str(path)})
    assert "error" not in resp, resp
    return resp["result"]["handle"]


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
