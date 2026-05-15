from radio_cartographer.models import CalibrationEntry, CalibrationTable
from radio_cartographer.calibration import fit_gain
from .._tolerances import CAL_ATOL

def test_fit_gain_linear_relation():
    t=CalibrationTable('c','','',3,6,(CalibrationEntry('a',1,2),CalibrationEntry('b',2,4),CalibrationEntry('c',3,6)))
    g=fit_gain(t)
    assert abs(g-2.0)<=CAL_ATOL
