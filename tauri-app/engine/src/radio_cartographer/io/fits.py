from __future__ import annotations

from pathlib import Path

import numpy as np

from ..image import GriddedImage


def write_fits(image: GriddedImage, path: str | Path) -> None:
    """Write a gridded image to a FITS primary HDU with celestial WCS.

    Notes:
    - numpy arrays are 0-indexed, but FITS WCS CRPIX keywords are 1-indexed.
    - Phase 2 already stores FITS-style reference pixels in `image.wcs.crpix*`.
    """
    from astropy.io import fits
    from astropy.wcs import WCS

    w = WCS(naxis=2)
    w.wcs.ctype = [image.wcs.ctype1, image.wcs.ctype2]
    w.wcs.crval = [float(image.wcs.crval1), float(image.wcs.crval2)]
    w.wcs.crpix = [float(image.wcs.crpix1), float(image.wcs.crpix2)]
    w.wcs.cdelt = [float(image.wcs.cdelt1), float(image.wcs.cdelt2)]

    data = np.asarray(image.pixels, dtype=np.float32)
    hdu = fits.PrimaryHDU(data=data, header=w.to_header())
    hdu.writeto(Path(path), overwrite=True, output_verify="exception")
