"""Append + superimpose: composition rules and overlap math."""

from __future__ import annotations

import numpy as np
import pytest

from radio_cartographer.image import GriddedImage, WCSMetadata
from radio_cartographer.image_compose import (
    _GRID_CELL_BUDGET,
    _normalize01,
    append_images,
    bicolor_compose,
    extend_rgb_compose,
    superimpose_images,
    tricolor_compose,
)


def _make(width: int, height: int, min_ra: float, max_ra: float, min_dec: float, max_dec: float, fill: float) -> GriddedImage:
    pixels = np.full((height, width), fill, dtype=np.float64)
    cdelt1 = -(max_ra - min_ra) / max(width - 1, 1)
    cdelt2 = (max_dec - min_dec) / max(height - 1, 1)
    wcs = WCSMetadata(
        ctype1="RA---TAN",
        ctype2="DEC--TAN",
        crval1=(min_ra + max_ra) / 2,
        crval2=(min_dec + max_dec) / 2,
        crpix1=(width + 1) / 2,
        crpix2=(height + 1) / 2,
        cdelt1=cdelt1,
        cdelt2=cdelt2,
    )
    return GriddedImage(pixels=pixels, wcs=wcs, min_ra=min_ra, max_ra=max_ra, min_dec=min_dec, max_dec=max_dec)


def test_append_disjoint_keeps_each_image_in_its_own_footprint():
    a = _make(11, 11, 0.0, 10.0, 0.0, 10.0, fill=1.0)
    b = _make(11, 11, 20.0, 30.0, 0.0, 10.0, fill=2.0)
    out = append_images(a, b)
    # The union spans 0..30; we should see both fills somewhere.
    assert (out.pixels == 1.0).any()
    assert (out.pixels == 2.0).any()


def test_append_overlap_uses_max():
    a = _make(11, 11, 0.0, 10.0, 0.0, 10.0, fill=1.0)
    b = _make(11, 11, 5.0, 15.0, 0.0, 10.0, fill=3.0)
    out = append_images(a, b)
    # Some overlap cell must contain 3.0 (the max).
    assert out.pixels.max() == 3.0
    # Cells covered only by `a` keep 1.0.
    assert (out.pixels == 1.0).any()


def test_superimpose_overlap_uses_weighted_average():
    a = _make(11, 11, 0.0, 10.0, 0.0, 10.0, fill=2.0)
    b = _make(11, 11, 5.0, 15.0, 0.0, 10.0, fill=6.0)
    out = superimpose_images(a, b, weight=0.5)
    # Overlap cells should be 0.5*2 + 0.5*6 = 4.0.
    assert np.any(np.isclose(out.pixels, 4.0))
    # Cells covered only by one image keep that image's fill.
    assert (out.pixels == 2.0).any()
    assert (out.pixels == 6.0).any()


def test_shift_translates_secondary_footprint():
    a = _make(11, 11, 0.0, 10.0, 0.0, 10.0, fill=1.0)
    b = _make(11, 11, 0.0, 10.0, 0.0, 10.0, fill=5.0)
    out = append_images(a, b, ra_shift_seconds=20.0)
    # After +20 shift in RA, b occupies 20..30; union spans 0..30; both fills present.
    assert out.min_ra <= 0.0 and out.max_ra >= 30.0
    assert (out.pixels == 1.0).any()
    assert (out.pixels == 5.0).any()


# ── Grid-budget guard (BUG-009) ──────────────────────────────────────────────

# Reproduces the FITS-vs-.img unit mismatch: a fine-cell primary in degrees
# unioned with a secondary whose bounds are in seconds-of-time would expand
# the output grid by ~240× per axis. We pick numbers that blow the 100 MP
# budget by an order of magnitude — closer to the user-reported (5269, 16M).
_FINE_PRIMARY = (100, 100, 0.0, 0.1, 0.0, 0.1)  # cell ≈ 0.001 per pixel
_MISMATCHED_SECONDARY = (50, 50, 1000.0, 2000.0, 0.0, 1.0)


def test_append_rejects_grid_explosion():
    primary = _make(*_FINE_PRIMARY, fill=1.0)
    secondary = _make(*_MISMATCHED_SECONDARY, fill=2.0)
    with pytest.raises(ValueError, match="combined sky area"):
        append_images(primary, secondary)


def test_superimpose_rejects_grid_explosion():
    primary = _make(*_FINE_PRIMARY, fill=1.0)
    secondary = _make(*_MISMATCHED_SECONDARY, fill=2.0)
    with pytest.raises(ValueError, match="combined sky area"):
        superimpose_images(primary, secondary)


def test_compose_within_budget_succeeds():
    # Regression guard: two compatible images must still compose without
    # tripping the budget check.
    a = _make(50, 50, 0.0, 1.0, 0.0, 1.0, fill=1.0)
    b = _make(50, 50, 0.5, 1.5, 0.0, 1.0, fill=2.0)
    out = append_images(a, b)
    assert out.pixels.size <= _GRID_CELL_BUDGET
    assert (out.pixels == 1.0).any()
    assert (out.pixels == 2.0).any()


# ── _normalize01 NaN-safety (BUG-013) ────────────────────────────────────────


def test_normalize01_linear_finite_input():
    arr = np.array([[0.0, 5.0], [10.0, 2.5]], dtype=np.float64)
    out = _normalize01(arr)
    assert out.min() == 0.0
    assert out.max() == 1.0
    assert out[0, 1] == 0.5
    assert out[1, 1] == 0.25


def test_normalize01_preserves_nan_through_stretch():
    # FITS NaN sentinels must not poison the rest of the channel; finite cells
    # still normalize to [0, 1] and the NaN cell stays NaN downstream so the
    # renderer can paint it as "no data" (BUG-013/-014).
    arr = np.array([[0.0, np.nan, 10.0], [5.0, 2.5, np.nan]], dtype=np.float64)
    out = _normalize01(arr)
    assert np.isnan(out[0, 1])
    assert np.isnan(out[1, 2])
    finite_vals = out[np.isfinite(out)]
    assert finite_vals.min() == 0.0
    assert finite_vals.max() == 1.0
    assert out[1, 0] == 0.5  # 5.0 maps to 0.5 in [0, 10]


def test_normalize01_all_nan_input_returns_all_nan():
    arr = np.full((3, 4), np.nan, dtype=np.float64)
    out = _normalize01(arr)
    assert out.shape == arr.shape
    assert np.isnan(out).all()


def test_normalize01_all_equal_finite_returns_zeros_for_finite_nan_for_rest():
    arr = np.array([[3.0, 3.0, np.nan], [3.0, np.nan, 3.0]], dtype=np.float64)
    out = _normalize01(arr)
    # Finite, all-equal → 0 (no range to stretch). NaN inputs stay NaN.
    assert out[0, 0] == 0.0 and out[0, 1] == 0.0
    assert np.isnan(out[0, 2])
    assert np.isnan(out[1, 1])


def test_normalize01_inf_is_treated_as_non_finite():
    arr = np.array([[0.0, 5.0], [np.inf, 10.0]], dtype=np.float64)
    out = _normalize01(arr)
    assert np.isnan(out[1, 0])
    assert out[0, 0] == 0.0
    assert out[1, 1] == 1.0
    assert out[0, 1] == 0.5


def test_normalize01_empty_input():
    arr = np.zeros((0, 0), dtype=np.float64)
    out = _normalize01(arr)
    assert out.shape == (0, 0)


# ── Coverage-aware compose (BUG-013 / BUG-014) ────────────────────────────────


def test_append_disjoint_gaps_render_as_nan():
    # The "no coverage" gutter between two disjoint footprints must be NaN so
    # the UI can paint it blank. Pre-BUG-014 it was 0.0 and rendered black.
    a = _make(11, 11, 0.0, 10.0, 0.0, 10.0, fill=1.0)
    b = _make(11, 11, 20.0, 30.0, 0.0, 10.0, fill=2.0)
    out = append_images(a, b)
    assert np.isnan(out.pixels).any(), "no-coverage gap should be NaN, not 0.0"
    # Covered cells still carry the input fills.
    finite = out.pixels[np.isfinite(out.pixels)]
    assert (finite == 1.0).any() and (finite == 2.0).any()


def test_bicolor_uncovered_cells_are_nan_per_channel():
    # Two disjoint images: each assigned channel covers its own footprint and
    # is NaN elsewhere. The cell at the gap between them is NaN in BOTH R and
    # G — the unused channel (B) is NaN there as well so the UI's any-NaN→white
    # rule fires.
    primary = _make(11, 11, 0.0, 10.0, 0.0, 10.0, fill=1.0)
    secondary = _make(11, 11, 20.0, 30.0, 0.0, 10.0, fill=2.0)
    out = bicolor_compose(primary, secondary, primary_channel="r", secondary_channel="g")
    # R covers primary's footprint only.
    r = out.pixels_r
    g = out.pixels_g
    b = out.pixels_b
    # There must exist a pixel where R is finite and G is NaN (primary-only).
    primary_only = np.isfinite(r) & np.isnan(g)
    assert primary_only.any(), "expected primary-only cells (R finite, G NaN)"
    secondary_only = np.isnan(r) & np.isfinite(g)
    assert secondary_only.any(), "expected secondary-only cells (R NaN, G finite)"
    # Gap (neither covered) must have NaN in every channel.
    gap = np.isnan(r) & np.isnan(g) & np.isnan(b)
    assert gap.any(), "expected fully-uncovered gap with NaN in every channel"
    # Covered cells in primary's R reach 1.0 (single-fill flat image → all
    # finite cells are 0 after _normalize01; widen the assertion).
    finite_r = r[np.isfinite(r)]
    assert finite_r.size > 0


def test_bicolor_same_image_each_channel_max_is_one():
    # Compose an image with itself: both R and G are independently normalized
    # so the brightest covered cell maps to 1.0 in each assigned channel.
    img = _make(11, 11, 0.0, 10.0, 0.0, 10.0, fill=1.0)
    # Vary one cell to give the channel an actual stretch range.
    img.pixels[5, 5] = 10.0
    out = bicolor_compose(img, img, primary_channel="r", secondary_channel="g")
    assert np.nanmax(out.pixels_r) == 1.0
    assert np.nanmax(out.pixels_g) == 1.0
    # B is the unused channel: covered cells are 0.0; uncovered cells are NaN.
    finite_b = out.pixels_b[np.isfinite(out.pixels_b)]
    assert finite_b.size > 0 and (finite_b == 0.0).all()


def test_tricolor_disjoint_inputs_each_channel_has_data():
    # Three images at three non-overlapping sky positions: bbox must be the
    # full 3-way union so the tertiary's footprint actually appears in B.
    # Pre-fix, _two_image_grid only used primary+secondary so the tertiary
    # was silently clipped off.
    primary = _make(11, 11, 0.0, 10.0, 0.0, 10.0, fill=1.0)
    primary.pixels[5, 5] = 5.0
    secondary = _make(11, 11, 20.0, 30.0, 0.0, 10.0, fill=2.0)
    secondary.pixels[5, 5] = 8.0
    tertiary = _make(11, 11, 0.0, 10.0, 20.0, 30.0, fill=3.0)
    tertiary.pixels[5, 5] = 9.0
    out = tricolor_compose(primary, secondary, tertiary)
    # bbox should span all three footprints.
    assert out.min_ra <= 0.0 and out.max_ra >= 30.0
    assert out.min_dec <= 0.0 and out.max_dec >= 30.0
    # Every channel must have finite cells reaching 1.0 — proves the tertiary
    # made it onto the grid alongside primary and secondary.
    for label, ch in (("R", out.pixels_r), ("G", out.pixels_g), ("B", out.pixels_b)):
        assert np.isfinite(ch).any(), f"{label} channel has no finite cells"
        assert np.nanmax(ch) == 1.0, f"{label} channel peak should normalize to 1.0"
    # Pairwise: primary-only cells (R finite, G/B NaN), etc., must exist.
    p_only = np.isfinite(out.pixels_r) & np.isnan(out.pixels_g) & np.isnan(out.pixels_b)
    s_only = np.isnan(out.pixels_r) & np.isfinite(out.pixels_g) & np.isnan(out.pixels_b)
    t_only = np.isnan(out.pixels_r) & np.isnan(out.pixels_g) & np.isfinite(out.pixels_b)
    assert p_only.any() and s_only.any() and t_only.any()


def test_tricolor_tertiary_shift_translates_tertiary_only():
    # Applying a tertiary shift moves the tertiary's footprint relative to
    # primary/secondary without disturbing the other inputs' positions.
    primary = _make(11, 11, 0.0, 10.0, 0.0, 10.0, fill=1.0)
    secondary = _make(11, 11, 0.0, 10.0, 0.0, 10.0, fill=2.0)
    tertiary = _make(11, 11, 0.0, 10.0, 0.0, 10.0, fill=3.0)
    shifted = tricolor_compose(
        primary, secondary, tertiary,
        tertiary_ra_shift_seconds=50.0,  # well outside the 0..10 bbox
    )
    # The bbox must grow on the high-RA side to include the shifted tertiary.
    assert shifted.max_ra >= 50.0
    # Tertiary-only cells exist beyond primary/secondary's footprint.
    t_only_far = np.isnan(shifted.pixels_r) & np.isnan(shifted.pixels_g) & np.isfinite(shifted.pixels_b)
    assert t_only_far.any()
    # Without the shift, secondary and tertiary would share the primary's
    # footprint and there'd be no tertiary-only cells.
    nominal = tricolor_compose(primary, secondary, tertiary)
    t_only_nominal = np.isnan(nominal.pixels_r) & np.isnan(nominal.pixels_g) & np.isfinite(nominal.pixels_b)
    assert not t_only_nominal.any()


def test_extend_rgb_grows_bbox_to_cover_new_image():
    # A bi-color "extended" with a third image at a disjoint sky position must
    # grow the output bbox so the new image's footprint isn't silently clipped.
    # Use varied flux values so each input's normalization range is non-degenerate
    # — uniform fills collapse to 0.0 after _normalize01 and fool the
    # unused-channel detection in extend_rgb_compose.
    primary = _make(11, 11, 0.0, 10.0, 0.0, 10.0, fill=1.0)
    primary.pixels[5, 5] = 7.0
    secondary = _make(11, 11, 0.0, 10.0, 0.0, 10.0, fill=2.0)
    secondary.pixels[5, 5] = 8.0
    bi = bicolor_compose(primary, secondary, primary_channel="r", secondary_channel="g")
    assert bi.min_ra == 0.0 and bi.max_ra == 10.0
    # New image entirely outside the bi-color's bbox on the high-RA side.
    other = _make(11, 11, 20.0, 30.0, 0.0, 10.0, fill=5.0)
    other.pixels[5, 5] = 9.0
    extended = extend_rgb_compose(bi, other)
    # bbox grew.
    assert extended.max_ra >= 30.0
    # B channel (the previously-unused one) now has finite cells in the
    # extended region.
    b_finite_in_ext = np.isfinite(extended.pixels_b).any()
    assert b_finite_in_ext, "extended bbox must carry the new image's data in B"
    # R and G still have finite cells where the bi-color's data lived; the
    # extension region must be NaN for them (BUG-014 contract).
    assert np.isfinite(extended.pixels_r).any()
    assert np.isfinite(extended.pixels_g).any()
    # There must be cells where R/G are NaN but B is finite (the new
    # image's exclusive footprint).
    new_only = np.isnan(extended.pixels_r) & np.isnan(extended.pixels_g) & np.isfinite(extended.pixels_b)
    assert new_only.any()
