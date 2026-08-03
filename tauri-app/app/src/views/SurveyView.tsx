import { useCallback, useEffect, useMemo, useState } from 'react';
import { rpcClient, type SourceSweep } from '../ipc/client';
import { useSurvey } from '../state/survey-context';
import { useTheme } from '../state/theme-context';
import { PointScatter, type Point } from '../lib/plots/PointScatter';
import { dataColors } from '../lib/plots/plot-theme';
import { WorkspaceBody } from './WorkspaceBody';

function formatRa(volts: number): string {
  // RA in the .md2 fixtures is given in arc-time seconds.  Format as HH:MM:SS.
  const total = Math.max(0, volts);
  const hours = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = Math.floor(total % 60);
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function formatDec(deg: number): string {
  // `.md2` declination is decimal degrees, matching `.md1` and the legacy
  // `vb/survform.frm:8703-8705` formatter.
  const sign = deg < 0 ? '-' : '';
  const abs = Math.abs(deg);
  const d = Math.floor(abs);
  const m = Math.floor((abs - d) * 60);
  const s = Math.floor((abs - d - m / 60) * 3600);
  return `${sign}${String(d).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatFlux(v: number, unit: 'volts' | 'gain' | 'jy'): string {
  // 'gain' is the dimensionless ratio after noise-injection bracket calibration;
  // a `.cal` file (flux calibration) then converts that to janskies.
  const label = unit === 'volts' ? 'V' : unit === 'jy' ? 'Jy' : 'GCU';
  return `${v.toFixed(3)} ${label}`;
}

// Map of sample index → amount removed (originalFlux[i] - newFlux[i]).
// Matches legacy VB's `Baseline!()` array (vb/survform.frm:5493): for samples
// inside a drawn "Remove RFI" segment, Flux gets replaced with the drawn line
// and the difference is what we plot in the bottom "Removed" panel.
type RemovedMap = Record<number, number>;

function applyRemoved(flux: number[], removed: RemovedMap): number[] {
  const keys = Object.keys(removed);
  if (keys.length === 0) return flux;
  const out = flux.slice();
  for (const key of keys) {
    const i = Number(key);
    out[i] = flux[i] - removed[i];
  }
  return out;
}

export function SurveyView() {
  const {
    survey,
    workspace,
    workspaceHandle,
    setViewMode,
    close,
    currentSweepIndex,
    setCurrentSweepIndex,
    acceptedSweeps,
    acceptCurrentSweep,
    acceptAll,
    markDirty,
  } = useSurvey();
  const { theme } = useTheme();
  const dc = useMemo(() => dataColors(theme), [theme]);
  const sweepIndex = currentSweepIndex;
  const [sweep, setSweep] = useState<SourceSweep | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoverPoint, setHoverPoint] = useState<Point | null>(null);
  const [stickyPoint, setStickyPoint] = useState<Point | null>(null);
  const [baselineMode, setBaselineMode] = useState(false);
  const [pendingBaselinePoint, setPendingBaselinePoint] = useState<
    { dec: number; flux: number } | null
  >(null);
  // Per-sweep, per-sample "removed" amount from Remove RFI edits, measured
  // against `originalBySweep` (NOT the engine's current flux). Kept across
  // Accept Sweep so revisiting an accepted sweep still shows the Removed plot
  // and lets you restore points and re-apply. Only cleared on workspace change.
  // Not persisted to `.srv` — this is session-scoped (see the "Undo a removal"
  // note in the Survey help section).
  const [removedBySweep, setRemovedBySweep] = useState<Record<number, RemovedMap>>({});
  // Per-sweep pristine flux snapshot, captured the first time a sweep is edited
  // this session — before Accept Sweep overwrites the engine's flux with the
  // corrected values. Every removed-amount and the committed flux are derived
  // from this, so it stays valid even once the engine no longer holds the
  // original. Presence of an entry also means "this sweep was edited this
  // session", the signal commitPendingEdits uses to decide whether to sync.
  const [originalBySweep, setOriginalBySweep] = useState<Record<number, number[]>>({});
  // Per-sweep stack of prior `removedBySweep[i]` snapshots. Every Remove RFI
  // removal AND every recover-line draw pushes one entry, so a single Undo
  // reverts whichever happened last on this sweep. Snapshots are relative to
  // `originalBySweep`, so they survive Accept Sweep too; only cleared on
  // workspace change.
  const [historyBySweep, setHistoryBySweep] = useState<Record<number, RemovedMap[]>>({});
  // First endpoint of the recovery line drawn on the bottom "Removed" plot.
  // Mirrors `pendingBaselinePoint` for the top plot, but in (Dec, removed-amount)
  // space and with FREE coordinates (not snapped to a removed sample) — see
  // vb/survform.frm:5732-5749 (Picture3 second-line gesture).
  const [pendingRecoverPoint, setPendingRecoverPoint] = useState<
    { dec: number; removed: number } | null
  >(null);
  // Live free-cursor position on the bottom plot, used to rubber-band the
  // recovery line preview from `pendingRecoverPoint` to the cursor.
  const [recoverCursor, setRecoverCursor] = useState<
    { dec: number; removed: number } | null
  >(null);
  const [committing, setCommitting] = useState(false);
  const [sweepInput, setSweepInput] = useState<string>(() => String(sweepIndex + 1));

  useEffect(() => {
    setSweep(null);
    setError(null);
    setHoverPoint(null);
    setStickyPoint(null);
    setBaselineMode(false);
    setPendingBaselinePoint(null);
    setPendingRecoverPoint(null);
    setRecoverCursor(null);
  }, [workspaceHandle, workspace?.calibrated, workspace?.flux_calibrated, sweepIndex]);

  // When the workspace itself changes (different .md2 / .srv opened), drop
  // any pending per-sweep baseline edits from the previous survey.
  useEffect(() => {
    setRemovedBySweep({});
    setHistoryBySweep({});
    setOriginalBySweep({});
  }, [workspaceHandle]);

  useEffect(() => {
    setSweepInput(String(sweepIndex + 1));
  }, [sweepIndex]);

  useEffect(() => {
    if (workspaceHandle === null) {
      setSweep(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    rpcClient
      .getSourceSweep(workspaceHandle, sweepIndex)
      .then((data) => {
        if (!cancelled) setSweep(data);
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setSweep(null);
          setError(err.message);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // `flux_calibrated` is a dep so the sweep is re-fetched in Jy as soon as a
    // `.cal` is loaded — otherwise the cached GCU samples stay on screen even
    // though the engine workspace has been rescaled.
  }, [workspaceHandle, sweepIndex, workspace?.flux_calibrated]);

  const removed = useMemo<RemovedMap>(
    () => removedBySweep[sweepIndex] ?? {},
    [removedBySweep, sweepIndex],
  );
  const hasPendingRemoved = Object.keys(removed).length > 0;

  // Base flux the removed map is measured against: the pristine snapshot once
  // the sweep has been edited this session, otherwise whatever the engine just
  // handed us (which is the original for an untouched sweep).
  const baseFlux = useMemo<number[] | null>(
    () => originalBySweep[sweepIndex] ?? sweep?.flux ?? null,
    [originalBySweep, sweepIndex, sweep],
  );

  // The top plot shows the *corrected* flux (base minus current removals).
  // After Accept Sweep the engine's flux already equals base - removed, so
  // these recomputed values match a fresh re-load exactly.
  const correctedFlux = useMemo<number[] | null>(() => {
    if (!sweep || !baseFlux) return null;
    if (!hasPendingRemoved) return null;
    return applyRemoved(baseFlux, removed);
  }, [sweep, baseFlux, removed, hasPendingRemoved]);

  const topSeries = useMemo(() => {
    if (!sweep) return [];
    const flux = correctedFlux ?? sweep.flux;
    const points: Point[] = sweep.ra.map((ra, i) => ({
      x: sweep.dec[i],
      y: flux[i],
      ra,
      dec: sweep.dec[i],
      flux: flux[i],
    }));
    return [{ points, color: dc.seriesPrimary, name: 'Sweep' }];
  }, [sweep, correctedFlux, dc]);

  const bottomSeries = useMemo(() => {
    if (!sweep || !hasPendingRemoved) return [];
    const points: Point[] = [];
    for (const key of Object.keys(removed)) {
      const i = Number(key);
      points.push({
        x: sweep.dec[i],
        y: removed[i],
        ra: sweep.ra[i],
        dec: sweep.dec[i],
        flux: sweep.flux[i],
        sampleIndex: i,
      });
    }
    return [{ points, color: dc.seriesSecondary, name: 'Removed' }];
  }, [sweep, removed, hasPendingRemoved, dc]);

  const baselineOverlays = useMemo(() => {
    const lines: { points: { x: number; y: number }[]; color: string; width: number }[] = [];
    if (pendingBaselinePoint) {
      const target = hoverPoint ?? stickyPoint;
      if (target) {
        lines.push({
          points: [
            { x: pendingBaselinePoint.dec, y: pendingBaselinePoint.flux },
            { x: target.dec, y: target.flux },
          ],
          color: dc.baseline,
          width: 1,
        });
      }
    }
    return lines;
  }, [pendingBaselinePoint, hoverPoint, stickyPoint, dc]);

  // Rubber-band preview for the recovery line on the bottom "Removed" plot,
  // drawn from the first endpoint to the free cursor (un-snapped).
  const recoverOverlays = useMemo(() => {
    const lines: { points: { x: number; y: number }[]; color: string; width: number }[] = [];
    if (pendingRecoverPoint && recoverCursor) {
      lines.push({
        points: [
          { x: pendingRecoverPoint.dec, y: pendingRecoverPoint.removed },
          { x: recoverCursor.dec, y: recoverCursor.removed },
        ],
        color: dc.seriesSecondary,
        width: 1,
      });
    }
    return lines;
  }, [pendingRecoverPoint, recoverCursor, dc]);

  const handleHover = useCallback((p: Point | null) => {
    setHoverPoint(p);
  }, []);

  // Replace this sweep's RemovedMap with `next` and remember the previous
  // value on the undo stack so a subsequent Undo can revert this one mutation
  // (either a Remove RFI removal or a recovery-line draw — both go through
  // here).
  const commitRemoved = useCallback(
    (next: RemovedMap) => {
      // Snapshot the pristine flux on the first edit of this sweep, before any
      // Accept Sweep overwrites the engine copy. Later edits (including ones
      // made after the sweep was accepted) keep measuring against this.
      if (sweep) {
        setOriginalBySweep((prev) =>
          prev[sweepIndex] !== undefined
            ? prev
            : { ...prev, [sweepIndex]: sweep.flux },
        );
      }
      const prevMap = removedBySweep[sweepIndex] ?? {};
      setHistoryBySweep((h) => {
        const stack = h[sweepIndex] ?? [];
        return { ...h, [sweepIndex]: [...stack, prevMap] };
      });
      setRemovedBySweep((prev) => ({ ...prev, [sweepIndex]: next }));
    },
    [removedBySweep, sweepIndex, sweep],
  );

  const handleClick = useCallback(
    (p: Point) => {
      if (baselineMode) {
        if (!sweep) return;
        // Keep the RA/Dec/Flux readout live while removing RFI: clicking a
        // point should still update the side readout even though the click is
        // also being consumed as a baseline endpoint.
        setStickyPoint(p);
        if (!pendingBaselinePoint) {
          setPendingBaselinePoint({ dec: p.dec, flux: p.flux });
        } else {
          const dec0 = pendingBaselinePoint.dec;
          const flux0 = pendingBaselinePoint.flux;
          const dec1 = p.dec;
          const flux1 = p.flux;
          const lo = Math.min(dec0, dec1);
          const hi = Math.max(dec0, dec1);
          const slope = dec1 === dec0 ? 0 : (flux1 - flux0) / (dec1 - dec0);
          // Removals are measured against the pristine base so they stay valid
          // even after Accept Sweep rewrites the engine's flux to the corrected
          // values (base falls back to the current flux on the first edit).
          const base = originalBySweep[sweepIndex] ?? sweep.flux;
          const next: RemovedMap = { ...(removedBySweep[sweepIndex] ?? {}) };
          for (let i = 0; i < sweep.dec.length; i++) {
            const d = sweep.dec[i];
            if (d < lo || d > hi) continue;
            const lineFlux = flux0 + slope * (d - dec0);
            next[i] = base[i] - lineFlux;
          }
          commitRemoved(next);
          setPendingBaselinePoint(null);
        }
        return;
      }
      setStickyPoint(p);
    },
    [
      baselineMode,
      pendingBaselinePoint,
      sweepIndex,
      sweep,
      removedBySweep,
      originalBySweep,
      commitRemoved,
    ],
  );

  // Recover removed samples by drawing a second, FREE (un-snapped) line across
  // the bottom "Removed" plot — the exact inverse of the Remove RFI line on the
  // top plot. For every already-removed sample whose Dec falls in the drawn
  // line's Dec span, the removed amount is reset to the line's value: drawing
  // the line at ~0 fully recovers the sample, while drawing it through the
  // residual keeps the part below the line as baseline and feeds the part above
  // back into the flux — i.e. recreates the noise structure. Mirrors the legacy
  // Picture3 gesture (vb/survform.frm:5732-5749).
  const handleRecoverClick = useCallback(
    (x: number, y: number) => {
      if (!baselineMode || !hasPendingRemoved || !sweep) return;
      if (!pendingRecoverPoint) {
        setPendingRecoverPoint({ dec: x, removed: y });
        return;
      }
      const dec0 = pendingRecoverPoint.dec;
      const removed0 = pendingRecoverPoint.removed;
      const lo = Math.min(dec0, x);
      const hi = Math.max(dec0, x);
      const slope = x === dec0 ? 0 : (y - removed0) / (x - dec0);
      const current = removedBySweep[sweepIndex] ?? {};
      const next: RemovedMap = { ...current };
      for (const key of Object.keys(current)) {
        const i = Number(key);
        const d = sweep.dec[i];
        if (d < lo || d > hi) continue;
        const lineValue = removed0 + slope * (d - dec0);
        if (Math.abs(lineValue) < 1e-9) {
          delete next[i];
        } else {
          next[i] = lineValue;
        }
      }
      commitRemoved(next);
      setPendingRecoverPoint(null);
      setRecoverCursor(null);
    },
    [
      baselineMode,
      hasPendingRemoved,
      sweep,
      pendingRecoverPoint,
      sweepIndex,
      removedBySweep,
      commitRemoved,
    ],
  );

  const handleRecoverCursorMove = useCallback(
    (x: number, y: number) => {
      if (!baselineMode || !hasPendingRemoved) return;
      setRecoverCursor({ dec: x, removed: y });
    },
    [baselineMode, hasPendingRemoved],
  );

  // Pop the most recent removal/recovery on this sweep off the history stack.
  // Disabled when the stack is empty (Undo button reflects this).
  const handleUndo = useCallback(() => {
    const stack = historyBySweep[sweepIndex] ?? [];
    if (stack.length === 0) return;
    const prevMap = stack[stack.length - 1];
    setRemovedBySweep((r) => ({ ...r, [sweepIndex]: prevMap }));
    setHistoryBySweep((h) => ({ ...h, [sweepIndex]: stack.slice(0, -1) }));
  }, [historyBySweep, sweepIndex]);

  const handleEmptyClick = useCallback(() => {
    if (baselineMode) {
      // Empty-space click in baseline mode cancels a pending first endpoint
      // (matches the legacy "right-click cancels" gesture).
      setPendingBaselinePoint(null);
      return;
    }
    setStickyPoint(null);
  }, [baselineMode]);

  const toggleBaselineMode = useCallback(() => {
    setBaselineMode((m) => !m);
    setPendingBaselinePoint(null);
    setPendingRecoverPoint(null);
    setRecoverCursor(null);
  }, []);

  // Sync this sweep's edits to the engine workspace. A sweep edited this
  // session has an `originalBySweep` snapshot; we write back base - removed
  // (which equals the original again if every point has since been restored).
  // Sweeps never touched this session have no snapshot and nothing to sync.
  //
  // Unlike the old flow, this does NOT discard the removed map / history /
  // snapshot afterwards — that's what keeps an accepted sweep re-editable, so
  // you can revisit it, restore points, and Apply Edits. The removed map stays
  // valid because it's measured against the retained snapshot, not the engine's
  // (now corrected) flux. Returns false if the commit failed (callers skip
  // accepting) or there is no sweep loaded. Shared by Accept Sweep/Accept All.
  const commitPendingEdits = useCallback(async (): Promise<boolean> => {
    if (!sweep || workspaceHandle === null) return false;
    const base = originalBySweep[sweepIndex];
    if (base === undefined) return true;
    const newFlux = applyRemoved(base, removedBySweep[sweepIndex] ?? {});
    setCommitting(true);
    setError(null);
    try {
      await rpcClient.setSourceSweepFlux(workspaceHandle, sweepIndex, newFlux);
      markDirty();
    } catch (e) {
      setError((e as Error).message);
      setCommitting(false);
      return false;
    }
    setCommitting(false);
    return true;
  }, [sweep, workspaceHandle, originalBySweep, removedBySweep, sweepIndex, markDirty]);

  const handleAcceptSweep = useCallback(async () => {
    if (!(await commitPendingEdits())) return;
    acceptCurrentSweep();
  }, [commitPendingEdits, acceptCurrentSweep]);

  const handleAcceptAll = useCallback(async () => {
    if (!(await commitPendingEdits())) return;
    acceptAll();
  }, [commitPendingEdits, acceptAll]);

  // Keyboard navigation over sweeps (ignored while typing in a field such as
  // the sweep-number input):
  //   ←            previous sweep (no accept)
  //   →            accept the current sweep and advance (once calibrated);
  //                before calibration it just moves to the next sweep
  //   Ctrl/Cmd+Shift+A   accept every remaining sweep at once
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (
        el &&
        (el.tagName === 'INPUT' ||
          el.tagName === 'TEXTAREA' ||
          el.tagName === 'SELECT' ||
          el.isContentEditable)
      ) {
        return;
      }
      const count = workspace?.source_count ?? 0;
      if (count <= 0) return;
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'a' || e.key === 'A')) {
        if (!workspace?.calibrated) return;
        e.preventDefault();
        void handleAcceptAll();
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentSweepIndex(Math.max(0, currentSweepIndex - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (workspace?.calibrated) void handleAcceptSweep();
        else setCurrentSweepIndex(Math.min(count - 1, currentSweepIndex + 1));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    currentSweepIndex,
    workspace?.source_count,
    workspace?.calibrated,
    handleAcceptSweep,
    handleAcceptAll,
    setCurrentSweepIndex,
  ]);

  const readoutPoint = stickyPoint ?? hoverPoint;
  const unit: 'volts' | 'gain' | 'jy' = sweep?.unit ?? 'volts';

  if (!survey || !workspace || workspaceHandle === null) {
    return (
      <div className="survey-view empty">
        <p>No survey loaded. Use Survey → New Survey... to open an .md2 file.</p>
      </div>
    );
  }

  const sweepCount = workspace.source_count;
  const sweepNumber = sweep?.index !== undefined ? sweep.index + 1 : sweepIndex + 1;
  const isAccepted = acceptedSweeps.has(sweepIndex);
  const allAccepted = acceptedSweeps.size >= sweepCount && sweepCount > 0;
  const baselineHint = baselineMode
    ? pendingBaselinePoint
      ? 'Remove RFI: click endpoint…'
      : 'Remove RFI: click first point…'
    : null;
  const canUndo = (historyBySweep[sweepIndex]?.length ?? 0) > 0;

  return (
    <div className="survey-view workspace">
      <div className="workspace-frame">
        <div className="workspace-title">
          {`${workspace.name} - Sweep ${sweepNumber}`}
          {isAccepted && <span className="sweep-accepted-tag"> · accepted</span>}
        </div>

        <WorkspaceBody
          plots={
          <div className="workspace-plots">
            <div className="plot-row">
              <div className="axis-label-y">Flux</div>
              <div className="plot-cell">
                {loading && <div className="plot-status">Loading sweep…</div>}
                {error && <div className="plot-status error">{error}</div>}
                {baselineHint && <div className="plot-status">{baselineHint}</div>}
                {sweep && (
                  <PointScatter
                    series={topSeries}
                    xAxisLabel=""
                    yAxisLabel=""
                    overlayLines={baselineOverlays}
                    onHover={handleHover}
                    onPointClick={handleClick}
                    onEmptyClick={handleEmptyClick}
                    pinnedPoint={
                      pendingBaselinePoint
                        ? { x: pendingBaselinePoint.dec, y: pendingBaselinePoint.flux }
                        : stickyPoint
                          ? { x: stickyPoint.dec, y: stickyPoint.flux }
                          : null
                    }
                    testId="survey-plot"
                    height={260}
                    showXTicks={false}
                  />
                )}
              </div>
            </div>

            {/* Shared x-axis label sits between the two panels so the top plot's
                ticks/title don't overlap the lower "Removed" panel — same pattern
                ScanView uses (both panels share the Declination x-axis). */}
            <div className="plot-row-label">
              <div className="axis-label-y-spacer" />
              <div className="x-axis-label">Declination</div>
            </div>

            <div className="plot-row">
              <div className="axis-label-y">Removed</div>
              <div
                className={`plot-cell${hasPendingRemoved ? '' : ' baseline-placeholder'}`}
              >
                <PointScatter
                  series={bottomSeries}
                  xAxisLabel=""
                  yAxisLabel=""
                  overlayLines={recoverOverlays}
                  pinnedPoint={
                    pendingRecoverPoint
                      ? { x: pendingRecoverPoint.dec, y: pendingRecoverPoint.removed }
                      : null
                  }
                  onCursorClick={
                    baselineMode && hasPendingRemoved ? handleRecoverClick : undefined
                  }
                  onCursorMove={
                    baselineMode && hasPendingRemoved ? handleRecoverCursorMove : undefined
                  }
                  testId="baseline-plot"
                  height={200}
                />
                {!hasPendingRemoved && (
                  <div className="plot-status">
                    Removed samples appear here, draw a line across this plot to recover them
                  </div>
                )}
                {hasPendingRemoved && baselineMode && (
                  <div className="plot-status">
                    {pendingRecoverPoint
                      ? 'Recover: click line endpoint…'
                      : 'Recover: click first point of a line…'}
                  </div>
                )}
              </div>
            </div>
          </div>
          }
          side={
          <div className="workspace-side">
            <div className="side-buttons">
              <button
                onClick={() => void handleAcceptSweep()}
                disabled={
                  !workspace.calibrated ||
                  committing ||
                  (isAccepted && !hasPendingRemoved)
                }
                title={
                  !workspace.calibrated
                    ? 'Calibrate the survey first'
                    : hasPendingRemoved
                      ? isAccepted
                        ? 'Commit pending RFI edits to this accepted sweep'
                        : 'Commit RFI edits and accept this sweep'
                      : isAccepted
                        ? 'This sweep is already accepted'
                        : 'Accept this sweep into the survey'
                }
              >
                {committing
                  ? 'Saving…'
                  : isAccepted && hasPendingRemoved
                    ? 'Apply Edits'
                    : 'Accept Sweep'}
              </button>
              <button
                onClick={() => setViewMode('calibrate-survey')}
                disabled={workspace.calibrated}
                title="Run gain calibration using the noise-injection brackets"
              >
                Calibrate Survey
              </button>
              <div className="button-gap" />
              <button
                onClick={toggleBaselineMode}
                disabled={!workspace.calibrated}
                className={baselineMode ? 'active' : ''}
                title="Click two points on the flux vs declination plot to replace the segment between them with a straight line. Then draw a line across the Removed plot to recover those samples — drawing it low recovers fully, drawing it through the residual recreates the noise structure."
              >
                {baselineMode ? 'Remove RFI (click…)' : 'Remove RFI'}
              </button>
              <button
                onClick={handleUndo}
                disabled={!canUndo}
                title="Undo the most recent Remove RFI removal or recovery on this sweep"
              >
                Undo
              </button>
              <div className="button-gap" />
              <button
                onClick={() => setViewMode('pre-image')}
                disabled={!allAccepted}
                title={
                  allAccepted
                    ? 'Build the pre-image from the accepted sweeps'
                    : 'Accept every sweep first'
                }
              >
                Create Pre-Image
              </button>
              <button onClick={() => void close()}>Cancel</button>
            </div>

            <div className="readout">
              <div>RA: {readoutPoint ? formatRa(readoutPoint.ra) : '--:--:--'}</div>
              <div>Dec: {readoutPoint ? formatDec(readoutPoint.dec) : '--:--:--'}</div>
              <div>Flux: {readoutPoint ? formatFlux(readoutPoint.flux, unit) : `-- ${unit === 'volts' ? 'V' : unit === 'jy' ? 'Jy' : 'GCU'}`}</div>
              {stickyPoint && !baselineMode && (
                <div className="readout-pin">📌 pinned (click empty space to release)</div>
              )}
            </div>

            <div className="sweep-progress">
              {acceptedSweeps.size} / {sweepCount} sweeps accepted
            </div>

            <div className="sweep-nav">
              <button
                disabled={sweepIndex <= 0 || loading}
                onClick={() => setCurrentSweepIndex(Math.max(0, sweepIndex - 1))}
              >
                ‹ Prev
              </button>
              <input
                type="number"
                className="sweep-nav-input"
                min={1}
                max={Math.max(1, sweepCount)}
                value={sweepInput}
                aria-label="Sweep number"
                onChange={(e) => setSweepInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                }}
                onBlur={() => {
                  const parsed = parseInt(sweepInput, 10);
                  if (Number.isFinite(parsed)) {
                    const clamped = Math.max(1, Math.min(sweepCount, parsed));
                    setCurrentSweepIndex(clamped - 1);
                    setSweepInput(String(clamped));
                  } else {
                    setSweepInput(String(sweepIndex + 1));
                  }
                }}
              />
              <span>/ {sweepCount}</span>
              <button
                disabled={sweepIndex >= sweepCount - 1 || loading}
                onClick={() =>
                  setCurrentSweepIndex(Math.min(sweepCount - 1, sweepIndex + 1))
                }
              >
                Next ›
              </button>
            </div>

            <div className="sweep-nav-hint">
              Keys: ← back · → accept &amp; next
            </div>
          </div>
          }
        />
      </div>
    </div>
  );
}
