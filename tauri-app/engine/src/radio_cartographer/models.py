"""In-memory representations of every legacy file format.

Single source of truth for the dataclasses each codec in
[radio_cartographer.io](io/__init__.py) returns. Phase 2 numerics operate on
these directly; Phase 3 RPC ships these (in JSON-friendly projections) over the
sidecar wire.

Each model carries an optional `raw_bytes` field that preserves the original
file bytes when the model was loaded from disk. The codec write path uses
`raw_bytes` when present to guarantee byte-identical round-trip with the legacy
EXE. Models constructed programmatically (Phase 2 reductions, Phase 4 export)
leave `raw_bytes=None` and rely on the per-codec serializer to produce VB-
compatible output via `radio_cartographer.io._vb_format`.
"""

from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np
from numpy.typing import NDArray


@dataclass(frozen=True)
class Sweep:
    """One declination sweep — a contiguous run of telescope samples."""

    ra: NDArray[np.float64]
    dec: NDArray[np.float64]
    flux: NDArray[np.float64]
    min_dec: float | None = None
    max_dec: float | None = None
    min_flux: float | None = None
    max_flux: float | None = None
    calib: float | None = None


@dataclass(frozen=True)
class Scan:
    """A reduced single-sweep scan — what `.scn` files carry."""

    name: str
    channel: str
    peak: str
    min_dec: float
    max_dec: float
    min_flux: float
    max_flux: float
    check: NDArray[np.int_]
    ra: NDArray[np.float64]
    dec: NDArray[np.float64]
    flux: NDArray[np.float64]
    raw_bytes: bytes | None = None

    @property
    def total(self) -> int:
        return int(self.ra.shape[0])


@dataclass(frozen=True)
class Survey:
    """A reduced multi-sweep survey — what `.srv` files carry."""

    label1: str
    label2: str
    sweep_count: int
    swp: int
    sweep0: Sweep
    sweeps: tuple[Sweep, ...]
    raw_bytes: bytes | None = None
    accepted: tuple[bool, ...] | None = None
    # Sample counts of the four cal quadrants packed into `sweep0`
    # (initial_on, initial_off, terminal_on, terminal_off). `None` means the
    # legacy fixed layout of four 60-sample quadrants (240 total). When set,
    # `sweep0` holds exactly `sum(cal_lengths)` samples and the codec records
    # the counts in the `#OGRC_SWEEP0` header line so the quadrant boundaries
    # survive without padding.
    cal_lengths: tuple[int, int, int, int] | None = None


@dataclass(frozen=True)
class CalibrationEntry:
    name: str
    measured_flux: float
    known_flux: float


@dataclass(frozen=True)
class CalibrationTable:
    """A telescope calibration table — what `.cal` files carry."""

    caption: str
    fit_annotation: str
    fit_result: str
    max_measured_flux: float
    max_known_flux: float
    entries: tuple[CalibrationEntry, ...]
    raw_bytes: bytes | None = None

    @property
    def count(self) -> int:
        return len(self.entries)


@dataclass(frozen=True)
class PaletteStop:
    """One control point of a Radio Cartographer palette.

    The four floats correspond to VB's `Pal!(Cnt%, 1..4)`: flux anchor and the
    three RGB channels. Stored as floats because the legacy app does the same;
    the renderer rounds at draw time.
    """

    anchor: float
    r: float
    g: float
    b: float


@dataclass(frozen=True)
class Palette:
    """An RGB palette — what `.pal` files carry."""

    stops: tuple[PaletteStop, ...]
    raw_bytes: bytes | None = None

    @property
    def count(self) -> int:
        return len(self.stops)


@dataclass(frozen=True)
class RawSweep:
    """One sweep parsed from raw telescope input (`.md1`/`.md2`).

    The `.md1` and `.md2` formats are not authored by this codebase, so the
    parser is permissive: it splits on the legacy `"*"` record separator and
    keeps the original RA/Dec/Flux triplets as numpy arrays.
    """

    ra: NDArray[np.float64]
    dec: NDArray[np.float64]
    flux: NDArray[np.float64]


@dataclass(frozen=True)
class MD1Document:
    """Raw single-sweep input as read from a `.md1` file.

    The legacy parser walks five fixed-or-variable blocks separated by `"*"`
    lines. We don't need to fully understand that segmentation for Phase 1 —
    we keep the parsed triplets and the original bytes, and let Phase 2
    address structural reductions. `trailing_metadata` captures the
    acquisition-system header strings that follow the final `"*"` separator
    (telescope name, local start/stop date/time).
    """

    samples: RawSweep
    raw_bytes: bytes
    trailing_metadata: tuple[str, ...] = field(default_factory=tuple)


@dataclass(frozen=True)
class MD2Document:
    """Raw multi-sweep survey input as read from a `.md2` file."""

    sweeps: tuple[RawSweep, ...]
    raw_bytes: bytes
    trailing_metadata: tuple[str, ...] = field(default_factory=tuple)


@dataclass(frozen=True)
class Image:
    """A gridded survey image — what `.img` files carry.

    `.img` is a VB binary file: length-prefixed ASCII strings for every header
    field and palette entry, then a 2-D `Int16` pixel grid in row-major order.
    """

    name: str
    min_ra: float
    max_ra: float
    min_dec: float
    max_dec: float
    min_flux: float
    max_flux: float
    min_ra_p: float
    max_ra_p: float
    min_dec_p: float
    max_dec_p: float
    min_flux_p: float
    max_flux_p: float
    pix: int
    palette: Palette
    pixels: NDArray[np.int16]
    # Flux unit string ("Jy" / "GCU" / None). Legacy `.img` files don't carry
    # this on disk — `read_img` reads it from an optional trailing string and
    # leaves it as `None` for legacy files. `write_img` only appends the
    # suffix when this is set, so legacy fixtures round-trip byte-exact.
    unit: str | None = None
    raw_bytes: bytes | None = None


@dataclass(frozen=True)
class Bitmap:
    """A rendered survey image as a 24-bit BI_RGB BMP (`.bmp` export).

    Byte-fidelity to VB's `SavePicture` output is documented as best-effort
    (plan §9). For now the bitmap is stored as opaque bytes; once a fixture is
    captured, a structured representation (width, height, RGB array) can be
    added without changing the round-trip contract.
    """

    raw_bytes: bytes
