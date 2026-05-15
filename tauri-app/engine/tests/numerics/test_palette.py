import numpy as np

from radio_cartographer.models import Palette, PaletteStop
from radio_cartographer.palette import apply_palette


def _palette() -> Palette:
    return Palette((PaletteStop(0, 0, 0, 0), PaletteStop(255, 255, 255, 255)))


def test_palette_maps_flux_to_rgb() -> None:
    values = np.array([0.0, 5.0, 10.0])
    rgb = apply_palette(values, _palette(), 0.0, 10.0)
    assert tuple(rgb[0]) == (0, 0, 0)
    assert tuple(rgb[-1]) == (255, 255, 255)


def test_palette_clamps_outside_flux_range() -> None:
    values = np.array([-1.0, 11.0])
    rgb = apply_palette(values, _palette(), 0.0, 10.0)
    assert tuple(rgb[0]) == (0, 0, 0)
    assert tuple(rgb[1]) == (255, 255, 255)
