import numpy as np
from radio_cartographer.models import Palette, PaletteStop
from radio_cartographer.palette import apply_palette


def test_apply_palette_known_values() -> None:
    palette = Palette(stops=(PaletteStop(0, 0, 0, 0), PaletteStop(1, 255, 255, 255)))
    img = np.array([[0.0, 0.5, 1.0]])
    rgb = apply_palette(img, palette, 0.0, 1.0)
    assert tuple(rgb[0, 0]) == (0, 0, 0)
    assert tuple(rgb[0, 2]) == (255, 255, 255)


def test_palette_clamps_outside_flux_range() -> None:
    palette = Palette(stops=(PaletteStop(0, 0, 0, 0), PaletteStop(1, 255, 0, 0)))
    img = np.array([[-1.0, 2.0]])
    rgb = apply_palette(img, palette, 0.0, 1.0)
    assert tuple(rgb[0, 0]) == (0, 0, 0)
    assert tuple(rgb[0, 1]) == (255, 0, 0)
