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
[#OGRC_SWEEP0 l0 l1 l2 l3]    (optional — this app's variable-length cal header)
Sweep 0:
  For Num=1..N:               (N = 240 legacy, or sum(l0..l3) when header present)
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

SWEEP0_LENGTH = 240  # legacy fixed cal block: four 60-sample quadrants
SWEEP0_HEADER = "#OGRC_SWEEP0"  # marks this app's variable-length cal layout


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

    # Optional variable-length cal header written by this app. Legacy files go
    # straight into the sweep0 numeric block (240 samples, four 60-sample
    # quadrants); when the header is present it declares the four real quadrant
    # counts so no padding is needed.
    cal_lengths: tuple[int, int, int, int] | None = None
    if cursor < len(lines) and lines[cursor].strip().startswith(SWEEP0_HEADER):
        parts = lines[cursor].strip().split()
        cursor += 1
        if len(parts) != 5:
            raise ValueError(
                f"{SWEEP0_HEADER} header must list 4 quadrant counts, got {parts[1:]}"
            )
        try:
            cal_lengths = (int(parts[1]), int(parts[2]), int(parts[3]), int(parts[4]))
        except ValueError as exc:
            raise ValueError(f"{SWEEP0_HEADER} counts must be integers: {parts[1:]}") from exc
        if any(length < 0 for length in cal_lengths):
            raise ValueError(f"{SWEEP0_HEADER} counts must be non-negative: {cal_lengths}")
        sweep0_length = sum(cal_lengths)
    else:
        sweep0_length = SWEEP0_LENGTH

    sweep0_ra = np.empty(sweep0_length, dtype=np.float64)
    sweep0_dec = np.empty(sweep0_length, dtype=np.float64)
    sweep0_flux = np.empty(sweep0_length, dtype=np.float64)
    for i in range(sweep0_length):
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

    accepted: tuple[bool, ...] | None = None
    if cursor < len(lines) and lines[cursor].strip() == "#OGRC_ACCEPTED":
        cursor += 1
        flags: list[bool] = []
        for _ in range(swp):
            if cursor >= len(lines):
                raise ValueError("#OGRC_ACCEPTED trailer truncated")
            flags.append(int(lines[cursor].strip()) != 0)
            cursor += 1
        accepted = tuple(flags)

    return Survey(
        label1=label1,
        label2=label2,
        sweep_count=sweep_count,
        swp=swp,
        sweep0=sweep0,
        sweeps=tuple(sweeps),
        raw_bytes=raw,
        accepted=accepted,
        cal_lengths=cal_lengths,
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
    # Real validation, not an assert — asserts are stripped under `python -O`
    # (and optimized PyInstaller builds), which would turn this into a bare
    # IndexError on the next line.
    if not survey.sweeps:
        raise ValueError("cannot serialize a survey with no sweeps")
    out += vb_print_formatted(vb_format_fixed(_must(survey.sweeps[-1].calib), 4))
    # sweep0 is either the legacy fixed 240-sample block or, when `cal_lengths`
    # is set, a variable-length block prefixed by an `#OGRC_SWEEP0` header that
    # records the four real cal-quadrant counts (so short .md2 cal brackets need
    # no padding). Validate the length up front so a mismatch is a clear error,
    # not an opaque `index N out of bounds` from the loop below.
    if survey.cal_lengths is None:
        sweep0_length = SWEEP0_LENGTH
    else:
        sweep0_length = sum(survey.cal_lengths)
        out += vb_print_string(f"{SWEEP0_HEADER} " + " ".join(str(n) for n in survey.cal_lengths))
    for _name, _arr in (
        ("ra", survey.sweep0.ra),
        ("dec", survey.sweep0.dec),
        ("flux", survey.sweep0.flux),
    ):
        if _arr.shape[0] != sweep0_length:
            raise ValueError(
                f".srv sweep0 {_name} must be {sweep0_length} samples, "
                f"got {_arr.shape[0]}"
            )
    for i in range(sweep0_length):
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
    if survey.accepted is not None:
        if len(survey.accepted) != survey.swp:
            raise ValueError(
                f"accepted length {len(survey.accepted)} must equal swp {survey.swp}"
            )
        out += vb_print_string("#OGRC_ACCEPTED")
        for flag in survey.accepted:
            out += vb_print_number(-1 if flag else 0)
    return bytes(out)


def _must(value: float | None) -> float:
    if value is None:
        raise ValueError("Sweep metadata field is required for .srv serialization")
    return value


def _compact(value: float) -> float | int:
    if value == int(value):
        return int(value)
    return value
