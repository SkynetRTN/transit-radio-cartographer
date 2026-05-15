import numpy as np
from radio_cartographer.models import Scan
from radio_cartographer.scan import baseline_subtract
from .._tolerances import BASELINE_ATOL

def test_baseline_removes_linear_trend():
    n=64;x=np.arange(n,dtype=float);flux=2*x+5
    s=Scan('n','a','',0,1,0,1,np.zeros(n,int),x,x,flux)
    out=baseline_subtract(s,1)
    assert np.allclose(out.flux,0,atol=BASELINE_ATOL)
