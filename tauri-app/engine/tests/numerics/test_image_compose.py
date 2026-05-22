"""Append + superimpose: composition rules and overlap math."""

from __future__ import annotations

import numpy as np

from radio_cartographer.image import GriddedImage, WCSMetadata
from radio_cartographer.image_compose import append_images, superimpose_images


def _make(width: int, height: int, min_ra: float, max_ra: float, min_dec: float, max_dec: float, fill: float) -> GriddedImage:
    pixels = np.full((height, width), fill, dtype=np.float64)
    cdelt1 = -(max_ra - min_ra) / max(width - 1, 1)
    cdelt2 = (max_dec - min_dec) / max(height - 1, 1)
    wcs = WCSMetadata(
        ctype1="RA---TAN",
        ctype2="DEC--TAN",
        crval1=(min_ra + max_ra) / 2,
        crval2=(min_dec + max_dec) / 2,
        crpix1=(width + 1) / 2,
        crpix2=(height + 1) / 2,
        cdelt1=cdelt1,
        cdelt2=cdelt2,
    )
    return GriddedImage(pixels=pixels, wcs=wcs, min_ra=min_ra, max_ra=max_ra, min_dec=min_dec, max_dec=max_dec)


def test_append_disjoint_keeps_each_image_in_its_own_footprint():
    a = _make(11, 11, 0.0, 10.0, 0.0, 10.0, fill=1.0)
    b = _make(11, 11, 20.0, 30.0, 0.0, 10.0, fill=2.0)
    out = append_images(a, b)
    # The union spans 0..30; we should see both fills somewhere.
    assert (out.pixels == 1.0).any()
    assert (out.pixels == 2.0).any()


def test_append_overlap_uses_max():
    a = _make(11, 11, 0.0, 10.0, 0.0, 10.0, fill=1.0)
    b = _make(11, 11, 5.0, 15.0, 0.0, 10.0, fill=3.0)
    out = append_images(a, b)
    # Some overlap cell must contain 3.0 (the max).
    assert out.pixels.max() == 3.0
    # Cells covered only by `a` keep 1.0.
    assert (out.pixels == 1.0).any()


def test_superimpose_overlap_uses_weighted_average():
    a = _make(11, 11, 0.0, 10.0, 0.0, 10.0, fill=2.0)
    b = _make(11, 11, 5.0, 15.0, 0.0, 10.0, fill=6.0)
    out = superimpose_images(a, b, weight=0.5)
    # Overlap cells should be 0.5*2 + 0.5*6 = 4.0.
    assert np.any(np.isclose(out.pixels, 4.0))
    # Cells covered only by one image keep that image's fill.
    assert (out.pixels == 2.0).any()
    assert (out.pixels == 6.0).any()


def test_shift_translates_secondary_footprint():
    a = _make(11, 11, 0.0, 10.0, 0.0, 10.0, fill=1.0)
    b = _make(11, 11, 0.0, 10.0, 0.0, 10.0, fill=5.0)
    out = append_images(a, b, ra_shift_seconds=20.0)
    # After +20 shift in RA, b occupies 20..30; union spans 0..30; both fills present.
    assert out.min_ra <= 0.0 and out.max_ra >= 30.0
    assert (out.pixels == 1.0).any()
    assert (out.pixels == 5.0).any()
