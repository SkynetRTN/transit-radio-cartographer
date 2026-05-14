from __future__ import annotations

from pathlib import Path

from .common import TextDocument, _read_text, _write_text


def read_srv(path: str | Path) -> TextDocument:
    return TextDocument(raw_bytes=_read_text(path))


def write_srv(document: TextDocument, path: str | Path) -> None:
    _write_text(document, path)
