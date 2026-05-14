"""`.cal` codec — telescope calibration table (vb/calform.frm).

Wire format (CRLF every line):

```
Caption                       (string)
Label1.Caption                (string — typically "Slope: ... Jy")
Label2.Caption                (string — may be empty)
 MaxMF                        (numeric)
 MaxKF                        (numeric)
 CalNum                       (integer)
For each of CalNum entries:
  Name                        (string)
  MFlux                       (numeric)
  KFlux                       (numeric)
```
"""

from __future__ import annotations

from pathlib import Path

from ..models import CalibrationEntry, CalibrationTable
from ._vb_format import vb_print_number, vb_print_string
from .common import split_crlf_lines


def read_cal(path: str | Path) -> CalibrationTable:
    raw = Path(path).read_bytes()
    return _parse_cal(raw)


def write_cal(table: CalibrationTable, path: str | Path) -> None:
    Path(path).write_bytes(_serialize_cal(table))


def _parse_cal(raw: bytes) -> CalibrationTable:
    lines = split_crlf_lines(raw)
    if len(lines) < 6:
        raise ValueError(".cal file has fewer than 6 header lines")
    caption = lines[0]
    fit_annotation = lines[1]
    fit_result = lines[2]
    max_mf = _parse_number(lines[3])
    max_kf = _parse_number(lines[4])
    cal_num = int(_parse_number(lines[5]))
    body_start = 6
    expected_body = 3 * cal_num
    if len(lines) < body_start + expected_body:
        raise ValueError(
            f".cal claims {cal_num} entries but file has only "
            f"{len(lines) - body_start} body lines"
        )
    entries: list[CalibrationEntry] = []
    for i in range(cal_num):
        base = body_start + 3 * i
        entries.append(
            CalibrationEntry(
                name=lines[base],
                measured_flux=_parse_number(lines[base + 1]),
                known_flux=_parse_number(lines[base + 2]),
            )
        )
    return CalibrationTable(
        caption=caption,
        fit_annotation=fit_annotation,
        fit_result=fit_result,
        max_measured_flux=max_mf,
        max_known_flux=max_kf,
        entries=tuple(entries),
        raw_bytes=raw,
    )


def _parse_number(token: str) -> float:
    """Mimic VB `Val()` semantics on a `Print #1`-formatted numeric line.

    VB `Print #1` surrounds non-negative numerics with a leading + trailing
    space. `Val()` ignores leading whitespace and stops at the first non-
    numeric character (so trailing space is fine too).
    """
    return float(token.strip())


def _serialize_cal(table: CalibrationTable) -> bytes:
    if table.raw_bytes is not None:
        return table.raw_bytes
    out = bytearray()
    out += vb_print_string(table.caption)
    out += vb_print_string(table.fit_annotation)
    out += vb_print_string(table.fit_result)
    out += vb_print_number(_compact(table.max_measured_flux))
    out += vb_print_number(_compact(table.max_known_flux))
    out += vb_print_number(len(table.entries))
    for entry in table.entries:
        out += vb_print_string(entry.name)
        out += vb_print_number(_compact(entry.measured_flux))
        out += vb_print_number(_compact(entry.known_flux))
    return bytes(out)


def _compact(value: float) -> float | int:
    if value == int(value):
        return int(value)
    return value
