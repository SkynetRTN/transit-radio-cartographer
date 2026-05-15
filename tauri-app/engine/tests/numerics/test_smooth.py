import numpy as np
from radio_cartographer.models import Scan
from radio_cartographer.scan import smooth_flux
from .._tolerances import SMOOTH_ATOL

def test_smooth_impulse_spreads_energy():
    n=31;x=np.arange(n,dtype=float);flux=np.zeros(n);flux[n//2]=1
    s=Scan('n','a','',0,1,0,1,np.zeros(n,int),x,x,flux)
    out=smooth_flux(s,5)
    expected=np.convolve(flux,np.ones(5)/5,mode='same')
    assert np.allclose(out.flux,expected,atol=SMOOTH_ATOL)
