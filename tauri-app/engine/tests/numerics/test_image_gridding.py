import numpy as np
from radio_cartographer.image import grid_survey
from radio_cartographer.models import Survey,Sweep

def test_image_gridding_emits_pixels_and_wcs():
    s=Sweep(ra=np.array([0.,1.,0.,1.]),dec=np.array([0.,0.,1.,1.]),flux=np.array([1.,2.,3.,4.]))
    survey=Survey('a','b',1,0,s,(s,))
    img=grid_survey(survey,width=4,height=4)
    assert img.pixels.shape==(4,4)
    for key in ('CTYPE1','CTYPE2','CRVAL1','CRVAL2','CRPIX1','CRPIX2','CDELT1','CDELT2'):
        assert key in img.wcs
