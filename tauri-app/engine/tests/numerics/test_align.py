import numpy as np
from radio_cartographer.models import Scan
from radio_cartographer.scan import align_dec
from .._tolerances import ALIGN_ATOL

def test_align_offsets_declination():
    x=np.arange(5,dtype=float);dec=np.linspace(-1,1,5)
    s=Scan('n','a','',-1,1,0,1,np.zeros(5,int),x,dec,np.ones(5))
    out=align_dec(s,0.5)
    assert np.allclose(out.dec,dec+0.5,atol=ALIGN_ATOL)
