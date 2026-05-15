import numpy as np
from radio_cartographer.models import Scan
from radio_cartographer.scan import fft_flux
from .._legacy.four1 import four1_real
from .._tolerances import FFT_ATOL

def _scan(flux):
    n=len(flux)
    x=np.arange(n,dtype=float)
    return Scan('n','a','',0,1,float(np.min(flux)),float(np.max(flux)),np.zeros(n,int),x,x,np.array(flux,float))

def test_fft_matches_legacy_four1_oracle():
    s=_scan(np.sin(np.linspace(0,2*np.pi,64,endpoint=False)))
    assert np.allclose(fft_flux(s), four1_real(s.flux), atol=FFT_ATOL)
