from __future__ import annotations

import numpy as np

from radio_cartographer.models import Sweep, Survey
from radio_cartographer.scan import align_flux, baseline_subtract, smooth_flux


def smooth_survey(survey: Survey, window: int = 5) -> Survey:
    sweeps = tuple(Sweep(s.ra, s.dec, smooth_flux(s.flux, window), s.min_dec, s.max_dec, s.min_flux, s.max_flux, s.calib) for s in survey.sweeps)
    return Survey(survey.label1, survey.label2, survey.sweep_count, survey.swp, survey.sweep0, sweeps)


def baseline_survey(survey: Survey) -> Survey:
    sweeps = tuple(Sweep(s.ra, s.dec, baseline_subtract(s.flux), s.min_dec, s.max_dec, s.min_flux, s.max_flux, s.calib) for s in survey.sweeps)
    return Survey(survey.label1, survey.label2, survey.sweep_count, survey.swp, survey.sweep0, sweeps)


def align_survey(survey: Survey, shift_samples: float) -> Survey:
    sweeps = tuple(Sweep(s.ra, s.dec, align_flux(s.flux, shift_samples), s.min_dec, s.max_dec, s.min_flux, s.max_flux, s.calib) for s in survey.sweeps)
    return Survey(survey.label1, survey.label2, survey.sweep_count, survey.swp, survey.sweep0, sweeps)
