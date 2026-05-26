"""`.img` codec — gridded survey image (vb/survform.frm).

This is a VB **binary** format despite the legacy text-only claim in
`AGENT.md`. Wire format:

```
header strings, each as Int16 length followed by ASCII payload:
   Name (Label4.Caption)
   Str$(MinRaI), Str$(MaxRaI), Str$(MinDecI), Str$(MaxDecI),
   Str$(MinFluxI), Str$(MaxFluxI),
   Str$(MinRaPI), Str$(MaxRaPI), Str$(MinDecPI), Str$(MaxDecPI),
   Str$(MinFluxPI), Str$(MaxFluxPI),
   Str$(Pix), Str$(PalNum)
palette (PalNum * 4 Int16-prefixed strings)
grid: row-major Int16, shape (cnt_rows, num_cols) where
   cnt_rows = (4770 // (15 * Pix)) + 1
   num_cols = (5970 // (15 * Pix)) + 1
```

See `vb/survform.frm:3463-3540` (writer) and `vb/survform.frm:4632-4749`
(reader) for the legacy code.
"""

from __future__ import annotations

import struct
from pathlib import Path

import numpy as np

from ..models import Image, Palette, PaletteStop
from .pal import _compact


def read_img(path: str | Path) -> Image:
    raw = Path(path).read_bytes()
    return _parse_img(raw)


def write_img(image: Image, path: str | Path) -> None:
    Path(path).write_bytes(_serialize_img(image))


def _parse_img(raw: bytes) -> Image:
    cursor = 0

    def read_prefixed_string() -> str:
        nonlocal cursor
        if cursor + 2 > len(raw):
            raise ValueError(".img header truncated reading length prefix")
        length = struct.unpack_from("<h", raw, cursor)[0]
        cursor += 2
        if length < 0 or cursor + length > len(raw):
            raise ValueError(
                f".img header truncated reading {length}-byte payload at offset {cursor}"
            )
        payload = raw[cursor : cursor + length].decode("ascii", errors="strict")
        cursor += length
        return payload

    name = read_prefixed_string()
    min_ra = float(read_prefixed_string())
    max_ra = float(read_prefixed_string())
    min_dec = float(read_prefixed_string())
    max_dec = float(read_prefixed_string())
    min_flux = float(read_prefixed_string())
    max_flux = float(read_prefixed_string())
    min_ra_p = float(read_prefixed_string())
    max_ra_p = float(read_prefixed_string())
    min_dec_p = float(read_prefixed_string())
    max_dec_p = float(read_prefixed_string())
    min_flux_p = float(read_prefixed_string())
    max_flux_p = float(read_prefixed_string())
    pix = int(read_prefixed_string())
    pal_num = int(read_prefixed_string())

    if pix <= 0:
        raise ValueError(f".img Pix value must be positive, got {pix}")

    stops: list[PaletteStop] = []
    for _ in range(pal_num):
        anchor = float(read_prefixed_string())
        r = float(read_prefixed_string())
        g = float(read_prefixed_string())
        b = float(read_prefixed_string())
        stops.append(PaletteStop(anchor=anchor, r=r, g=g, b=b))
    palette = Palette(stops=tuple(stops), raw_bytes=None)

    rows = (4770 // (15 * pix)) + 1
    cols = (5970 // (15 * pix)) + 1
    pixel_count = rows * cols
    expected_bytes = pixel_count * 2
    remaining = len(raw) - cursor
    if remaining < expected_bytes:
        raise ValueError(
            f".img grid size mismatch: expected at least {expected_bytes} bytes for "
            f"a ({rows},{cols}) grid at Pix={pix}, got {remaining}"
        )
    pixels = np.frombuffer(raw, dtype="<i2", count=pixel_count, offset=cursor)
    # Legacy on-disk row order is MaxDec → MinDec (the legacy paint loop draws
    # `Clr(Num, Cnt=1)` at y=0, top of the picture, and the builder maps high
    # Dec to low `Cnt` indices — see vb/survform.frm:1697, 4805). Our internal
    # convention is row 0 = MinDec (matches the heatmap's `ys[0] = min_dec`),
    # so we flip vertically here. `_serialize_img` flips back when writing,
    # which keeps the on-disk bytes legacy-compatible and round-trip-stable.
    pixels = pixels.reshape((rows, cols))[::-1].copy()
    cursor += expected_bytes

    # Optional unit string appended after the pixel grid — our extension to
    # the legacy format. Legacy `.img` files end at the pixel grid, so a
    # missing unit just means `unit=None`. Format: same length-prefixed ASCII
    # as the header strings.
    unit: str | None = None
    if cursor + 2 <= len(raw):
        u_len = struct.unpack_from("<h", raw, cursor)[0]
        if u_len >= 0 and cursor + 2 + u_len <= len(raw):
            cursor += 2
            unit = raw[cursor : cursor + u_len].decode("ascii", errors="strict")

    return Image(
        name=name,
        min_ra=min_ra,
        max_ra=max_ra,
        min_dec=min_dec,
        max_dec=max_dec,
        min_flux=min_flux,
        max_flux=max_flux,
        min_ra_p=min_ra_p,
        max_ra_p=max_ra_p,
        min_dec_p=min_dec_p,
        max_dec_p=max_dec_p,
        min_flux_p=min_flux_p,
        max_flux_p=max_flux_p,
        pix=pix,
        palette=palette,
        pixels=pixels,
        unit=unit,
        raw_bytes=raw,
    )


def _serialize_img(image: Image) -> bytes:
    if image.raw_bytes is not None:
        return image.raw_bytes
    from ._vb_format import vb_str

    out = bytearray()

    def write_prefixed_string(s: str) -> None:
        encoded = s.encode("ascii", errors="strict")
        out.extend(struct.pack("<h", len(encoded)))
        out.extend(encoded)

    write_prefixed_string(image.name)
    for field in (
        image.min_ra,
        image.max_ra,
        image.min_dec,
        image.max_dec,
        image.min_flux,
        image.max_flux,
        image.min_ra_p,
        image.max_ra_p,
        image.min_dec_p,
        image.max_dec_p,
        image.min_flux_p,
        image.max_flux_p,
    ):
        write_prefixed_string(vb_str(_compact(float(field))))
    write_prefixed_string(vb_str(image.pix))
    write_prefixed_string(vb_str(image.palette.count))
    for stop in image.palette.stops:
        for value in (stop.anchor, stop.r, stop.g, stop.b):
            write_prefixed_string(vb_str(_compact(float(value))))
    # Flip rows back to legacy on-disk order (MaxDec first); see `_parse_img`
    # for the matching read-side flip.
    out.extend(image.pixels[::-1].astype("<i2", copy=False).tobytes(order="C"))
    # Optional unit suffix — only appended when set so legacy files round-trip
    # byte-exact (read returns unit=None → write skips the suffix).
    if image.unit:
        encoded = image.unit.encode("ascii", errors="strict")
        out.extend(struct.pack("<h", len(encoded)))
        out.extend(encoded)
    return bytes(out)
