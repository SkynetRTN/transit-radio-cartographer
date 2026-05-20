import { useCallback, useEffect, useMemo, useState } from 'react';
import { rpcClient, type SourceSweep } from '../ipc/client';
import { useSurvey } from '../state/survey-context';
import { PointScatter, type Point } from '../lib/plots/PointScatter';

function formatRa(volts: number): string {
  // RA in the .md2 fixtures is given in arc-time seconds.  Format as HH:MM:SS.
  const total = Math.max(0, volts);
  const hours = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = Math.floor(total % 60);
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function formatDec(deg: number): string {
  // Declination in the .md2 fixtures appears to be in arc-minutes.
  const totalArcSec = deg * 60;
  const sign = totalArcSec < 0 ? '-' : '';
  const abs = Math.abs(totalArcSec);
  const d = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  const s = Math.floor(abs % 60);
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
// inside a drawn segment, Flux gets replaced with the drawn line and the
// difference is what we plot in the bottom "Removed" panel.
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
    markDirty,
  } = useSurvey();
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
  // Per-sweep, per-sample "removed" amount from Baseline Segment edits.
  // Lives only until Accept Sweep, at which point it's committed to the
  // backend workspace (and cleared here so the next view of this sweep
  // reads the new baseline flux from disk).
  const [removedBySweep, setRemovedBySweep] = useState<Record<number, RemovedMap>>({});
  const [committing, setCommitting] = useState(false);
  const [sweepInput, setSweepInput] = useState<string>(() => String(sweepIndex + 1));

  useEffect(() => {
    setSweep(null);
    setError(null);
    setHoverPoint(null);
    setStickyPoint(null);
    setBaselineMode(false);
    setPendingBaselinePoint(null);
  }, [workspaceHandle, workspace?.calibrated, sweepIndex]);

  // When the workspace itself changes (different .md2 / .srv opened), drop
  // any pending per-sweep baseline edits from the previous survey.
  useEffect(() => {
    setRemovedBySweep({});
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
  }, [workspaceHandle, sweepIndex]);

  const removed = useMemo<RemovedMap>(
    () => removedBySweep[sweepIndex] ?? {},
    [removedBySweep, sweepIndex],
  );
  const hasPendingRemoved = Object.keys(removed).length > 0;

  // The top plot shows the *corrected* flux (with current pending removals
  // applied). Once committed via Accept Sweep, the backend's flux already
  // reflects the same values, so a re-load shows the same picture.
  const correctedFlux = useMemo<number[] | null>(() => {
    if (!sweep) return null;
    if (!hasPendingRemoved) return null;
    return applyRemoved(sweep.flux, removed);
  }, [sweep, removed, hasPendingRemoved]);

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
    return [{ points, color: '#d80000', name: 'Sweep' }];
  }, [sweep, correctedFlux]);

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
    return [{ points, color: '#3060c0', name: 'Removed' }];
  }, [sweep, removed, hasPendingRemoved]);

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
          color: '#c020c0',
          width: 1,
        });
      }
    }
    return lines;
  }, [pendingBaselinePoint, hoverPoint, stickyPoint]);

  const handleHover = useCallback((p: Point | null) => {
    setHoverPoint(p);
  }, []);

  const handleClick = useCallback(
    (p: Point) => {
      if (baselineMode) {
        if (!sweep) return;
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
          setRemovedBySweep((prev) => {
            const next: RemovedMap = { ...(prev[sweepIndex] ?? {}) };
            for (let i = 0; i < sweep.dec.length; i++) {
              const d = sweep.dec[i];
              if (d < lo || d > hi) continue;
              const lineFlux = flux0 + slope * (d - dec0);
              next[i] = sweep.flux[i] - lineFlux;
            }
            return { ...prev, [sweepIndex]: next };
          });
          setPendingBaselinePoint(null);
        }
        return;
      }
      setStickyPoint(p);
    },
    [baselineMode, pendingBaselinePoint, sweepIndex, sweep],
  );

  const handleRestoreClick = useCallback(
    (p: Point) => {
      if (p.sampleIndex === undefined) return;
      const idx = p.sampleIndex;
      setRemovedBySweep((prev) => {
        const current = prev[sweepIndex];
        if (!current || !(idx in current)) return prev;
        const next: RemovedMap = { ...current };
        delete next[idx];
        return { ...prev, [sweepIndex]: next };
      });
    },
    [sweepIndex],
  );

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
  }, []);

  const handleAcceptSweep = useCallback(async () => {
    if (!sweep || workspaceHandle === null) return;
    const pending = removedBySweep[sweepIndex];
    if (pending && Object.keys(pending).length > 0) {
      const newFlux = applyRemoved(sweep.flux, pending);
      setCommitting(true);
      setError(null);
      try {
        await rpcClient.setSourceSweepFlux(workspaceHandle, sweepIndex, newFlux);
        setRemovedBySweep((prev) => {
          const next = { ...prev };
          delete next[sweepIndex];
          return next;
        });
        markDirty();
      } catch (e) {
        setError((e as Error).message);
        setCommitting(false);
        return;
      }
      setCommitting(false);
    }
    acceptCurrentSweep();
  }, [
    sweep,
    workspaceHandle,
    removedBySweep,
    sweepIndex,
    acceptCurrentSweep,
    markDirty,
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
      ? 'Baseline: click endpoint…'
      : 'Baseline: click first point…'
    : null;

  return (
    <div className="survey-view workspace">
      <div className="workspace-frame">
        <div className="workspace-title">
          {`${workspace.name} - Sweep ${sweepNumber}`}
          {isAccepted && <span className="sweep-accepted-tag"> · accepted</span>}
        </div>

        <div className="workspace-body">
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
                    xAxisLabel="Declination"
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
                  />
                )}
              </div>
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
                  onPointClick={handleRestoreClick}
                  testId="baseline-plot"
                  height={200}
                />
                {!hasPendingRemoved && (
                  <div className="plot-status">
                    Draw a baseline segment to see removed points here. Click a point to restore it.
                  </div>
                )}
              </div>
            </div>
          </div>

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
                        ? 'Commit pending baseline edits to this accepted sweep'
                        : 'Commit baseline edits and accept this sweep'
                      : isAccepted
                        ? 'This sweep is already accepted'
                        : 'Accept this sweep into the survey'
                }
              >
                {committing
                  ? 'Saving…'
                  : isAccepted && hasPendingRemoved
                    ? 'Apply Baselines'
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
                title="Click two points on the flux vs declination plot to replace the segment between them with a straight line. Click a point in the Removed plot to restore it."
              >
                {baselineMode ? 'Baseline Segment (click…)' : 'Baseline Segment'}
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
              <div>Flux: {readoutPoint ? formatFlux(readoutPoint.flux, unit) : `-- ${unit === 'volts' ? 'V' : 'GCU'}`}</div>
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
          </div>
        </div>
      </div>
    </div>
  );
}
