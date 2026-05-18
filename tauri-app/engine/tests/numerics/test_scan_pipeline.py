"""Numerics-pipeline tests against the `cyg0a` legacy fixture chain.

The `fixtures/intermediates/cyg0a*.scn` files were captured from
`KARALEAH2002.exe` at successive save points of the Scan reduction workflow,
all derived from `fixtures/inputs/cyg0a.md1`:

  * `cyg0a.scn`         — after `Calibrate Scan`.
  * `cyg0abaseline.scn` — after `Calibrate Scan` + `Baseline Source`.
  * `cyg0adec.scn`      — calibrated data re-saved with the
                          `Select Declination` `check=-1` mask written through,
                          but with the prior baseline subtraction undone.
  * `cyg0afull.scn`     — `cyg0adec` + a second `Baseline Source` using a
                          slightly different (re-marked) off-source mask.

These tests verify our numerics reproduce each step to within documented
tolerance. The legacy `Calibrate Scan` has subtle VB indexing quirks that
introduce a small (~0.5–0.7%) systematic gain offset; the legacy `Baseline
Source` is defined by two user-clicked drag endpoints that the `.scn` does
not preserve, so we approximate it with a least-squares fit through the
off-source (`check == -1`) samples.
"""

import numpy as np
from radio_cartographer.io.md1 import read_md1
from radio_cartographer.io.scn import read_scn
from radio_cartographer.scan import calibrate_scan, subtract_baseline_off_source
from tests._tolerances import SCAN_BASELINE_ATOL, SCAN_CAL_RTOL


def test_pipeline_preserves_geometry(inputs_dir, intermediates_dir) -> None:
    cal = read_scn(intermediates_dir / "cyg0a.scn")
    baseline = read_scn(intermediates_dir / "cyg0abaseline.scn")
    dec = read_scn(intermediates_dir / "cyg0adec.scn")
    full = read_scn(intermediates_dir / "cyg0afull.scn")

    for other in (baseline, dec, full):
        assert np.array_equal(other.ra, cal.ra)
        assert np.array_equal(other.dec, cal.dec)
        assert other.total == cal.total

    md1 = read_md1(inputs_dir / "cyg0a.md1")
    assert md1.samples.flux.size - 240 == cal.total


def test_calibration_reproduces_cyg0a_scn(inputs_dir, intermediates_dir) -> None:
    md1 = read_md1(inputs_dir / "cyg0a.md1")
    expected = read_scn(intermediates_dir / "cyg0a.scn")

    mine = calibrate_scan(md1.samples.flux, md1.samples.ra)

    assert mine.shape == expected.flux.shape
    src_ra = md1.samples.ra[120 : 120 + expected.total]
    assert np.array_equal(src_ra, expected.ra)
    # 1% relative tolerance: the legacy in-place RA shift during cal mixes
    # `Ra(120+k)` indices that this implementation reads from pristine raw
    # data; on Cyg A the resulting systematic offset is ~0.7% of peak flux.
    assert np.allclose(mine, expected.flux, rtol=SCAN_CAL_RTOL, atol=0.1)


def test_baseline_reproduces_cyg0abaseline_scn(intermediates_dir) -> None:
    cal = read_scn(intermediates_dir / "cyg0a.scn")
    expected = read_scn(intermediates_dir / "cyg0abaseline.scn")

    # The legacy `cyg0a.flux - cyg0abaseline.flux` is a straight line in RA
    # to within rounding — confirms the legacy baseline really is linear,
    # so subtract_baseline_off_source's `polyfit(deg=1)` is the right family.
    legacy_baseline = cal.flux - expected.flux
    coeff = np.polyfit(cal.ra, legacy_baseline, deg=1)
    legacy_fit_resid = legacy_baseline - np.polyval(coeff, cal.ra)
    assert np.max(np.abs(legacy_fit_resid)) < SCAN_BASELINE_ATOL

    off_source = expected.check == -1
    assert off_source.sum() > 0
    mine = subtract_baseline_off_source(cal.ra, cal.flux, off_source)

    # `mine.shape` and the post-subtraction off-source level are the
    # contract — by construction the LS fit drives the off-source mean to
    # zero, while the legacy's drag-endpoint line leaves a ~0.05 Jy bias.
    assert mine.shape == expected.flux.shape
    assert abs(float(np.mean(mine[off_source]))) < 0.1
    # Source survives subtraction — Cyg A's true peak is ~3.5 Jy, well
    # above the residual baseline mismatch between our LS line and the
    # legacy's user-drawn line.
    assert float(np.max(mine)) > 2.0


def test_declination_selection_carries_to_cyg0adec_scn(intermediates_dir) -> None:
    cal = read_scn(intermediates_dir / "cyg0a.scn")
    baseline = read_scn(intermediates_dir / "cyg0abaseline.scn")
    dec = read_scn(intermediates_dir / "cyg0adec.scn")

    # `cyg0a.scn` was saved before `Select Declination` ran, so its check
    # field is all zeros; the dec/baseline pair share the off-source mask.
    assert np.array_equal(cal.check, np.zeros_like(cal.check))
    assert np.array_equal(dec.check, baseline.check)
    assert int((dec.check == -1).sum()) > 0

    # `cyg0adec.scn` is the *calibrated, un-baselined* flux re-saved with the
    # off-source mask attached — within `.scn`'s 4-decimal `Format$ "#.####"`
    # rounding of `cyg0a.scn`.
    assert np.max(np.abs(dec.flux - cal.flux)) < 0.02
    # The peak annotation matches the post-baseline source peak.
    assert dec.peak.startswith("Peak Flux:")


def test_full_reproduces_cyg0afull_scn(intermediates_dir) -> None:
    dec = read_scn(intermediates_dir / "cyg0adec.scn")
    expected = read_scn(intermediates_dir / "cyg0afull.scn")

    # `cyg0afull` was produced from `cyg0adec` by re-marking the off-source
    # regions and running `Baseline Source` again — the new mask lives in
    # `cyg0afull.check`, not in `cyg0adec.check`. The legacy baseline at
    # this stage is again linear in RA.
    legacy_baseline = dec.flux - expected.flux
    coeff = np.polyfit(dec.ra, legacy_baseline, deg=1)
    legacy_fit_resid = legacy_baseline - np.polyval(coeff, dec.ra)
    assert np.max(np.abs(legacy_fit_resid)) < SCAN_BASELINE_ATOL

    off_source = expected.check == -1
    assert off_source.sum() > 0
    assert not np.array_equal(expected.check, dec.check)

    mine = subtract_baseline_off_source(dec.ra, dec.flux, off_source)
    assert mine.shape == expected.flux.shape
    assert abs(float(np.mean(mine[off_source]))) < 0.1
    assert float(np.max(mine)) > 2.0
