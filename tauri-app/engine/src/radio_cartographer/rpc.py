from __future__ import annotations

import base64
import binascii
import io
import json
import struct
import sys
import traceback
import warnings
from dataclasses import asdict, replace as replace_dataclass
from pathlib import Path
from typing import Any

import numpy as np
from numpy.typing import NDArray

from ._handles import HandleRegistry, UnknownHandleError
from .flux_calibration import default_known_jy, fit_counts_to_jy, fit_error, read_scn_peak
from .image import (
    DEFAULT_PIXEL_DEG,
    GriddedImage,
    RgbGriddedImage,
    WCSMetadata,
    apply_flux_calibration_image,
    make_image,
    revert_flux_calibration_image,
)
from .image_compose import (
    append_images,
    append_images_multi,
    bicolor_compose,
    extend_rgb_compose,
    superimpose_images,
    superimpose_images_multi,
    tricolor_compose,
)
from .io.bmp import write_bmp_from_rgb
from .io.png import write_png_from_rgb
from .io.cal import read_cal, write_cal
from .io.fits import read_fits, write_fits
from .io.img import read_img, write_img
from .io.md1 import read_md1
from .io.md2 import read_md2
from .io.pal import read_pal, write_pal
from .io.scn import read_scn, write_scn
from .io.srv import read_srv, write_srv
from .models import CalibrationEntry, CalibrationTable, Image, Palette, PaletteStop, Survey, Sweep
from .palette import apply_palette
from .scan_workspace import (
    ScanWorkspace,
    append_scan_source,
    apply_flux_calibration_scan,
    apply_scan_calibration,
    baseline_scan_source,
    build_scan_workspace,
    current_source_flux as scan_current_source_flux,
    cut_calibration_segment_scan,
    cut_scan_segment,
    determine_peak,
    determine_peak_fit,
    determine_peak_gaussian,
    determine_peak_max_value,
    determine_peak_squared_cosine,
    revert_flux_calibration_scan,
    scan_from_scn,
    select_calibration_declination_scan,
    select_scan_declination,
    set_bracket_enabled_scan,
    undo_scan,
    workspace_to_scan,
)
from .survey import apply_to_survey, reduce_raw_sweep
from .workspace import (
    SurveyWorkspace,
    apply_flux_calibration,
    apply_gain_calibration,
    apply_workspace_reduction,
    build_workspace,
    current_source_dec,
    current_source_flux,
    cut_calibration_segment,
    revert_flux_calibration,
    select_calibration_declination,
    survey_from_srv,
    undo_cut,
    workspace_to_survey,
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


def _array_to_jsonable_list(arr: NDArray) -> list:
    """Convert a numpy float array to a JSON-safe nested Python list.

    Standard JSON does not allow `NaN`/`Infinity`; Python's `json.dumps` emits
    them anyway as bareword literals, and Rust's `serde_json::from_str` (used
    by the Tauri sidecar bridge to parse our responses) rejects them — the
    whole RPC reply gets dropped and the UI sees an opaque "decode_failed."
    Substituting `None`/`null` at the array-to-list boundary keeps the rest
    of the engine NaN-aware while emitting strict JSON.
    """
    # Object-dtype intermediate so we can mix Python floats with None. The
    # tolist() call still happens but on the substituted array.
    finite = np.isfinite(arr)
    if finite.all():
        return arr.tolist()
    obj = arr.astype(object)
    obj[~finite] = None
    return obj.tolist()


def _block_downsample(pixels: NDArray, step: int) -> NDArray:
    """Block-max downsample a 2-D array by `step`, keeping NaN as "no data".

    Stride-slice downsampling (`pixels[::step, ::step]`) was the previous
    approach, but for sparse bright sources (a single-pixel peak in a wide
    grid) the peak can fall on an unsampled coordinate and disappear from
    the display — leaving the user's bi-color image looking far darker than
    the underlying channel actually is. Block-max preserves the peak for
    *any* block that contains it.

    Cells beyond the largest multiple of `step` are dropped (at most `step-1`
    cells on each axis); this trades a one-cell display fringe for a simple
    vectorized reduction. `np.nanmax` returns NaN only when every cell in
    a block is NaN, which is the right semantic for "fully uncovered block."
    """
    if step <= 1:
        return pixels
    h, w = pixels.shape
    h_trim = (h // step) * step
    w_trim = (w // step) * step
    if h_trim == 0 or w_trim == 0:
        return pixels[:0, :0]
    trimmed = pixels[:h_trim, :w_trim]
    blocks = trimmed.reshape(h_trim // step, step, w_trim // step, step)
    with np.errstate(invalid="ignore"), warnings.catch_warnings():
        # `nanmax` on a fully-NaN block emits "All-NaN slice encountered"; we
        # *want* NaN out in that case, so swallow the warning.
        warnings.simplefilter("ignore", RuntimeWarning)
        return np.nanmax(blocks, axis=(1, 3))


def _image_to_gridded(image: Image) -> GriddedImage:
    """Convert a legacy `.img` Image (int16 + palette) to a GriddedImage.

    Legacy quantizes flux into 5000 buckets:
    `Clr = Int((f - MinFluxPI) / (MaxFluxPI - MinFluxPI) * 5000) + 1`
    (vb/survform.frm:1706). Invert with `(Clr - 1) / 4999`. Pixels carrying
    `Clr = 0` are unpainted background; legacy renders them at MinFluxPI, so
    we clamp negatives back to that floor here.
    """
    pixels_f = np.asarray(image.pixels, dtype=np.float64)
    p_lo = float(image.min_flux_p)
    p_hi = float(image.max_flux_p)
    if p_hi > p_lo and pixels_f.size:
        pixels_f = p_lo + ((pixels_f - 1.0) / 4999.0) * (p_hi - p_lo)
        pixels_f = np.clip(pixels_f, p_lo, p_hi)
    height, width = pixels_f.shape
    cdelt1 = -(image.max_ra - image.min_ra) / max(width - 1, 1)
    cdelt2 = (image.max_dec - image.min_dec) / max(height - 1, 1)
    wcs = WCSMetadata(
        ctype1="RA---TAN",
        ctype2="DEC--TAN",
        crval1=(image.min_ra + image.max_ra) / 2.0,
        crval2=(image.min_dec + image.max_dec) / 2.0,
        crpix1=(width + 1) / 2.0,
        crpix2=(height + 1) / 2.0,
        cdelt1=cdelt1,
        cdelt2=cdelt2,
    )
    return GriddedImage(
        pixels=pixels_f,
        wcs=wcs,
        min_ra=float(image.min_ra),
        max_ra=float(image.max_ra),
        min_dec=float(image.min_dec),
        max_dec=float(image.max_dec),
        unit=image.unit,
        # Infer flux state from the on-disk unit suffix. Legacy files
        # without a suffix are treated as GCU (not flux-calibrated) so
        # the auto-apply effect can promote them to Jy when a `.cal`
        # is loaded.
        flux_calibrated=(image.unit == "Jy"),
        flux_slope=None,
    )


def _gridded_to_image(
    image: GriddedImage,
    *,
    palette: "Palette | None",
    flux_min: float,
    flux_max: float,
    name: str,
    pix: int,
    unit: str | None = None,
) -> Image:
    """Pack a GriddedImage as a legacy `.img` Image with int16 pixels.

    Legacy quantizes flux into 5000 buckets (`Clr = Int((f - lo) / (hi - lo)
    * 5000) + 1`, vb/survform.frm:1706), so files produced here load
    correctly in the legacy viewer's flux readout. Callers supply the flux
    range (the palette's "stretch") and a palette; we fall back to the
    8-stop default if no palette is given.
    """
    pal = palette if palette is not None else _default_palette()
    if flux_max <= flux_min:
        flux_max = flux_min + 1e-9
    # BUG-014: in-memory pixels carry NaN for "no coverage." The legacy .img
    # format uses `Clr = 0` as the "unpainted background" sentinel (re-read
    # at `_image_to_gridded` time as `min_flux_p` floor). Substitute 0 for
    # no-coverage cells on the way out so the file is a strict superset of
    # legacy semantics — a round-trip pins those cells back to the floor flux
    # rather than to NaN, which is acceptable since .img has no real NaN.
    finite = np.isfinite(image.pixels)
    norm = np.zeros_like(image.pixels)
    if finite.any():
        norm[finite] = (image.pixels[finite] - flux_min) / (flux_max - flux_min)
        norm = np.clip(norm, 0.0, 1.0)
    int_pixels = ((norm * 4999.0).round() + 1.0).astype(np.int16)
    # Force no-coverage cells to the unpainted sentinel (Clr = 0).
    int_pixels[~finite] = 0
    # Float aggregates skip NaN so we don't poison the file header.
    if finite.any():
        observed_min = float(np.nanmin(image.pixels))
        observed_max = float(np.nanmax(image.pixels))
    else:
        observed_min = 0.0
        observed_max = 0.0
    return Image(
        name=name,
        min_ra=float(image.min_ra),
        max_ra=float(image.max_ra),
        min_dec=float(image.min_dec),
        max_dec=float(image.max_dec),
        min_flux=observed_min,
        max_flux=observed_max,
        min_ra_p=float(image.min_ra),
        max_ra_p=float(image.max_ra),
        min_dec_p=float(image.min_dec),
        max_dec_p=float(image.max_dec),
        min_flux_p=float(flux_min),
        max_flux_p=float(flux_max),
        pix=int(pix),
        palette=pal,
        pixels=int_pixels,
        unit=unit,
    )


def _palette_stops_payload(palette: "Palette") -> list[dict[str, float]]:
    return [
        {"anchor": float(s.anchor), "r": float(s.r), "g": float(s.g), "b": float(s.b)}
        for s in palette.stops
    ]


def _palette_from_stops(stops_payload: Any) -> "Palette | None":
    if not stops_payload:
        return None
    if not isinstance(stops_payload, list):
        raise RpcError(ERR_INVALID_PARAMS, "palette stops must be a list")
    stops: list[PaletteStop] = []
    for entry in stops_payload:
        try:
            stops.append(
                PaletteStop(
                    anchor=float(entry["anchor"]),
                    r=float(entry["r"]),
                    g=float(entry["g"]),
                    b=float(entry["b"]),
                )
            )
        except (KeyError, TypeError, ValueError) as exc:
            raise RpcError(ERR_INVALID_PARAMS, f"invalid palette stop: {entry!r}") from exc
    return Palette(stops=tuple(stops))


def _default_palette() -> "Palette":
    """The legacy 8-stop ramp (vb/survform.frm:1518-1550).

    Returned anchors are in [0, 255] to match the .pal/.img convention.
    """
    return Palette(
        stops=(
            PaletteStop(anchor=0.0, r=0, g=0, b=0),
            PaletteStop(anchor=255.0 / 7.0, r=255, g=0, b=255),
            PaletteStop(anchor=255.0 * 2 / 7.0, r=0, g=0, b=255),
            PaletteStop(anchor=255.0 * 3 / 7.0, r=0, g=255, b=255),
            PaletteStop(anchor=255.0 * 4 / 7.0, r=0, g=255, b=0),
            PaletteStop(anchor=255.0 * 5 / 7.0, r=255, g=255, b=0),
            PaletteStop(anchor=255.0 * 6 / 7.0, r=255, g=0, b=0),
            PaletteStop(anchor=255.0, r=255, g=255, b=255),
        )
    )


def _flux_range_from_params(params: dict[str, Any], image: GriddedImage) -> tuple[float, float]:
    if "flux_min" in params and "flux_max" in params:
        try:
            return float(params["flux_min"]), float(params["flux_max"])
        except (TypeError, ValueError) as exc:
            raise RpcError(ERR_INVALID_PARAMS, "flux_min/flux_max must be numeric") from exc
    if image.pixels.size:
        # nanmin/nanmax so a composed image carrying NaN "no data" cells still
        # auto-ranges from the actual data, not from a NaN-poisoned extent.
        finite_count = int(np.isfinite(image.pixels).sum())
        if finite_count > 0:
            return float(np.nanmin(image.pixels)), float(np.nanmax(image.pixels))
    return 0.0, 1.0


def _pixel_deg_param(params: dict[str, Any], default: float | None = None) -> float | None:
    """Parse the `pix` param as degrees-per-pixel (float).

    The wire key stayed `pix` for continuity, but it now carries the on-sky
    pixel size in degrees (default 1/20 of the beam), not the old integer
    coarseness factor. Absent → `default`; non-positive/non-numeric → error.
    """
    raw = params.get("pix")
    if raw is None:
        return default
    try:
        value = float(raw)
    except (TypeError, ValueError) as exc:
        raise RpcError(ERR_INVALID_PARAMS, "pix (pixel size in degrees) must be numeric") from exc
    if not value > 0.0:
        raise RpcError(ERR_INVALID_PARAMS, "pix (pixel size in degrees) must be positive")
    return value


def _open_image_path(path: str) -> GriddedImage:
    ext = Path(path).suffix.lower()
    if ext == ".img":
        return _image_to_gridded(read_img(path))
    if ext in (".fits", ".fit"):
        return read_fits(path)
    raise RpcError(
        ERR_INVALID_PARAMS,
        f"unsupported image extension {ext!r}; expected .img/.fits/.fit",
    )


def _force_calibrated_if_requested(image: GriddedImage, params: dict[str, Any]) -> GriddedImage:
    """Force a composite to Jy / flux-calibrated when the user attested it.

    `_combined_flux_state` marks a composite calibrated only when every input
    carries the `.img` "Jy" unit suffix. But legacy `.img` files never wrote
    that suffix, so a genuinely-calibrated legacy map reads back as
    uncalibrated. The compose UI therefore asks the user "are all the images
    flux calibrated?"; when they answer yes it sends `force_calibrated: true`,
    and their attestation overrides the on-disk inference here.
    """
    if not bool(params.get("force_calibrated", False)):
        return image
    return replace_dataclass(image, unit="Jy", flux_calibrated=True, flux_slope=None)


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
            elif method == "open_saved_survey":
                result = self._open_saved_survey(params)
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
            elif method == "open_image":
                result = self._open_image(params)
            elif method == "save_image":
                result = self._save_image(params)
            elif method == "save_bitmap":
                result = self._save_bitmap(params)
            elif method == "save_png":
                result = self._save_png(params)
            elif method == "append_image":
                result = self._append_image(params)
            elif method == "append_image_multi":
                result = self._append_image_multi(params)
            elif method == "superimpose_image":
                result = self._superimpose_image(params)
            elif method == "superimpose_image_multi":
                result = self._superimpose_image_multi(params)
            elif method == "bicolor_image":
                result = self._bicolor_image(params)
            elif method == "tricolor_image":
                result = self._tricolor_image(params)
            elif method == "extend_rgb_image":
                result = self._extend_rgb_image(params)
            elif method == "get_rgb_image_pixels":
                result = self._get_rgb_image_pixels(params)
            elif method == "save_rgb_png":
                result = self._save_rgb_png(params)
            elif method == "open_palette":
                result = self._open_palette(params)
            elif method == "save_palette":
                result = self._save_palette(params)
            elif method == "get_workspace_overview":
                result = self._get_workspace_overview(params)
            elif method == "get_source_sweep":
                result = self._get_source_sweep(params)
            elif method == "get_sweep_paths":
                result = self._get_sweep_paths(params)
            elif method == "set_source_sweep_flux":
                result = self._set_source_sweep_flux(params)
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
            elif method == "set_workspace_name":
                result = self._set_workspace_name(params)
            elif method == "open_scan":
                result = self._open_scan(params)
            elif method == "open_saved_scan":
                result = self._open_saved_scan(params)
            elif method == "get_scan_overview":
                result = self._get_scan_overview(params)
            elif method == "get_scan_view":
                result = self._get_scan_view(params)
            elif method == "get_scan_calibration_view":
                result = self._get_scan_calibration_view(params)
            elif method == "cut_scan_calibration_segment":
                result = self._cut_scan_calibration_segment(params)
            elif method == "select_scan_calibration_declination":
                result = self._select_scan_calibration_declination(params)
            elif method == "apply_scan_calibration":
                result = self._apply_scan_calibration(params)
            elif method == "set_scan_bracket_enabled":
                result = self._set_scan_bracket_enabled(params)
            elif method == "set_scan_workspace_name":
                result = self._set_scan_workspace_name(params)
            elif method == "select_scan_declination":
                result = self._select_scan_declination(params)
            elif method == "cut_scan_segment":
                result = self._cut_scan_segment(params)
            elif method == "baseline_scan_source":
                result = self._baseline_scan_source(params)
            elif method == "append_scan":
                result = self._append_scan(params)
            elif method == "determine_scan_peak":
                result = self._determine_scan_peak(params)
            elif method == "determine_scan_peak_fit":
                result = self._determine_scan_peak_fit(params)
            elif method == "determine_scan_peak_gaussian":
                result = self._determine_scan_peak_gaussian(params)
            elif method == "determine_scan_peak_squared_cosine":
                result = self._determine_scan_peak_squared_cosine(params)
            elif method == "determine_scan_peak_max_value":
                result = self._determine_scan_peak_max_value(params)
            elif method == "undo_scan":
                result = self._undo_scan(params)
            elif method == "save_scan":
                result = self._save_scan(params)
            elif method == "save_survey":
                result = self._save_survey(params)
            elif method == "flux_cal_read_file":
                result = self._flux_cal_read_file(params)
            elif method == "flux_cal_write_file":
                result = self._flux_cal_write_file(params)
            elif method == "flux_cal_fit":
                result = self._flux_cal_fit(params)
            elif method == "flux_cal_read_scn_peak":
                result = self._flux_cal_read_scn_peak(params)
            elif method == "flux_cal_default_known_jy":
                result = self._flux_cal_default_known_jy(params)
            elif method == "flux_cal_apply_to_survey":
                result = self._flux_cal_apply_to_survey(params)
            elif method == "flux_cal_revert_from_survey":
                result = self._flux_cal_revert_from_survey(params)
            elif method == "flux_cal_apply_to_scan":
                result = self._flux_cal_apply_to_scan(params)
            elif method == "flux_cal_revert_from_scan":
                result = self._flux_cal_revert_from_scan(params)
            elif method == "flux_cal_apply_to_image":
                result = self._flux_cal_apply_to_image(params)
            elif method == "flux_cal_revert_from_image":
                result = self._flux_cal_revert_from_image(params)
            elif method == "export_fits":
                # Legacy hook from the Phase 3 stub — `save_image` is now the
                # canonical FITS write path (dispatch is by file extension).
                params_with_fits = dict(params)
                path = params_with_fits.get("path", "")
                if not str(path).lower().endswith((".fits", ".fit")):
                    raise RpcError(
                        ERR_INVALID_PARAMS,
                        "export_fits requires a .fits/.fit path; use save_image for .img",
                    )
                result = self._save_image(params_with_fits)
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

    def _open_saved_survey(self, params: dict[str, Any]) -> dict[str, Any]:
        path = params.get("path")
        if not path:
            raise RpcError(ERR_INVALID_PARAMS, "path is required")
        try:
            survey = read_srv(Path(path))
        except Exception as exc:  # noqa: BLE001
            raise RpcError(ERR_IO, f"failed to open survey: {exc}") from exc
        try:
            workspace, accepted_indices = survey_from_srv(survey, str(path))
        except ValueError as exc:
            raise RpcError(ERR_IO, f"failed to open survey: {exc}") from exc
        survey_handle = self._handles.create(survey)
        ws_handle = self._handles.create(workspace)
        return {
            "handle": survey_handle,
            "metadata": {"sweep_count": survey.swp, "path": str(path)},
            "workspace_handle": ws_handle,
            "workspace": self._workspace_overview(workspace),
            "accepted_sweeps": [int(i) for i in accepted_indices],
        }

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
        pixel_deg = _pixel_deg_param(params, default=DEFAULT_PIXEL_DEG)
        ws_handle = params.get("workspace_handle")
        unit: str | None = None
        flux_calibrated = False
        flux_slope: float | None = None
        if ws_handle is not None:
            # Pre-image is built from source sweeps only — the cal brackets
            # point at a different calibrator, so including them stretches the
            # RA/Dec extent and dumps cal-voltage samples onto an unrelated
            # part of the sky. After Apply Gain Calibration the workspace's
            # `calibrated_source_flux` is in gain units; we prefer those.
            ws = self._resolve_workspace(int(ws_handle))
            survey = _survey_from_workspace_sources(ws)
            # An image always implies at least gain-calibration (you can't
            # make a sensible image from raw volts). Reflect Jy after flux
            # calibration, otherwise GCU. When the workspace was flux-cal'd,
            # carry the slope onto the image so the auto-apply effect treats
            # it as already-calibrated (and doesn't try to multiply again).
            if ws.flux_calibrated:
                unit = "Jy"
                flux_calibrated = True
                flux_slope = ws.flux_slope
            else:
                unit = "GCU"
        else:
            handle = int(params.get("handle", -1))
            survey = self._resolve_survey(handle)
        image = make_image(survey, pixel_deg=pixel_deg)
        if unit is not None or flux_calibrated:
            image = replace_dataclass(
                image,
                unit=unit if unit is not None else image.unit,
                flux_calibrated=flux_calibrated,
                flux_slope=flux_slope,
            )
        new_handle = self._handles.create(image)
        return self._image_meta(image, new_handle)

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
            step = max(1, -(-longest // max_dim))  # ceil division
            if step > 1:
                pixels = _block_downsample(pixels, step)
                height, width = pixels.shape
        return {
            "pixels": _array_to_jsonable_list(pixels),
            "width": int(width),
            "height": int(height),
        }

    def _image_meta(self, image: GriddedImage, handle: int) -> dict[str, Any]:
        height, width = image.pixels.shape
        # nanmin/nanmax so an appended image carrying NaN "no data" cells
        # (BUG-014) doesn't poison the meta with NaN — that would emit a bare
        # `NaN` literal in JSON, which Rust serde rejects and the whole RPC
        # reply silently disappears on the UI side.
        if image.pixels.size and np.isfinite(image.pixels).any():
            min_flux = float(np.nanmin(image.pixels))
            max_flux = float(np.nanmax(image.pixels))
        else:
            min_flux = 0.0
            max_flux = 0.0
        return {
            "handle": handle,
            "width": int(width),
            "height": int(height),
            "min_ra": float(image.min_ra),
            "max_ra": float(image.max_ra),
            "min_dec": float(image.min_dec),
            "max_dec": float(image.max_dec),
            "min_flux": min_flux,
            "max_flux": max_flux,
            "unit": image.unit,
            "flux_calibrated": bool(image.flux_calibrated),
            "flux_slope": (
                float(image.flux_slope) if image.flux_slope is not None else None
            ),
        }

    def _open_image(self, params: dict[str, Any]) -> dict[str, Any]:
        path = params.get("path")
        if not path:
            raise RpcError(ERR_INVALID_PARAMS, "path is required")
        ext = Path(str(path)).suffix.lower()
        try:
            if ext == ".img":
                legacy = read_img(str(path))
                image = _image_to_gridded(legacy)
                palette_stops = _palette_stops_payload(legacy.palette)
            elif ext in (".fits", ".fit"):
                image = read_fits(str(path))
                palette_stops = None
            else:
                raise RpcError(
                    ERR_INVALID_PARAMS,
                    f"unsupported image extension {ext!r}; expected .img/.fits/.fit",
                )
        except RpcError:
            raise
        except Exception as exc:  # noqa: BLE001
            raise RpcError(ERR_IO, f"failed to open image: {exc}") from exc
        handle = self._handles.create(image)
        result = self._image_meta(image, handle)
        if palette_stops is not None:
            result["palette"] = palette_stops
        return result

    def _save_image(self, params: dict[str, Any]) -> dict[str, Any]:
        handle = int(params.get("handle", -1))
        image = self._resolve_image(handle)
        path = params.get("path")
        if not path:
            raise RpcError(ERR_INVALID_PARAMS, "path is required")
        ext = Path(str(path)).suffix.lower()
        try:
            if ext == ".img":
                palette = _palette_from_stops(params.get("palette"))
                flux_min, flux_max = _flux_range_from_params(params, image)
                # Unit precedence: explicit `unit` param wins; otherwise fall
                # back to whatever the GriddedImage carries (loaded from disk
                # or set by `make_image` from the workspace).
                unit_param = params.get("unit")
                unit = (
                    str(unit_param) if isinstance(unit_param, str) and unit_param else image.unit
                )
                # `.img` v2 stores explicit grid dims, so the legacy `pix`
                # header field no longer drives shape — write a valid nominal 1.
                legacy = _gridded_to_image(
                    image,
                    palette=palette,
                    flux_min=flux_min,
                    flux_max=flux_max,
                    name=str(params.get("name", "image")),
                    pix=1,
                    unit=unit,
                )
                write_img(legacy, str(path))
            elif ext in (".fits", ".fit"):
                # FITS carries the true scale in CDELT/NAXIS; RC_PIX is legacy
                # metadata and the pixel size is no longer an integer, so skip it.
                write_fits(
                    image,
                    str(path),
                    name=str(params.get("name")) if params.get("name") is not None else None,
                    pix=None,
                )
            else:
                raise RpcError(
                    ERR_INVALID_PARAMS,
                    f"unsupported image extension {ext!r}; expected .img/.fits/.fit",
                )
        except RpcError:
            raise
        except Exception as exc:  # noqa: BLE001
            raise RpcError(ERR_IO, f"failed to save image: {exc}") from exc
        return {"path": str(path), "bytes_written": int(Path(str(path)).stat().st_size)}

    def _save_bitmap(self, params: dict[str, Any]) -> dict[str, Any]:
        handle = int(params.get("handle", -1))
        image = self._resolve_image(handle)
        path = params.get("path")
        if not path:
            raise RpcError(ERR_INVALID_PARAMS, "path is required")
        palette = _palette_from_stops(params.get("palette")) or _default_palette()
        flux_min, flux_max = _flux_range_from_params(params, image)
        rgb = apply_palette(image.pixels, palette, flux_min, flux_max)
        try:
            write_bmp_from_rgb(rgb, str(path))
        except Exception as exc:  # noqa: BLE001
            raise RpcError(ERR_IO, f"failed to save bitmap: {exc}") from exc
        return {"path": str(path), "bytes_written": int(Path(str(path)).stat().st_size)}

    def _save_png(self, params: dict[str, Any]) -> dict[str, Any]:
        # BUG-005 (dan): the scalar-image raster export is a full-resolution PNG
        # (replacing the old .bmp). Same palette/flux-range application as the
        # bitmap path — only the encoder differs.
        handle = int(params.get("handle", -1))
        image = self._resolve_image(handle)
        path = params.get("path")
        if not path:
            raise RpcError(ERR_INVALID_PARAMS, "path is required")
        palette = _palette_from_stops(params.get("palette")) or _default_palette()
        flux_min, flux_max = _flux_range_from_params(params, image)
        rgb = apply_palette(image.pixels, palette, flux_min, flux_max)
        try:
            write_png_from_rgb(rgb, str(path))
        except Exception as exc:  # noqa: BLE001
            raise RpcError(ERR_IO, f"failed to save png: {exc}") from exc
        return {"path": str(path), "bytes_written": int(Path(str(path)).stat().st_size)}

    def _save_rgb_png(self, params: dict[str, Any]) -> dict[str, Any]:
        # Persist a client-rendered PNG (bi/tri-color composite). The webview
        # composites the 3 channels to a canvas and hands us its data URL /
        # base64; there is no scalar GriddedImage to route through save_image,
        # so we just decode and write the bytes verbatim.
        path = params.get("path")
        if not path:
            raise RpcError(ERR_INVALID_PARAMS, "path is required")
        data = params.get("data")
        if not isinstance(data, str) or not data:
            raise RpcError(ERR_INVALID_PARAMS, "data (base64 PNG) is required")
        # Accept an optional data-URL prefix ("data:image/png;base64,...").
        if data.startswith("data:"):
            _, _, data = data.partition(",")
        try:
            raw = base64.b64decode(data, validate=True)
        except (binascii.Error, ValueError) as exc:
            raise RpcError(ERR_INVALID_PARAMS, f"invalid base64 data: {exc}") from exc
        try:
            Path(str(path)).write_bytes(raw)
        except Exception as exc:  # noqa: BLE001
            raise RpcError(ERR_IO, f"failed to save png: {exc}") from exc
        return {"path": str(path), "bytes_written": len(raw)}

    def _append_image(self, params: dict[str, Any]) -> dict[str, Any]:
        primary = self._resolve_image(int(params.get("handle", -1)))
        other_path = params.get("other_path")
        if not other_path:
            raise RpcError(ERR_INVALID_PARAMS, "other_path is required")
        secondary = _open_image_path(str(other_path))
        ra_shift = float(params.get("ra_shift_seconds", 0.0))
        dec_shift = float(params.get("dec_shift_degrees", 0.0))
        pix = params.get("pix")
        pix_int = int(pix) if pix is not None else None
        try:
            composed = append_images(
                primary,
                secondary,
                pix=pix_int,
                ra_shift_seconds=ra_shift,
                dec_shift_degrees=dec_shift,
            )
        except ValueError as exc:
            raise RpcError(ERR_INVALID_PARAMS, str(exc)) from exc
        composed = _force_calibrated_if_requested(composed, params)
        new_handle = self._handles.create(composed)
        return self._image_meta(composed, new_handle)

    def _append_image_multi(self, params: dict[str, Any]) -> dict[str, Any]:
        # N-way append: one primary (in-memory handle) + a list of on-disk
        # images, composed onto a single union grid so each source is resampled
        # exactly once (no per-step re-snapping of the running accumulator).
        primary = self._resolve_image(int(params.get("handle", -1)))
        other_paths = params.get("other_paths")
        if not isinstance(other_paths, list) or not other_paths:
            raise RpcError(ERR_INVALID_PARAMS, "other_paths (non-empty list) is required")
        others = [_open_image_path(str(p)) for p in other_paths]
        pix = params.get("pix")
        pix_int = int(pix) if pix is not None else None
        try:
            composed = append_images_multi(primary, others, pix=pix_int)
        except ValueError as exc:
            raise RpcError(ERR_INVALID_PARAMS, str(exc)) from exc
        composed = _force_calibrated_if_requested(composed, params)
        new_handle = self._handles.create(composed)
        return self._image_meta(composed, new_handle)

    def _resolve_rgb_image(self, handle: int) -> RgbGriddedImage:
        try:
            obj = self._handles.get(handle)
        except UnknownHandleError as exc:
            raise RpcError(ERR_INVALID_HANDLE, f"unknown handle: {handle}") from exc
        if not isinstance(obj, RgbGriddedImage):
            raise RpcError(ERR_INVALID_HANDLE, f"handle {handle} is not an RGB image")
        return obj

    def _rgb_image_meta(self, image: RgbGriddedImage, handle: int) -> dict[str, Any]:
        height, width = image.pixels_r.shape
        return {
            "handle": handle,
            "kind": "rgb",
            "width": int(width),
            "height": int(height),
            "min_ra": float(image.min_ra),
            "max_ra": float(image.max_ra),
            "min_dec": float(image.min_dec),
            "max_dec": float(image.max_dec),
        }

    def _bicolor_image(self, params: dict[str, Any]) -> dict[str, Any]:
        primary = self._resolve_image(int(params.get("handle", -1)))
        other_path = params.get("other_path")
        if not other_path:
            raise RpcError(ERR_INVALID_PARAMS, "other_path is required")
        secondary = _open_image_path(str(other_path))
        primary_channel = str(params.get("primary_channel", "r")).lower()
        secondary_channel = str(params.get("secondary_channel", "g")).lower()
        ra_shift = float(params.get("ra_shift_seconds", 0.0))
        dec_shift = float(params.get("dec_shift_degrees", 0.0))
        pix = params.get("pix")
        pix_int = int(pix) if pix is not None else None
        try:
            composed = bicolor_compose(
                primary,
                secondary,
                primary_channel=primary_channel,
                secondary_channel=secondary_channel,
                pix=pix_int,
                ra_shift_seconds=ra_shift,
                dec_shift_degrees=dec_shift,
            )
        except ValueError as exc:
            raise RpcError(ERR_INVALID_PARAMS, str(exc)) from exc
        new_handle = self._handles.create(composed)
        return self._rgb_image_meta(composed, new_handle)

    def _tricolor_image(self, params: dict[str, Any]) -> dict[str, Any]:
        primary = self._resolve_image(int(params.get("handle", -1)))
        second_path = params.get("second_path")
        third_path = params.get("third_path")
        if not second_path or not third_path:
            raise RpcError(ERR_INVALID_PARAMS, "second_path and third_path are required")
        secondary = _open_image_path(str(second_path))
        tertiary = _open_image_path(str(third_path))
        ra_shift = float(params.get("ra_shift_seconds", 0.0))
        dec_shift = float(params.get("dec_shift_degrees", 0.0))
        tertiary_ra_shift = float(params.get("tertiary_ra_shift_seconds", 0.0))
        tertiary_dec_shift = float(params.get("tertiary_dec_shift_degrees", 0.0))
        pix = params.get("pix")
        pix_int = int(pix) if pix is not None else None
        try:
            composed = tricolor_compose(
                primary,
                secondary,
                tertiary,
                pix=pix_int,
                tertiary_ra_shift_seconds=tertiary_ra_shift,
                tertiary_dec_shift_degrees=tertiary_dec_shift,
                ra_shift_seconds=ra_shift,
                dec_shift_degrees=dec_shift,
            )
        except ValueError as exc:
            raise RpcError(ERR_INVALID_PARAMS, str(exc)) from exc
        new_handle = self._handles.create(composed)
        return self._rgb_image_meta(composed, new_handle)

    def _extend_rgb_image(self, params: dict[str, Any]) -> dict[str, Any]:
        rgb = self._resolve_rgb_image(int(params.get("handle", -1)))
        other_path = params.get("other_path")
        if not other_path:
            raise RpcError(ERR_INVALID_PARAMS, "other_path is required")
        other = _open_image_path(str(other_path))
        ra_shift = float(params.get("ra_shift_seconds", 0.0))
        dec_shift = float(params.get("dec_shift_degrees", 0.0))
        try:
            composed = extend_rgb_compose(
                rgb, other, ra_shift_seconds=ra_shift, dec_shift_degrees=dec_shift
            )
        except ValueError as exc:
            raise RpcError(ERR_INVALID_PARAMS, str(exc)) from exc
        new_handle = self._handles.create(composed)
        return self._rgb_image_meta(composed, new_handle)

    def _get_rgb_image_pixels(self, params: dict[str, Any]) -> dict[str, Any]:
        handle = int(params.get("handle", -1))
        image = self._resolve_rgb_image(handle)
        try:
            max_dim = int(params.get("max_dim", 400))
        except (TypeError, ValueError) as exc:
            raise RpcError(ERR_INVALID_PARAMS, "max_dim must be an integer") from exc
        r = image.pixels_r
        g = image.pixels_g
        b = image.pixels_b
        height, width = r.shape
        if max_dim > 0:
            longest = max(height, width)
            step = max(1, -(-longest // max_dim))
            if step > 1:
                r = _block_downsample(r, step)
                g = _block_downsample(g, step)
                b = _block_downsample(b, step)
                height, width = r.shape
        return {
            "r": _array_to_jsonable_list(r),
            "g": _array_to_jsonable_list(g),
            "b": _array_to_jsonable_list(b),
            "width": int(width),
            "height": int(height),
        }

    def _superimpose_image(self, params: dict[str, Any]) -> dict[str, Any]:
        primary = self._resolve_image(int(params.get("handle", -1)))
        other_path = params.get("other_path")
        if not other_path:
            raise RpcError(ERR_INVALID_PARAMS, "other_path is required")
        secondary = _open_image_path(str(other_path))
        ra_shift = float(params.get("ra_shift_seconds", 0.0))
        dec_shift = float(params.get("dec_shift_degrees", 0.0))
        weight = float(params.get("weight", 0.5))
        pix = params.get("pix")
        pix_int = int(pix) if pix is not None else None
        try:
            composed = superimpose_images(
                primary,
                secondary,
                weight=weight,
                pix=pix_int,
                ra_shift_seconds=ra_shift,
                dec_shift_degrees=dec_shift,
            )
        except ValueError as exc:
            raise RpcError(ERR_INVALID_PARAMS, str(exc)) from exc
        composed = _force_calibrated_if_requested(composed, params)
        new_handle = self._handles.create(composed)
        return self._image_meta(composed, new_handle)

    def _superimpose_image_multi(self, params: dict[str, Any]) -> dict[str, Any]:
        # N-way superimpose: one primary (in-memory handle) + a list of on-disk
        # images, blended onto a single union grid with every image weighted
        # equally (no per-image weight — that's only meaningful pairwise).
        primary = self._resolve_image(int(params.get("handle", -1)))
        other_paths = params.get("other_paths")
        if not isinstance(other_paths, list) or not other_paths:
            raise RpcError(ERR_INVALID_PARAMS, "other_paths (non-empty list) is required")
        others = [_open_image_path(str(p)) for p in other_paths]
        pix = params.get("pix")
        pix_int = int(pix) if pix is not None else None
        try:
            composed = superimpose_images_multi(primary, others, pix=pix_int)
        except ValueError as exc:
            raise RpcError(ERR_INVALID_PARAMS, str(exc)) from exc
        composed = _force_calibrated_if_requested(composed, params)
        new_handle = self._handles.create(composed)
        return self._image_meta(composed, new_handle)

    def _open_palette(self, params: dict[str, Any]) -> dict[str, Any]:
        path = params.get("path")
        if not path:
            raise RpcError(ERR_INVALID_PARAMS, "path is required")
        try:
            palette = read_pal(str(path))
        except Exception as exc:  # noqa: BLE001
            raise RpcError(ERR_IO, f"failed to open palette: {exc}") from exc
        return {"stops": _palette_stops_payload(palette), "path": str(path)}

    def _save_palette(self, params: dict[str, Any]) -> dict[str, Any]:
        path = params.get("path")
        if not path:
            raise RpcError(ERR_INVALID_PARAMS, "path is required")
        palette = _palette_from_stops(params.get("stops"))
        if palette is None:
            raise RpcError(ERR_INVALID_PARAMS, "stops is required")
        try:
            write_pal(palette, str(path))
        except Exception as exc:  # noqa: BLE001
            raise RpcError(ERR_IO, f"failed to save palette: {exc}") from exc
        return {"path": str(path), "bytes_written": int(Path(str(path)).stat().st_size)}

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
            "flux_calibrated": bool(ws.flux_calibrated),
            "flux_slope": float(ws.flux_slope) if ws.flux_slope is not None else None,
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
        # BUG-015 (dan): return the most-recent PROCESSED flux/dec (reduced by
        # smooth/baseline/align on the Pre Image screen) whenever a reduction
        # has run — even on a workspace that was never gain-calibrated — so
        # "Back to Sweeps" always shows the processed data. `current_source_*`
        # fall back to the calibrated flux / raw dec when no reduction has run.
        has_reduction = (
            ws.reduced_source_flux is not None or ws.reduced_source_dec is not None
        )
        if has_reduction or (ws.calibrated and ws.calibrated_source_flux is not None):
            flux = current_source_flux(ws)[index]
            dec = current_source_dec(ws)[index]
            # After noise-injection bracket gain calibration the values are
            # raw_volts / cal_volts — dimensionless. The legacy app didn't
            # label this state; we call it "gain calibration units" until a
            # `.cal` file (flux calibration) converts the survey to janskies.
            # Reductions on a never-calibrated workspace are still in volts.
            unit = "jy" if ws.flux_calibrated else ("gain" if ws.calibrated else "volts")
        else:
            flux = raw.flux
            dec = raw.dec
            unit = "volts"
        max_points = int(params.get("max_points", 4000))
        ra, dec, flux_d = _maybe_downsample(raw.ra, dec, flux, max_points)
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

    def _get_sweep_paths(self, params: dict[str, Any]) -> dict[str, Any]:
        """Return a downsampled (dec, ra) polyline for every source sweep.

        Feeds the Pre Image hover readout, which maps the cell under the cursor
        back to the sweep it came from so the user can jump to that sweep and
        remove RFI. Uses the same sweeps `make_image` grids from
        (`_survey_from_workspace_sources`) — reduced dec when the sweeps have
        been aligned — so the paths line up with what's drawn on screen. RA is
        never reduced, so it comes straight from the raw sweep. Only ra/dec are
        sent (no flux) to keep the payload small across ~200-sweep surveys.
        """
        ws = self._resolve_workspace(int(params.get("handle", -1)))
        try:
            max_points = int(params.get("max_points", 64))
        except (TypeError, ValueError) as exc:
            raise RpcError(ERR_INVALID_PARAMS, "max_points must be an integer") from exc
        survey = _survey_from_workspace_sources(ws)
        sweeps: list[dict[str, Any]] = []
        for index, s in enumerate(survey.sweeps):
            ra = np.asarray(s.ra, dtype=np.float64)
            dec = np.asarray(s.dec, dtype=np.float64)
            n = ra.shape[0]
            if max_points > 0 and n > max_points:
                # linspace (not stride) so the dec endpoints survive — the
                # frontend interpolates RA at a hovered dec and clamps to the
                # ends, so preserving them keeps the near-boundary match honest.
                idx = np.unique(np.linspace(0, n - 1, max_points).round().astype(int))
                ra = ra[idx]
                dec = dec[idx]
            sweeps.append(
                {"index": index, "ra": ra.tolist(), "dec": dec.tolist()}
            )
        return {"sweeps": sweeps, "source_count": int(ws.source_count)}

    def _set_source_sweep_flux(self, params: dict[str, Any]) -> dict[str, Any]:
        ws = self._resolve_workspace(int(params.get("handle", -1)))
        index = int(params.get("index", -1))
        if index < 0 or index >= ws.source_count:
            raise RpcError(
                ERR_INVALID_PARAMS,
                f"source sweep index out of range: {index} (0..{ws.source_count - 1})",
            )
        raw_flux = params.get("flux")
        if not isinstance(raw_flux, list):
            raise RpcError(ERR_INVALID_PARAMS, "flux must be a list of numbers")
        try:
            flux_arr = np.asarray(raw_flux, dtype=np.float64)
        except (TypeError, ValueError) as exc:
            raise RpcError(ERR_INVALID_PARAMS, "flux must be numeric") from exc
        expected = int(ws.source_sweeps[index].ra.shape[0])
        if flux_arr.shape[0] != expected:
            raise RpcError(
                ERR_INVALID_PARAMS,
                f"flux length {flux_arr.shape[0]} does not match sweep sample count {expected}",
            )
        # Write into whichever layer current_source_flux reads from so the
        # next get_source_sweep / save_survey sees the update.
        if ws.reduced_source_flux is not None:
            as_list = list(ws.reduced_source_flux)
            as_list[index] = flux_arr
            ws.reduced_source_flux = tuple(as_list)
        elif ws.calibrated_source_flux is not None:
            as_list = list(ws.calibrated_source_flux)
            as_list[index] = flux_arr
            ws.calibrated_source_flux = tuple(as_list)
        else:
            raise RpcError(
                ERR_INVALID_PARAMS, "sweep must be calibrated before flux edits"
            )
        return {"overview": self._workspace_overview(ws)}

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

    def _set_workspace_name(self, params: dict[str, Any]) -> dict[str, Any]:
        # User-facing rename. The workspace name is what gets serialised into
        # the .srv `label2` on save, so changing it here is enough to persist
        # across save → close → reopen.
        ws = self._resolve_workspace(int(params.get("handle", -1)))
        name = params.get("name")
        if not isinstance(name, str):
            raise RpcError(ERR_INVALID_PARAMS, "name must be a string")
        ws.name = name
        return self._workspace_overview(ws)

    # ─────────────────────────────────────────────────────────────────────
    # Scan pipeline (Scan menu → New Scan → MD1 → calibrate → reductions)
    # The shape mirrors the Survey workspace but the underlying state is a
    # `ScanWorkspace` — one continuous sweep with 240 cal samples bracketing
    # the source, not a tuple of sweeps.
    # ─────────────────────────────────────────────────────────────────────

    def _resolve_scan_workspace(self, handle: int) -> ScanWorkspace:
        try:
            obj = self._handles.get(handle)
        except UnknownHandleError as exc:
            raise RpcError(ERR_INVALID_HANDLE, f"unknown handle: {handle}") from exc
        if not isinstance(obj, ScanWorkspace):
            raise RpcError(ERR_INVALID_HANDLE, f"handle {handle} is not a scan workspace")
        return obj

    def _scan_overview(self, ws: ScanWorkspace) -> dict[str, Any]:
        return {
            "name": ws.name,
            "path": ws.path,
            "source_count": int(ws.source_count),
            "source_kept": int(ws.kept_count()),
            "initial_cal_samples": int(ws.initial.on_flux.shape[0] + ws.initial.off_flux.shape[0]),
            "terminal_cal_samples": int(ws.terminal.on_flux.shape[0] + ws.terminal.off_flux.shape[0]),
            "initial_kept": int(int(ws.initial.on_mask.sum()) + int(ws.initial.off_mask.sum())),
            "terminal_kept": int(int(ws.terminal.on_mask.sum()) + int(ws.terminal.off_mask.sum())),
            "cal1": float(ws.cal1()),
            "cal2": float(ws.cal2()),
            "calibrated": bool(ws.calibrated),
            "initial_enabled": bool(ws.initial_enabled),
            "terminal_enabled": bool(ws.terminal_enabled),
            "can_undo": bool(ws.undo_stack),
            "peak_flux": float(ws.peak_flux) if ws.peak_flux is not None else None,
            "flux_calibrated": bool(ws.flux_calibrated),
            "flux_slope": float(ws.flux_slope) if ws.flux_slope is not None else None,
        }

    def _open_scan(self, params: dict[str, Any]) -> dict[str, Any]:
        path = params.get("path")
        if not path:
            raise RpcError(ERR_INVALID_PARAMS, "path is required")
        try:
            md1 = read_md1(str(path))
        except Exception as exc:  # noqa: BLE001
            raise RpcError(ERR_IO, f"failed to open scan: {exc}") from exc
        try:
            workspace = build_scan_workspace(str(path), md1)
        except ValueError as exc:
            raise RpcError(ERR_IO, f"failed to open scan: {exc}") from exc
        handle = self._handles.create(workspace)
        return {
            "handle": handle,
            "metadata": {
                "path": str(path),
                "source_count": int(workspace.source_count),
            },
            "overview": self._scan_overview(workspace),
        }

    def _open_saved_scan(self, params: dict[str, Any]) -> dict[str, Any]:
        path = params.get("path")
        if not path:
            raise RpcError(ERR_INVALID_PARAMS, "path is required")
        try:
            scan = read_scn(Path(path))
        except Exception as exc:  # noqa: BLE001
            raise RpcError(ERR_IO, f"failed to open scan: {exc}") from exc
        try:
            workspace = scan_from_scn(scan, str(path))
        except ValueError as exc:
            raise RpcError(ERR_IO, f"failed to open scan: {exc}") from exc
        handle = self._handles.create(workspace)
        return {
            "handle": handle,
            "metadata": {
                "path": str(path),
                "source_count": int(workspace.source_count),
            },
            "overview": self._scan_overview(workspace),
        }

    def _get_scan_overview(self, params: dict[str, Any]) -> dict[str, Any]:
        ws = self._resolve_scan_workspace(int(params.get("handle", -1)))
        return self._scan_overview(ws)

    def _get_scan_view(self, params: dict[str, Any]) -> dict[str, Any]:
        """Return the full-scan view payload — pre-cal shows cal + source, post-cal shows source only."""
        ws = self._resolve_scan_workspace(int(params.get("handle", -1)))
        flux = scan_current_source_flux(ws)
        if ws.calibrated:
            return {
                "name": ws.name,
                "calibrated": True,
                "unit": "jy" if ws.flux_calibrated else "gain",
                "source": {
                    "ra": ws.source_ra.tolist(),
                    "dec": ws.source_dec.tolist(),
                    "flux": flux.tolist(),
                    "mask": ws.source_mask.astype(bool).tolist(),
                },
                "peak_flux": float(ws.peak_flux) if ws.peak_flux is not None else None,
            }
        # Pre-cal: serve initial cal, source, terminal cal as three contiguous
        # blocks so the front-end can paint vertical separator lines at the
        # boundaries (legacy `vb/scanform.frm:1385-1396`).
        return {
            "name": ws.name,
            "calibrated": False,
            "unit": "volts",
            "initial_on": {
                "ra": ws.initial.on_ra.tolist(),
                "dec": ws.initial.on_dec.tolist(),
                "flux": ws.initial.on_flux.tolist(),
                "mask": ws.initial.on_mask.astype(bool).tolist(),
            },
            "initial_off": {
                "ra": ws.initial.off_ra.tolist(),
                "dec": ws.initial.off_dec.tolist(),
                "flux": ws.initial.off_flux.tolist(),
                "mask": ws.initial.off_mask.astype(bool).tolist(),
            },
            "source": {
                "ra": ws.source_ra.tolist(),
                "dec": ws.source_dec.tolist(),
                "flux": ws.source_flux.tolist(),
                "mask": ws.source_mask.astype(bool).tolist(),
            },
            "terminal_on": {
                "ra": ws.terminal.on_ra.tolist(),
                "dec": ws.terminal.on_dec.tolist(),
                "flux": ws.terminal.on_flux.tolist(),
                "mask": ws.terminal.on_mask.astype(bool).tolist(),
            },
            "terminal_off": {
                "ra": ws.terminal.off_ra.tolist(),
                "dec": ws.terminal.off_dec.tolist(),
                "flux": ws.terminal.off_flux.tolist(),
                "mask": ws.terminal.off_mask.astype(bool).tolist(),
            },
        }

    def _get_scan_calibration_view(self, params: dict[str, Any]) -> dict[str, Any]:
        """Split-bracket view used by the Calibrate Scan screen."""
        ws = self._resolve_scan_workspace(int(params.get("handle", -1)))

        def bracket(label: str, br) -> dict[str, Any]:
            return {
                "label": label,
                "on": {
                    "ra": br.on_ra.tolist(),
                    "dec": br.on_dec.tolist(),
                    "flux": br.on_flux.tolist(),
                    "mask": br.on_mask.astype(bool).tolist(),
                },
                "off": {
                    "ra": br.off_ra.tolist(),
                    "dec": br.off_dec.tolist(),
                    "flux": br.off_flux.tolist(),
                    "mask": br.off_mask.astype(bool).tolist(),
                },
            }

        return {
            "name": ws.name,
            "initial": bracket("initial", ws.initial),
            "terminal": bracket("terminal", ws.terminal),
            "cal1": float(ws.cal1()),
            "cal2": float(ws.cal2()),
            "initial_enabled": bool(ws.initial_enabled),
            "terminal_enabled": bool(ws.terminal_enabled),
            "can_undo": bool(ws.undo_stack),
        }

    def _cut_scan_calibration_segment(self, params: dict[str, Any]) -> dict[str, Any]:
        ws = self._resolve_scan_workspace(int(params.get("handle", -1)))
        try:
            ra_min = float(params["ra_min"])
            ra_max = float(params["ra_max"])
        except (KeyError, TypeError, ValueError) as exc:
            raise RpcError(ERR_INVALID_PARAMS, "ra_min and ra_max are required numbers") from exc
        removed = cut_calibration_segment_scan(ws, ra_min, ra_max)
        return {"removed": int(removed), "overview": self._scan_overview(ws)}

    def _select_scan_calibration_declination(self, params: dict[str, Any]) -> dict[str, Any]:
        ws = self._resolve_scan_workspace(int(params.get("handle", -1)))
        try:
            dec_min = float(params["dec_min"])
            dec_max = float(params["dec_max"])
        except (KeyError, TypeError, ValueError) as exc:
            raise RpcError(ERR_INVALID_PARAMS, "dec_min and dec_max are required numbers") from exc
        bracket = params.get("bracket")
        if bracket not in ("initial", "terminal"):
            raise RpcError(ERR_INVALID_PARAMS, "bracket must be 'initial' or 'terminal'")
        try:
            removed = select_calibration_declination_scan(ws, dec_min, dec_max, bracket)
        except ValueError as exc:
            raise RpcError(ERR_INVALID_PARAMS, str(exc)) from exc
        return {"removed": int(removed), "overview": self._scan_overview(ws)}

    def _apply_scan_calibration(self, params: dict[str, Any]) -> dict[str, Any]:
        ws = self._resolve_scan_workspace(int(params.get("handle", -1)))
        try:
            apply_scan_calibration(ws)
        except ValueError as exc:
            raise RpcError(ERR_INVALID_PARAMS, str(exc)) from exc
        return self._scan_overview(ws)

    def _set_scan_bracket_enabled(self, params: dict[str, Any]) -> dict[str, Any]:
        ws = self._resolve_scan_workspace(int(params.get("handle", -1)))
        which = params.get("bracket")
        if which not in ("initial", "terminal"):
            raise RpcError(ERR_INVALID_PARAMS, "bracket must be 'initial' or 'terminal'")
        enabled = bool(params.get("enabled", True))
        try:
            set_bracket_enabled_scan(ws, str(which), enabled)
        except ValueError as exc:
            raise RpcError(ERR_INVALID_PARAMS, str(exc)) from exc
        return self._scan_overview(ws)

    def _set_scan_workspace_name(self, params: dict[str, Any]) -> dict[str, Any]:
        # Mirrors `_set_workspace_name` for the scan side. `workspace_to_scan`
        # serialises this name into the .scn file's `Scan.name`, which is what
        # `scan_from_scn` reads back on reopen.
        ws = self._resolve_scan_workspace(int(params.get("handle", -1)))
        name = params.get("name")
        if not isinstance(name, str):
            raise RpcError(ERR_INVALID_PARAMS, "name must be a string")
        ws.name = name
        return self._scan_overview(ws)

    def _select_scan_declination(self, params: dict[str, Any]) -> dict[str, Any]:
        ws = self._resolve_scan_workspace(int(params.get("handle", -1)))
        try:
            dec_min = float(params["dec_min"])
            dec_max = float(params["dec_max"])
        except (KeyError, TypeError, ValueError) as exc:
            raise RpcError(ERR_INVALID_PARAMS, "dec_min and dec_max are required numbers") from exc
        if not ws.calibrated:
            raise RpcError(ERR_INVALID_PARAMS, "scan must be calibrated before source reductions")
        removed = select_scan_declination(ws, dec_min, dec_max)
        return {"removed": int(removed), "overview": self._scan_overview(ws)}

    def _cut_scan_segment(self, params: dict[str, Any]) -> dict[str, Any]:
        ws = self._resolve_scan_workspace(int(params.get("handle", -1)))
        try:
            ra_min = float(params["ra_min"])
            ra_max = float(params["ra_max"])
        except (KeyError, TypeError, ValueError) as exc:
            raise RpcError(ERR_INVALID_PARAMS, "ra_min and ra_max are required numbers") from exc
        if not ws.calibrated:
            raise RpcError(ERR_INVALID_PARAMS, "scan must be calibrated before source reductions")
        removed = cut_scan_segment(ws, ra_min, ra_max)
        return {"removed": int(removed), "overview": self._scan_overview(ws)}

    def _baseline_scan_source(self, params: dict[str, Any]) -> dict[str, Any]:
        ws = self._resolve_scan_workspace(int(params.get("handle", -1)))
        try:
            ra0 = float(params["ra0"])
            flux0 = float(params["flux0"])
            ra1 = float(params["ra1"])
            flux1 = float(params["flux1"])
        except (KeyError, TypeError, ValueError) as exc:
            raise RpcError(
                ERR_INVALID_PARAMS, "ra0/flux0/ra1/flux1 are required numbers"
            ) from exc
        if not ws.calibrated:
            raise RpcError(ERR_INVALID_PARAMS, "scan must be calibrated before source reductions")
        try:
            baseline_scan_source(ws, ra0, flux0, ra1, flux1)
        except ValueError as exc:
            raise RpcError(ERR_INVALID_PARAMS, str(exc)) from exc
        return {"overview": self._scan_overview(ws)}

    def _append_scan(self, params: dict[str, Any]) -> dict[str, Any]:
        ws = self._resolve_scan_workspace(int(params.get("handle", -1)))
        path = params.get("path")
        if not path:
            raise RpcError(ERR_INVALID_PARAMS, "path is required")
        if not ws.calibrated:
            raise RpcError(
                ERR_INVALID_PARAMS, "scan must be calibrated before appending scans"
            )
        try:
            scan = read_scn(Path(str(path)))
        except Exception as exc:  # noqa: BLE001
            raise RpcError(ERR_IO, f"failed to open scan: {exc}") from exc
        added = append_scan_source(ws, scan)
        return {"added": int(added), "overview": self._scan_overview(ws)}

    def _determine_scan_peak(self, params: dict[str, Any]) -> dict[str, Any]:
        ws = self._resolve_scan_workspace(int(params.get("handle", -1)))
        try:
            flux_y = float(params["flux"])
        except (KeyError, TypeError, ValueError) as exc:
            raise RpcError(ERR_INVALID_PARAMS, "flux is required and must be numeric") from exc
        if not ws.calibrated:
            raise RpcError(ERR_INVALID_PARAMS, "scan must be calibrated before determining peak")
        peak = determine_peak(ws, flux_y)
        return {"peak_flux": float(peak), "overview": self._scan_overview(ws)}

    def _determine_scan_peak_fit(self, params: dict[str, Any]) -> dict[str, Any]:
        ws = self._resolve_scan_workspace(int(params.get("handle", -1)))
        try:
            ra_min = float(params["ra_min"])
            ra_max = float(params["ra_max"])
            degree = int(params.get("degree", 2))
        except (KeyError, TypeError, ValueError) as exc:
            raise RpcError(
                ERR_INVALID_PARAMS,
                "ra_min/ra_max are required numbers and degree must be an integer",
            ) from exc
        if not ws.calibrated:
            raise RpcError(ERR_INVALID_PARAMS, "scan must be calibrated before determining peak")
        try:
            peak_flux, ra_grid, flux_grid, peak_ra = determine_peak_fit(
                ws, ra_min, ra_max, degree
            )
        except ValueError as exc:
            raise RpcError(ERR_INVALID_PARAMS, str(exc)) from exc
        return {
            "peak_flux": float(peak_flux),
            "peak_ra": float(peak_ra),
            "fit_ra": [float(x) for x in ra_grid],
            "fit_flux": [float(x) for x in flux_grid],
            "overview": self._scan_overview(ws),
        }

    def _determine_scan_peak_gaussian(self, params: dict[str, Any]) -> dict[str, Any]:
        ws = self._resolve_scan_workspace(int(params.get("handle", -1)))
        try:
            ra_min = float(params["ra_min"])
            ra_max = float(params["ra_max"])
        except (KeyError, TypeError, ValueError) as exc:
            raise RpcError(
                ERR_INVALID_PARAMS, "ra_min/ra_max are required numbers"
            ) from exc
        if not ws.calibrated:
            raise RpcError(ERR_INVALID_PARAMS, "scan must be calibrated before determining peak")
        try:
            peak_flux, ra_grid, flux_grid, peak_ra = determine_peak_gaussian(
                ws, ra_min, ra_max
            )
        except ValueError as exc:
            raise RpcError(ERR_INVALID_PARAMS, str(exc)) from exc
        return {
            "peak_flux": float(peak_flux),
            "peak_ra": float(peak_ra),
            "fit_ra": [float(x) for x in ra_grid],
            "fit_flux": [float(x) for x in flux_grid],
            "overview": self._scan_overview(ws),
        }

    def _determine_scan_peak_squared_cosine(self, params: dict[str, Any]) -> dict[str, Any]:
        ws = self._resolve_scan_workspace(int(params.get("handle", -1)))
        try:
            ra_min = float(params["ra_min"])
            ra_max = float(params["ra_max"])
        except (KeyError, TypeError, ValueError) as exc:
            raise RpcError(
                ERR_INVALID_PARAMS, "ra_min/ra_max are required numbers"
            ) from exc
        if not ws.calibrated:
            raise RpcError(ERR_INVALID_PARAMS, "scan must be calibrated before determining peak")
        try:
            peak_flux, ra_grid, flux_grid, peak_ra = determine_peak_squared_cosine(
                ws, ra_min, ra_max
            )
        except ValueError as exc:
            raise RpcError(ERR_INVALID_PARAMS, str(exc)) from exc
        return {
            "peak_flux": float(peak_flux),
            "peak_ra": float(peak_ra),
            "fit_ra": [float(x) for x in ra_grid],
            "fit_flux": [float(x) for x in flux_grid],
            "overview": self._scan_overview(ws),
        }

    def _determine_scan_peak_max_value(self, params: dict[str, Any]) -> dict[str, Any]:
        ws = self._resolve_scan_workspace(int(params.get("handle", -1)))
        try:
            ra_min = float(params["ra_min"])
            ra_max = float(params["ra_max"])
        except (KeyError, TypeError, ValueError) as exc:
            raise RpcError(
                ERR_INVALID_PARAMS, "ra_min/ra_max are required numbers"
            ) from exc
        if not ws.calibrated:
            raise RpcError(ERR_INVALID_PARAMS, "scan must be calibrated before determining peak")
        try:
            peak_flux, ra_grid, flux_grid, peak_ra = determine_peak_max_value(
                ws, ra_min, ra_max
            )
        except ValueError as exc:
            raise RpcError(ERR_INVALID_PARAMS, str(exc)) from exc
        return {
            "peak_flux": float(peak_flux),
            "peak_ra": float(peak_ra),
            "fit_ra": [float(x) for x in ra_grid],
            "fit_flux": [float(x) for x in flux_grid],
            "overview": self._scan_overview(ws),
        }

    def _undo_scan(self, params: dict[str, Any]) -> dict[str, Any]:
        ws = self._resolve_scan_workspace(int(params.get("handle", -1)))
        undone = undo_scan(ws)
        return {"undone": bool(undone), "overview": self._scan_overview(ws)}

    def _save_scan(self, params: dict[str, Any]) -> dict[str, Any]:
        ws = self._resolve_scan_workspace(int(params.get("handle", -1)))
        path_str = params.get("path")
        if not path_str:
            raise RpcError(ERR_INVALID_PARAMS, "path is required")
        path = Path(str(path_str))
        if not path.parent.exists():
            raise RpcError(ERR_IO, f"directory does not exist: {path.parent}")
        scan = workspace_to_scan(ws)
        try:
            write_scn(scan, path)
        except Exception as exc:  # noqa: BLE001
            raise RpcError(ERR_IO, f"failed to save scan: {exc}") from exc
        return {"path": str(path), "bytes_written": path.stat().st_size}

    def _save_survey(self, params: dict[str, Any]) -> dict[str, Any]:
        ws = self._resolve_workspace(int(params.get("handle", -1)))
        path_str = params.get("path")
        if not path_str:
            raise RpcError(ERR_INVALID_PARAMS, "path is required")
        path = Path(str(path_str))
        if not path.parent.exists():
            raise RpcError(ERR_IO, f"directory does not exist: {path.parent}")
        raw_accepted = params.get("accepted_sweeps")
        accepted_sweeps: list[int] | None
        if raw_accepted is None:
            accepted_sweeps = None
        else:
            try:
                accepted_sweeps = [int(i) for i in raw_accepted]
            except (TypeError, ValueError) as exc:
                raise RpcError(
                    ERR_INVALID_PARAMS, "accepted_sweeps must be a list of ints"
                ) from exc
        survey = workspace_to_survey(ws, accepted_sweeps=accepted_sweeps)
        try:
            write_srv(survey, path)
        except Exception as exc:  # noqa: BLE001
            raise RpcError(ERR_IO, f"failed to save survey: {exc}") from exc
        return {"path": str(path), "bytes_written": path.stat().st_size}

    # ─────────────────────────────────────────────────────────────────────
    # Flux calibration (.cal file → Jy/GCU slope → applied to workspace)
    # ─────────────────────────────────────────────────────────────────────

    def _serialize_cal_table(self, table: CalibrationTable) -> dict[str, Any]:
        return {
            "caption": table.caption,
            "fit_annotation": table.fit_annotation,
            "fit_result": table.fit_result,
            "max_measured_flux": float(table.max_measured_flux),
            "max_known_flux": float(table.max_known_flux),
            "entries": [
                {
                    "name": e.name,
                    "measured_flux": float(e.measured_flux),
                    "known_flux": float(e.known_flux),
                }
                for e in table.entries
            ],
        }

    def _build_cal_table_from_params(
        self, caption: str, entries_param: Any
    ) -> CalibrationTable:
        if not isinstance(entries_param, list):
            raise RpcError(ERR_INVALID_PARAMS, "entries must be a list")
        built: list[CalibrationEntry] = []
        for raw in entries_param:
            if not isinstance(raw, dict):
                raise RpcError(ERR_INVALID_PARAMS, "each entry must be an object")
            try:
                built.append(
                    CalibrationEntry(
                        name=str(raw.get("name", "")),
                        measured_flux=float(raw.get("measured_flux", 0.0)),
                        known_flux=float(raw.get("known_flux", 0.0)),
                    )
                )
            except (TypeError, ValueError) as exc:
                raise RpcError(
                    ERR_INVALID_PARAMS, f"invalid entry payload: {raw!r}"
                ) from exc
        max_mf = max((e.measured_flux for e in built), default=0.0)
        max_kf = max((e.known_flux for e in built), default=0.0)
        # Fit_annotation/fit_result will be overwritten with the live fit
        # below so the .cal file we write reflects the current entries.
        table = CalibrationTable(
            caption=caption,
            fit_annotation="",
            fit_result="",
            max_measured_flux=max_mf,
            max_known_flux=max_kf,
            entries=tuple(built),
            raw_bytes=None,
        )
        slope = fit_counts_to_jy(table)
        err = fit_error(table)
        return CalibrationTable(
            caption=caption,
            fit_annotation=f"Slope: {slope:g} Jy",
            fit_result=f"Error: {err:g} Jy" if table.count > 1 else "",
            max_measured_flux=max_mf,
            max_known_flux=max_kf,
            entries=tuple(built),
            raw_bytes=None,
        )

    def _flux_cal_read_file(self, params: dict[str, Any]) -> dict[str, Any]:
        path = params.get("path")
        if not path:
            raise RpcError(ERR_INVALID_PARAMS, "path is required")
        try:
            table = read_cal(str(path))
        except Exception as exc:  # noqa: BLE001
            raise RpcError(ERR_IO, f"failed to read calibration: {exc}") from exc
        return {
            "path": str(path),
            "table": self._serialize_cal_table(table),
            "slope": float(fit_counts_to_jy(table)),
            "error": float(fit_error(table)),
        }

    def _flux_cal_write_file(self, params: dict[str, Any]) -> dict[str, Any]:
        path_str = params.get("path")
        if not path_str:
            raise RpcError(ERR_INVALID_PARAMS, "path is required")
        path = Path(str(path_str))
        if not path.parent.exists():
            raise RpcError(ERR_IO, f"directory does not exist: {path.parent}")
        caption = str(params.get("caption", ""))
        table = self._build_cal_table_from_params(caption, params.get("entries", []))
        try:
            write_cal(table, path)
        except Exception as exc:  # noqa: BLE001
            raise RpcError(ERR_IO, f"failed to write calibration: {exc}") from exc
        return {
            "path": str(path),
            "bytes_written": path.stat().st_size,
            "table": self._serialize_cal_table(table),
            "slope": float(fit_counts_to_jy(table)),
            "error": float(fit_error(table)),
        }

    def _flux_cal_fit(self, params: dict[str, Any]) -> dict[str, Any]:
        caption = str(params.get("caption", ""))
        table = self._build_cal_table_from_params(caption, params.get("entries", []))
        return {
            "slope": float(fit_counts_to_jy(table)),
            "error": float(fit_error(table)),
            "table": self._serialize_cal_table(table),
        }

    def _flux_cal_read_scn_peak(self, params: dict[str, Any]) -> dict[str, Any]:
        path = params.get("path")
        if not path:
            raise RpcError(ERR_INVALID_PARAMS, "path is required")
        try:
            name, peak = read_scn_peak(str(path))
        except Exception as exc:  # noqa: BLE001
            raise RpcError(ERR_IO, f"failed to read scan: {exc}") from exc
        return {
            "name": name,
            "peak_flux": float(peak),
            "default_known_jy": float(default_known_jy(name)),
        }

    def _flux_cal_default_known_jy(self, params: dict[str, Any]) -> dict[str, Any]:
        name = str(params.get("name", ""))
        return {"name": name, "default_known_jy": float(default_known_jy(name))}

    def _flux_cal_apply_to_survey(self, params: dict[str, Any]) -> dict[str, Any]:
        ws = self._resolve_workspace(int(params.get("handle", -1)))
        try:
            slope = float(params["slope"])
        except (KeyError, TypeError, ValueError) as exc:
            raise RpcError(ERR_INVALID_PARAMS, "slope is required and must be numeric") from exc
        try:
            apply_flux_calibration(ws, slope)
        except ValueError as exc:
            raise RpcError(ERR_INVALID_PARAMS, str(exc)) from exc
        return self._workspace_overview(ws)

    def _flux_cal_revert_from_survey(self, params: dict[str, Any]) -> dict[str, Any]:
        ws = self._resolve_workspace(int(params.get("handle", -1)))
        revert_flux_calibration(ws)
        return self._workspace_overview(ws)

    def _flux_cal_apply_to_scan(self, params: dict[str, Any]) -> dict[str, Any]:
        ws = self._resolve_scan_workspace(int(params.get("handle", -1)))
        try:
            slope = float(params["slope"])
        except (KeyError, TypeError, ValueError) as exc:
            raise RpcError(ERR_INVALID_PARAMS, "slope is required and must be numeric") from exc
        try:
            apply_flux_calibration_scan(ws, slope)
        except ValueError as exc:
            raise RpcError(ERR_INVALID_PARAMS, str(exc)) from exc
        return self._scan_overview(ws)

    def _flux_cal_revert_from_scan(self, params: dict[str, Any]) -> dict[str, Any]:
        ws = self._resolve_scan_workspace(int(params.get("handle", -1)))
        revert_flux_calibration_scan(ws)
        return self._scan_overview(ws)

    def _flux_cal_apply_to_image(self, params: dict[str, Any]) -> dict[str, Any]:
        handle = int(params.get("handle", -1))
        image = self._resolve_image(handle)
        try:
            slope = float(params["slope"])
        except (KeyError, TypeError, ValueError) as exc:
            raise RpcError(ERR_INVALID_PARAMS, "slope is required and must be numeric") from exc
        try:
            updated = apply_flux_calibration_image(image, slope)
        except ValueError as exc:
            raise RpcError(ERR_INVALID_PARAMS, str(exc)) from exc
        self._handles.set(handle, updated)
        return self._image_meta(updated, handle)

    def _flux_cal_revert_from_image(self, params: dict[str, Any]) -> dict[str, Any]:
        handle = int(params.get("handle", -1))
        image = self._resolve_image(handle)
        updated = revert_flux_calibration_image(image)
        self._handles.set(handle, updated)
        return self._image_meta(updated, handle)

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
