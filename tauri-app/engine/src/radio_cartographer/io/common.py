"""Shared utilities for the legacy-format codecs."""

from __future__ import annotations


def split_crlf_lines(blob: bytes) -> list[str]:
    """Split bytes into text lines, returning them without their terminators.

    Files written by the legacy VB app are CRLF-terminated ASCII, but newer
    Skynet exports terminate lines with bare LF — a strict CRLF split saw
    those files as one giant line and every codec parsed them as empty
    (0 sweeps / 0 samples). Accept both terminators on read; the writers
    still emit byte-exact CRLF for legacy round-trip fidelity.
    """
    text = blob.decode("ascii", errors="strict")
    text = text.replace("\r\n", "\n")
    if text.endswith("\n"):
        text = text[:-1]
    return text.split("\n")
