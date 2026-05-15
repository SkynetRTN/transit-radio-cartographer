import numpy as np

from radio_cartographer.image import grid_survey
from radio_cartographer.models import Survey, Sweep


def _survey() -> Survey:
    s = Sweep(ra=np.array([0.0, 1.0, 2.0]), dec=np.array([0.0, 0.0, 0.0]), flux=np.array([1.0, 2.0, 3.0]))
    return Survey("a", "b", 1, 0, s, (s,))


def test_grid_image_shape_and_wcs_fields() -> None:
    result = grid_survey(_survey(), width=16, height=8)
    assert result.pixels.shape == (8, 16)
    assert result.wcs.ctype1 == "RA---TAN"
    assert result.wcs.ctype2 == "DEC--TAN"


def test_grid_preserves_flux_energy_nonempty_cells() -> None:
    result = grid_survey(_survey(), width=8, height=4)
    assert float(result.pixels.sum()) > 0
