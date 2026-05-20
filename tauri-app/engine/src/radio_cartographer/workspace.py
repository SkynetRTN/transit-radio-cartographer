"""Survey workspace — stateful container that backs the interactive UI.

A `.md2` survey file contains a sequence of sweeps. By convention used in the
fixtures and confirmed against the legacy app:

- The first two sweeps are the **initial calibration bracket**:
  sweep 0 is the cal-on measurement, sweep 1 is cal-off.
- The last two sweeps are the **terminal calibration bracket** (same layout).
- Every sweep in between is a **source sweep** — the actual survey samples.

`Cal1 = mean(initial_cal_on.flux) - mean(initial_cal_off.flux)` is the gain
voltage at the start of the survey, `Cal2` similarly at the end. These match
the "Initial: V" / "Terminal: V" readouts in the legacy "Calibrate Survey"
screen.

The `SurveyWorkspace` keeps the raw sweeps untouched and tracks which cal
samples have been masked out (e.g. by the user dragging "Cut Segment" on the
calibration view). Cuts are stored on an undo stack so the user can revert.
Once the user clicks **Calibrate Survey**, `apply_gain_calibration` divides
each source sweep's flux by a linearly-interpolated cal voltage between
`Cal1` and `Cal2`, marking the workspace as calibrated.
"""

from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np
from numpy.typing import NDArray

from .models import MD2Document, RawSweep, Survey, Sweep
from .scan import align_dec_shifts, smooth_flux, subtract_baseline


@dataclass(frozen=True)
class CalBracket:
    """One cal bracket — the cal-on and cal-off raw sweeps and their masks."""

    cal_on: RawSweep
    cal_off: RawSweep
    cal_on_mask: NDArray[np.bool_]
    cal_off_mask: NDArray[np.bool_]

    def kept_on_flux(self) -> NDArray[np.float64]:
        return self.cal_on.flux[self.cal_on_mask]

    def kept_off_flux(self) -> NDArray[np.float64]:
        return self.cal_off.flux[self.cal_off_mask]

    def cal_value(self) -> float:
        on = self.kept_on_flux()
        off = self.kept_off_flux()
        if on.size == 0 or off.size == 0:
            return 0.0
        return float(on.mean() - off.mean())


@dataclass
class SurveyWorkspace:
    """Interactive workspace wrapping a parsed `.md2` survey."""

    name: str
    path: str
    md2: MD2Document
    initial: CalBracket
    terminal: CalBracket
    source_sweeps: tuple[RawSweep, ...]
    calibrated_source_flux: tuple[NDArray[np.float64], ...] | None = None
    # Pre-image reductions stored on the workspace. `reduced_source_flux`
    # tracks smooth/baseline output (per-sweep flux *after* every reduction
    # the user has invoked); `reduced_source_dec` tracks Align Sweeps output
    # (per-sweep dec arrays shifted to align adjacent sweeps). The pre-image
    # uses whichever is set, falling back to calibrated/raw below.
    reduced_source_flux: tuple[NDArray[np.float64], ...] | None = None
    reduced_source_dec: tuple[NDArray[np.float64], ...] | None = None
    undo_stack: list[dict[str, NDArray[np.bool_]]] = field(default_factory=list)
    initial_enabled: bool = True
    terminal_enabled: bool = True
    # Flux calibration (.cal slope) state — applied on top of gain calibration.
    # `flux_slope` is the Jy/GCU multiplier; `flux_calibrated` flips true after
    # `apply_flux_calibration` scales every flux array in place.
    flux_calibrated: bool = False
    flux_slope: float | None = None

    @property
    def source_count(self) -> int:
        return len(self.source_sweeps)

    @property
    def calibrated(self) -> bool:
        return self.calibrated_source_flux is not None

    def cal1(self) -> float:
        return self.initial.cal_value() if self.initial_enabled else 0.0

    def cal2(self) -> float:
        return self.terminal.cal_value() if self.terminal_enabled else 0.0


def build_workspace(path: str, md2: MD2Document) -> SurveyWorkspace:
    """Classify cal vs source sweeps and produce a fresh workspace.

    Recognises the standard `.md2` layout (2 initial cal + N source + 2
    terminal cal). Raises ValueError for shorter files that can't accommodate
    the brackets — the UI should handle that error and refuse to open.
    """
    sweeps = list(md2.sweeps)
    if len(sweeps) < 5:
        raise ValueError(
            f".md2 survey must have at least 5 sweeps (2 initial cal + 1 source + 2 terminal cal), "
            f"got {len(sweeps)}"
        )
    initial = CalBracket(
        cal_on=sweeps[0],
        cal_off=sweeps[1],
        cal_on_mask=np.ones(sweeps[0].flux.shape[0], dtype=bool),
        cal_off_mask=np.ones(sweeps[1].flux.shape[0], dtype=bool),
    )
    terminal = CalBracket(
        cal_on=sweeps[-2],
        cal_off=sweeps[-1],
        cal_on_mask=np.ones(sweeps[-2].flux.shape[0], dtype=bool),
        cal_off_mask=np.ones(sweeps[-1].flux.shape[0], dtype=bool),
    )
    source = tuple(sweeps[2:-2])
    if not source:
        raise ValueError(".md2 survey has no source sweeps between cal brackets")
    name = path.rsplit("/", 1)[-1].rsplit("\\", 1)[-1].rsplit(".", 1)[0].upper()
    return SurveyWorkspace(
        name=name,
        path=path,
        md2=md2,
        initial=initial,
        terminal=terminal,
        source_sweeps=source,
    )


def cut_calibration_segment(
    workspace: SurveyWorkspace,
    ra_min: float,
    ra_max: float,
) -> int:
    """Mask cal samples whose RA falls in [ra_min, ra_max]. Returns # removed.

    Records the prior masks on the undo stack so `undo_cut` can revert.
    """
    if ra_min > ra_max:
        ra_min, ra_max = ra_max, ra_min

    snapshot: dict[str, NDArray[np.bool_]] = {
        "initial_on": workspace.initial.cal_on_mask.copy(),
        "initial_off": workspace.initial.cal_off_mask.copy(),
        "terminal_on": workspace.terminal.cal_on_mask.copy(),
        "terminal_off": workspace.terminal.cal_off_mask.copy(),
    }

    def _apply(sweep: RawSweep, mask: NDArray[np.bool_]) -> tuple[NDArray[np.bool_], int]:
        in_range = (sweep.ra >= ra_min) & (sweep.ra <= ra_max)
        removed_here = int((mask & in_range).sum())
        return mask & ~in_range, removed_here

    new_initial_on, r1 = _apply(workspace.initial.cal_on, workspace.initial.cal_on_mask)
    new_initial_off, r2 = _apply(workspace.initial.cal_off, workspace.initial.cal_off_mask)
    new_terminal_on, r3 = _apply(workspace.terminal.cal_on, workspace.terminal.cal_on_mask)
    new_terminal_off, r4 = _apply(workspace.terminal.cal_off, workspace.terminal.cal_off_mask)
    removed = r1 + r2 + r3 + r4

    if removed == 0:
        return 0

    workspace.initial = CalBracket(
        cal_on=workspace.initial.cal_on,
        cal_off=workspace.initial.cal_off,
        cal_on_mask=new_initial_on,
        cal_off_mask=new_initial_off,
    )
    workspace.terminal = CalBracket(
        cal_on=workspace.terminal.cal_on,
        cal_off=workspace.terminal.cal_off,
        cal_on_mask=new_terminal_on,
        cal_off_mask=new_terminal_off,
    )
    workspace.undo_stack.append(snapshot)
    return removed


def select_calibration_declination(
    workspace: SurveyWorkspace,
    dec_min: float,
    dec_max: float,
    bracket: str,
) -> int:
    """Keep cal samples whose Dec falls in [dec_min, dec_max] for one bracket.

    Mirrors `cut_calibration_segment` but inverts the predicate (removes
    samples *outside* the selection) and scopes the change to a single
    bracket. Pre- and post-survey cal brackets typically point at slightly
    different declinations, so applying one bracket's selection to both would
    over-cut the other bracket. `bracket` must be either `"initial"` or
    `"terminal"`. Records the prior masks on the undo stack so `undo_cut` can
    revert.
    """
    if bracket not in ("initial", "terminal"):
        raise ValueError(f"bracket must be 'initial' or 'terminal', got {bracket!r}")
    if dec_min > dec_max:
        dec_min, dec_max = dec_max, dec_min

    snapshot: dict[str, NDArray[np.bool_]] = {
        "initial_on": workspace.initial.cal_on_mask.copy(),
        "initial_off": workspace.initial.cal_off_mask.copy(),
        "terminal_on": workspace.terminal.cal_on_mask.copy(),
        "terminal_off": workspace.terminal.cal_off_mask.copy(),
    }

    def _apply(sweep: RawSweep, mask: NDArray[np.bool_]) -> tuple[NDArray[np.bool_], int]:
        in_range = (sweep.dec >= dec_min) & (sweep.dec <= dec_max)
        removed_here = int((mask & ~in_range).sum())
        return mask & in_range, removed_here

    if bracket == "initial":
        new_on, r1 = _apply(workspace.initial.cal_on, workspace.initial.cal_on_mask)
        new_off, r2 = _apply(workspace.initial.cal_off, workspace.initial.cal_off_mask)
        removed = r1 + r2
        if removed == 0:
            return 0
        workspace.initial = CalBracket(
            cal_on=workspace.initial.cal_on,
            cal_off=workspace.initial.cal_off,
            cal_on_mask=new_on,
            cal_off_mask=new_off,
        )
    else:
        new_on, r1 = _apply(workspace.terminal.cal_on, workspace.terminal.cal_on_mask)
        new_off, r2 = _apply(workspace.terminal.cal_off, workspace.terminal.cal_off_mask)
        removed = r1 + r2
        if removed == 0:
            return 0
        workspace.terminal = CalBracket(
            cal_on=workspace.terminal.cal_on,
            cal_off=workspace.terminal.cal_off,
            cal_on_mask=new_on,
            cal_off_mask=new_off,
        )

    workspace.undo_stack.append(snapshot)
    return removed


def undo_cut(workspace: SurveyWorkspace) -> bool:
    """Revert the most recent `cut_calibration_segment`. Returns True if undone."""
    if not workspace.undo_stack:
        return False
    snap = workspace.undo_stack.pop()
    workspace.initial = CalBracket(
        cal_on=workspace.initial.cal_on,
        cal_off=workspace.initial.cal_off,
        cal_on_mask=snap["initial_on"],
        cal_off_mask=snap["initial_off"],
    )
    workspace.terminal = CalBracket(
        cal_on=workspace.terminal.cal_on,
        cal_off=workspace.terminal.cal_off,
        cal_on_mask=snap["terminal_on"],
        cal_off_mask=snap["terminal_off"],
    )
    return True


def apply_gain_calibration(workspace: SurveyWorkspace) -> None:
    """Apply the noise-injection bracket gain calibration to every source sweep.

    For each source sweep at fractional position `t = i / (N-1)` along the
    sequence, the per-sweep cal voltage is the linear interpolation
    `cal(t) = (1 - t) * Cal1 + t * Cal2`. The calibrated flux is
    `raw_flux / cal(t)` — converting from raw volts to a unitless gain-
    corrected signal.

    Stores the calibrated flux arrays on the workspace and marks it calibrated.
    Subsequent UI displays use the calibrated values for source-sweep views.
    """
    cal1 = workspace.cal1()
    cal2 = workspace.cal2()
    if not workspace.initial_enabled and not workspace.terminal_enabled:
        raise ValueError("at least one cal bracket must remain enabled to calibrate")
    if workspace.initial_enabled and cal1 == 0.0:
        raise ValueError("initial Cal1 is zero — too many samples cut")
    if workspace.terminal_enabled and cal2 == 0.0:
        raise ValueError("terminal Cal2 is zero — too many samples cut")
    # When only one bracket is in use, use it for both endpoints.
    if not workspace.initial_enabled:
        cal1 = cal2
    if not workspace.terminal_enabled:
        cal2 = cal1

    n = workspace.source_count
    if n == 1:
        weights = np.array([0.5])
    else:
        weights = np.linspace(0.0, 1.0, n)
    calibrated: list[NDArray[np.float64]] = []
    for i, sweep in enumerate(workspace.source_sweeps):
        cal_i = (1.0 - weights[i]) * cal1 + weights[i] * cal2
        calibrated.append(sweep.flux / cal_i)
    workspace.calibrated_source_flux = tuple(calibrated)
    # A fresh calibration invalidates any prior pre-image reductions and any
    # previously-applied flux (Jy) scaling — the caller can re-apply the slope.
    workspace.reduced_source_flux = None
    workspace.reduced_source_dec = None
    workspace.flux_calibrated = False
    workspace.flux_slope = None


def current_source_flux(workspace: SurveyWorkspace) -> tuple[NDArray[np.float64], ...]:
    """Return the most-recent per-sweep flux arrays.

    Reductions applied on the Pre Image screen win over the calibrated flux,
    which wins over the raw `.md2` voltages. This is the same precedence
    `_survey_from_workspace_sources` uses when building the gridded image.
    """
    if workspace.reduced_source_flux is not None:
        return workspace.reduced_source_flux
    if workspace.calibrated_source_flux is not None:
        return workspace.calibrated_source_flux
    return tuple(np.asarray(raw.flux, dtype=np.float64) for raw in workspace.source_sweeps)


def current_source_dec(workspace: SurveyWorkspace) -> tuple[NDArray[np.float64], ...]:
    """Return the most-recent per-sweep declination arrays.

    Align Sweeps shifts dec values; everything else leaves them alone, so
    the reduced array wins when present and the raw `.md2` dec is the
    fallback.
    """
    if workspace.reduced_source_dec is not None:
        return workspace.reduced_source_dec
    return tuple(np.asarray(raw.dec, dtype=np.float64) for raw in workspace.source_sweeps)


def apply_workspace_reduction(
    workspace: SurveyWorkspace, op: str, **kwargs: float | int
) -> None:
    """Apply smooth/baseline/align to the workspace's source sweeps.

    Smooth/baseline modify `reduced_source_flux`; align modifies
    `reduced_source_dec`. Both stack — a second call composes with the
    first. The next `make_image(workspace_handle=...)` reads from both
    states.
    """
    fluxes = current_source_flux(workspace)
    decs = current_source_dec(workspace)
    if op == "align":
        # Align is survey-wide: it cross-correlates adjacent sweeps and
        # picks a dec shift for each. Operates on the *current* dec arrays
        # so successive Align Sweeps further refine the alignment.
        deltas = align_dec_shifts(
            list(decs), list(fluxes), max_delta_deg=float(kwargs.get("offset", 0.0))
        )
        shifted = tuple(
            np.asarray(d, dtype=np.float64) + delta for d, delta in zip(decs, deltas)
        )
        workspace.reduced_source_dec = shifted
        return
    reduced: list[NDArray[np.float64]] = []
    for sweep_dec, flux in zip(decs, fluxes):
        sweep_flux = np.asarray(flux, dtype=np.float64)
        if op == "smooth":
            reduced.append(smooth_flux(sweep_flux, window=int(kwargs.get("window", 5))))
        elif op == "baseline":
            reduced.append(
                subtract_baseline(
                    np.asarray(sweep_dec, dtype=np.float64),
                    sweep_flux,
                    degree=int(kwargs.get("degree", 1)),
                )
            )
        else:
            raise ValueError(f"unknown reduction op: {op!r}")
    workspace.reduced_source_flux = tuple(reduced)


def clear_workspace_reductions(workspace: SurveyWorkspace) -> None:
    """Drop any pre-image reductions, reverting to calibrated/raw flux."""
    workspace.reduced_source_flux = None
    workspace.reduced_source_dec = None


def apply_flux_calibration(workspace: SurveyWorkspace, slope: float) -> None:
    """Multiply gain-calibrated flux by `slope` (Jy/GCU). Idempotent guard.

    Requires the workspace to already be gain-calibrated — flux calibration
    converts GCU to Jy, so applying it to raw volts would mix units. If the
    workspace was already flux-calibrated (possibly with a different slope),
    this is a no-op; the caller should `revert_flux_calibration` first.
    """
    if not workspace.calibrated or workspace.calibrated_source_flux is None:
        raise ValueError("workspace must be gain-calibrated before flux calibration")
    if workspace.flux_calibrated:
        return
    if slope == 0.0:
        raise ValueError("flux calibration slope must be nonzero")
    scaled = tuple(arr * slope for arr in workspace.calibrated_source_flux)
    workspace.calibrated_source_flux = scaled
    if workspace.reduced_source_flux is not None:
        workspace.reduced_source_flux = tuple(
            arr * slope for arr in workspace.reduced_source_flux
        )
    workspace.flux_calibrated = True
    workspace.flux_slope = float(slope)


def revert_flux_calibration(workspace: SurveyWorkspace) -> None:
    """Undo a previously-applied flux calibration, returning flux to GCU."""
    if not workspace.flux_calibrated or workspace.flux_slope in (None, 0.0):
        return
    slope = workspace.flux_slope
    assert slope is not None
    if workspace.calibrated_source_flux is not None:
        workspace.calibrated_source_flux = tuple(
            arr / slope for arr in workspace.calibrated_source_flux
        )
    if workspace.reduced_source_flux is not None:
        workspace.reduced_source_flux = tuple(
            arr / slope for arr in workspace.reduced_source_flux
        )
    workspace.flux_calibrated = False
    workspace.flux_slope = None


def workspace_to_survey(workspace: SurveyWorkspace) -> Survey:
    """Project the workspace's current state into a `Survey` for .srv writing.

    The `.srv` format expects a fixed 240-sample `sweep0` that is the
    concatenation of the four cal sub-sweeps (initial_on + initial_off +
    terminal_on + terminal_off, 60 samples each — verified against
    fixtures/intermediates/and0a.srv vs fixtures/inputs/and0a.md2). Per-sweep
    `calib` carries Cal1 on sweep0, Cal2 on the last sweep, and 0.0 in
    between (the legacy writer only stores the bracket voltages, not a
    Jy/count conversion, until a .cal file is applied — out of scope here).

    Source sweeps use the current pipeline output (reduced > calibrated >
    raw) for both flux and dec — `current_source_flux` and
    `current_source_dec` already do that. The survey workflow has no
    source-side sample cuts (only cal-bracket cuts and full-sweep
    reductions), so we emit every source sample.
    """
    fluxes = current_source_flux(workspace)
    decs = current_source_dec(workspace)
    cal1 = workspace.cal1()
    cal2 = workspace.cal2()

    sweep0_ra = np.concatenate(
        [
            workspace.initial.cal_on.ra,
            workspace.initial.cal_off.ra,
            workspace.terminal.cal_on.ra,
            workspace.terminal.cal_off.ra,
        ]
    ).astype(np.float64)
    sweep0_dec = np.concatenate(
        [
            workspace.initial.cal_on.dec,
            workspace.initial.cal_off.dec,
            workspace.terminal.cal_on.dec,
            workspace.terminal.cal_off.dec,
        ]
    ).astype(np.float64)
    sweep0_flux = np.concatenate(
        [
            workspace.initial.cal_on.flux,
            workspace.initial.cal_off.flux,
            workspace.terminal.cal_on.flux,
            workspace.terminal.cal_off.flux,
        ]
    ).astype(np.float64)
    sweep0 = Sweep(
        ra=sweep0_ra,
        dec=sweep0_dec,
        flux=sweep0_flux,
        calib=cal1,
    )

    sweeps: list[Sweep] = []
    n = workspace.source_count
    for i, (raw, dec, flux) in enumerate(zip(workspace.source_sweeps, decs, fluxes)):
        flux_arr = np.asarray(flux, dtype=np.float64)
        dec_arr = np.asarray(dec, dtype=np.float64)
        ra_arr = np.asarray(raw.ra, dtype=np.float64)
        # Per-sweep `calib` is 0.0 except for the terminal source sweep,
        # which carries Cal2 (mirrors the and0a.srv fixture pattern).
        calib = cal2 if i == n - 1 else 0.0
        sweeps.append(
            Sweep(
                ra=ra_arr,
                dec=dec_arr,
                flux=flux_arr,
                min_dec=float(dec_arr.min()),
                max_dec=float(dec_arr.max()),
                min_flux=float(flux_arr.min()),
                max_flux=float(flux_arr.max()),
                calib=calib,
            )
        )

    return Survey(
        label1=workspace.path,
        label2=workspace.name,
        sweep_count=n + 1,
        swp=n,
        sweep0=sweep0,
        sweeps=tuple(sweeps),
        raw_bytes=None,
    )


