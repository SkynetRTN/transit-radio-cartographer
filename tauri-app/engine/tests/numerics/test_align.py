import numpy as np
from radio_cartographer.scan import align_by_offset, align_dec_shifts
from tests._tolerances import ALIGN_ATOL


def test_align_with_zero_offset_is_noop() -> None:
    dec = np.linspace(0, 10, 200)
    flux = np.sin(dec)
    y = align_by_offset(dec, flux, offset=0.0)
    assert np.allclose(y, flux, atol=ALIGN_ATOL)


def test_align_corrects_known_shift() -> None:
    dec = np.linspace(0, 10, 200)
    flux = np.sin(dec)
    shifted = np.interp(dec, dec - 0.5, flux, left=flux[0], right=flux[-1])
    fixed = align_by_offset(dec, shifted, offset=0.5)
    assert np.allclose(fixed[10:-10], flux[10:-10], atol=1e-1)


def test_align_dec_shifts_zero_max_delta_is_noop() -> None:
    dec = np.linspace(0.0, 10.0, 400)
    flux_a = np.exp(-((dec - 5.0) ** 2) / 0.5)
    flux_b = np.exp(-((dec - 5.4) ** 2) / 0.5)
    deltas = align_dec_shifts([dec, dec], [flux_a, flux_b], max_delta_deg=0.0)
    assert deltas == [0.0, 0.0]


def test_align_dec_shifts_recovers_known_pair_offset() -> None:
    # Two identical Gaussian-feature sweeps offset by +0.4 deg in dec
    # (sweep b's feature is at HIGHER dec than sweep a's). The legacy
    # algorithm closes the gap by moving sweep a UP by 0.2 and sweep b
    # DOWN by 0.2 — both features land at ~5.2.
    dec = np.linspace(0.0, 10.0, 400)
    flux_a = np.exp(-((dec - 5.0) ** 2) / 0.5)
    flux_b = np.exp(-((dec - 5.4) ** 2) / 0.5)
    deltas = align_dec_shifts([dec, dec], [flux_a, flux_b], max_delta_deg=1.0)
    assert deltas[0] > 0.0 and deltas[1] < 0.0
    assert abs(deltas[0] - 0.2) < 0.03
    assert abs(deltas[1] - (-0.2)) < 0.03
    # After applying the shifts, the two feature centers should coincide.
    assert abs((5.0 + deltas[0]) - (5.4 + deltas[1])) < 0.06


def test_align_dec_shifts_closes_gap_for_three_sweeps() -> None:
    # Three sweeps with features at dec=5, 5.3, 5.6 — successive -0.3 lags.
    # Following the legacy weighted-blend formula
    # (vb/survform.frm:2723-2728), with roughly equal correlation strength
    # at both pairs the expected deltas are (+0.15, 0, -0.15): edge sweeps
    # move inward, the middle sweep stays put. The total spread halves.
    dec = np.linspace(0.0, 10.0, 400)
    centers = [5.0, 5.3, 5.6]
    fluxes = [np.exp(-((dec - c) ** 2) / 0.5) for c in centers]
    decs = [dec.copy() for _ in centers]
    deltas = align_dec_shifts(decs, fluxes, max_delta_deg=1.0)
    aligned_centers = [c + d for c, d in zip(centers, deltas)]
    spread_before = max(centers) - min(centers)
    spread_after = max(aligned_centers) - min(aligned_centers)
    assert spread_after < spread_before
    # Half the original spread within one grid cell of slop.
    assert abs(spread_after - spread_before / 2.0) < 0.05
    # Edge sweeps move inward; middle sweep barely moves.
    assert deltas[0] > 0.0
    assert deltas[2] < 0.0
    assert abs(deltas[1]) < 0.05


def test_align_dec_shifts_respects_max_delta_clamp() -> None:
    # Feature is offset by 1.0 deg between the two sweeps, but the user
    # restricts search to ±0.3 deg. The recovered shift must not exceed the
    # bound (matches vb/survform.frm:2710 `Break = DeltaDec/range * 384`).
    dec = np.linspace(0.0, 10.0, 400)
    flux_a = np.exp(-((dec - 5.0) ** 2) / 0.5)
    flux_b = np.exp(-((dec - 6.0) ** 2) / 0.5)
    deltas = align_dec_shifts([dec, dec], [flux_a, flux_b], max_delta_deg=0.3)
    # |delta[1] - delta[0]| is the closure applied to the pair; capped at 2*max_delta.
    assert abs(deltas[1] - deltas[0]) <= 0.3 + 1e-9
