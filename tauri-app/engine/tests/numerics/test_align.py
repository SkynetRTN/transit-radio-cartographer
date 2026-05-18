import numpy as np
from radio_cartographer.scan import align_by_offset
from tests._tolerances import ALIGN_ATOL


def test_align_with_zero_offset_is_noop() -> None:
    dec = np.linspace(0, 10, 200)
    flux = np.sin(dec)
    y = align_by_offset(dec, flux, offset=0.0)
    assert np.allclose(y, flux, atol=ALIGN_ATOL)


def test_align_corrects_known_shift() -> None:
    dec = np.linspace(0, 10, 200)
    flux = np.sin(dec)
    shifted = np.interp(dec, dec - 0.5, flux, left=flux[0], right=flux[-1])
    fixed = align_by_offset(dec, shifted, offset=0.5)
    assert np.allclose(fixed[10:-10], flux[10:-10], atol=1e-1)
