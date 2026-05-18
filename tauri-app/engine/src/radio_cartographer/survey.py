from __future__ import annotations

from collections.abc import Callable, Sequence
from dataclasses import replace
from pathlib import Path

import numpy as np

from .calibration import apply_calibration
from .image import GriddedImage, make_image
from .io.cal import read_cal
from .io.md2 import read_md2
from .models import RawSweep, Survey, Sweep
from .scan import align_by_offset, smooth_flux, subtract_baseline


def reduce_raw_sweep(raw: RawSweep) -> Sweep:
    return Sweep(
        ra=np.asarray(raw.ra, dtype=np.float64),
        dec=np.asarray(raw.dec, dtype=np.float64),
        flux=np.asarray(raw.flux, dtype=np.float64),
    )


def smooth_sweep(sweep: Sweep, window: int = 5) -> Sweep:
    return replace(sweep, flux=smooth_flux(sweep.flux, window=window))


def baseline_sweep(sweep: Sweep, degree: int = 1) -> Sweep:
    return replace(sweep, flux=subtract_baseline(sweep.dec, sweep.flux, degree=degree))


def align_sweep(sweep: Sweep, offset: float) -> Sweep:
    return replace(sweep, flux=align_by_offset(sweep.dec, sweep.flux, offset=offset))


def apply_to_survey(survey: Survey, op: str, **kwargs: float | int) -> Survey:
    ops: dict[str, Callable[[Sweep], Sweep]] = {
        "smooth": lambda s: smooth_sweep(s, int(kwargs.get("window", 5))),
        "baseline": lambda s: baseline_sweep(s, int(kwargs.get("degree", 1))),
        "align": lambda s: align_sweep(s, float(kwargs.get("offset", 0.0))),
    }
    fn = ops[op]
    sweeps: tuple[Sweep, ...] = tuple(fn(s) for s in survey.sweeps)
    return replace(survey, sweeps=sweeps)


def run_tutorial_survey_pipeline(
    md2_path: str | Path,
    calibration_path: str | Path,
    *,
    cuts: Sequence[tuple[int, int, int]] = (),
    smooth_window: int = 5,
    align_offset: float = 0.5,
    image_pix: int = 1,
    second_baseline: bool = True,
) -> tuple[Survey, GriddedImage]:
    md2 = read_md2(md2_path)
    sweeps = tuple(reduce_raw_sweep(s) for s in md2.sweeps)
    survey = Survey(label1=Path(md2_path).name, label2="", sweep_count=len(sweeps), swp=0, sweep0=sweeps[0], sweeps=sweeps)
    survey = apply_calibration(survey, read_cal(calibration_path))

    if cuts:
        cut_sweeps = list(survey.sweeps)
        for sweep_idx, start, end in cuts:
            s = cut_sweeps[sweep_idx]
            mask = np.ones(s.flux.shape[0], dtype=bool)
            mask[start:end] = False
            cut_sweeps[sweep_idx] = Sweep(ra=s.ra[mask], dec=s.dec[mask], flux=s.flux[mask], calib=s.calib)
        survey = replace(survey, sweeps=tuple(cut_sweeps))

    survey = apply_to_survey(survey, "baseline", degree=1)
    survey = apply_to_survey(survey, "smooth", window=smooth_window)
    if second_baseline:
        survey = apply_to_survey(survey, "baseline", degree=1)
    survey = apply_to_survey(survey, "align", offset=align_offset)
    return survey, make_image(survey, pix=image_pix)
