"""`.md2` codec — raw multi-sweep telescope survey input.

`.md2` is acquisition-system output, not produced by this codebase. The
parser splits the file on `"*"` separator lines into sweeps and parses each
sweep as RA/Dec/Flux triplets.
"""

from __future__ import annotations

from pathlib import Path

import numpy as np

from ..models import MD2Document, RawSweep
from .common import reject_b_channel, split_crlf_lines


def read_md2(path: str | Path) -> MD2Document:
    reject_b_channel(path)
    raw = Path(path).read_bytes()
    return _parse_md2(raw)


def write_md2(document: MD2Document, path: str | Path) -> None:
    Path(path).write_bytes(document.raw_bytes)


def _parse_md2(raw: bytes) -> MD2Document:
    lines = split_crlf_lines(raw)
    sweeps: list[RawSweep] = []
    metadata: list[str] = []
    current: list[float] = []
    in_metadata = False
    for line in lines:
        token = line.strip()
        if not token:
            continue
        if in_metadata:
            metadata.append(line)
            continue
        if token == "*":
            if current:
                sweeps.append(_finalize_sweep(current))
                current = []
            continue
        try:
            current.append(float(token))
        except ValueError:
            in_metadata = True
            if current:
                sweeps.append(_finalize_sweep(current))
                current = []
            metadata.append(line)
    if current:
        sweeps.append(_finalize_sweep(current))
    return MD2Document(
        sweeps=tuple(sweeps),
        raw_bytes=raw,
        trailing_metadata=tuple(metadata),
    )


def _finalize_sweep(tokens: list[float]) -> RawSweep:
    if len(tokens) % 3 != 0:
        raise ValueError(f".md2 sweep has {len(tokens)} numeric tokens, not a multiple of 3")
    arr = np.array(tokens, dtype=np.float64).reshape(-1, 3)
    return RawSweep(
        ra=arr[:, 0].copy(),
        dec=arr[:, 1].copy(),
        flux=arr[:, 2].copy(),
    )
