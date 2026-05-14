"""VB5 `Print #1` / `Str$` / `Format$` faithful number formatting.

The legacy app writes text formats via VB5's `Print #1` and `Format$`. To
re-emit byte-identical bytes from typed models (Phase 2 onward), the codec
serializers route every numeric value through this helper instead of using
Python's default `str()` / `repr()`.

The rules below are inferred from the captured fixtures (see
`fixtures/README.md` "binary-equality policy") and verified by
`test_vb_format.py`.

`Print #1, x` (numeric x):
- For non-negative numbers: " " + Str$(x) + " " + CRLF
- For negative numbers:           Str$(x) + " " + CRLF
- The trailing space is the print-zone separator VB inserts after the value.
- The leading space is VB's "sign slot" — replaced by "-" for negatives.

`Print #1, x$` (string x$):
- x$ + CRLF (no surrounding spaces)

`Print #1, Format$(x, fmt)`:
- The Format$ result is a string, so surrounding spaces are NOT added.
- `"#.####"` (4 decimals) and `"#.##"` (2 decimals) are the only formats the
  legacy app uses; both strip the leading "0" for |x| < 1 and trim trailing
  zeros after the decimal point.

`Str$(x)`:
- For non-negative: " " + value
- For negative:           value
- Integers: no decimal point (e.g., `Str$(1581)` → " 1581").
- Floats: VB's compact repr; matches Python's `repr(float)` for most values.
"""

from __future__ import annotations


def vb_str(x: float | int) -> str:
    """Mimic VB's `Str$(x)`.

    For non-negative numeric `x` VB returns a string prefixed by a single
    space; for negative `x`, no prefix (the minus sign occupies the slot).
    Integers render without a decimal point; floats use VB's compact
    representation, which for the values we care about is identical to
    Python's `repr(float)` (e.g. `3.594`, not `3.594000`).
    """
    if isinstance(x, bool):
        raise TypeError("vb_str does not accept bool")
    if isinstance(x, int):
        body = str(x)
    elif isinstance(x, float):
        if x != x or x in (float("inf"), float("-inf")):
            raise ValueError(f"vb_str cannot serialize {x!r}")
        body = str(int(x)) if x.is_integer() else repr(x)
    else:
        raise TypeError(f"vb_str expects int or float, got {type(x).__name__}")
    if body.startswith("-"):
        return body
    return " " + body


def vb_print_number(x: float | int) -> bytes:
    """Bytes that `Print #1, x` writes for a numeric scalar.

    Layout: `vb_str(x)` + trailing space + CRLF. The trailing space is the
    VB print-zone delimiter — the legacy fixtures confirm it is present even
    when the value is the last item on its `Print` line.
    """
    return (vb_str(x) + " \r\n").encode("ascii")


def vb_print_string(s: str) -> bytes:
    """Bytes that `Print #1, s$` writes for a string scalar.

    No surrounding spaces are inserted. CRLF terminates the line.
    """
    return s.encode("ascii", errors="strict") + b"\r\n"


def vb_print_formatted(s: str) -> bytes:
    """Bytes that `Print #1, Format$(x, fmt)` writes.

    `Format$` returns a `String`, so the print path is the string path —
    no surrounding spaces. Callers supply the already-formatted text.
    """
    return vb_print_string(s)


def vb_format_fixed(x: float, decimals: int) -> str:
    """Mimic VB's `Format$(x, "#.####")` for small fixed-decimal formats.

    VB's `"#"` placeholders skip leading and trailing zeros around the
    decimal point: `0.3401 → ".3401"`, `1.0 → "1"`, `31.34 → "31.34"`.
    """
    if decimals < 0:
        raise ValueError("decimals must be >= 0")
    if x != x or x in (float("inf"), float("-inf")):
        raise ValueError(f"vb_format_fixed cannot serialize {x!r}")
    rounded = f"{x:.{decimals}f}"
    sign = ""
    if rounded.startswith("-"):
        sign = "-"
        rounded = rounded[1:]
    if "." in rounded:
        integer_part, fractional_part = rounded.split(".", 1)
        fractional_part = fractional_part.rstrip("0")
    else:
        integer_part, fractional_part = rounded, ""
    if integer_part == "0":
        integer_part = ""
    if not integer_part and not fractional_part:
        # VB's `Format$(0, "#.####")` returns the bare decimal point.
        return "."
    if fractional_part:
        return f"{sign}{integer_part}.{fractional_part}"
    return f"{sign}{integer_part}"


def vb_format_pal(values: list[float | int], count: int) -> bytes:
    """Bytes that `dataform.frm` writes for a `.pal` file.

    The single line is `Str$(count) + " " + Str$(v1) + " " + … + " "` with a
    terminating CRLF from `Print #1, Junk$`. Each `vb_str` already begins
    with a leading space for non-negatives, so consecutive entries appear
    separated by two spaces in the fixture bytes.
    """
    parts: list[str] = [vb_str(count) + " "]
    for v in values:
        parts.append(vb_str(v) + " ")
    return ("".join(parts) + "\r\n").encode("ascii")
