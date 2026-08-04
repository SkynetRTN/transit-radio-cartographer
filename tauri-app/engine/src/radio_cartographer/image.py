from __future__ import annotations

import math
from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

from .models import Survey

# ── Grid scale ───────────────────────────────────────────────────────────────
# Images are gridded at a FIXED angular pixel size (degrees on-sky), so a pixel
# means the same thing on every map and appends never resample one map onto
# another's coarser grid. The default is 1/20 of the 40 ft beam.
BEAM_FWHM_DEG = 1.2  # 40 ft telescope beam (most inputs come from the 40 ft)
PIXELS_PER_BEAM = 20
DEFAULT_PIXEL_DEG = BEAM_FWHM_DEG / PIXELS_PER_BEAM  # 0.06° = 3.6′ per pixel

# RA is stored in seconds of time; 15°/hour → 240 seconds of time per degree.
# A fixed seconds-per-pixel would shrink on-sky as cos(dec) grows, so we divide
# by cos(dec) to keep pixels ~square in true angle. `_MIN_COS_DEC` guards the
# division from blowing up near the poles (irrelevant for 40 ft data, but safe).
_SEC_PER_DEG_RA = 240.0
_MIN_COS_DEC = 0.05


def cell_sizes(
    min_dec: float, max_dec: float, pixel_deg: float = DEFAULT_PIXEL_DEG
) -> tuple[float, float]:
    """(RA cell in seconds-of-time, Dec cell in degrees) for `pixel_deg` on-sky.

    The RA cell is widened by 1/cos(dec_center) so a column spans the same true
    angle as a row despite RA's stored unit being time, not angle.
    """
    dec_center = (min_dec + max_dec) / 2.0
    cosd = max(math.cos(math.radians(dec_center)), _MIN_COS_DEC)
    cell_ra_sec = pixel_deg * _SEC_PER_DEG_RA / cosd
    return cell_ra_sec, pixel_deg


def grid_dims(
    min_ra: float,
    max_ra: float,
    min_dec: float,
    max_dec: float,
    pixel_deg: float = DEFAULT_PIXEL_DEG,
) -> tuple[int, int]:
    """(width, height) in cells covering the extent at a fixed `pixel_deg`."""
    cell_ra, cell_dec = cell_sizes(min_dec, max_dec, pixel_deg)
    width = max(int(math.ceil(abs(max_ra - min_ra) / cell_ra)) + 1, 1)
    height = max(int(math.ceil(abs(max_dec - min_dec) / cell_dec)) + 1, 1)
    return width, height


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
    # Optional flux unit ("Jy" / "GCU" / None). Set when loading a `.img`
    # carrying the unit suffix, or when `make_image` is called from a
    # workspace whose calibration state is known. Propagates into the RPC's
    # ImageMeta so the React side can show "0.42 Jy" or "0.42 GCU" in the
    # readout instead of bare numbers.
    unit: str | None = None
    # Flux calibration applied directly to this image (independent of any
    # survey/scan workspace). Survey- and scan-built images carry their
    # calibration via the workspace; standalone images opened from `.img` /
    # `.fits` use these fields so the auto-apply effect can `revert` and
    # re-apply when the user loads a different `.cal` file.
    flux_calibrated: bool = False
    flux_slope: float | None = None


def apply_flux_calibration_image(image: GriddedImage, slope: float) -> GriddedImage:
    """Return a new image with pixels scaled by `slope` and unit set to "Jy".

    Idempotent: if the image is already flux-calibrated, returns it unchanged.
    Mirrors the survey/scan equivalents — the caller is expected to revert
    first if they want to re-calibrate with a different slope.
    """
    if image.flux_calibrated:
        return image
    if slope == 0.0:
        raise ValueError("flux calibration slope must be nonzero")
    return GriddedImage(
        pixels=image.pixels * slope,
        wcs=image.wcs,
        min_ra=image.min_ra,
        max_ra=image.max_ra,
        min_dec=image.min_dec,
        max_dec=image.max_dec,
        unit="Jy",
        flux_calibrated=True,
        flux_slope=float(slope),
    )


def revert_flux_calibration_image(image: GriddedImage) -> GriddedImage:
    """Undo a previously-applied flux calibration, returning flux to GCU."""
    if not image.flux_calibrated or image.flux_slope in (None, 0.0):
        return image
    slope = image.flux_slope
    assert slope is not None
    return GriddedImage(
        pixels=image.pixels / slope,
        wcs=image.wcs,
        min_ra=image.min_ra,
        max_ra=image.max_ra,
        min_dec=image.min_dec,
        max_dec=image.max_dec,
        unit="GCU",
        flux_calibrated=False,
        flux_slope=None,
    )


@dataclass(frozen=True)
class RgbGriddedImage:
    """A 3-channel image — what bi/tri-color composites produce.

    Each channel is a (height, width) float array in [0, 1] (normalized to its
    own channel min/max so a faint source still saturates that channel's color
    at the bright end — the legacy bi-color behavior). RA/Dec bounds match
    `GriddedImage` so the rendering side can re-use the same axis machinery.
    """

    pixels_r: NDArray[np.float64]
    pixels_g: NDArray[np.float64]
    pixels_b: NDArray[np.float64]
    wcs: WCSMetadata
    min_ra: float
    max_ra: float
    min_dec: float
    max_dec: float
    # Which channel carries no input ("r"/"g"/"b"), or None when all three are
    # populated. Recorded at compose time because it cannot be reliably
    # inferred from pixel values: a populated channel whose input is flat
    # normalizes to all-zeros, indistinguishable from the bi-color filler.
    unused_channel: str | None = None


def make_image(
    survey: Survey,
    pixel_deg: float = DEFAULT_PIXEL_DEG,
    width: int | None = None,
    height: int | None = None,
    fill: str = "interpolate",
) -> GriddedImage:
    """Build a (height, width) flux grid from a survey's sweeps.

    Two fill modes, mirroring the legacy app's two screens:

    - "interpolate" (default) — the legacy Make Image routine
      (vb/survform.frm:1651-1799). It does not just bin samples — it walks
      the region *between* adjacent sweeps and paints each cell with a
      linearly-interpolated flux, producing the smooth filled map. Three
      passes:

      1. Paint each sample's cell at the sample's flux.
      2. For every adjacent pair of sweeps, step finely through the
         overlapping declination range. At each step interpolate to find
         each sweep's (RA, flux) at that Dec, then paint a horizontal
         segment between the two sweeps' RA columns with
         linearly-interpolated flux.
      3. Average where multiple strip-fills cover the same cell.

    - "bars" — the legacy Pre-Image draw (vb/survform.frm:905-979). No
      inter-sweep interpolation: each sample paints one constant-flux
      horizontal bar at its declination, spanning the RA strip between the
      midpoints with the adjacent sweeps (edge sweeps extend to the survey
      bounds). This is the banded look of the legacy pre-image screen —
      interpolation only happens when the user commits Make Image.

    In "interpolate" mode cells outside any swept region remain 0 and render
    at the palette's anchor=0 stop (black); in "bars" mode they are NaN
    ("no data" — serialized as null and rendered as blank sky), so Align
    Sweeps visibly exposes the uncovered edges in the pre-image viewer.
    The grid is sized so each cell spans a fixed
    `pixel_deg` on-sky (default 1/20 of the beam) via `grid_dims`; explicit
    width/height overrides exist for tests and the FITS exporter.
    """
    if fill not in ("interpolate", "bars"):
        raise ValueError(f"fill must be 'interpolate' or 'bars', got {fill!r}")
    sweeps = [s for s in survey.sweeps if s.ra.size > 0]
    if not sweeps:
        pixels = np.zeros((height or 1, width or 1), dtype=np.float64)
        width = pixels.shape[1]
        height = pixels.shape[0]
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

    # FEAT-009: detect surveys whose RA samples straddle the 0h↔24h sidereal
    # boundary (e.g. Cassiopeia A, RA ~23h, observed across midnight). Naive
    # min/max would produce a 24h-wide grid with a huge empty middle band.
    # Algorithm: sort RA samples and find the largest gap, plus the wrap-gap
    # (last_sample → first_sample + 86400). If a middle gap is larger than
    # both the wrap gap and a 6h threshold, declare wrap and shift early-side
    # samples into a contiguous range that extends past 86400. The frontend
    # already mods RA back into [0, 86400) for tick labels and readouts
    # (ImagePlot.tsx formatRaSeconds), so the unwrapped storage values do not
    # leak to the user.
    cutoff: float | None = None
    if ra_all.size >= 2:
        ra_sorted = np.sort(ra_all)
        middle_gaps = np.diff(ra_sorted)
        wrap_gap = (float(ra_sorted[0]) + 86400.0) - float(ra_sorted[-1])
        max_middle_idx = int(np.argmax(middle_gaps))
        max_middle_gap = float(middle_gaps[max_middle_idx])
        if max_middle_gap > 21600.0 and max_middle_gap > wrap_gap:
            cutoff = float(ra_sorted[max_middle_idx])

    def unwrap_ra(ra: NDArray[np.float64]) -> NDArray[np.float64]:
        if cutoff is None:
            return ra
        return np.where(ra <= cutoff, ra + 86400.0, ra)

    ra_all = unwrap_ra(ra_all)
    min_ra, max_ra = float(np.min(ra_all)), float(np.max(ra_all))
    min_dec, max_dec = float(np.min(dec_all)), float(np.max(dec_all))
    ra_range = max(max_ra - min_ra, np.finfo(float).eps)
    dec_range = max(max_dec - min_dec, np.finfo(float).eps)

    # Size the grid so each cell spans a fixed `pixel_deg` on-sky, unless the
    # caller pinned width/height explicitly (tests / FITS export).
    auto_w, auto_h = grid_dims(min_ra, max_ra, min_dec, max_dec, pixel_deg)
    width = auto_w if width is None else width
    height = auto_h if height is None else height

    pixels = np.zeros((height, width), dtype=np.float64)
    counts = np.zeros((height, width), dtype=np.int64)

    def to_col(ra: NDArray[np.float64]) -> NDArray[np.int64]:
        # Column 0 corresponds to max_ra so the rendered image carries the
        # FITS-standard cdelt1 < 0 (RA decreases with sample index) advertised
        # by the WCS below. `unwrap_ra` is a no-op for non-wrapping surveys
        # and idempotent on already-unwrapped values, so callers can pass raw
        # sweep RA or pre-unwrapped interpolated RA either way.
        ra_uw = unwrap_ra(np.asarray(ra, dtype=np.float64))
        c = ((max_ra - ra_uw) / ra_range) * (width - 1)
        return np.clip(np.rint(c).astype(np.int64), 0, width - 1)

    def to_row(dec: NDArray[np.float64]) -> NDArray[np.int64]:
        r = ((np.asarray(dec, dtype=np.float64) - min_dec) / dec_range) * (height - 1)
        return np.clip(np.rint(r).astype(np.int64), 0, height - 1)

    if fill == "bars":
        # Legacy pre-image (vb/survform.frm:905-979): each sample paints a
        # constant-flux horizontal bar at its declination, spanning the RA
        # strip between the midpoints with the adjacent sweeps. Edge sweeps
        # extend to the survey bounds. The legacy uses per-sweep boundary
        # RAs from the sweep endpoints; the per-sweep mean is equivalent for
        # drawing constant vertical strips and is robust to scan direction.
        means = [float(np.mean(unwrap_ra(s.ra))) for s in sweeps]
        n = len(sweeps)
        ascending = n == 1 or means[0] <= means[-1]
        for i, s in enumerate(sweeps):
            if i == 0:
                edge_a = min_ra if ascending else max_ra
            else:
                edge_a = (means[i - 1] + means[i]) / 2.0
            if i == n - 1:
                edge_b = max_ra if ascending else min_ra
            else:
                edge_b = (means[i] + means[i + 1]) / 2.0
            ca, cb = (int(c) for c in to_col(np.array([edge_a, edge_b])))
            c_lo, c_hi = (ca, cb) if ca <= cb else (cb, ca)
            # Each sample owns the band of rows out to the dec midpoints with
            # its neighbouring samples (nearest-sample fill). The legacy drew
            # every bar a fixed 30 twips tall on its fixed-size canvas, which
            # overlapped adjacent samples' bars — painting only the sample's
            # own row here would leave zero-flux gaps whenever the sweep's
            # dec spacing is coarser than a grid row.
            order = np.argsort(s.dec)
            dec_s = s.dec[order]
            flux_s = s.flux[order]
            m = dec_s.size
            lo_edges = np.empty(m, dtype=np.float64)
            hi_edges = np.empty(m, dtype=np.float64)
            lo_edges[0] = dec_s[0]
            lo_edges[1:] = (dec_s[:-1] + dec_s[1:]) / 2.0
            hi_edges[:-1] = lo_edges[1:]
            hi_edges[-1] = dec_s[-1]
            r_lo = to_row(lo_edges)
            r_hi = to_row(hi_edges)
            # Adjacent bands and strips share their boundary row/column; the
            # accumulator averages there (the legacy let the later draw
            # overwrite — visually indistinguishable at one cell wide).
            for j in range(m):
                a, b = int(r_lo[j]), int(r_hi[j])
                if a > b:
                    a, b = b, a
                pixels[a : b + 1, c_lo : c_hi + 1] += flux_s[j]
                counts[a : b + 1, c_lo : c_hi + 1] += 1
    else:
        # 1) Paint sample cells. Each sample contributes its flux to the cell
        # it falls in; duplicate samples in the same cell average via the
        # counts accumulator below.
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
            # Unwrap the per-sweep RA arrays before interp — a single sweep
            # that crosses the wrap point would otherwise interpolate across
            # the 86400 → 0 jump and emit garbage.
            dec1, ra1, f1 = s1.dec[o1], unwrap_ra(s1.ra[o1]), s1.flux[o1]
            dec2, ra2, f2 = s2.dec[o2], unwrap_ra(s2.ra[o2]), s2.flux[o2]
            dec_lo = max(float(dec1[0]), float(dec2[0]))
            dec_hi = min(float(dec1[-1]), float(dec2[-1]))
            if dec_hi <= dec_lo:
                continue
            # ~3 dec-steps per output row keeps the strip dense enough that
            # the fill is continuous after row rounding. Below the legacy's
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

    if fill == "bars":
        # Uncovered cells are "no data", not zero flux — zero is a legitimate
        # value after baseline subtraction. NaN serializes to `null` over RPC
        # and Plotly leaves those cells transparent, so the pre-image
        # background reads as blank sky. Visible after Align Sweeps shifts
        # sweeps in dec and exposes the grid edges. The committed image
        # (interpolate mode) keeps 0 so save/append/palette behavior is
        # unchanged.
        pixels[counts == 0] = np.nan

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
