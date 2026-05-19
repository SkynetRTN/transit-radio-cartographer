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

function formatFlux(v: number, unit: 'volts' | 'gain'): string {
  // 'gain' is the dimensionless ratio after noise-injection bracket calibration.
  // A `.cal` file (flux calibration) converts it to janskies later.
  return `${v.toFixed(3)} ${unit === 'volts' ? 'V' : 'GCU'}`;
}

interface BaselineSegment {
  // Each segment is the (dec, flux) endpoints the user clicked on the top plot.
  // The straight line interpolated between them replaces the flux at every
  // declination sample that falls between dec0 and dec1.
  dec0: number;
  flux0: number;
  dec1: number;
  flux1: number;
}

function applyBaselineSegments(
  decs: number[],
  flux: number[],
  segments: BaselineSegment[],
): number[] {
  if (segments.length === 0) return flux;
  const out = flux.slice();
  for (const seg of segments) {
    const lo = Math.min(seg.dec0, seg.dec1);
    const hi = Math.max(seg.dec0, seg.dec1);
    const slope = seg.dec1 === seg.dec0 ? 0 : (seg.flux1 - seg.flux0) / (seg.dec1 - seg.dec0);
    for (let i = 0; i < decs.length; i++) {
      if (decs[i] >= lo && decs[i] <= hi) {
        out[i] = seg.flux0 + slope * (decs[i] - seg.dec0);
      }
    }
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
  // Per-sweep baseline edits — discarded when navigating away (matches the
  // legacy "Accept Sweep" model where unconfirmed sweeps revert on exit).
  const [segmentsBySweep, setSegmentsBySweep] = useState<Record<number, BaselineSegment[]>>({});

  useEffect(() => {
    setSweep(null);
    setError(null);
    setHoverPoint(null);
    setStickyPoint(null);
    setBaselineMode(false);
    setPendingBaselinePoint(null);
  }, [workspaceHandle, workspace?.calibrated, sweepIndex]);

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

  const segments = useMemo(
    () => segmentsBySweep[sweepIndex] ?? [],
    [segmentsBySweep, sweepIndex],
  );

  const baselineCorrected = useMemo<number[] | null>(() => {
    if (!sweep) return null;
    if (segments.length === 0) return null;
    return applyBaselineSegments(sweep.dec, sweep.flux, segments);
  }, [sweep, segments]);

  const topSeries = useMemo(() => {
    if (!sweep) return [];
    const points: Point[] = sweep.ra.map((ra, i) => ({
      x: sweep.dec[i],
      y: sweep.flux[i],
      ra,
      dec: sweep.dec[i],
      flux: sweep.flux[i],
    }));
    return [{ points, color: '#d80000', name: 'Sweep' }];
  }, [sweep]);

  const bottomSeries = useMemo(() => {
    if (!sweep || !baselineCorrected) return [];
    const points: Point[] = sweep.ra.map((ra, i) => ({
      x: sweep.dec[i],
      y: baselineCorrected[i],
      ra,
      dec: sweep.dec[i],
      flux: baselineCorrected[i],
    }));
    return [{ points, color: '#d80000', name: 'Sweep (baselined)' }];
  }, [sweep, baselineCorrected]);

  const baselineOverlays = useMemo(() => {
    const lines = segments.map((s) => ({
      points: [
        { x: s.dec0, y: s.flux0 },
        { x: s.dec1, y: s.flux1 },
      ],
      color: '#c020c0',
      width: 2,
    }));
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
  }, [segments, pendingBaselinePoint, hoverPoint, stickyPoint]);

  const handleHover = useCallback((p: Point | null) => {
    setHoverPoint(p);
  }, []);

  const handleClick = useCallback(
    (p: Point) => {
      if (baselineMode) {
        if (!pendingBaselinePoint) {
          setPendingBaselinePoint({ dec: p.dec, flux: p.flux });
        } else {
          const seg: BaselineSegment = {
            dec0: pendingBaselinePoint.dec,
            flux0: pendingBaselinePoint.flux,
            dec1: p.dec,
            flux1: p.flux,
          };
          setSegmentsBySweep((prev) => ({
            ...prev,
            [sweepIndex]: [...(prev[sweepIndex] ?? []), seg],
          }));
          setPendingBaselinePoint(null);
        }
        return;
      }
      setStickyPoint(p);
    },
    [baselineMode, pendingBaselinePoint, sweepIndex],
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

  const handleUndoBaseline = useCallback(() => {
    setSegmentsBySweep((prev) => {
      const current = prev[sweepIndex] ?? [];
      if (current.length === 0) return prev;
      return { ...prev, [sweepIndex]: current.slice(0, -1) };
    });
    setPendingBaselinePoint(null);
  }, [sweepIndex]);

  const toggleBaselineMode = useCallback(() => {
    setBaselineMode((m) => !m);
    setPendingBaselinePoint(null);
  }, []);

  const handleAcceptSweep = useCallback(() => {
    // Legacy "Accept Sweep" has no visual feedback; it just consumes the
    // sweep with any pending edits (baseline segments stay on the per-sweep
    // record) and advances to the next un-accepted sweep.
    acceptCurrentSweep();
  }, [acceptCurrentSweep]);

  const readoutPoint = stickyPoint ?? hoverPoint;
  const unit: 'volts' | 'gain' = sweep?.unit ?? 'volts';

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
              <div className="axis-label-y">Flux</div>
              <div
                className={`plot-cell${baselineCorrected ? '' : ' baseline-placeholder'}`}
              >
                <PointScatter
                  series={bottomSeries}
                  xAxisLabel=""
                  yAxisLabel=""
                  testId="baseline-plot"
                  height={200}
                />
              </div>
            </div>
          </div>

          <div className="workspace-side">
            <div className="side-buttons">
              <button
                onClick={handleAcceptSweep}
                disabled={!workspace.calibrated || isAccepted}
                title={
                  isAccepted
                    ? 'This sweep is already accepted'
                    : workspace.calibrated
                      ? 'Accept this sweep into the survey'
                      : 'Calibrate the survey first'
                }
              >
                Accept Sweep
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
                title="Click two points on the flux vs declination plot to replace the segment between them with a straight line"
              >
                {baselineMode ? 'Baseline Segment (click…)' : 'Baseline Segment'}
              </button>
              <button
                onClick={handleUndoBaseline}
                disabled={segments.length === 0 && !pendingBaselinePoint}
                title="Undo the most recent baseline segment on this sweep"
              >
                Undo Baseline
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
              <span>
                {sweepIndex + 1} / {sweepCount}
              </span>
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
