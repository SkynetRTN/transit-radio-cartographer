from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class TextDocument:
    raw_bytes: bytes


@dataclass(frozen=True)
class BinaryDocument:
    raw_bytes: bytes


def _read_text(path: str | Path) -> bytes:
    return Path(path).read_bytes()


def _write_text(document: TextDocument, path: str | Path) -> None:
    Path(path).write_bytes(document.raw_bytes)


def _read_bytes(path: str | Path) -> bytes:
    return Path(path).read_bytes()


def _write_bytes(document: BinaryDocument, path: str | Path) -> None:
    Path(path).write_bytes(document.raw_bytes)


def _reject_b_channel(path: str | Path) -> None:
    name = Path(path).name.lower()
    if name.endswith("b.md1") or name.endswith("b.md2"):
        raise ValueError(f"Channel-B files are not supported: {path}")
