import numpy as np

from radio_cartographer.scan import align_flux
from tests._tolerances import ALIGN_ATOL


def test_align_with_zero_offset_is_noop() -> None:
    x = np.random.default_rng(2).normal(size=64)
    np.testing.assert_allclose(align_flux(x, 0.0), x, atol=ALIGN_ATOL)


def test_align_corrects_known_shift() -> None:
    x = np.zeros(64)
    x[20] = 1.0
    shifted = align_flux(x, 3.0)
    recovered = align_flux(shifted, -3.0)
    np.testing.assert_allclose(recovered, x, atol=1e-2)
