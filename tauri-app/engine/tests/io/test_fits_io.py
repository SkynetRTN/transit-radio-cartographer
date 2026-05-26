"""Round-trip tests for the new FITS codec."""

from __future__ import annotations

import numpy as np
import pytest

from radio_cartographer.image import GriddedImage, WCSMetadata
from radio_cartographer.io.fits import read_fits, write_fits


def _make_gridded(h=8, w=10) -> GriddedImage:
    pixels = np.arange(h * w, dtype=np.float64).reshape(h, w) * 0.1
    wcs = WCSMetadata(
        ctype1="RA---TAN",
        ctype2="DEC--TAN",
        crval1=100.0,
        crval2=20.0,
        crpix1=(w + 1) / 2.0,
        crpix2=(h + 1) / 2.0,
        cdelt1=-0.01,
        cdelt2=0.01,
    )
    min_ra = wcs.crval1 + (1 - wcs.crpix1) * wcs.cdelt1
    max_ra = wcs.crval1 + (w - wcs.crpix1) * wcs.cdelt1
    min_dec = wcs.crval2 + (1 - wcs.crpix2) * wcs.cdelt2
    max_dec = wcs.crval2 + (h - wcs.crpix2) * wcs.cdelt2
    return GriddedImage(
        pixels=pixels,
        wcs=wcs,
        min_ra=min(min_ra, max_ra),
        max_ra=max(min_ra, max_ra),
        min_dec=min(min_dec, max_dec),
        max_dec=max(min_dec, max_dec),
    )


def test_fits_roundtrip(tmp_path):
    img = _make_gridded()
    fp = tmp_path / "round.fits"
    write_fits(img, fp, name="round", pix=2)
    back = read_fits(fp)
    assert back.pixels.shape == img.pixels.shape
    np.testing.assert_allclose(back.pixels, img.pixels, atol=1e-5)
    assert back.wcs.cdelt1 == pytest.approx(img.wcs.cdelt1)
    assert back.wcs.cdelt2 == pytest.approx(img.wcs.cdelt2)
    assert back.min_ra == pytest.approx(img.min_ra, rel=1e-9, abs=1e-9)
    assert back.max_dec == pytest.approx(img.max_dec, rel=1e-9, abs=1e-9)


def test_fits_reads_cas_a_fixture():
    # The CAS-A fixture has NaN sentinels in off-survey cells. read_fits must
    # silently convert them to 0 so downstream rendering doesn't see NaN.
    gridded = read_fits("C:\\Users\\leesnow\\skynet2\\ogrc\\fixtures\\inputs\\CAS-A_RC_Job_7963_0007654.fits")
    assert gridded.pixels.ndim == 2
    assert np.isfinite(gridded.pixels).all()
    assert np.isfinite(gridded.min_ra) and np.isfinite(gridded.max_ra)
