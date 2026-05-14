"""Codec entry points for every legacy file format.

Each codec exposes `read(path)` and `write(model, path)`. The model types
are defined in [`radio_cartographer.models`](../models.py); see that module
for the field-level documentation.
"""

from .bmp import read_bmp, write_bmp
from .cal import read_cal, write_cal
from .img import read_img, write_img
from .md1 import read_md1, write_md1
from .md2 import read_md2, write_md2
from .pal import read_pal, write_pal
from .scn import read_scn, write_scn
from .srv import read_srv, write_srv

__all__ = [
    "read_bmp",
    "write_bmp",
    "read_cal",
    "write_cal",
    "read_img",
    "write_img",
    "read_md1",
    "write_md1",
    "read_md2",
    "write_md2",
    "read_pal",
    "write_pal",
    "read_scn",
    "write_scn",
    "read_srv",
    "write_srv",
]
