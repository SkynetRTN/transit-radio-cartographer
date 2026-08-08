"""Tests for the legacy *Baseline Sweeps* lower-envelope subtraction.

The legacy operation (`vb/survform.frm:2420-2449`) is NOT a polynomial fit:
it slides a window of ``base_deg`` declination degrees along the sweep,
draws a support line across the window, rotates the line down onto any
sample beneath it, and takes the pointwise minimum of all lines as the
baseline. The baseline therefore hugs the off-source noise floor and passes
*under* sources narrower than the window, preserving their shape.
"""

from pathlib import Path

import numpy as np
import pytest
from radio_cartographer.io import read_md2
from radio_cartographer.scan import subtract_baseline_envelope
from tests._tolerances import BASELINE_ATOL

SUN_FIXTURE = Path(__file__).resolve().parents[4] / "fixtures" / "inputs" / "sun1_a.md2"


def _legacy_baseline_sweeps(
    dec: np.ndarray, flux: np.ndarray, base_deg: float
) -> np.ndarray:
    """Line-for-line 1-based transliteration of `vb/survform.frm:2420-2449`.

    Expects ascending dec (the legacy load path sorts each sweep before the
    reduction ever runs). Kept deliberately naive — plain Python floats and
    the exact VB control flow — as an independent oracle for the vectorised
    implementation.
    """
    total = len(dec)
    d = [0.0] + [float(v) for v in dec]
    f = [0.0] + [float(v) for v in flux]
    baseline = [1000.0] * (total + 1)
    number = 1
    while d[number] < d[total]:
        num = number + 1
        while (d[number] + base_deg > d[num]) and (num < total):
            num += 1
        a = (f[num] - f[number]) / (d[num] - d[number])
        b = f[num] - a * d[num]
        numb = num - 1
        while numb > number:
            if (f[numb] < a * d[numb] + b) and (d[numb] != d[number]):
                num = numb
                a = (f[num] - f[number]) / (d[num] - d[number])
                b = f[num] - a * d[num]
            numb -= 1
        for counter in range(number, num + 1):
            if a * d[counter] + b < baseline[counter]:
                baseline[counter] = a * d[counter] + b
        number += 1
    return np.array([f[i] - baseline[i] for i in range(1, total + 1)])


def test_envelope_removes_constant_offset() -> None:
    dec = np.linspace(0, 10, 200)
    flux = np.full(200, 3.0)
    y = subtract_baseline_envelope(dec, flux, base_deg=2.0)
    assert np.allclose(y, 0.0, atol=BASELINE_ATOL)


def test_envelope_removes_linear_drift() -> None:
    dec = np.linspace(-5, 5, 200)
    flux = 2.0 + 0.7 * dec
    y = subtract_baseline_envelope(dec, flux, base_deg=2.0)
    assert np.allclose(y, 0.0, atol=BASELINE_ATOL)


def test_envelope_preserves_narrow_source() -> None:
    # A source narrower than base_deg must survive nearly intact — the
    # envelope interpolates *under* the peak instead of fitting through it.
    dec = np.linspace(-10, 10, 800)
    peak = np.exp(-(dec**2) / 0.5)
    flux = 0.5 + 0.2 * dec + peak
    y = subtract_baseline_envelope(dec, flux, base_deg=5.0)
    assert np.max(y) > 0.95 * np.max(peak)
    assert np.min(y) >= -BASELINE_ATOL


def test_envelope_residual_never_negative() -> None:
    # The baseline is a lower envelope: no covered sample sits below it.
    rng = np.random.default_rng(42)
    dec = np.linspace(0, 30, 600)
    flux = 1.0 + 0.05 * dec + rng.normal(0.0, 0.3, dec.size)
    y = subtract_baseline_envelope(dec, flux, base_deg=5.0)
    assert np.min(y) >= -BASELINE_ATOL


def test_envelope_matches_literal_vb_transliteration() -> None:
    rng = np.random.default_rng(7)
    dec = np.linspace(0, 30, 400)
    flux = (
        2.0
        + 0.1 * dec
        + 8.0 * np.exp(-((dec - 15.0) ** 2) / 2.0)
        + rng.normal(0.0, 0.25, dec.size)
    )
    for base_deg in (0.5, 2.0, 5.0, 40.0):
        mine = subtract_baseline_envelope(dec, flux, base_deg=base_deg)
        oracle = _legacy_baseline_sweeps(dec, flux, base_deg)
        assert np.allclose(mine, oracle, atol=BASELINE_ATOL), f"base_deg={base_deg}"


def test_envelope_descending_sweep_matches_reversed_ascending() -> None:
    # The legacy load path reverses descending sweeps before the reduction;
    # the port must give each (dec, flux) sample the same value either way.
    rng = np.random.default_rng(3)
    dec = np.linspace(0, 20, 300)
    flux = 1.0 + rng.normal(0.0, 0.2, dec.size) + 5.0 * np.exp(-((dec - 8.0) ** 2))
    asc = subtract_baseline_envelope(dec, flux, base_deg=5.0)
    desc = subtract_baseline_envelope(dec[::-1].copy(), flux[::-1].copy(), base_deg=5.0)
    assert np.allclose(asc, desc[::-1], atol=BASELINE_ATOL)


def test_envelope_unsorted_input_matches_sorted() -> None:
    # The legacy load path bubble-sorts each sweep into ascending dec; the
    # port sorts internally and scatters results back to input order.
    rng = np.random.default_rng(11)
    dec = np.linspace(0, 20, 300)
    flux = 1.0 + 0.1 * dec + rng.normal(0.0, 0.2, dec.size)
    perm = rng.permutation(dec.size)
    sorted_result = subtract_baseline_envelope(dec, flux, base_deg=5.0)
    scattered_result = subtract_baseline_envelope(dec[perm], flux[perm], base_deg=5.0)
    assert np.allclose(scattered_result, sorted_result[perm], atol=BASELINE_ATOL)


def test_envelope_rejects_nonpositive_base_deg() -> None:
    dec = np.linspace(0, 10, 50)
    flux = np.ones(50)
    with pytest.raises(ValueError):
        subtract_baseline_envelope(dec, flux, base_deg=0.0)
    with pytest.raises(ValueError):
        subtract_baseline_envelope(dec, flux, base_deg=-1.0)


def test_envelope_preserves_sun_disk_on_fixture() -> None:
    """Regression: a degree-5 polyfit ate the sun's shoulders/Airy rings and
    left negative lobes above and below the disk. The envelope must keep the
    residual non-negative and preserve nearly the full disk amplitude."""
    survey = read_md2(str(SUN_FIXTURE))
    sweep = max(survey.sweeps, key=lambda s: float(np.max(s.flux)))
    dec = np.asarray(sweep.dec, dtype=np.float64)
    flux = np.asarray(sweep.flux, dtype=np.float64)
    y = subtract_baseline_envelope(dec, flux, base_deg=5.0)
    # No negative lobes anywhere on the sweep.
    assert float(np.min(y)) >= -BASELINE_ATOL
    # The disk survives: at least 85% of the raw peak-over-floor amplitude.
    raw_amplitude = float(np.max(flux) - np.min(flux))
    assert float(np.max(y)) > 0.85 * raw_amplitude
