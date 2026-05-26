"""Append / Superimpose two `GriddedImage`s onto a common RA/Dec grid.

Both flows resample the inputs onto a union bounding box at the requested
pixel resolution, then differ only in how overlapping cells are combined:

- **Append**: overlap cell = `max(primary, secondary)`.
- **Superimpose**: overlap cell = `weight * primary + (1 - weight) * secondary`.

Non-overlap cells take whichever image covers them unchanged. Cells outside
both images stay zero.
"""

from __future__ import annotations

import numpy as np
from numpy.typing import NDArray

from .image import GriddedImage, RgbGriddedImage, WCSMetadata


def append_images(
    primary: GriddedImage,
    secondary: GriddedImage,
    *,
    pix: int | None = None,
    ra_shift_seconds: float = 0.0,
    dec_shift_degrees: float = 0.0,
) -> GriddedImage:
    return _compose(primary, secondary, pix, ra_shift_seconds, dec_shift_degrees, "append")


def superimpose_images(
    primary: GriddedImage,
    secondary: GriddedImage,
    *,
    weight: float = 0.5,
    pix: int | None = None,
    ra_shift_seconds: float = 0.0,
    dec_shift_degrees: float = 0.0,
) -> GriddedImage:
    if not 0.0 <= weight <= 1.0:
        raise ValueError(f"weight must be in [0, 1], got {weight}")
    return _compose(
        primary, secondary, pix, ra_shift_seconds, dec_shift_degrees, "superimpose", weight=weight
    )


def _compose(
    primary: GriddedImage,
    secondary: GriddedImage,
    pix: int | None,
    ra_shift_seconds: float,
    dec_shift_degrees: float,
    mode: str,
    *,
    weight: float = 0.5,
) -> GriddedImage:
    # Apply user-requested shift to the secondary image's footprint before
    # union-ing the bounding boxes. Shifts are simple translations of the
    # WCS reference values — the underlying pixel array is unchanged.
    sec_min_ra = secondary.min_ra + ra_shift_seconds
    sec_max_ra = secondary.max_ra + ra_shift_seconds
    sec_min_dec = secondary.min_dec + dec_shift_degrees
    sec_max_dec = secondary.max_dec + dec_shift_degrees

    min_ra = min(primary.min_ra, sec_min_ra)
    max_ra = max(primary.max_ra, sec_max_ra)
    min_dec = min(primary.min_dec, sec_min_dec)
    max_dec = max(primary.max_dec, sec_max_dec)

    # Pick the output grid scale. If `pix` is None, inherit the primary's per-cell
    # step so the composite reads at the same resolution as the source.
    if pix is not None and pix > 0:
        # Legacy convention from `_legacy_grid_shape`: width = (5970/(15*pix))+1.
        # But that's tuned for the survey's swept region size, not arbitrary
        # composite extents. For composites we instead use the primary's
        # per-cell step (cdelt) so the output is roughly `pix` times denser
        # than the legacy default — practical without coupling to vb's magic
        # numbers. `pix` is therefore reinterpreted here as "subdivision
        # factor relative to primary's native cells"; pix=1 keeps primary's
        # native resolution.
        p_height, p_width = primary.pixels.shape
        cell_ra = (primary.max_ra - primary.min_ra) / max(p_width - 1, 1) / pix
        cell_dec = (primary.max_dec - primary.min_dec) / max(p_height - 1, 1) / pix
    else:
        p_height, p_width = primary.pixels.shape
        cell_ra = (primary.max_ra - primary.min_ra) / max(p_width - 1, 1)
        cell_dec = (primary.max_dec - primary.min_dec) / max(p_height - 1, 1)

    cell_ra = abs(cell_ra) or 1.0
    cell_dec = abs(cell_dec) or 1.0
    width = max(int(np.ceil((max_ra - min_ra) / cell_ra)) + 1, 1)
    height = max(int(np.ceil((max_dec - min_dec) / cell_dec)) + 1, 1)

    p_resampled = _resample_onto(primary, min_ra, max_ra, min_dec, max_dec, width, height, 0.0, 0.0)
    s_resampled = _resample_onto(
        secondary, min_ra, max_ra, min_dec, max_dec, width, height, ra_shift_seconds, dec_shift_degrees
    )
    p_mask = _coverage_mask(primary, min_ra, max_ra, min_dec, max_dec, width, height, 0.0, 0.0)
    s_mask = _coverage_mask(
        secondary, min_ra, max_ra, min_dec, max_dec, width, height, ra_shift_seconds, dec_shift_degrees
    )

    pixels = np.zeros((height, width), dtype=np.float64)
    only_p = p_mask & ~s_mask
    only_s = s_mask & ~p_mask
    both = p_mask & s_mask
    pixels[only_p] = p_resampled[only_p]
    pixels[only_s] = s_resampled[only_s]
    if mode == "append":
        pixels[both] = np.maximum(p_resampled[both], s_resampled[both])
    else:
        pixels[both] = weight * p_resampled[both] + (1.0 - weight) * s_resampled[both]

    cdelt1 = -(max_ra - min_ra) / max(width - 1, 1)
    cdelt2 = (max_dec - min_dec) / max(height - 1, 1)
    wcs = WCSMetadata(
        ctype1="RA---TAN",
        ctype2="DEC--TAN",
        crval1=(min_ra + max_ra) / 2.0,
        crval2=(min_dec + max_dec) / 2.0,
        crpix1=(width + 1) / 2.0,
        crpix2=(height + 1) / 2.0,
        cdelt1=cdelt1,
        cdelt2=cdelt2,
    )
    return GriddedImage(
        pixels=pixels,
        wcs=wcs,
        min_ra=min_ra,
        max_ra=max_ra,
        min_dec=min_dec,
        max_dec=max_dec,
    )


def _resample_onto(
    src: GriddedImage,
    min_ra: float,
    max_ra: float,
    min_dec: float,
    max_dec: float,
    width: int,
    height: int,
    ra_shift: float,
    dec_shift: float,
) -> NDArray[np.float64]:
    """Bilinear-resample `src` onto the output grid, accounting for shifts.

    Output cell (row, col) maps to RA = max_ra - col*(...). To sample the
    source we subtract the shift (since shifting the secondary +ra_shift in
    world space means the secondary's pixel at world RA r appears at output RA
    r+ra_shift, so the output sample at RA r' draws from src at r'-ra_shift).
    """
    out = np.zeros((height, width), dtype=np.float64)
    s_h, s_w = src.pixels.shape
    if s_h == 0 or s_w == 0:
        return out
    col = np.arange(width)
    row = np.arange(height)
    ra_grid = max_ra - col * (max_ra - min_ra) / max(width - 1, 1)
    dec_grid = min_dec + row * (max_dec - min_dec) / max(height - 1, 1)

    src_ra_for_each_col = ra_grid - ra_shift
    src_dec_for_each_row = dec_grid - dec_shift

    # Convert world coords → source pixel coords (col indices increase as RA
    # decreases, so we invert).
    src_col = (src.max_ra - src_ra_for_each_col) * (s_w - 1) / max(src.max_ra - src.min_ra, 1e-12)
    src_row = (src_dec_for_each_row - src.min_dec) * (s_h - 1) / max(src.max_dec - src.min_dec, 1e-12)

    valid_col = (src_col >= 0) & (src_col <= s_w - 1)
    valid_row = (src_row >= 0) & (src_row <= s_h - 1)

    # Round to nearest source pixel — bilinear would be smoother but the
    # legacy app paints solid cells, so nearest preserves the mosaic look.
    col_idx = np.clip(np.rint(src_col).astype(np.int64), 0, s_w - 1)
    row_idx = np.clip(np.rint(src_row).astype(np.int64), 0, s_h - 1)

    cols_valid = np.where(valid_col)[0]
    rows_valid = np.where(valid_row)[0]
    if cols_valid.size == 0 or rows_valid.size == 0:
        return out
    rr, cc = np.meshgrid(rows_valid, cols_valid, indexing="ij")
    out[rr, cc] = src.pixels[row_idx[rr], col_idx[cc]]
    return out


def bicolor_compose(
    primary: GriddedImage,
    secondary: GriddedImage,
    *,
    primary_channel: str,
    secondary_channel: str,
    pix: int | None = None,
    ra_shift_seconds: float = 0.0,
    dec_shift_degrees: float = 0.0,
) -> RgbGriddedImage:
    """Assign each input to one of R/G/B; the third channel is zero.

    Each channel is normalized independently so a faint source still saturates
    that channel — same intent as the legacy bi-color flow (vb/survform.frm
    bicolor-mode).
    """
    if primary_channel not in ("r", "g", "b"):
        raise ValueError(f"primary_channel must be r/g/b, got {primary_channel!r}")
    if secondary_channel not in ("r", "g", "b"):
        raise ValueError(f"secondary_channel must be r/g/b, got {secondary_channel!r}")
    if primary_channel == secondary_channel:
        raise ValueError("primary and secondary colors must differ")

    channels: dict[str, NDArray[np.float64]] = {}
    p_resampled, s_resampled, bbox = _two_image_grid(
        primary, secondary, pix, ra_shift_seconds, dec_shift_degrees
    )
    channels[primary_channel] = _normalize01(p_resampled)
    channels[secondary_channel] = _normalize01(s_resampled)
    zero = np.zeros_like(p_resampled)
    for c in ("r", "g", "b"):
        channels.setdefault(c, zero)
    return _rgb_image_from_channels(channels, bbox)


def tricolor_compose(
    primary: GriddedImage,
    secondary: GriddedImage,
    tertiary: GriddedImage,
    *,
    pix: int | None = None,
    ra_shift_seconds: float = 0.0,
    dec_shift_degrees: float = 0.0,
) -> RgbGriddedImage:
    """R = primary, G = secondary, B = tertiary — each normalized independently.

    The legacy guide allows tri-color either from an existing bi-color image
    (assigning the not-yet-used color to the third input) or from a single
    primary plus two more images. This implementation handles the latter
    directly; the bi-color → tri-color case is just bi-color → add the third
    input on whichever channel is currently zero, which the caller can do by
    re-using `bicolor_compose` semantics.
    """
    # First resample primary vs secondary into a 2-image union grid, then
    # resample tertiary into the same grid. Keep the secondary's shift on the
    # secondary; tertiary uses its own shift (caller passes 0 if unwanted).
    p_resampled, s_resampled, bbox = _two_image_grid(
        primary, secondary, pix, ra_shift_seconds, dec_shift_degrees
    )
    # Resample tertiary into the same bbox/grid with no shift (kept simple —
    # the caller can pre-shift if needed).
    t_resampled = _resample_onto(
        tertiary,
        bbox["min_ra"],
        bbox["max_ra"],
        bbox["min_dec"],
        bbox["max_dec"],
        bbox["width"],
        bbox["height"],
        0.0,
        0.0,
    )
    channels = {
        "r": _normalize01(p_resampled),
        "g": _normalize01(s_resampled),
        "b": _normalize01(t_resampled),
    }
    return _rgb_image_from_channels(channels, bbox)


def extend_rgb_compose(
    rgb,
    other: GriddedImage,
    *,
    ra_shift_seconds: float = 0.0,
    dec_shift_degrees: float = 0.0,
) -> RgbGriddedImage:
    """Add a third image into the unused channel of an existing RGB image.

    Used by Tri-Color when invoked from a bi-color result — the unused
    (all-zero) channel is detected and filled with the new image, resampled
    onto the existing RGB grid. Raises if all three channels are already
    populated (the image is already a tri-color).
    """
    channels: dict[str, NDArray[np.float64]] = {
        "r": np.asarray(rgb.pixels_r, dtype=np.float64),
        "g": np.asarray(rgb.pixels_g, dtype=np.float64),
        "b": np.asarray(rgb.pixels_b, dtype=np.float64),
    }
    unused: str | None = None
    for name, ch in channels.items():
        if ch.size == 0 or float(np.max(ch)) == 0.0:
            unused = name
            break
    if unused is None:
        raise ValueError("all 3 channels already populated; cannot extend to tri-color")

    height, width = channels["r"].shape
    new_layer = _resample_onto(
        other,
        rgb.min_ra,
        rgb.max_ra,
        rgb.min_dec,
        rgb.max_dec,
        width,
        height,
        ra_shift_seconds,
        dec_shift_degrees,
    )
    channels[unused] = _normalize01(new_layer)
    return RgbGriddedImage(
        pixels_r=channels["r"],
        pixels_g=channels["g"],
        pixels_b=channels["b"],
        wcs=rgb.wcs,
        min_ra=rgb.min_ra,
        max_ra=rgb.max_ra,
        min_dec=rgb.min_dec,
        max_dec=rgb.max_dec,
    )


def _normalize01(arr: NDArray[np.float64]) -> NDArray[np.float64]:
    lo = float(np.min(arr)) if arr.size else 0.0
    hi = float(np.max(arr)) if arr.size else 1.0
    if hi <= lo:
        return np.zeros_like(arr)
    return (arr - lo) / (hi - lo)


def _two_image_grid(
    primary: GriddedImage,
    secondary: GriddedImage,
    pix: int | None,
    ra_shift_seconds: float,
    dec_shift_degrees: float,
) -> tuple[NDArray[np.float64], NDArray[np.float64], dict[str, float | int]]:
    sec_min_ra = secondary.min_ra + ra_shift_seconds
    sec_max_ra = secondary.max_ra + ra_shift_seconds
    sec_min_dec = secondary.min_dec + dec_shift_degrees
    sec_max_dec = secondary.max_dec + dec_shift_degrees
    min_ra = min(primary.min_ra, sec_min_ra)
    max_ra = max(primary.max_ra, sec_max_ra)
    min_dec = min(primary.min_dec, sec_min_dec)
    max_dec = max(primary.max_dec, sec_max_dec)

    if pix is not None and pix > 0:
        p_height, p_width = primary.pixels.shape
        cell_ra = (primary.max_ra - primary.min_ra) / max(p_width - 1, 1) / pix
        cell_dec = (primary.max_dec - primary.min_dec) / max(p_height - 1, 1) / pix
    else:
        p_height, p_width = primary.pixels.shape
        cell_ra = (primary.max_ra - primary.min_ra) / max(p_width - 1, 1)
        cell_dec = (primary.max_dec - primary.min_dec) / max(p_height - 1, 1)
    cell_ra = abs(cell_ra) or 1.0
    cell_dec = abs(cell_dec) or 1.0
    width = max(int(np.ceil((max_ra - min_ra) / cell_ra)) + 1, 1)
    height = max(int(np.ceil((max_dec - min_dec) / cell_dec)) + 1, 1)

    p_resampled = _resample_onto(primary, min_ra, max_ra, min_dec, max_dec, width, height, 0.0, 0.0)
    s_resampled = _resample_onto(
        secondary,
        min_ra,
        max_ra,
        min_dec,
        max_dec,
        width,
        height,
        ra_shift_seconds,
        dec_shift_degrees,
    )
    bbox = {
        "min_ra": min_ra,
        "max_ra": max_ra,
        "min_dec": min_dec,
        "max_dec": max_dec,
        "width": width,
        "height": height,
    }
    return p_resampled, s_resampled, bbox


def _rgb_image_from_channels(
    channels: dict[str, NDArray[np.float64]],
    bbox: dict[str, float | int],
) -> RgbGriddedImage:
    width = int(bbox["width"])
    height = int(bbox["height"])
    min_ra = float(bbox["min_ra"])
    max_ra = float(bbox["max_ra"])
    min_dec = float(bbox["min_dec"])
    max_dec = float(bbox["max_dec"])
    cdelt1 = -(max_ra - min_ra) / max(width - 1, 1)
    cdelt2 = (max_dec - min_dec) / max(height - 1, 1)
    wcs = WCSMetadata(
        ctype1="RA---TAN",
        ctype2="DEC--TAN",
        crval1=(min_ra + max_ra) / 2.0,
        crval2=(min_dec + max_dec) / 2.0,
        crpix1=(width + 1) / 2.0,
        crpix2=(height + 1) / 2.0,
        cdelt1=cdelt1,
        cdelt2=cdelt2,
    )
    return RgbGriddedImage(
        pixels_r=channels["r"],
        pixels_g=channels["g"],
        pixels_b=channels["b"],
        wcs=wcs,
        min_ra=min_ra,
        max_ra=max_ra,
        min_dec=min_dec,
        max_dec=max_dec,
    )


def _coverage_mask(
    src: GriddedImage,
    min_ra: float,
    max_ra: float,
    min_dec: float,
    max_dec: float,
    width: int,
    height: int,
    ra_shift: float,
    dec_shift: float,
) -> NDArray[np.bool_]:
    col = np.arange(width)
    row = np.arange(height)
    ra_grid = max_ra - col * (max_ra - min_ra) / max(width - 1, 1) - ra_shift
    dec_grid = min_dec + row * (max_dec - min_dec) / max(height - 1, 1) - dec_shift
    in_ra = (ra_grid >= src.min_ra) & (ra_grid <= src.max_ra)
    in_dec = (dec_grid >= src.min_dec) & (dec_grid <= src.max_dec)
    return in_dec[:, None] & in_ra[None, :]
