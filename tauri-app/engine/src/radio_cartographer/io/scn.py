"""`.scn` codec — reduced single-sweep scan (vb/scanform.frm).

Wire format (CRLF every line):

```
Caption                       (string — source name)
"A" | "B"                     (channel flag)
Peak                          (string — may be empty)
 MinDec                       (numeric)
 MaxDec                       (numeric)
MinFlux                       (Format$ "#.####")
MaxFlux                       (Format$ "#.####")
 Total                        (integer)
For each of Total records:
  Check                       (integer)
  Ra                          (numeric)
  Dec                         (numeric)
  Flux                        (Format$ "#.####")
```
"""

from __future__ import annotations

from pathlib import Path

import numpy as np

from ..models import Scan
from ._vb_format import (
    vb_format_fixed,
    vb_print_formatted,
    vb_print_number,
    vb_print_string,
)
from .common import split_crlf_lines


def _vb_float(token: str) -> float:
    """Parse a VB `Format$`-emitted numeric token; treat bare `.` as 0."""
    stripped = token.strip()
    if stripped in ("", "."):
        return 0.0
    return float(stripped)


def read_scn(path: str | Path) -> Scan:
    raw = Path(path).read_bytes()
    return _parse_scn(raw)


def write_scn(scan: Scan, path: str | Path) -> None:
    Path(path).write_bytes(_serialize_scn(scan))


def _parse_scn(raw: bytes) -> Scan:
    lines = split_crlf_lines(raw)
    if len(lines) < 8:
        raise ValueError(".scn file has fewer than 8 header lines")
    name = lines[0]
    channel = lines[1]
    if channel not in ("A", "B"):
        raise ValueError(f"Unexpected channel flag in .scn header: {channel!r}")
    peak = lines[2]
    min_dec = _vb_float(lines[3])
    max_dec = _vb_float(lines[4])
    min_flux = _vb_float(lines[5])
    max_flux = _vb_float(lines[6])
    total = int(lines[7].strip())
    body_start = 8
    needed = body_start + 4 * total
    if len(lines) < needed:
        raise ValueError(
            f".scn claims {total} records but file has only "
            f"{len(lines) - body_start} body lines (need {4 * total})"
        )
    check = np.empty(total, dtype=np.int_)
    ra = np.empty(total, dtype=np.float64)
    dec = np.empty(total, dtype=np.float64)
    flux = np.empty(total, dtype=np.float64)
    for i in range(total):
        base = body_start + 4 * i
        check[i] = int(lines[base].strip())
        ra[i] = _vb_float(lines[base + 1])
        dec[i] = _vb_float(lines[base + 2])
        flux[i] = _vb_float(lines[base + 3])
    return Scan(
        name=name,
        channel=channel,
        peak=peak,
        min_dec=min_dec,
        max_dec=max_dec,
        min_flux=min_flux,
        max_flux=max_flux,
        check=check,
        ra=ra,
        dec=dec,
        flux=flux,
        raw_bytes=raw,
    )


def _serialize_scn(scan: Scan) -> bytes:
    if scan.raw_bytes is not None:
        return scan.raw_bytes
    out = bytearray()
    out += vb_print_string(scan.name)
    out += vb_print_string(scan.channel)
    out += vb_print_string(scan.peak)
    out += vb_print_number(_compact(scan.min_dec))
    out += vb_print_number(_compact(scan.max_dec))
    out += vb_print_formatted(vb_format_fixed(scan.min_flux, 4))
    out += vb_print_formatted(vb_format_fixed(scan.max_flux, 4))
    out += vb_print_number(scan.total)
    for i in range(scan.total):
        out += vb_print_number(int(scan.check[i]))
        out += vb_print_number(_compact(float(scan.ra[i])))
        out += vb_print_number(_compact(float(scan.dec[i])))
        out += vb_print_formatted(vb_format_fixed(float(scan.flux[i]), 4))
    return bytes(out)


def _compact(value: float) -> float | int:
    if value == int(value):
        return int(value)
    return value
