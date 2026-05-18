import pytest
fits = pytest.importorskip("astropy.io.fits", reason="astropy not available")

from radio_cartographer.io.fits import write_fits
from radio_cartographer.survey import run_tutorial_survey_pipeline


def test_tutorial_pipeline_fits_export(inputs_dir, tmp_path):
    _survey, img = run_tutorial_survey_pipeline(inputs_dir / 'and0a.md2', inputs_dir / 'cal25a.cal', align_offset=0.5, image_pix=1)
    out = tmp_path / 'tutorial.fits'
    write_fits(img, out)
    with fits.open(out) as hdul:
        hdul.verify('exception')
        data = hdul[0].data
        hdr = hdul[0].header
    assert data.shape == img.pixels.shape
    for k in ['CTYPE1','CTYPE2','CRVAL1','CRVAL2','CRPIX1','CRPIX2','CDELT1','CDELT2']:
        assert k in hdr
