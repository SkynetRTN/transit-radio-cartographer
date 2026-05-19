from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

from .models import Survey


@dataclass(frozen=True)
class WCSMetadata:
    ctype1: str
    ctype2: str
    crval1: float
    crval2: float
    crpix1: float
    crpix2: float
    cdelt1: float
    cdelt2: float


@dataclass(frozen=True)
class GriddedImage:
    pixels: NDArray[np.float64]
    wcs: WCSMetadata
    min_ra: float
    max_ra: float
    min_dec: float
    max_dec: float


def _legacy_grid_shape(pix: int) -> tuple[int, int]:
    """Width/height in cells for a given pixel resolution.

    Mirrors vb/survform.frm:1606-1607 where `XMax% = 4770` and `YMax% = 5970`
    are stepped by `15 * Pix%` to produce the cell grid. The `.img` reader
    derives shape from the on-disk `Pix` header field the same way, so this
    is the canonical formula codecs and rendering both use.
    """
    if pix <= 0:
        raise ValueError(f"pix must be positive, got {pix}")
    width = (5970 // (15 * pix)) + 1
    height = (4770 // (15 * pix)) + 1
    return width, height


def make_image(
    survey: Survey,
    pix: int = 1,
    width: int | None = None,
    height: int | None = None,
) -> GriddedImage:
    """Build a (height, width) flux grid filled between adjacent sweeps.

    The legacy app (vb/survform.frm:1651-1799) does not just bin samples — it
    walks the region *between* adjacent sweeps and paints each cell with a
    linearly-interpolated flux. That produces the filled "sweep map" seen in
    the legacy pre-image screenshots, where cells inside the swept region
    take on a color rather than rendering as black background. We mirror
    that with three passes:

    1. Paint each sample's cell at the sample's flux.
    2. For every adjacent pair of sweeps, step finely through the
       overlapping declination range. At each step interpolate to find each
       sweep's (RA, flux) at that Dec, then paint a horizontal segment
       between the two sweeps' RA columns with linearly-interpolated flux.
    3. Average where multiple strip-fills cover the same cell.

    Cells outside any swept region remain 0 and render at the palette's
    anchor=0 stop (black). `pix` controls grid coarseness via the legacy
    formula `_legacy_grid_shape`; width/height overrides exist for tests and
    the future FITS exporter.
    """
    if width is None or height is None:
        legacy_w, legacy_h = _legacy_grid_shape(pix)
        width = legacy_w if width is None else width
        height = legacy_h if height is None else height

    sweeps = [s for s in survey.sweeps if s.ra.size > 0]
    if not sweeps:
        pixels = np.zeros((height, width), dtype=np.float64)
        wcs = WCSMetadata(
            ctype1="RA---TAN",
            ctype2="DEC--TAN",
            crval1=0.0,
            crval2=0.0,
            crpix1=(width + 1) / 2.0,
            crpix2=(height + 1) / 2.0,
            cdelt1=-1.0,
            cdelt2=1.0,
        )
        return GriddedImage(
            pixels=pixels, wcs=wcs, min_ra=0.0, max_ra=0.0, min_dec=0.0, max_dec=0.0
        )

    ra_all = np.concatenate([s.ra for s in sweeps])
    dec_all = np.concatenate([s.dec for s in sweeps])
    min_ra, max_ra = float(np.min(ra_all)), float(np.max(ra_all))
    min_dec, max_dec = float(np.min(dec_all)), float(np.max(dec_all))
    ra_range = max(max_ra - min_ra, np.finfo(float).eps)
    dec_range = max(max_dec - min_dec, np.finfo(float).eps)

    pixels = np.zeros((height, width), dtype=np.float64)
    counts = np.zeros((height, width), dtype=np.int64)

    def to_col(ra: NDArray[np.float64]) -> NDArray[np.int64]:
        # Column 0 corresponds to max_ra so the rendered image carries the
        # FITS-standard cdelt1 < 0 (RA decreases with sample index) advertised
        # by the WCS below.
        c = ((max_ra - np.asarray(ra, dtype=np.float64)) / ra_range) * (width - 1)
        return np.clip(np.rint(c).astype(np.int64), 0, width - 1)

    def to_row(dec: NDArray[np.float64]) -> NDArray[np.int64]:
        r = ((np.asarray(dec, dtype=np.float64) - min_dec) / dec_range) * (height - 1)
        return np.clip(np.rint(r).astype(np.int64), 0, height - 1)

    # 1) Paint sample cells. Each sample contributes its flux to the cell it
    # falls in; duplicate samples in the same cell average via the counts
    # accumulator below.
    for s in sweeps:
        rows = to_row(s.dec)
        cols = to_col(s.ra)
        np.add.at(pixels, (rows, cols), s.flux)
        np.add.at(counts, (rows, cols), 1)

    # 2) Strip-fill between adjacent sweeps.
    for i in range(len(sweeps) - 1):
        s1, s2 = sweeps[i], sweeps[i + 1]
        if s1.dec.size < 2 or s2.dec.size < 2:
            continue
        o1 = np.argsort(s1.dec)
        o2 = np.argsort(s2.dec)
        dec1, ra1, f1 = s1.dec[o1], s1.ra[o1], s1.flux[o1]
        dec2, ra2, f2 = s2.dec[o2], s2.ra[o2], s2.flux[o2]
        dec_lo = max(float(dec1[0]), float(dec2[0]))
        dec_hi = min(float(dec1[-1]), float(dec2[-1]))
        if dec_hi <= dec_lo:
            continue
        # ~3 dec-steps per output row keeps the strip dense enough that the
        # fill is continuous after row rounding. Below the legacy's
        # per-pixel resolution, but visually equivalent at typical pix
        # values and orders of magnitude faster.
        n_steps = max(int(np.ceil((dec_hi - dec_lo) / dec_range * height * 3)), 4)
        dec_steps = np.linspace(dec_lo, dec_hi, n_steps)
        ra_at_1 = np.interp(dec_steps, dec1, ra1)
        ra_at_2 = np.interp(dec_steps, dec2, ra2)
        flux_at_1 = np.interp(dec_steps, dec1, f1)
        flux_at_2 = np.interp(dec_steps, dec2, f2)
        rows_k = to_row(dec_steps)
        col_a_k = to_col(ra_at_1)
        col_b_k = to_col(ra_at_2)
        for k in range(n_steps):
            row = int(rows_k[k])
            ca, cb = int(col_a_k[k]), int(col_b_k[k])
            fa, fb = float(flux_at_1[k]), float(flux_at_2[k])
            if ca > cb:
                ca, cb = cb, ca
                fa, fb = fb, fa
            span = cb - ca
            if span == 0:
                pixels[row, ca] += (fa + fb) / 2.0
                counts[row, ca] += 1
            else:
                cols = np.arange(ca, cb + 1)
                t = (cols - ca) / span
                pixels[row, cols] += fa + t * (fb - fa)
                counts[row, cols] += 1

    np.divide(pixels, counts, out=pixels, where=counts > 0)

    cdelt1 = -ra_range / max(width - 1, 1)
    cdelt2 = dec_range / max(height - 1, 1)
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
