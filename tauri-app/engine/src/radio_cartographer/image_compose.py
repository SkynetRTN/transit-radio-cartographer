"""Append / Superimpose two `GriddedImage`s onto a common RA/Dec grid.

Both flows resample the inputs onto a union bounding box at the requested
pixel resolution, then differ only in how overlapping cells are combined:

- **Append**: overlap cell = `max(primary, secondary)`.
- **Superimpose**: overlap cell = `weight * primary + (1 - weight) * secondary`.

Non-overlap cells take whichever image covers them unchanged. Cells outside
both images stay zero.
"""

from __future__ import annotations

import warnings
from collections.abc import Sequence

import numpy as np
from numpy.typing import NDArray

from .image import GriddedImage, RgbGriddedImage, WCSMetadata

# Output grid cap (cells). 100 MP × 8 B/cell = 800 MB at float64 — comfortably
# larger than any legitimate composite, fatally smaller than the 660 GiB OOM
# that triggered BUG-009. Crossing this cap almost always means the two inputs
# carry RA/Dec in different units (e.g. legacy `.img` seconds-of-time vs FITS
# degrees) rather than a real mosaic, so we reject before allocating.
_GRID_CELL_BUDGET = 100_000_000


def _check_grid_budget(width: int, height: int) -> None:
    if width * height > _GRID_CELL_BUDGET:
        raise ValueError(
            f"Cannot compose images: combined sky area is far larger than the "
            f"finest input's pixel size. This usually means the images use "
            f"different coordinate systems (e.g. a .fits file in degrees with "
            f"an .img file in seconds of time). Computed grid would be "
            f"{height}x{width} pixels."
        )


def _ra_wrap_shifts(*max_ras: float) -> tuple[float, ...]:
    """Legacy 12-hour RA wraparound (vb/survform.frm:7111 and siblings).

    RA is stored in seconds of time and is cyclic: 0h == 24h == 86400s. Two
    maps straddling the 0h/24h seam (e.g. one at ~23h, one at ~1h) would union
    into a ~24h-wide bounding box with a huge empty middle — blowing the cell
    budget (BUG-009: the compose is rejected outright, "won't append") or
    scattering the maps to opposite edges of a mostly-blank image.

    The legacy rule: if *any* input's max RA reaches past the 12h mark
    (43200s), any input whose max RA sits *below* 12h is assumed to have
    wrapped from the far side of the seam, so it is shifted up by 24h (86400s)
    onto a common continuous axis before the union is taken. Returns one
    additive RA shift (0.0 or 86400.0) per input, in the order given.

    The unwrapped storage values may exceed 86400; the frontend mods RA back
    into [0, 86400) for tick labels and readouts (ImagePlot.tsx
    formatRaSeconds), matching make_image's FEAT-009 unwrap, so they never
    surface to the user.
    """
    if any(m > 43200.0 for m in max_ras):
        return tuple(86400.0 if m < 43200.0 else 0.0 for m in max_ras)
    return tuple(0.0 for _ in max_ras)


def _combined_flux_state(images: Sequence[GriddedImage]) -> tuple[str | None, bool]:
    """Flux unit + calibration flag a scalar composite should carry.

    A composite is flux-calibrated only if *every* input is — a max/mean that
    mixes a Jy map with an uncalibrated (GCU) one is in no consistent unit, so
    we won't assert a scale we don't have. When all inputs agree we keep that
    label so the "this is flux-calibrated" fact survives save → reopen: the
    `.img` unit suffix is the only calibration marker on disk (a fresh instance
    with no `.cal` loaded infers calibration purely from `unit == "Jy"`). When
    the inputs disagree we drop the unit entirely.

    `flux_slope` is always None on the way out (the caller sets it): a composite
    blends several sources, so it can't be reverted by dividing through a single
    slope, and `revert_flux_calibration_image` no-ops when the slope is None.
    """
    all_calibrated = bool(images) and all(img.flux_calibrated for img in images)
    if all_calibrated:
        return "Jy", True
    units = {img.unit for img in images}
    unit = images[0].unit if len(units) == 1 else None
    return unit, False


def _cell_of(span: float, dim: int) -> float:
    """One image's native cell along an axis: span / (dim - 1). Zero-span /
    single-cell inputs return `inf` so they're skipped by a min()."""
    c = abs(span) / max(dim - 1, 1)
    return c if c > 0 else float("inf")


def _finest_cell(images: Sequence[GriddedImage]) -> tuple[float, float]:
    """Finest (smallest) native RA/Dec cell across all `images`.

    Each image was gridded at its own on-sky pixel size — 0.06° by default, but
    the pre-image screen lets the user pick per image, so a mosaic can mix
    sizes. Sizing the composite to the *finest* input (not the primary's) means
    no image is ever downsampled below the resolution it was built at, and the
    result is independent of which file happens to be open (the combine order).
    A finer input simply lifts the whole grid to its resolution; coarser inputs
    are upsampled to fit. Degenerate inputs contribute `inf` and are ignored; an
    all-degenerate set falls back to 1.0.
    """
    cell_ra = min(_cell_of(img.max_ra - img.min_ra, img.pixels.shape[1]) for img in images)
    cell_dec = min(_cell_of(img.max_dec - img.min_dec, img.pixels.shape[0]) for img in images)
    return (
        cell_ra if cell_ra != float("inf") else 1.0,
        cell_dec if cell_dec != float("inf") else 1.0,
    )


def append_images(
    primary: GriddedImage,
    secondary: GriddedImage,
    *,
    pix: int | None = None,
    ra_shift_seconds: float = 0.0,
    dec_shift_degrees: float = 0.0,
) -> GriddedImage:
    return _compose(primary, secondary, pix, ra_shift_seconds, dec_shift_degrees, "append")


def append_images_multi(
    primary: GriddedImage,
    others: Sequence[GriddedImage],
    *,
    pix: int | None = None,
    shifts: Sequence[tuple[float, float]] | None = None,
) -> GriddedImage:
    """Append N images onto a single union grid, resampling each source once.

    Result-equivalent to folding `append_images` left-to-right (overlap cell =
    max across all covering inputs, order-independent), but every source is
    snapped to the output grid exactly once instead of the running accumulator
    being re-snapped on each pairwise step. That avoids the nearest-neighbor
    regrid error a long pairwise chain accumulates — the motivation for
    appending many files in one shot rather than one at a time.

    The output cell is the finest native cell across all inputs (same convention
    as the pairwise path), so the result is independent of which image is
    primary; `others` are the additional images. `shifts` optionally gives a
    per-`other` (ra_shift_seconds, dec_shift_degrees) translation, in the same
    order as `others`; `primary` is never shifted. Cells outside every input's
    footprint are NaN (BUG-014 "no data" contract).
    """
    if not others:
        raise ValueError("append_images_multi requires at least one other image")
    if shifts is not None and len(shifts) != len(others):
        raise ValueError(
            f"shifts length ({len(shifts)}) must match others length ({len(others)})"
        )

    images = [primary, *others]
    # Per-image user shift; primary is fixed at the origin.
    if shifts:
        user_ra = [0.0] + [float(s[0]) for s in shifts]
        user_dec = [0.0] + [float(s[1]) for s in shifts]
    else:
        user_ra = [0.0] * len(images)
        user_dec = [0.0] * len(images)

    # Effective (post-user-shift) max RA per image drives the 0h/24h seam
    # unwrap; the resulting wrap shift folds into each image's total RA shift.
    eff_max_ra = [img.max_ra + user_ra[i] for i, img in enumerate(images)]
    wraps = _ra_wrap_shifts(*eff_max_ra)
    ra_shift = [user_ra[i] + wraps[i] for i in range(len(images))]
    dec_shift = list(user_dec)

    # Union bounding box over every image's shifted footprint.
    min_ra = min(img.min_ra + ra_shift[i] for i, img in enumerate(images))
    max_ra = max(img.max_ra + ra_shift[i] for i, img in enumerate(images))
    min_dec = min(img.min_dec + dec_shift[i] for i, img in enumerate(images))
    max_dec = max(img.max_dec + dec_shift[i] for i, img in enumerate(images))

    # Output cell = finest native cell across all inputs (open-order independent;
    # no input downsampled below its own pixel size). `pix` subdivides further.
    cell_ra, cell_dec = _finest_cell(images)
    if pix is not None and pix > 0:
        cell_ra /= pix
        cell_dec /= pix
    cell_ra = abs(cell_ra) or 1.0
    cell_dec = abs(cell_dec) or 1.0
    width = max(int(np.ceil((max_ra - min_ra) / cell_ra)) + 1, 1)
    height = max(int(np.ceil((max_dec - min_dec) / cell_dec)) + 1, 1)
    _check_grid_budget(width, height)

    # Fold each source in with NaN-aware max (`fmax` treats uncovered NaN cells
    # as "missing", so the union naturally takes the max over covering inputs
    # and leaves fully-uncovered cells NaN). Order-independent by construction.
    pixels = np.full((height, width), np.nan, dtype=np.float64)
    for i, img in enumerate(images):
        resampled = _resample_onto(
            img, min_ra, max_ra, min_dec, max_dec, width, height, ra_shift[i], dec_shift[i]
        )
        mask = _coverage_mask(
            img, min_ra, max_ra, min_dec, max_dec, width, height, ra_shift[i], dec_shift[i]
        )
        layer = np.where(mask, resampled, np.nan)
        pixels = np.fmax(pixels, layer)

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
    unit, flux_calibrated = _combined_flux_state(images)
    return GriddedImage(
        pixels=pixels,
        wcs=wcs,
        min_ra=min_ra,
        max_ra=max_ra,
        min_dec=min_dec,
        max_dec=max_dec,
        unit=unit,
        flux_calibrated=flux_calibrated,
        flux_slope=None,
    )


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


def superimpose_images_multi(
    primary: GriddedImage,
    others: Sequence[GriddedImage],
    *,
    pix: int | None = None,
    shifts: Sequence[tuple[float, float]] | None = None,
) -> GriddedImage:
    """Superimpose N images onto a single union grid, weighting them equally.

    Every overlapping cell becomes the *mean* of the covering inputs' values
    (order-independent) — the N-way generalization of `superimpose_images` at
    `weight=0.5`. Unequal weights are only meaningful when folding images in one
    at a time (superimpose → save → superimpose the next), so the multi path
    fixes equal weights by construction; callers wanting a lopsided blend must
    compose pairwise. Like `append_images_multi`, every source is snapped to the
    output grid exactly once instead of re-snapping a running accumulator, so a
    long chain doesn't accumulate nearest-neighbor regrid error.

    The output cell is the finest native cell across all inputs (open-order
    independent); `others` are the additional images.
    `shifts` optionally gives a per-`other` (ra_shift_seconds, dec_shift_degrees)
    translation, in the same order as `others`; `primary` is never shifted.
    Cells outside every input's footprint are NaN (BUG-014 "no data" contract).
    """
    if not others:
        raise ValueError("superimpose_images_multi requires at least one other image")
    if shifts is not None and len(shifts) != len(others):
        raise ValueError(
            f"shifts length ({len(shifts)}) must match others length ({len(others)})"
        )

    images = [primary, *others]
    # Per-image user shift; primary is fixed at the origin.
    if shifts:
        user_ra = [0.0] + [float(s[0]) for s in shifts]
        user_dec = [0.0] + [float(s[1]) for s in shifts]
    else:
        user_ra = [0.0] * len(images)
        user_dec = [0.0] * len(images)

    # Effective (post-user-shift) max RA per image drives the 0h/24h seam
    # unwrap; the resulting wrap shift folds into each image's total RA shift.
    eff_max_ra = [img.max_ra + user_ra[i] for i, img in enumerate(images)]
    wraps = _ra_wrap_shifts(*eff_max_ra)
    ra_shift = [user_ra[i] + wraps[i] for i in range(len(images))]
    dec_shift = list(user_dec)

    # Union bounding box over every image's shifted footprint.
    min_ra = min(img.min_ra + ra_shift[i] for i, img in enumerate(images))
    max_ra = max(img.max_ra + ra_shift[i] for i, img in enumerate(images))
    min_dec = min(img.min_dec + dec_shift[i] for i, img in enumerate(images))
    max_dec = max(img.max_dec + dec_shift[i] for i, img in enumerate(images))

    # Output cell = finest native cell across all inputs (open-order independent;
    # no input downsampled below its own pixel size). `pix` subdivides further.
    cell_ra, cell_dec = _finest_cell(images)
    if pix is not None and pix > 0:
        cell_ra /= pix
        cell_dec /= pix
    cell_ra = abs(cell_ra) or 1.0
    cell_dec = abs(cell_dec) or 1.0
    width = max(int(np.ceil((max_ra - min_ra) / cell_ra)) + 1, 1)
    height = max(int(np.ceil((max_dec - min_dec) / cell_dec)) + 1, 1)
    _check_grid_budget(width, height)

    # Accumulate a per-cell sum and coverage count, then divide for the equal-
    # weight mean. Cells with zero coverage stay NaN (no input touched them).
    pixels_sum = np.zeros((height, width), dtype=np.float64)
    counts = np.zeros((height, width), dtype=np.float64)
    for i, img in enumerate(images):
        resampled = _resample_onto(
            img, min_ra, max_ra, min_dec, max_dec, width, height, ra_shift[i], dec_shift[i]
        )
        mask = _coverage_mask(
            img, min_ra, max_ra, min_dec, max_dec, width, height, ra_shift[i], dec_shift[i]
        )
        # Accumulate only finite cells: a composite input has NaN "no data"
        # cells inside its rectangular coverage mask, and summing them would
        # poison the mean for every other input covering that cell (bug #33 —
        # the append variant's np.fmax handles this; give the mean the same
        # treatment by not counting NaN cells as coverage).
        finite = mask & np.isfinite(resampled)
        pixels_sum[finite] += resampled[finite]
        counts[finite] += 1.0
    with np.errstate(invalid="ignore"):
        pixels = np.where(counts > 0, pixels_sum / counts, np.nan)

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
    unit, flux_calibrated = _combined_flux_state(images)
    return GriddedImage(
        pixels=pixels,
        wcs=wcs,
        min_ra=min_ra,
        max_ra=max_ra,
        min_dec=min_dec,
        max_dec=max_dec,
        unit=unit,
        flux_calibrated=flux_calibrated,
        flux_slope=None,
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

    # Unwrap across the 0h/24h RA seam (see `_ra_wrap_shifts`). The per-image
    # wrap shift folds into the resample/coverage shift so pixels land in the
    # unwrapped positions the union bounding box is computed in.
    p_wrap, s_wrap = _ra_wrap_shifts(primary.max_ra, sec_max_ra)
    p_ra_shift = p_wrap
    s_ra_shift = ra_shift_seconds + s_wrap
    p_min_ra = primary.min_ra + p_wrap
    p_max_ra = primary.max_ra + p_wrap
    sec_min_ra += s_wrap
    sec_max_ra += s_wrap

    min_ra = min(p_min_ra, sec_min_ra)
    max_ra = max(p_max_ra, sec_max_ra)
    min_dec = min(primary.min_dec, sec_min_dec)
    max_dec = max(primary.max_dec, sec_max_dec)

    # Output cell = finer of the two inputs, so neither is downsampled below its
    # own pixel size and the result doesn't depend on which is primary. `pix`
    # (if given) subdivides that further — pix=2 → twice as dense.
    cell_ra, cell_dec = _finest_cell([primary, secondary])
    if pix is not None and pix > 0:
        cell_ra /= pix
        cell_dec /= pix

    cell_ra = abs(cell_ra) or 1.0
    cell_dec = abs(cell_dec) or 1.0
    width = max(int(np.ceil((max_ra - min_ra) / cell_ra)) + 1, 1)
    height = max(int(np.ceil((max_dec - min_dec) / cell_dec)) + 1, 1)
    _check_grid_budget(width, height)

    p_resampled = _resample_onto(primary, min_ra, max_ra, min_dec, max_dec, width, height, p_ra_shift, 0.0)
    s_resampled = _resample_onto(
        secondary, min_ra, max_ra, min_dec, max_dec, width, height, s_ra_shift, dec_shift_degrees
    )
    p_mask = _coverage_mask(primary, min_ra, max_ra, min_dec, max_dec, width, height, p_ra_shift, 0.0)
    s_mask = _coverage_mask(
        secondary, min_ra, max_ra, min_dec, max_dec, width, height, s_ra_shift, dec_shift_degrees
    )

    # BUG-014: cells outside both inputs' footprints are "no data" — encode as
    # NaN so the UI renders them as blank (white) rather than treating the
    # zero-fill as a real-but-very-dark sample. The save layer is responsible
    # for round-tripping these to a format-appropriate sentinel.
    pixels = np.full((height, width), np.nan, dtype=np.float64)
    only_p = p_mask & ~s_mask
    only_s = s_mask & ~p_mask
    both = p_mask & s_mask
    pixels[only_p] = p_resampled[only_p]
    pixels[only_s] = s_resampled[only_s]
    # NaN-aware combination: coverage masks are bounding-box rectangles, and a
    # composite input carries NaN "no data" cells INSIDE its bbox (the BUG-014
    # contract). np.maximum / a plain weighted sum propagate NaN, which would
    # erase the other image's real data wherever it falls over such a cell —
    # so take the finite operand when only one side has data (bug #29).
    p_b = p_resampled[both]
    s_b = s_resampled[both]
    if mode == "append":
        pixels[both] = np.fmax(p_b, s_b)
    else:
        p_ok = np.isfinite(p_b)
        s_ok = np.isfinite(s_b)
        with np.errstate(invalid="ignore"):
            pixels[both] = np.where(
                p_ok & s_ok,
                weight * p_b + (1.0 - weight) * s_b,
                np.where(p_ok, p_b, s_b),
            )

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
    unit, flux_calibrated = _combined_flux_state([primary, secondary])
    return GriddedImage(
        pixels=pixels,
        wcs=wcs,
        min_ra=min_ra,
        max_ra=max_ra,
        min_dec=min_dec,
        max_dec=max_dec,
        unit=unit,
        flux_calibrated=flux_calibrated,
        flux_slope=None,
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
    """Assign each input to one of R/G/B; the unused channel is all-zero.

    Each channel is normalized independently so a faint source still saturates
    that channel — same intent as the legacy bi-color flow (vb/survform.frm
    bicolor-mode). Cells outside each input's footprint carry NaN so the UI
    can render them as "no data" (white) rather than as a black covered cell.
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
    p_mask, s_mask = _two_image_masks(
        primary, secondary, bbox, ra_shift_seconds, dec_shift_degrees
    )
    p_for_channel = np.where(p_mask, p_resampled, np.nan)
    s_for_channel = np.where(s_mask, s_resampled, np.nan)
    channels[primary_channel] = _normalize01(p_for_channel)
    channels[secondary_channel] = _normalize01(s_for_channel)
    # The unused channel is the union footprint at flat 0 so the assigned
    # colors mix only where their inputs actually have data. Uncovered cells
    # of the union footprint are NaN so the UI's no-data paint applies
    # whenever ANY channel for that pixel is NaN.
    union_mask = p_mask | s_mask
    unused = np.where(union_mask, 0.0, np.nan)
    unused_name: str | None = None
    for c in ("r", "g", "b"):
        if c not in channels:
            unused_name = c
            channels[c] = unused
    return _rgb_image_from_channels(channels, bbox, unused_channel=unused_name)


def tricolor_compose(
    primary: GriddedImage,
    secondary: GriddedImage,
    tertiary: GriddedImage,
    *,
    pix: int | None = None,
    ra_shift_seconds: float = 0.0,
    dec_shift_degrees: float = 0.0,
    tertiary_ra_shift_seconds: float = 0.0,
    tertiary_dec_shift_degrees: float = 0.0,
) -> RgbGriddedImage:
    """R = primary, G = secondary, B = tertiary — each normalized independently.

    The output grid is the union of all three sources' footprints (with shifts
    applied to secondary and tertiary), at the finest input's cell size — so
    a tertiary off the side of the primary+secondary union is still rendered.
    Per-channel coverage is tracked: cells outside an input's footprint are
    NaN in that channel, letting the UI render no-coverage cells distinctly.
    """
    # Union bbox over all three inputs (with each input's shift applied).
    sec_min_ra = secondary.min_ra + ra_shift_seconds
    sec_max_ra = secondary.max_ra + ra_shift_seconds
    sec_min_dec = secondary.min_dec + dec_shift_degrees
    sec_max_dec = secondary.max_dec + dec_shift_degrees
    ter_min_ra = tertiary.min_ra + tertiary_ra_shift_seconds
    ter_max_ra = tertiary.max_ra + tertiary_ra_shift_seconds
    ter_min_dec = tertiary.min_dec + tertiary_dec_shift_degrees
    ter_max_dec = tertiary.max_dec + tertiary_dec_shift_degrees

    # Unwrap all three inputs across the 0h/24h RA seam (see `_ra_wrap_shifts`).
    p_wrap, s_wrap, t_wrap = _ra_wrap_shifts(primary.max_ra, sec_max_ra, ter_max_ra)
    p_ra_shift = p_wrap
    s_ra_shift = ra_shift_seconds + s_wrap
    t_ra_shift = tertiary_ra_shift_seconds + t_wrap
    p_min_ra = primary.min_ra + p_wrap
    p_max_ra = primary.max_ra + p_wrap
    sec_min_ra += s_wrap
    sec_max_ra += s_wrap
    ter_min_ra += t_wrap
    ter_max_ra += t_wrap
    min_ra = min(p_min_ra, sec_min_ra, ter_min_ra)
    max_ra = max(p_max_ra, sec_max_ra, ter_max_ra)
    min_dec = min(primary.min_dec, sec_min_dec, ter_min_dec)
    max_dec = max(primary.max_dec, sec_max_dec, ter_max_dec)

    # Output cell = finest of the three inputs (open-order independent; no input
    # downsampled below its own pixel size). `pix` subdivides further.
    cell_ra, cell_dec = _finest_cell([primary, secondary, tertiary])
    if pix is not None and pix > 0:
        cell_ra /= pix
        cell_dec /= pix
    cell_ra = abs(cell_ra) or 1.0
    cell_dec = abs(cell_dec) or 1.0
    width = max(int(np.ceil((max_ra - min_ra) / cell_ra)) + 1, 1)
    height = max(int(np.ceil((max_dec - min_dec) / cell_dec)) + 1, 1)
    _check_grid_budget(width, height)

    p_resampled = _resample_onto(primary, min_ra, max_ra, min_dec, max_dec, width, height, p_ra_shift, 0.0)
    s_resampled = _resample_onto(
        secondary, min_ra, max_ra, min_dec, max_dec, width, height,
        s_ra_shift, dec_shift_degrees,
    )
    t_resampled = _resample_onto(
        tertiary, min_ra, max_ra, min_dec, max_dec, width, height,
        t_ra_shift, tertiary_dec_shift_degrees,
    )
    p_mask = _coverage_mask(primary, min_ra, max_ra, min_dec, max_dec, width, height, p_ra_shift, 0.0)
    s_mask = _coverage_mask(
        secondary, min_ra, max_ra, min_dec, max_dec, width, height,
        s_ra_shift, dec_shift_degrees,
    )
    t_mask = _coverage_mask(
        tertiary, min_ra, max_ra, min_dec, max_dec, width, height,
        t_ra_shift, tertiary_dec_shift_degrees,
    )
    channels = {
        "r": _normalize01(np.where(p_mask, p_resampled, np.nan)),
        "g": _normalize01(np.where(s_mask, s_resampled, np.nan)),
        "b": _normalize01(np.where(t_mask, t_resampled, np.nan)),
    }
    bbox = {
        "min_ra": min_ra, "max_ra": max_ra,
        "min_dec": min_dec, "max_dec": max_dec,
        "width": width, "height": height,
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
    (all-zero or all-NaN) channel is detected and filled with the new image,
    resampled onto the existing RGB grid. Raises if all three channels are
    already populated (the image is already a tri-color).
    """
    channels: dict[str, NDArray[np.float64]] = {
        "r": np.asarray(rgb.pixels_r, dtype=np.float64),
        "g": np.asarray(rgb.pixels_g, dtype=np.float64),
        "b": np.asarray(rgb.pixels_b, dtype=np.float64),
    }
    # Prefer the channel recorded at compose time — pixel values cannot
    # distinguish a truly unused channel from a populated one whose flat
    # input normalized to all-zeros.
    unused: str | None = getattr(rgb, "unused_channel", None)
    if unused not in ("r", "g", "b"):
        unused = None
        for name, ch in channels.items():
            if ch.size == 0:
                unused = name
                break
            # Fallback heuristic for RGB images with no recorded unused
            # channel: the bicolor path fills the empty channel with 0.0
            # inside coverage and NaN outside, so `nanmax` is either 0.0
            # (covered-but-empty) or NaN (all-NaN).
            with np.errstate(invalid="ignore"), warnings.catch_warnings():
                warnings.simplefilter("ignore", RuntimeWarning)
                ch_max = float(np.nanmax(ch))
            if np.isnan(ch_max) or ch_max == 0.0:
                unused = name
                break
    if unused is None:
        raise ValueError("all 3 channels already populated; cannot extend to tri-color")

    old_height, old_width = channels["r"].shape
    # Extend the bbox to cover the new image's footprint too, otherwise a
    # third input at a different sky position is silently clipped to the
    # existing bi-color bounds and never appears in the result.
    other_min_ra = other.min_ra + ra_shift_seconds
    other_max_ra = other.max_ra + ra_shift_seconds
    other_min_dec = other.min_dec + dec_shift_degrees
    other_max_dec = other.max_dec + dec_shift_degrees
    new_min_ra = min(float(rgb.min_ra), other_min_ra)
    new_max_ra = max(float(rgb.max_ra), other_max_ra)
    new_min_dec = min(float(rgb.min_dec), other_min_dec)
    new_max_dec = max(float(rgb.max_dec), other_max_dec)

    # Output cell = finer of the existing RGB grid and the new image, so a finer
    # third image lifts the whole composite to its resolution rather than being
    # downsampled. When the cell (and thus the shape) changes, the existing
    # channels are re-gridded below; the grid also grows to cover the new image.
    cell_ra = min(
        _cell_of(float(rgb.max_ra) - float(rgb.min_ra), old_width),
        _cell_of(other.max_ra - other.min_ra, other.pixels.shape[1]),
    )
    cell_dec = min(
        _cell_of(float(rgb.max_dec) - float(rgb.min_dec), old_height),
        _cell_of(other.max_dec - other.min_dec, other.pixels.shape[0]),
    )
    cell_ra = (cell_ra if cell_ra != float("inf") else 1.0) or 1.0
    cell_dec = (cell_dec if cell_dec != float("inf") else 1.0) or 1.0
    new_width = max(int(np.ceil((new_max_ra - new_min_ra) / cell_ra)) + 1, 1)
    new_height = max(int(np.ceil((new_max_dec - new_min_dec) / cell_dec)) + 1, 1)
    _check_grid_budget(new_width, new_height)

    # Resample each existing channel onto the larger grid. `_resample_onto`
    # carries the source's NaN cells through as NaN, and stamps zero for
    # cells outside the source bbox — we then mask those back to NaN so the
    # extension region renders as no-data per the BUG-014 contract.
    if (new_width, new_height) != (old_width, old_height):
        old_mask = _coverage_mask(
            GriddedImage(
                pixels=channels["r"],
                wcs=rgb.wcs,
                min_ra=float(rgb.min_ra),
                max_ra=float(rgb.max_ra),
                min_dec=float(rgb.min_dec),
                max_dec=float(rgb.max_dec),
            ),
            new_min_ra, new_max_ra, new_min_dec, new_max_dec,
            new_width, new_height, 0.0, 0.0,
        )
        for name, ch in list(channels.items()):
            tmp = GriddedImage(
                pixels=ch,
                wcs=rgb.wcs,
                min_ra=float(rgb.min_ra),
                max_ra=float(rgb.max_ra),
                min_dec=float(rgb.min_dec),
                max_dec=float(rgb.max_dec),
            )
            resampled = _resample_onto(
                tmp, new_min_ra, new_max_ra, new_min_dec, new_max_dec,
                new_width, new_height, 0.0, 0.0,
            )
            channels[name] = np.where(old_mask, resampled, np.nan)

    new_layer = _resample_onto(
        other,
        new_min_ra, new_max_ra, new_min_dec, new_max_dec,
        new_width, new_height,
        ra_shift_seconds, dec_shift_degrees,
    )
    new_mask = _coverage_mask(
        other,
        new_min_ra, new_max_ra, new_min_dec, new_max_dec,
        new_width, new_height,
        ra_shift_seconds, dec_shift_degrees,
    )
    channels[unused] = _normalize01(np.where(new_mask, new_layer, np.nan))

    bbox = {
        "min_ra": new_min_ra, "max_ra": new_max_ra,
        "min_dec": new_min_dec, "max_dec": new_max_dec,
        "width": new_width, "height": new_height,
    }
    return _rgb_image_from_channels(channels, bbox)


def _normalize01(arr: NDArray[np.float64]) -> NDArray[np.float64]:
    # NaN-safe per-channel stretch. Non-finite inputs (FITS NaN sentinels,
    # divide-by-zero artifacts) carry through as NaN so the downstream
    # renderer can paint them as "no data" rather than collapsing to black
    # via the [0, 1] clamp. The finite mask is also used to derive lo/hi
    # — otherwise a single stray NaN would poison the whole channel.
    if arr.size == 0:
        return arr
    finite = np.isfinite(arr)
    if not finite.any():
        return np.full_like(arr, np.nan)
    lo = float(np.min(arr[finite]))
    hi = float(np.max(arr[finite]))
    if hi <= lo:
        return np.where(finite, 0.0, np.nan)
    return np.where(finite, (arr - lo) / (hi - lo), np.nan)


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

    # Unwrap across the 0h/24h RA seam (see `_ra_wrap_shifts`). `_two_image_masks`
    # recomputes the same wrap from the same inputs so the mask geometry matches.
    p_wrap, s_wrap = _ra_wrap_shifts(primary.max_ra, sec_max_ra)
    p_ra_shift = p_wrap
    s_ra_shift = ra_shift_seconds + s_wrap
    p_min_ra = primary.min_ra + p_wrap
    p_max_ra = primary.max_ra + p_wrap
    sec_min_ra += s_wrap
    sec_max_ra += s_wrap
    min_ra = min(p_min_ra, sec_min_ra)
    max_ra = max(p_max_ra, sec_max_ra)
    min_dec = min(primary.min_dec, sec_min_dec)
    max_dec = max(primary.max_dec, sec_max_dec)

    # Output cell = finer of the two inputs (open-order independent; neither
    # downsampled below its own pixel size). `pix` subdivides further.
    cell_ra, cell_dec = _finest_cell([primary, secondary])
    if pix is not None and pix > 0:
        cell_ra /= pix
        cell_dec /= pix
    cell_ra = abs(cell_ra) or 1.0
    cell_dec = abs(cell_dec) or 1.0
    width = max(int(np.ceil((max_ra - min_ra) / cell_ra)) + 1, 1)
    height = max(int(np.ceil((max_dec - min_dec) / cell_dec)) + 1, 1)
    _check_grid_budget(width, height)

    p_resampled = _resample_onto(primary, min_ra, max_ra, min_dec, max_dec, width, height, p_ra_shift, 0.0)
    s_resampled = _resample_onto(
        secondary,
        min_ra,
        max_ra,
        min_dec,
        max_dec,
        width,
        height,
        s_ra_shift,
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


def _two_image_masks(
    primary: GriddedImage,
    secondary: GriddedImage,
    bbox: dict[str, float | int],
    ra_shift_seconds: float,
    dec_shift_degrees: float,
) -> tuple[NDArray[np.bool_], NDArray[np.bool_]]:
    """Coverage masks for `primary` and `secondary` on the bbox produced by
    `_two_image_grid`. Returned in the same order. Used by bi/tri-color compose
    so cells outside an input's footprint can be marked NaN per channel."""
    min_ra = float(bbox["min_ra"])
    max_ra = float(bbox["max_ra"])
    min_dec = float(bbox["min_dec"])
    max_dec = float(bbox["max_dec"])
    width = int(bbox["width"])
    height = int(bbox["height"])
    # Reproduce `_two_image_grid`'s seam unwrap from the same inputs so masks
    # align with the resampled data.
    p_wrap, s_wrap = _ra_wrap_shifts(primary.max_ra, secondary.max_ra + ra_shift_seconds)
    p_ra_shift = p_wrap
    s_ra_shift = ra_shift_seconds + s_wrap
    p_mask = _coverage_mask(primary, min_ra, max_ra, min_dec, max_dec, width, height, p_ra_shift, 0.0)
    s_mask = _coverage_mask(
        secondary, min_ra, max_ra, min_dec, max_dec, width, height,
        s_ra_shift, dec_shift_degrees,
    )
    return p_mask, s_mask


def _rgb_image_from_channels(
    channels: dict[str, NDArray[np.float64]],
    bbox: dict[str, float | int],
    unused_channel: str | None = None,
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
        unused_channel=unused_channel,
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
