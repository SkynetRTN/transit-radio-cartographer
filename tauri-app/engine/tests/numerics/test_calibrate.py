import numpy as np
from radio_cartographer.calibration import apply_calibration, fit_counts_to_jy
from radio_cartographer.io.cal import read_cal
from radio_cartographer.io.srv import read_srv
from tests._tolerances import CALIBRATION_RTOL


def test_calibration_fit_passes_through_origin(inputs_dir) -> None:
    # `fit_counts_to_jy` solves `min_G sum (m_i * G - k_i)^2` analytically —
    # the optimal gain is `G* = (m . k) / (m . m)` (no intercept term, so the
    # fit line passes through the origin). Verify the result is positive
    # *and* that the least-squares first-order optimality condition holds.
    cal = read_cal(inputs_dir / "cal25a.cal")
    gain = fit_counts_to_jy(cal)
    assert gain > 0

    m = np.array([e.measured_flux for e in cal.entries], dtype=np.float64)
    k = np.array([e.known_flux for e in cal.entries], dtype=np.float64)
    # d/dG [sum (m*G - k)^2] = 2 m . (m*G - k); zero at the optimum.
    dcost_dg = float(np.dot(m, m * gain - k))
    assert abs(dcost_dg) < CALIBRATION_RTOL * float(np.dot(m, k))


def test_calibration_converts_counts_to_jy(inputs_dir) -> None:
    cal = read_cal(inputs_dir / "cal25a.cal")
    gain = fit_counts_to_jy(cal)
    measured = np.array([e.measured_flux for e in cal.entries])
    known = np.array([e.known_flux for e in cal.entries])
    assert np.allclose(measured * gain, known, rtol=0.25)


def test_calibration_against_tutorial_cal18a(inputs_dir, intermediates_dir) -> None:
    # The plan names this test for `cal18a.cal`, but only `cal25a.cal` is
    # currently captured in `fixtures/inputs/` — fixture-parity gap tracked
    # in `agents/tauri_plan_phase_2.md`. The assertions below pin
    # `apply_calibration`'s observable behaviour against a real reduced
    # survey, which is what the test name's intent demands.
    cal = read_cal(inputs_dir / "cal25a.cal")
    survey = read_srv(intermediates_dir / "and0a.srv")
    gain = fit_counts_to_jy(cal)
    calibrated = apply_calibration(survey, cal)

    assert gain > 0.0
    assert calibrated.swp == survey.swp
    assert len(calibrated.sweeps) == len(survey.sweeps)

    # Sweep0 and every per-sweep flux must be scaled by `gain` to machine
    # precision; RA/Dec arrays must be preserved verbatim; each Sweep's
    # `calib` field records the applied gain so downstream code can
    # introspect what calibration the survey carries.
    assert np.allclose(calibrated.sweep0.flux, survey.sweep0.flux * gain, atol=0, rtol=1e-12)
    assert calibrated.sweep0.calib == gain
    for before, after in zip(survey.sweeps, calibrated.sweeps, strict=True):
        assert np.array_equal(before.ra, after.ra)
        assert np.array_equal(before.dec, after.dec)
        assert np.allclose(after.flux, before.flux * gain, atol=0, rtol=1e-12)
        assert after.calib == gain
