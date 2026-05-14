"""`.pal` codec — RGB palette (vb/dataform.frm).

Wire format: a single line `Str$(count) + " " + Str$(v1_1) + " " + ... + " "`
terminated by CRLF. Each palette stop occupies 4 values: `(anchor, r, g, b)`.
"""

from __future__ import annotations

from pathlib import Path

from ..models import Palette, PaletteStop


def read_pal(path: str | Path) -> Palette:
    raw = Path(path).read_bytes()
    return _parse_pal(raw)


def write_pal(palette: Palette, path: str | Path) -> None:
    Path(path).write_bytes(_serialize_pal(palette))


def _parse_pal(raw: bytes) -> Palette:
    if not raw.endswith(b"\r\n"):
        raise ValueError(".pal file must terminate with CRLF")
    line = raw[:-2].decode("ascii", errors="strict")
    tokens = [t for t in line.split(" ") if t != ""]
    if not tokens:
        raise ValueError(".pal file has no content")
    count = int(tokens[0])
    expected = 1 + 4 * count
    if len(tokens) != expected:
        raise ValueError(
            f".pal token count mismatch: header says {count} stops "
            f"(expected {expected} tokens), got {len(tokens)}"
        )
    stops: list[PaletteStop] = []
    for i in range(count):
        base = 1 + 4 * i
        anchor, r, g, b = (_pal_value(t) for t in tokens[base : base + 4])
        stops.append(PaletteStop(anchor=anchor, r=r, g=g, b=b))
    return Palette(stops=tuple(stops), raw_bytes=raw)


def _pal_value(token: str) -> float:
    """Parse a .pal numeric token preserving int-vs-float distinction.

    Values without a decimal point or exponent round-trip as integers; those
    with a `.` keep their float representation. This matches VB Single
    semantics: an integer-valued Single prints without `.0`.
    """
    if "." in token or "e" in token or "E" in token:
        return float(token)
    return float(int(token))


def _serialize_pal(palette: Palette) -> bytes:
    if palette.raw_bytes is not None:
        return palette.raw_bytes
    from ._vb_format import vb_format_pal

    flat: list[float | int] = []
    for stop in palette.stops:
        for value in (stop.anchor, stop.r, stop.g, stop.b):
            flat.append(_compact(value))
    return vb_format_pal(flat, palette.count)


def _compact(value: float) -> float | int:
    """Render integer-valued floats as int for VB `Str$` parity."""
    if value == int(value):
        return int(value)
    return value
