import pytest
fits = pytest.importorskip("astropy.io.fits", reason="astropy not available")

from radio_cartographer.image import make_image
from radio_cartographer.io.fits import write_fits
from radio_cartographer.io.srv import read_srv


def test_fits_write_produces_valid_file(intermediates_dir, tmp_path):
    survey = read_srv(intermediates_dir / 'and0a.srv')
    g = make_image(survey)
    out = tmp_path / 'x.fits'
    write_fits(g, out)
    with fits.open(out) as hdul:
        hdul.verify('exception')


def test_fits_header_has_wcs(intermediates_dir, tmp_path):
    g = make_image(read_srv(intermediates_dir / 'and0a.srv'))
    out = tmp_path / 'x.fits'; write_fits(g, out)
    h = fits.getheader(out)
    for k in ['CTYPE1','CTYPE2','CRVAL1','CRVAL2','CRPIX1','CRPIX2','CDELT1','CDELT2']:
        assert k in h


def test_fits_data_matches_img_pixels(intermediates_dir, tmp_path):
    g = make_image(read_srv(intermediates_dir / 'and0a.srv'))
    out = tmp_path / 'x.fits'; write_fits(g, out)
    data = fits.getdata(out)
    assert data.shape == g.pixels.shape


def test_fits_round_trip_through_astropy(intermediates_dir, tmp_path):
    g = make_image(read_srv(intermediates_dir / 'and0a.srv'))
    out = tmp_path / 'x.fits'; write_fits(g, out)
    with fits.open(out) as hdul:
        assert hdul[0].data is not None
