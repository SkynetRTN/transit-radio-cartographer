"""Round-trip tests for the new FITS codec."""

from __future__ import annotations

import numpy as np
import pytest
from astropy.io import fits

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


def test_fits_roundtrip_survey_seconds_of_time_wcs(tmp_path):
    # Regression for bug #28: make_image builds WCS with the RA axis in
    # SECONDS OF TIME (cdelt1 ≈ -17 s/px for the default 0.06° pixel).
    # write_fits must emit standard degrees (else DS9 misreads the header and
    # read_fits's own BUG-009 validation rejects the file), and read_fits must
    # convert back into seconds of time.
    h, w = 6, 8
    wcs = WCSMetadata(
        ctype1="RA---TAN",
        ctype2="DEC--TAN",
        crval1=4000.0,  # seconds of time
        crval2=35.0,
        crpix1=(w + 1) / 2.0,
        crpix2=(h + 1) / 2.0,
        cdelt1=-17.0,  # seconds of time per pixel
        cdelt2=0.06,
    )
    ra_a = wcs.crval1 + (1 - wcs.crpix1) * wcs.cdelt1
    ra_b = wcs.crval1 + (w - wcs.crpix1) * wcs.cdelt1
    dec_a = wcs.crval2 + (1 - wcs.crpix2) * wcs.cdelt2
    dec_b = wcs.crval2 + (h - wcs.crpix2) * wcs.cdelt2
    img = GriddedImage(
        pixels=np.ones((h, w), dtype=np.float64),
        wcs=wcs,
        min_ra=min(ra_a, ra_b),
        max_ra=max(ra_a, ra_b),
        min_dec=min(dec_a, dec_b),
        max_dec=max(dec_a, dec_b),
    )
    fp = tmp_path / "survey.fits"
    write_fits(img, fp)
    with fits.open(str(fp)) as hdul:
        header = hdul[0].header
        assert header["CDELT1"] == pytest.approx(-17.0 / 240.0)
        assert header["CRVAL1"] == pytest.approx(4000.0 / 240.0)
    back = read_fits(fp)
    assert back.wcs.cdelt1 == pytest.approx(-17.0)
    assert back.wcs.crval1 == pytest.approx(4000.0)
    assert back.min_ra == pytest.approx(img.min_ra)
    assert back.max_ra == pytest.approx(img.max_ra)
    assert back.min_dec == pytest.approx(img.min_dec)


def test_fits_reads_cas_a_fixture():
    # The CAS-A fixture has NaN sentinels in off-survey cells. read_fits must
    # silently convert them to 0 so downstream rendering doesn't see NaN.
    gridded = read_fits("C:\\Users\\leesnow\\skynet2\\ogrc\\fixtures\\inputs\\CAS-A_RC_Job_7963_0007654.fits")
    assert gridded.pixels.ndim == 2
    assert np.isfinite(gridded.pixels).all()
    assert np.isfinite(gridded.min_ra) and np.isfinite(gridded.max_ra)


# ── WCS validation (BUG-009) ─────────────────────────────────────────────────


def _write_fits(tmp_path, *, data=None, **header_overrides):
    """Build a tiny synthetic FITS file with the given WCS header overrides."""
    if data is None:
        data = np.ones((8, 10), dtype=np.float32)
    hdu = fits.PrimaryHDU(data=data)
    h = hdu.header
    h["CTYPE1"] = "RA---TAN"
    h["CTYPE2"] = "DEC--TAN"
    h["CRVAL1"] = 100.0
    h["CRVAL2"] = 20.0
    h["CRPIX1"] = (data.shape[1] + 1) / 2.0
    h["CRPIX2"] = (data.shape[0] + 1) / 2.0
    h["CDELT1"] = -0.01
    h["CDELT2"] = 0.01
    for k, v in header_overrides.items():
        h[k] = v
    path = tmp_path / "bad.fits"
    hdu.writeto(path, overwrite=True)
    return path


def test_read_fits_rejects_zero_cdelt(tmp_path):
    path = _write_fits(tmp_path, CDELT1=0.0)
    with pytest.raises(ValueError, match="CDELT.*non-zero"):
        read_fits(path)


def test_read_fits_rejects_huge_cdelt(tmp_path):
    path = _write_fits(tmp_path, CDELT1=50.0)
    with pytest.raises(ValueError, match="CDELT.*10 deg/pixel"):
        read_fits(path)


def test_read_fits_rejects_out_of_range_dec(tmp_path):
    # CRVAL2 in the celestial-pole region pushes computed Dec bounds past 90°.
    path = _write_fits(tmp_path, CRVAL2=200.0)
    with pytest.raises(ValueError, match="Dec bounds out of range"):
        read_fits(path)
