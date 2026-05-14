from __future__ import annotations

from pathlib import Path

from .common import BinaryDocument, _read_bytes, _write_bytes


def read_img(path: str | Path) -> BinaryDocument:
    return BinaryDocument(raw_bytes=_read_bytes(path))


def write_img(document: BinaryDocument, path: str | Path) -> None:
    _write_bytes(document, path)
