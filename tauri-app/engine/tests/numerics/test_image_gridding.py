import numpy as np

from radio_cartographer.image import make_image
from radio_cartographer.io.srv import read_srv


def test_makeimage_default_parameters_match_legacy(intermediates_dir) -> None:
    survey = read_srv(intermediates_dir / "and0a.srv")
    grid = make_image(survey, pix=1)
    assert grid.pixels.shape == (319, 399)


def test_makeimage_pixel_scale_inverts_correctly(intermediates_dir) -> None:
    survey = read_srv(intermediates_dir / "and0a.srv")
    grid = make_image(survey, pix=1)
    assert grid.wcs.ctype1 == "RA---TAN"
    assert grid.wcs.ctype2 == "DEC--TAN"
    assert np.isfinite(grid.wcs.cdelt1)
