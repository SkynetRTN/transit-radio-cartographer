"""Shared utilities for the legacy-format codecs."""

from __future__ import annotations

from pathlib import Path


def reject_b_channel(path: str | Path) -> None:
    """Refuse to open B-channel telescope files.

    The tutorial PDF rules these out (see [agents/tauri_plan.md](../../../../agents/tauri_plan.md)
    §6.1). The check inspects the filename stem only — so a hypothetical
    `survey.md1.bak` would not match — but it triggers on any stem that ends
    in `'b'`, matching the ERIRA naming convention (`and0b`, `morningb`,
    `mw_08b`, `pulsar1b`). The legacy reductions (`.scn`, `.srv`) are not
    gated; they came through earlier in the pipeline before our codec layer.
    """
    stem = Path(path).stem.lower()
    if stem.endswith("b"):
        raise ValueError(f"Channel-B files are not supported: {path}")


def split_crlf_lines(blob: bytes) -> list[str]:
    """Split bytes on CRLF, returning text lines without their terminators.

    The legacy files are CRLF-terminated unconditionally and ASCII; we decode
    strict here so any deviation surfaces as a parser error.
    """
    text = blob.decode("ascii", errors="strict")
    if text.endswith("\r\n"):
        text = text[:-2]
        lines = text.split("\r\n")
    else:
        lines = text.split("\r\n")
    return lines
