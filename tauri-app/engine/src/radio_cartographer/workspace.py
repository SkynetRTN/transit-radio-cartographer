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

from .models import MD2Document, RawSweep


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
    undo_stack: list[dict[str, NDArray[np.bool_]]] = field(default_factory=list)
    initial_enabled: bool = True
    terminal_enabled: bool = True

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


