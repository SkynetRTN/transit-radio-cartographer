"""Shared utilities for the legacy-format codecs."""

from __future__ import annotations


def split_crlf_lines(blob: bytes) -> list[str]:
    """Split bytes into text lines, accepting CRLF or LF terminators.

    The legacy files are ASCII; we decode strict here so any deviation
    surfaces as a parser error. Acquisition output is normally CRLF, but
    LF-only files occur in the wild, so both are accepted.
    """
    text = blob.decode("ascii", errors="strict")
    lines = [line.removesuffix("\r") for line in text.split("\n")]
    if lines and lines[-1] == "":
        lines.pop()
    return lines
