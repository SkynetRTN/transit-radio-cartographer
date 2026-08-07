"""FITS codec — reads/writes a `GriddedImage` to a single-HDU FITS file.

The legacy `.img` format is VB-specific. FITS is the astronomy standard, so a
saved survey image can be opened in DS9/aladin/etc. Convention:

- `NAXIS1` = width (RA columns); `NAXIS2` = height (Dec rows).
- Data array is `float32` (good enough for survey flux; downstream Plotly
  rendering takes float anyway).
- WCS: `CRVAL1/2` = center RA/Dec, `CDELT1/2` = per-pixel step (CDELT1 < 0 so
  RA decreases with column — matches `make_image`'s grid orientation).
- Extra `RC_NAME` / `RC_PIX` cards carry the legacy fields so a round-trip via
  FITS preserves the image name and pixel resolution.

Unit boundary: the app stores RA internally in SECONDS OF TIME (240 s/deg —
see image._SEC_PER_DEG_RA), but the FITS standard defines the RA axis of a
`RA---TAN` WCS in DEGREES. The RA-axis quantities (CRVAL1, CDELT1, and the
derived bounds) are therefore divided by 240 on write and multiplied by 240
on read, so exported files are standard-compliant (DS9/aladin read them
correctly) and externally-produced FITS land in the internal convention.
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
from astropy.io import fits

from ..image import GriddedImage, WCSMetadata

# RA seconds-of-time per degree (15°/hour). Mirrors image._SEC_PER_DEG_RA.
_SEC_PER_DEG_RA = 240.0


def read_fits(path: str | Path) -> GriddedImage:
    with fits.open(str(path)) as hdul:
        hdu = _primary_data_hdu(hdul)
        data = np.asarray(hdu.data, dtype=np.float64)
        if data.ndim != 2:
            raise ValueError(
                f".fits primary HDU must be 2-D, got shape {data.shape}"
            )
        # FITS files commonly use NaN for "no data here" (off-survey edges).
        # Replace with 0 so downstream rendering (Plotly heatmap, palette
        # interpolation) doesn't have to special-case it. The palette's
        # `anchor=0` stop is conventionally black, matching the "outside the
        # swept region" look of legacy `.img` files.
        data = np.nan_to_num(data, nan=0.0, posinf=0.0, neginf=0.0)
        header = hdu.header

    height, width = data.shape
    crval1 = float(header.get("CRVAL1", 0.0))
    crval2 = float(header.get("CRVAL2", 0.0))
    crpix1 = float(header.get("CRPIX1", (width + 1) / 2.0))
    crpix2 = float(header.get("CRPIX2", (height + 1) / 2.0))
    cdelt1 = float(header.get("CDELT1", -1.0))
    cdelt2 = float(header.get("CDELT2", 1.0))
    ctype1 = str(header.get("CTYPE1", "RA---TAN"))
    ctype2 = str(header.get("CTYPE2", "DEC--TAN"))

    # WCS sanity checks — fail loud on obviously broken headers so the
    # downstream compose math can't run away (BUG-009).
    for name, val in (
        ("CRVAL1", crval1),
        ("CRVAL2", crval2),
        ("CRPIX1", crpix1),
        ("CRPIX2", crpix2),
        ("CDELT1", cdelt1),
        ("CDELT2", cdelt2),
    ):
        if not np.isfinite(val):
            raise ValueError(f".fits WCS field {name} is not finite: {val!r}")
    if cdelt1 == 0.0 or cdelt2 == 0.0:
        raise ValueError(
            f".fits WCS CDELT must be non-zero, got CDELT1={cdelt1}, CDELT2={cdelt2}"
        )
    # 10 deg/pixel is already absurd for sky imaging; anything larger is a
    # unit error (e.g. radians written into a CDELT-in-degrees slot).
    if abs(cdelt1) > 10.0 or abs(cdelt2) > 10.0:
        raise ValueError(
            f".fits WCS CDELT exceeds 10 deg/pixel (likely a unit error): "
            f"CDELT1={cdelt1}, CDELT2={cdelt2}"
        )

    # World coordinates at the four corners (1-based FITS pixel convention).
    ra_at_col0 = crval1 + (1 - crpix1) * cdelt1
    ra_at_colN = crval1 + (width - crpix1) * cdelt1
    dec_at_row0 = crval2 + (1 - crpix2) * cdelt2
    dec_at_rowN = crval2 + (height - crpix2) * cdelt2
    min_ra = float(min(ra_at_col0, ra_at_colN))
    max_ra = float(max(ra_at_col0, ra_at_colN))
    min_dec = float(min(dec_at_row0, dec_at_rowN))
    max_dec = float(max(dec_at_row0, dec_at_rowN))

    # RA gets a grace window for wraparound (a footprint straddling 0/360);
    # Dec is strict — outside [-90, 90] is meaningless on the celestial sphere.
    if not (-360.0 <= min_ra <= max_ra <= 720.0):
        raise ValueError(
            f".fits WCS RA bounds out of range: [{min_ra}, {max_ra}] "
            f"(expected within [-360, 720] after corner math)"
        )
    if not (-90.0 <= min_dec <= max_dec <= 90.0):
        raise ValueError(
            f".fits WCS Dec bounds out of range: [{min_dec}, {max_dec}] "
            f"(expected within [-90, 90])"
        )

    # Header RA is degrees (FITS standard); the app works in seconds of time.
    wcs = WCSMetadata(
        ctype1=ctype1,
        ctype2=ctype2,
        crval1=crval1 * _SEC_PER_DEG_RA,
        crval2=crval2,
        crpix1=crpix1,
        crpix2=crpix2,
        cdelt1=cdelt1 * _SEC_PER_DEG_RA,
        cdelt2=cdelt2,
    )
    return GriddedImage(
        pixels=data,
        wcs=wcs,
        min_ra=min_ra * _SEC_PER_DEG_RA,
        max_ra=max_ra * _SEC_PER_DEG_RA,
        min_dec=min_dec,
        max_dec=max_dec,
    )


def write_fits(image: GriddedImage, path: str | Path, *, name: str | None = None, pix: int | None = None) -> None:
    hdu = fits.PrimaryHDU(data=np.asarray(image.pixels, dtype=np.float32))
    h = hdu.header
    h["CTYPE1"] = image.wcs.ctype1
    h["CTYPE2"] = image.wcs.ctype2
    # Internal RA is seconds of time; the FITS RA axis is degrees.
    h["CRVAL1"] = image.wcs.crval1 / _SEC_PER_DEG_RA
    h["CRVAL2"] = image.wcs.crval2
    h["CRPIX1"] = image.wcs.crpix1
    h["CRPIX2"] = image.wcs.crpix2
    h["CDELT1"] = image.wcs.cdelt1 / _SEC_PER_DEG_RA
    h["CDELT2"] = image.wcs.cdelt2
    h["BUNIT"] = "FLUX"
    if name is not None:
        h["RC_NAME"] = name[:68]
    if pix is not None:
        h["RC_PIX"] = int(pix)
    hdu.writeto(str(path), overwrite=True)


def _primary_data_hdu(hdul: fits.HDUList):
    """Return the first HDU that actually contains image data.

    Some FITS files (HEASARC outputs, multi-extension survey products) leave
    the PrimaryHDU empty and put the image in HDU 1+.
    """
    for hdu in hdul:
        if hdu.data is not None and getattr(hdu.data, "ndim", 0) >= 2:
            return hdu
    raise ValueError(".fits file has no 2-D image HDU")
