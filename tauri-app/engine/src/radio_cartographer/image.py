from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

from radio_cartographer.models import Survey


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


def grid_survey(survey: Survey, width: int = 128, height: int = 128) -> GriddedImage:
    ra = np.concatenate([s.ra for s in survey.sweeps])
    dec = np.concatenate([s.dec for s in survey.sweeps])
    flux = np.concatenate([s.flux for s in survey.sweeps])

    ra_min, ra_max = float(np.min(ra)), float(np.max(ra))
    dec_min, dec_max = float(np.min(dec)), float(np.max(dec))

    grid, _, _ = np.histogram2d(dec, ra, bins=(height, width), range=((dec_min, dec_max), (ra_min, ra_max)), weights=flux)
    hits, _, _ = np.histogram2d(dec, ra, bins=(height, width), range=((dec_min, dec_max), (ra_min, ra_max)))
    with np.errstate(invalid="ignore", divide="ignore"):
        pixels = np.where(hits > 0, grid / hits, 0.0)

    wcs = WCSMetadata(
        ctype1="RA---TAN",
        ctype2="DEC--TAN",
        crval1=(ra_min + ra_max) / 2.0,
        crval2=(dec_min + dec_max) / 2.0,
        crpix1=(width + 1) / 2.0,
        crpix2=(height + 1) / 2.0,
        cdelt1=-(ra_max - ra_min) / max(width - 1, 1),
        cdelt2=(dec_max - dec_min) / max(height - 1, 1),
    )
    return GriddedImage(pixels=pixels, wcs=wcs)
