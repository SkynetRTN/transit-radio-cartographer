"""Append + superimpose: composition rules and overlap math."""

from __future__ import annotations

import dataclasses

import numpy as np
import pytest

from radio_cartographer.image import GriddedImage, WCSMetadata
from radio_cartographer.image_compose import (
    _GRID_CELL_BUDGET,
    _normalize01,
    _ra_wrap_shifts,
    append_images,
    append_images_multi,
    bicolor_compose,
    extend_rgb_compose,
    superimpose_images,
    superimpose_images_multi,
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


def test_chained_append_keeps_new_data_over_composite_nan_gutter():
    # Regression for bug #29: a composite primary carries NaN "no data" cells
    # inside its bounding box (here: the dec 10..20 gutter between a and b).
    # Appending c into that gutter must show c's flux, not blank it to NaN
    # via maximum(NaN, x).
    a = _make(11, 11, 0.0, 10.0, 0.0, 10.0, fill=1.0)
    b = _make(11, 11, 0.0, 10.0, 20.0, 30.0, fill=2.0)
    ab = append_images(a, b)
    assert np.isnan(ab.pixels).any()  # the gutter exists
    c = _make(11, 11, 0.0, 10.0, 12.0, 18.0, fill=9.0)
    out = append_images(ab, c)
    assert (out.pixels == 9.0).any(), "c's data must survive the NaN gutter"
    # And the same through superimpose: one-sided cells take the covering
    # input's value instead of NaN-poisoning the blend.
    out_s = superimpose_images(ab, c)
    assert (out_s.pixels == 9.0).any()


def test_superimpose_multi_mean_ignores_composite_nan_cells():
    # Regression for bug #33: the N-way mean must not count a composite
    # primary's interior NaN cells as coverage.
    a = _make(11, 11, 0.0, 10.0, 0.0, 10.0, fill=1.0)
    b = _make(11, 11, 0.0, 10.0, 20.0, 30.0, fill=2.0)
    ab = append_images(a, b)
    c = _make(11, 11, 0.0, 10.0, 12.0, 18.0, fill=9.0)
    out = superimpose_images_multi(ab, [c])
    assert (out.pixels == 9.0).any(), "c alone covers the gutter; mean is c"


def test_append_uses_finest_cell_independent_of_open_order():
    # Different pixel sizes: a coarse wide map (cell = 10) and a fine small map
    # (cell = 0.1). The composite must adopt the FINEST input's cell regardless
    # of which image is the primary, so no map is downsampled to whichever
    # happened to be open first.
    coarse = _make(11, 11, 0.0, 100.0, 0.0, 100.0, fill=1.0)  # cell = 100/10 = 10
    fine = _make(101, 101, 0.0, 10.0, 0.0, 10.0, fill=2.0)  # cell = 10/100 = 0.1
    coarse_primary = append_images(coarse, fine)
    fine_primary = append_images(fine, coarse)
    # Same (fine) grid either way — resolution is open-order independent.
    assert coarse_primary.pixels.shape == fine_primary.pixels.shape
    # And it's the fine cell (~0.1), not the coarse one (10).
    assert abs(coarse_primary.wcs.cdelt2) < 1.0
    assert abs(fine_primary.wcs.cdelt2) < 1.0


def test_append_multi_uses_finest_cell_across_all_inputs():
    # The finest map is neither the primary nor first in `others` — its cell
    # must still drive the output grid.
    coarse = _make(11, 11, 0.0, 100.0, 0.0, 100.0, fill=1.0)  # cell = 10
    mid = _make(21, 21, 0.0, 100.0, 0.0, 100.0, fill=2.0)  # cell = 5
    fine = _make(201, 201, 0.0, 100.0, 0.0, 100.0, fill=3.0)  # cell = 0.5
    out = append_images_multi(coarse, [mid, fine])
    # Grid adopts the finest (0.5) cell → ~201 cells across the 100-wide span.
    assert out.pixels.shape[1] >= 190
    assert abs(out.wcs.cdelt1) < 1.0


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


# ── N-way append (single-resnap multi-file compose) ──────────────────────────


def test_append_multi_requires_at_least_one_other():
    a = _make(11, 11, 0.0, 10.0, 0.0, 10.0, fill=1.0)
    with pytest.raises(ValueError, match="at least one"):
        append_images_multi(a, [])


def test_append_multi_shifts_length_must_match():
    a = _make(11, 11, 0.0, 10.0, 0.0, 10.0, fill=1.0)
    b = _make(11, 11, 10.0, 20.0, 0.0, 10.0, fill=2.0)
    with pytest.raises(ValueError, match="shifts length"):
        append_images_multi(a, [b], shifts=[(0.0, 0.0), (0.0, 0.0)])


def test_append_multi_places_every_input():
    # Four disjoint maps along RA: all four fills must survive on one grid.
    a = _make(11, 11, 0.0, 10.0, 0.0, 10.0, fill=1.0)
    b = _make(11, 11, 10.0, 20.0, 0.0, 10.0, fill=2.0)
    c = _make(11, 11, 20.0, 30.0, 0.0, 10.0, fill=3.0)
    d = _make(11, 11, 30.0, 40.0, 0.0, 10.0, fill=4.0)
    out = append_images_multi(a, [b, c, d])
    finite = out.pixels[np.isfinite(out.pixels)]
    for fill in (1.0, 2.0, 3.0, 4.0):
        assert (finite == fill).any(), f"fill {fill} missing from multi-append"
    assert out.min_ra <= 0.0 and out.max_ra >= 40.0


def test_append_multi_overlap_takes_max_and_is_order_independent():
    # Three overlapping maps at the same footprint with different fills: every
    # cell should be the max (3.0), regardless of argument order.
    a = _make(11, 11, 0.0, 10.0, 0.0, 10.0, fill=1.0)
    b = _make(11, 11, 0.0, 10.0, 0.0, 10.0, fill=3.0)
    c = _make(11, 11, 0.0, 10.0, 0.0, 10.0, fill=2.0)
    out1 = append_images_multi(a, [b, c])
    out2 = append_images_multi(c, [b, a])
    assert np.nanmax(out1.pixels) == 3.0
    # Same primary footprint → same grid; results match cell-for-cell.
    np.testing.assert_allclose(out1.pixels, out2.pixels, equal_nan=True)


def test_append_multi_matches_pairwise_when_grid_is_stable():
    # When the primary already spans the full union (others fall inside it), no
    # regrid drift occurs and the one-shot multi result equals the pairwise
    # fold cell-for-cell — a correctness anchor for the max semantics.
    base = _make(21, 21, 0.0, 20.0, 0.0, 20.0, fill=1.0)
    base.pixels[5, 5] = 9.0
    b = _make(11, 11, 5.0, 10.0, 5.0, 10.0, fill=2.0)
    c = _make(11, 11, 10.0, 15.0, 10.0, 15.0, fill=4.0)
    multi = append_images_multi(base, [b, c])
    pair = append_images(append_images(base, b), c)
    assert multi.pixels.shape == pair.pixels.shape
    np.testing.assert_allclose(multi.pixels, pair.pixels, equal_nan=True)


def test_append_multi_unwraps_ra_seam():
    # Several maps straddling the 0h/24h seam compose into a compact grid.
    a = _make(*_NEAR_24H, fill=1.0)
    b = _make(*_NEAR_0H, fill=2.0)
    c = _make(11, 11, 84600.0, 86400.0, 0.0, 10.0, fill=3.0)  # ~23.5h–24h
    out = append_images_multi(a, [b, c])
    assert out.pixels.shape[1] < 100, "seam-straddling multi-append should stay compact"
    assert out.max_ra > 86400.0
    finite = out.pixels[np.isfinite(out.pixels)]
    for fill in (1.0, 2.0, 3.0):
        assert (finite == fill).any()


def test_append_multi_rejects_grid_explosion():
    primary = _make(*_FINE_PRIMARY, fill=1.0)
    secondary = _make(*_MISMATCHED_SECONDARY, fill=2.0)
    with pytest.raises(ValueError, match="combined sky area"):
        append_images_multi(primary, [secondary])


# ── N-way superimpose (equal-weight blend) ───────────────────────────────────


def test_superimpose_multi_requires_at_least_one_other():
    a = _make(11, 11, 0.0, 10.0, 0.0, 10.0, fill=1.0)
    with pytest.raises(ValueError, match="at least one"):
        superimpose_images_multi(a, [])


def test_superimpose_multi_shifts_length_must_match():
    a = _make(11, 11, 0.0, 10.0, 0.0, 10.0, fill=1.0)
    b = _make(11, 11, 10.0, 20.0, 0.0, 10.0, fill=2.0)
    with pytest.raises(ValueError, match="shifts length"):
        superimpose_images_multi(a, [b], shifts=[(0.0, 0.0), (0.0, 0.0)])


def test_superimpose_multi_overlap_is_equal_weight_mean():
    # Three fully-overlapping maps with fills 3, 6, 9 → every covered cell is the
    # mean (6.0), regardless of argument order.
    a = _make(11, 11, 0.0, 10.0, 0.0, 10.0, fill=3.0)
    b = _make(11, 11, 0.0, 10.0, 0.0, 10.0, fill=6.0)
    c = _make(11, 11, 0.0, 10.0, 0.0, 10.0, fill=9.0)
    out1 = superimpose_images_multi(a, [b, c])
    out2 = superimpose_images_multi(c, [b, a])
    finite = out1.pixels[np.isfinite(out1.pixels)]
    assert np.allclose(finite, 6.0)
    np.testing.assert_allclose(out1.pixels, out2.pixels, equal_nan=True)


def test_superimpose_multi_partial_overlap_averages_only_covering_inputs():
    # a covers 0..10, b covers 5..15, both fill 2 and 6. The overlap (5..10) is
    # the mean (4.0); a-only cells keep 2.0; b-only cells keep 6.0. This matches
    # pairwise superimpose at weight 0.5.
    a = _make(11, 11, 0.0, 10.0, 0.0, 10.0, fill=2.0)
    b = _make(11, 11, 5.0, 15.0, 0.0, 10.0, fill=6.0)
    out = superimpose_images_multi(a, [b])
    assert np.any(np.isclose(out.pixels, 4.0))
    assert (out.pixels == 2.0).any()
    assert (out.pixels == 6.0).any()


def test_superimpose_multi_matches_pairwise_half_weight():
    # Two overlapping maps: the one-shot multi result equals pairwise
    # superimpose at weight 0.5 cell-for-cell (both are the equal-weight mean).
    a = _make(21, 21, 0.0, 20.0, 0.0, 20.0, fill=2.0)
    a.pixels[5, 5] = 10.0
    b = _make(11, 11, 5.0, 15.0, 5.0, 15.0, fill=8.0)
    multi = superimpose_images_multi(a, [b])
    pair = superimpose_images(a, b, weight=0.5)
    assert multi.pixels.shape == pair.pixels.shape
    np.testing.assert_allclose(multi.pixels, pair.pixels, equal_nan=True)


def test_superimpose_multi_disjoint_gaps_render_as_nan():
    a = _make(11, 11, 0.0, 10.0, 0.0, 10.0, fill=1.0)
    b = _make(11, 11, 20.0, 30.0, 0.0, 10.0, fill=2.0)
    out = superimpose_images_multi(a, [b])
    assert np.isnan(out.pixels).any(), "no-coverage gap should be NaN, not 0.0"
    finite = out.pixels[np.isfinite(out.pixels)]
    assert (finite == 1.0).any() and (finite == 2.0).any()


def test_superimpose_multi_rejects_grid_explosion():
    primary = _make(*_FINE_PRIMARY, fill=1.0)
    secondary = _make(*_MISMATCHED_SECONDARY, fill=2.0)
    with pytest.raises(ValueError, match="combined sky area"):
        superimpose_images_multi(primary, [secondary])


# ── Flux-calibration state propagates through compose ────────────────────────
#
# The "this map is flux-calibrated" fact lives only in the `.img` unit suffix on
# disk, so a composite must carry it (unit="Jy", flux_calibrated=True) whenever
# every input is calibrated — otherwise saving the composite and reopening it in
# a fresh instance (no .cal loaded) would show it as uncalibrated.


def _cal(img: GriddedImage) -> GriddedImage:
    """Mark an image flux-calibrated (Jy), as apply_flux_calibration_image does."""
    return dataclasses.replace(img, unit="Jy", flux_calibrated=True, flux_slope=2.0)


def test_append_both_calibrated_composite_is_calibrated():
    a = _cal(_make(11, 11, 0.0, 10.0, 0.0, 10.0, fill=1.0))
    b = _cal(_make(11, 11, 5.0, 15.0, 0.0, 10.0, fill=3.0))
    out = append_images(a, b)
    assert out.flux_calibrated is True
    assert out.unit == "Jy"
    # A composite blends sources, so it isn't single-slope revertible.
    assert out.flux_slope is None


def test_superimpose_both_calibrated_composite_is_calibrated():
    a = _cal(_make(11, 11, 0.0, 10.0, 0.0, 10.0, fill=2.0))
    b = _cal(_make(11, 11, 5.0, 15.0, 0.0, 10.0, fill=6.0))
    out = superimpose_images(a, b, weight=0.5)
    assert out.flux_calibrated is True
    assert out.unit == "Jy"


def test_compose_mixed_calibration_is_not_calibrated():
    # One calibrated (Jy), one not: the composite can't claim a Jy scale.
    a = _cal(_make(11, 11, 0.0, 10.0, 0.0, 10.0, fill=1.0))
    b = _make(11, 11, 5.0, 15.0, 0.0, 10.0, fill=3.0)  # unit=None, uncalibrated
    out = append_images(a, b)
    assert out.flux_calibrated is False


def test_append_multi_all_calibrated_composite_is_calibrated():
    a = _cal(_make(11, 11, 0.0, 10.0, 0.0, 10.0, fill=1.0))
    b = _cal(_make(11, 11, 10.0, 20.0, 0.0, 10.0, fill=2.0))
    c = _cal(_make(11, 11, 20.0, 30.0, 0.0, 10.0, fill=3.0))
    out = append_images_multi(a, [b, c])
    assert out.flux_calibrated is True
    assert out.unit == "Jy"


def test_append_multi_one_uncalibrated_is_not_calibrated():
    a = _cal(_make(11, 11, 0.0, 10.0, 0.0, 10.0, fill=1.0))
    b = _cal(_make(11, 11, 10.0, 20.0, 0.0, 10.0, fill=2.0))
    c = _make(11, 11, 20.0, 30.0, 0.0, 10.0, fill=3.0)  # uncalibrated
    out = append_images_multi(a, [b, c])
    assert out.flux_calibrated is False


def test_superimpose_multi_all_calibrated_composite_is_calibrated():
    a = _cal(_make(11, 11, 0.0, 10.0, 0.0, 10.0, fill=2.0))
    b = _cal(_make(11, 11, 5.0, 15.0, 0.0, 10.0, fill=6.0))
    out = superimpose_images_multi(a, [b])
    assert out.flux_calibrated is True
    assert out.unit == "Jy"


def test_compose_all_gcu_preserves_gcu_label_uncalibrated():
    # Same agreed unit (GCU) but not flux-calibrated: keep the label, stay
    # uncalibrated so a later .cal load can still promote it.
    a = dataclasses.replace(_make(11, 11, 0.0, 10.0, 0.0, 10.0, fill=1.0), unit="GCU")
    b = dataclasses.replace(_make(11, 11, 5.0, 15.0, 0.0, 10.0, fill=3.0), unit="GCU")
    out = append_images(a, b)
    assert out.flux_calibrated is False
    assert out.unit == "GCU"


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


# ── RA 0h/24h seam wraparound (legacy survform.frm 12h rule) ─────────────────

# RA is stored in seconds of time: seam at 0 == 86400, 12h threshold at 43200.
# Two maps straddling the seam (one just before 24h, one just after 0h) must
# unwrap onto a continuous axis instead of unioning into a ~24h-wide grid that
# either blows the cell budget ("won't append") or scatters the maps apart.
_NEAR_24H = (11, 11, 82800.0, 86400.0, 0.0, 10.0)   # RA ~23h–24h
_NEAR_0H = (11, 11, 0.0, 3600.0, 0.0, 10.0)         # RA ~0h–1h


def test_ra_wrap_shifts_straddling_seam_bumps_low_side():
    # One footprint reaches past 12h → the sub-12h footprint is the wrapped one
    # and gets +24h (86400s).
    assert _ra_wrap_shifts(86400.0, 3600.0) == (0.0, 86400.0)
    assert _ra_wrap_shifts(3600.0, 86400.0) == (86400.0, 0.0)


def test_ra_wrap_shifts_both_same_side_is_noop():
    # Both below 12h (no input past the seam) → no shift.
    assert _ra_wrap_shifts(3600.0, 7200.0) == (0.0, 0.0)
    # Both above 12h (a normal high-RA mosaic) → no shift.
    assert _ra_wrap_shifts(50000.0, 60000.0) == (0.0, 0.0)


def test_ra_wrap_shifts_three_inputs():
    # Generalizes to the tri-color case: only the sub-12h inputs move.
    assert _ra_wrap_shifts(84000.0, 1800.0, 85000.0) == (0.0, 86400.0, 0.0)


def test_append_across_seam_stays_compact_and_keeps_both():
    # Regression for the user report: appending maps that straddle the 0h/24h
    # seam previously produced a ~24h-wide grid — rejected by the budget guard
    # ("won't append"). With the 12h unwrap the union is a compact ~2h span.
    a = _make(*_NEAR_24H, fill=1.0)
    b = _make(*_NEAR_0H, fill=2.0)
    out = append_images(a, b)  # must not raise on the budget guard
    # Union is ~2h wide (82800..90000), not ~24h — a couple dozen cells across.
    assert out.pixels.shape[1] < 100, "seam-straddling append should stay compact"
    assert out.pixels.size <= _GRID_CELL_BUDGET
    # The low-side map was unwrapped past 24h onto the continuous axis.
    assert out.max_ra > 86400.0
    # Both maps actually landed on the grid.
    finite = out.pixels[np.isfinite(out.pixels)]
    assert (finite == 1.0).any() and (finite == 2.0).any()


def test_append_across_seam_symmetric_in_argument_order():
    # Whichever map is primary, the unwrap produces the same compact union.
    a = _make(*_NEAR_24H, fill=1.0)
    b = _make(*_NEAR_0H, fill=2.0)
    out_ab = append_images(a, b)
    out_ba = append_images(b, a)
    assert out_ab.max_ra - out_ab.min_ra == pytest.approx(out_ba.max_ra - out_ba.min_ra)
    for out in (out_ab, out_ba):
        finite = out.pixels[np.isfinite(out.pixels)]
        assert (finite == 1.0).any() and (finite == 2.0).any()


def test_bicolor_across_seam_places_both_channels():
    a = _make(*_NEAR_24H, fill=1.0)
    a.pixels[5, 5] = 7.0
    b = _make(*_NEAR_0H, fill=2.0)
    b.pixels[5, 5] = 8.0
    out = bicolor_compose(a, b, primary_channel="r", secondary_channel="g")
    assert out.pixels_r.shape[1] < 100
    # Each assigned channel covers its own map's footprint somewhere.
    assert np.isfinite(out.pixels_r).any()
    assert np.isfinite(out.pixels_g).any()
    r_only = np.isfinite(out.pixels_r) & np.isnan(out.pixels_g)
    g_only = np.isnan(out.pixels_r) & np.isfinite(out.pixels_g)
    assert r_only.any() and g_only.any()


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
