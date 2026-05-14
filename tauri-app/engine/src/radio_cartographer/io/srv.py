"""`.srv` codec — reduced multi-sweep survey (vb/survform.frm).

Wire format (CRLF every line) matches the canonical writer at
`vb/survform.frm:984-1009` and reader at `vb/survform.frm:4388-4431`:

```
Label1                        (string — typically source path)
Label2                        (string — source name)
 SwpCnt                       (integer = Swp + 1)
 Swp                          (integer)
Calib(0)                      (Format$ "#.####")
Calib(Swp)                    (Format$ "#.####")
Sweep 0:
  For Num=1..240:
     Ra(0,Num)                (numeric)
    Dec(0,Num)                (Format$ "#.##")
    Flux(0,Num)               (Format$ "#.####")
For Cnt=1..Swp:
  MinDec(Cnt)                 (Format$ "#.##")
  MaxDec(Cnt)                 (Format$ "#.##")
  MinFlux(Cnt)                (Format$ "#.####")
  MaxFlux(Cnt)                (Format$ "#.####")
  Calib(Cnt)                  (Format$ "#.####")
   Total(Cnt)                 (integer)
  For Num=1..Total(Cnt):
     Ra(Cnt,Num)              (numeric)
    Dec(Cnt,Num)              (Format$ "#.##")
    Flux(Cnt,Num)             (Format$ "#.####")
```
"""

from __future__ import annotations

from pathlib import Path

import numpy as np

from ..models import Survey, Sweep
from ._vb_format import (
    vb_format_fixed,
    vb_print_formatted,
    vb_print_number,
    vb_print_string,
)
from .common import split_crlf_lines

SWEEP0_LENGTH = 240


def _vb_float(token: str) -> float:
    """Parse a VB `Format$`-emitted numeric token.

    `Format$(0, "#.####")` emits the bare `"."`; `Val(".")` is `0`. Python's
    `float(".")` raises, so we route that case explicitly.
    """
    stripped = token.strip()
    if stripped in ("", "."):
        return 0.0
    return float(stripped)


def read_srv(path: str | Path) -> Survey:
    raw = Path(path).read_bytes()
    return _parse_srv(raw)


def write_srv(survey: Survey, path: str | Path) -> None:
    Path(path).write_bytes(_serialize_srv(survey))


def _parse_srv(raw: bytes) -> Survey:
    lines = split_crlf_lines(raw)
    cursor = 0

    def take() -> str:
        nonlocal cursor
        if cursor >= len(lines):
            raise ValueError(".srv file ended unexpectedly")
        value = lines[cursor]
        cursor += 1
        return value

    label1 = take()
    label2 = take()
    sweep_count = int(take().strip())
    swp = int(take().strip())
    calib_zero = _vb_float(take())
    # The header carries `Calib!(Swp%)` again — same value as the last
    # per-sweep block. Consume but don't store; the value lives on the last
    # `Sweep` in `sweeps` once that block is parsed below.
    _calib_swp_redundant = _vb_float(take())  # noqa: F841 — consumed for layout

    sweep0_ra = np.empty(SWEEP0_LENGTH, dtype=np.float64)
    sweep0_dec = np.empty(SWEEP0_LENGTH, dtype=np.float64)
    sweep0_flux = np.empty(SWEEP0_LENGTH, dtype=np.float64)
    for i in range(SWEEP0_LENGTH):
        sweep0_ra[i] = _vb_float(take())
        sweep0_dec[i] = _vb_float(take())
        sweep0_flux[i] = _vb_float(take())
    sweep0 = Sweep(
        ra=sweep0_ra,
        dec=sweep0_dec,
        flux=sweep0_flux,
        calib=calib_zero,
    )

    sweeps: list[Sweep] = []
    for _ in range(swp):
        min_dec = _vb_float(take())
        max_dec = _vb_float(take())
        min_flux = _vb_float(take())
        max_flux = _vb_float(take())
        calib = _vb_float(take())
        total = int(take().strip())
        ra = np.empty(total, dtype=np.float64)
        dec = np.empty(total, dtype=np.float64)
        flux = np.empty(total, dtype=np.float64)
        for i in range(total):
            ra[i] = _vb_float(take())
            dec[i] = _vb_float(take())
            flux[i] = _vb_float(take())
        sweeps.append(
            Sweep(
                ra=ra,
                dec=dec,
                flux=flux,
                min_dec=min_dec,
                max_dec=max_dec,
                min_flux=min_flux,
                max_flux=max_flux,
                calib=calib,
            )
        )

    return Survey(
        label1=label1,
        label2=label2,
        sweep_count=sweep_count,
        swp=swp,
        sweep0=sweep0,
        sweeps=tuple(sweeps),
        raw_bytes=raw,
    )


def _serialize_srv(survey: Survey) -> bytes:
    if survey.raw_bytes is not None:
        return survey.raw_bytes
    out = bytearray()
    out += vb_print_string(survey.label1)
    out += vb_print_string(survey.label2)
    out += vb_print_number(survey.sweep_count)
    out += vb_print_number(survey.swp)
    out += vb_print_formatted(vb_format_fixed(_must(survey.sweep0.calib), 4))
    assert survey.sweeps  # documented invariant
    out += vb_print_formatted(vb_format_fixed(_must(survey.sweeps[-1].calib), 4))
    for i in range(SWEEP0_LENGTH):
        out += vb_print_number(_compact(float(survey.sweep0.ra[i])))
        out += vb_print_formatted(vb_format_fixed(float(survey.sweep0.dec[i]), 2))
        out += vb_print_formatted(vb_format_fixed(float(survey.sweep0.flux[i]), 4))
    for sweep in survey.sweeps:
        out += vb_print_formatted(vb_format_fixed(_must(sweep.min_dec), 2))
        out += vb_print_formatted(vb_format_fixed(_must(sweep.max_dec), 2))
        out += vb_print_formatted(vb_format_fixed(_must(sweep.min_flux), 4))
        out += vb_print_formatted(vb_format_fixed(_must(sweep.max_flux), 4))
        out += vb_print_formatted(vb_format_fixed(_must(sweep.calib), 4))
        total = int(sweep.ra.shape[0])
        out += vb_print_number(total)
        for i in range(total):
            out += vb_print_number(_compact(float(sweep.ra[i])))
            out += vb_print_formatted(vb_format_fixed(float(sweep.dec[i]), 2))
            out += vb_print_formatted(vb_format_fixed(float(sweep.flux[i]), 4))
    return bytes(out)


def _must(value: float | None) -> float:
    if value is None:
        raise ValueError("Sweep metadata field is required for .srv serialization")
    return value


def _compact(value: float) -> float | int:
    if value == int(value):
        return int(value)
    return value
