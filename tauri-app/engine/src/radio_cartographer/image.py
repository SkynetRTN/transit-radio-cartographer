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


def make_image(survey: Survey, pix: int = 1, width: int = 399, height: int = 319) -> GriddedImage:
    ra = np.concatenate([s.ra for s in survey.sweeps])
    dec = np.concatenate([s.dec for s in survey.sweeps])
    flux = np.concatenate([s.flux for s in survey.sweeps])
    min_ra, max_ra = float(np.min(ra)), float(np.max(ra))
    min_dec, max_dec = float(np.min(dec)), float(np.max(dec))
    xedges = np.linspace(min_ra, max_ra, width + 1)
    yedges = np.linspace(min_dec, max_dec, height + 1)
    weighted, _, _ = np.histogram2d(dec, ra, bins=(yedges, xedges), weights=flux)
    counts, _, _ = np.histogram2d(dec, ra, bins=(yedges, xedges))
    pixels = np.divide(weighted, counts, out=np.zeros_like(weighted), where=counts > 0)
    # Flip the RA axis so column 0 is at `max_ra` — matches the FITS-standard
    # `cdelt1 < 0` (RA decreasing with sample index) the WCS below advertises.
    pixels = pixels[:, ::-1]
    cdelt1 = -((max_ra - min_ra) / max(width - 1, 1))
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
        pixels=pixels, wcs=wcs, min_ra=min_ra, max_ra=max_ra, min_dec=min_dec, max_dec=max_dec
    )
