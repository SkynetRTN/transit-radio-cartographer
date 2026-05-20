"""Shared utilities for the legacy-format codecs."""

from __future__ import annotations


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
