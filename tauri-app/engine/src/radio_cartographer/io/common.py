"""Shared utilities for the legacy-format codecs."""

from __future__ import annotations


def split_crlf_lines(blob: bytes) -> list[str]:
    """Split bytes into text lines, accepting CRLF or LF terminators.

    The legacy files are ASCII; we decode strict here so any deviation
    surfaces as a parser error. Acquisition output is normally CRLF, but
    LF-only files occur in the wild (newer Skynet exports), so both are
    accepted — a strict CRLF split saw an LF file as one giant line and
    every codec parsed it as empty. Writers still emit byte-exact CRLF for
    legacy round-trip fidelity.
    """
    text = blob.decode("ascii", errors="strict")
    lines = [line.removesuffix("\r") for line in text.split("\n")]
    if lines and lines[-1] == "":
        lines.pop()
    return lines
