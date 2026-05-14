"""Unit tests for the VB `Print #1` / `Str$` / `Format$` helpers."""

from __future__ import annotations

import pytest
from radio_cartographer.io._vb_format import (
    vb_format_fixed,
    vb_format_pal,
    vb_print_formatted,
    vb_print_number,
    vb_print_string,
    vb_str,
)


class TestVbStr:
    def test_positive_int_gets_leading_space(self) -> None:
        assert vb_str(1581) == " 1581"

    def test_negative_int_has_no_leading_space(self) -> None:
        assert vb_str(-5) == "-5"

    def test_zero(self) -> None:
        assert vb_str(0) == " 0"

    def test_float_keeps_repr(self) -> None:
        assert vb_str(3.594) == " 3.594"

    def test_negative_float(self) -> None:
        assert vb_str(-18.123) == "-18.123"

    def test_integer_valued_float_drops_point_zero(self) -> None:
        assert vb_str(1.0) == " 1"

    def test_bool_rejected(self) -> None:
        with pytest.raises(TypeError):
            vb_str(True)  # type: ignore[arg-type]


class TestVbPrintNumber:
    def test_positive_has_leading_and_trailing_space(self) -> None:
        assert vb_print_number(1319) == b" 1319 \r\n"

    def test_negative_has_only_trailing_space(self) -> None:
        assert vb_print_number(-18.123) == b"-18.123 \r\n"

    def test_zero(self) -> None:
        assert vb_print_number(0) == b" 0 \r\n"


class TestVbPrintString:
    def test_no_surrounding_spaces(self) -> None:
        assert vb_print_string("CYG0A") == b"CYG0A\r\n"

    def test_empty_yields_crlf(self) -> None:
        assert vb_print_string("") == b"\r\n"

    def test_formatted_alias(self) -> None:
        assert vb_print_formatted("4.5684") == b"4.5684\r\n"


class TestVbFormatFixed:
    def test_typical_two_decimals(self) -> None:
        assert vb_format_fixed(31.34, 2) == "31.34"

    def test_typical_four_decimals(self) -> None:
        assert vb_format_fixed(4.5684, 4) == "4.5684"

    def test_sub_one_drops_leading_zero(self) -> None:
        assert vb_format_fixed(0.3401, 4) == ".3401"

    def test_integer_value_drops_decimal_point(self) -> None:
        assert vb_format_fixed(1.0, 4) == "1"

    def test_trailing_zeros_stripped(self) -> None:
        assert vb_format_fixed(2.1, 4) == "2.1"

    def test_zero_becomes_bare_decimal(self) -> None:
        # VB's `Format$(0, "#.####")` emits the lone period.
        assert vb_format_fixed(0.0, 4) == "."

    def test_negative_sub_one(self) -> None:
        assert vb_format_fixed(-0.5, 2) == "-.5"

    def test_rounds_half_away(self) -> None:
        # Python's banker's-rounding inside `f"{x:.{n}f}"` is what VB sees in
        # practice for these fixtures; pin it so we notice if it changes.
        assert vb_format_fixed(0.005, 2) in ("0.01", "0.00", ".01", ".")


class TestVbFormatPal:
    def test_two_stop_palette(self) -> None:
        out = vb_format_pal([0, 0, 0, 0, 255, 255, 255, 255], count=2)
        assert out == b" 2  0  0  0  0  255  255  255  255 \r\n"

    def test_single_stop(self) -> None:
        out = vb_format_pal([1, 2, 3, 4], count=1)
        assert out == b" 1  1  2  3  4 \r\n"
