from __future__ import annotations

import numpy as np

from .models import Image, Palette, Survey


def grid_survey(survey: Survey, *, width: int = 399, height: int = 319, pix: int = 1, palette: Palette | None = None) -> Image:
    palette = palette if palette is not None else Palette(stops=tuple())
    all_ra = np.concatenate([s.ra for s in survey.sweeps])
    all_dec = np.concatenate([s.dec for s in survey.sweeps])
    all_flux = np.concatenate([s.flux for s in survey.sweeps])
    min_ra, max_ra = float(all_ra.min()), float(all_ra.max())
    min_dec, max_dec = float(all_dec.min()), float(all_dec.max())
    min_flux, max_flux = float(all_flux.min()), float(all_flux.max())
    x = np.clip(((all_ra - min_ra) / max(max_ra - min_ra, 1e-12) * (width - 1)).astype(int), 0, width - 1)
    y = np.clip(((all_dec - min_dec) / max(max_dec - min_dec, 1e-12) * (height - 1)).astype(int), 0, height - 1)
    acc = np.zeros((height, width), dtype=np.float64)
    cnt = np.zeros((height, width), dtype=np.int32)
    np.add.at(acc, (y, x), all_flux)
    np.add.at(cnt, (y, x), 1)
    img = np.where(cnt > 0, acc / cnt, min_flux)
    pixels = np.clip(np.rint(img), -32768, 32767).astype(np.int16)
    wcs = derive_wcs(min_ra, max_ra, min_dec, max_dec, width, height)
    return Image("", min_ra, max_ra, min_dec, max_dec, min_flux, max_flux, min_ra, max_ra, min_dec, max_dec, min_flux, max_flux, pix, palette, pixels, raw_bytes=None, wcs=wcs)


def derive_wcs(min_ra: float, max_ra: float, min_dec: float, max_dec: float, width: int, height: int) -> dict[str, float | str]:
    return {
        "CTYPE1": "RA---TAN",
        "CTYPE2": "DEC--TAN",
        "CRVAL1": (min_ra + max_ra) / 2.0,
        "CRVAL2": (min_dec + max_dec) / 2.0,
        "CRPIX1": width / 2.0 + 0.5,
        "CRPIX2": height / 2.0 + 0.5,
        "CDELT1": -((max_ra - min_ra) / max(width - 1, 1)),
        "CDELT2": (max_dec - min_dec) / max(height - 1, 1),
    }
