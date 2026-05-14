from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from .common import _read_text, _reject_b_channel


@dataclass(frozen=True)
class MD1Document:
    raw_bytes: bytes


def read_md1(path: str | Path) -> MD1Document:
    _reject_b_channel(path)
    return MD1Document(raw_bytes=_read_text(path))


def write_md1(document: MD1Document, path: str | Path) -> None:
    Path(path).write_bytes(document.raw_bytes)
