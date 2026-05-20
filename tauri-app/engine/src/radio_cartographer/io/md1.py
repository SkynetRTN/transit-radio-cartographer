"""`.md1` codec — raw single-sweep telescope input.

`.md1` is acquisition-system output, not produced by this codebase. The
parser is therefore permissive: it reads triplets of `(ra, dec, flux)` lines
and skips any record-separator lines (`"*"`). We keep the original bytes so
write-through is byte-identical without trying to re-emit external format
quirks (leading-space-vs-not, etc).
"""

from __future__ import annotations

from pathlib import Path

import numpy as np

from ..models import MD1Document, RawSweep
from .common import split_crlf_lines


def read_md1(path: str | Path) -> MD1Document:
    raw = Path(path).read_bytes()
    return _parse_md1(raw)


def write_md1(document: MD1Document, path: str | Path) -> None:
    Path(path).write_bytes(document.raw_bytes)


def _parse_md1(raw: bytes) -> MD1Document:
    lines = split_crlf_lines(raw)
    numeric: list[float] = []
    metadata: list[str] = []
    in_metadata = False
    for line in lines:
        token = line.strip()
        if not token or token == "*":
            continue
        if in_metadata:
            metadata.append(line)
            continue
        try:
            numeric.append(float(token))
        except ValueError:
            in_metadata = True
            metadata.append(line)
    if len(numeric) % 3 != 0:
        raise ValueError(
            f".md1 numeric token count {len(numeric)} is not a multiple of 3 "
            "(expected RA/Dec/Flux triplets)"
        )
    arr = np.array(numeric, dtype=np.float64).reshape(-1, 3)
    samples = RawSweep(
        ra=arr[:, 0].copy(),
        dec=arr[:, 1].copy(),
        flux=arr[:, 2].copy(),
    )
    return MD1Document(
        samples=samples,
        raw_bytes=raw,
        trailing_metadata=tuple(metadata),
    )
