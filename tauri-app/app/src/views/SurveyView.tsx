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

export function SurveyView() {
  const { survey, workspace, workspaceHandle, setViewMode, close } = useSurvey();
  const [sweepIndex, setSweepIndex] = useState(0);
  const [sweep, setSweep] = useState<SourceSweep | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoverPoint, setHoverPoint] = useState<Point | null>(null);
  const [stickyPoint, setStickyPoint] = useState<Point | null>(null);

  useEffect(() => {
    setSweepIndex(0);
    setSweep(null);
    setError(null);
    setHoverPoint(null);
    setStickyPoint(null);
  }, [workspaceHandle, workspace?.calibrated]);

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

  const series = useMemo(() => {
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

  const handleHover = useCallback((p: Point | null) => {
    setHoverPoint(p);
  }, []);

  const handleClick = useCallback((p: Point) => {
    // Clicking a point always (re)pins to that point. Clicking empty space
    // on the graph unpins via onEmptyClick.
    setStickyPoint(p);
  }, []);

  const handleEmptyClick = useCallback(() => {
    setStickyPoint(null);
  }, []);

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

  return (
    <div className="survey-view workspace">
      <div className="workspace-frame">
        <div className="workspace-title">{`${workspace.name} - Sweep ${sweepNumber}`}</div>

        <div className="workspace-body">
          <div className="workspace-plots">
            <div className="plot-row">
              <div className="axis-label-y">Flux</div>
              <div className="plot-cell">
                {loading && <div className="plot-status">Loading sweep…</div>}
                {error && <div className="plot-status error">{error}</div>}
                {sweep && (
                  <PointScatter
                    series={series}
                    xAxisLabel="Declination"
                    yAxisLabel=""
                    onHover={handleHover}
                    onPointClick={handleClick}
                    onEmptyClick={handleEmptyClick}
                    pinnedPoint={
                      stickyPoint
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
              <div className="plot-cell baseline-placeholder">
                <PointScatter
                  series={[]}
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
              <button disabled={!workspace.calibrated} title="Accept this sweep into the survey">
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
              <button disabled title="Baseline segment (not implemented yet)">
                Baseline Segment
              </button>
              <button onClick={() => void close()}>Cancel</button>
            </div>

            <div className="readout">
              <div>RA: {readoutPoint ? formatRa(readoutPoint.ra) : '--:--:--'}</div>
              <div>Dec: {readoutPoint ? formatDec(readoutPoint.dec) : '--:--:--'}</div>
              <div>Flux: {readoutPoint ? formatFlux(readoutPoint.flux, unit) : `-- ${unit === 'volts' ? 'V' : 'GCU'}`}</div>
              {stickyPoint && <div className="readout-pin">📌 pinned (click empty space to release)</div>}
            </div>

            <div className="sweep-nav">
              <button
                disabled={sweepIndex <= 0 || loading}
                onClick={() => setSweepIndex((i) => Math.max(0, i - 1))}
              >
                ‹ Prev
              </button>
              <span>
                {sweepIndex + 1} / {sweepCount}
              </span>
              <button
                disabled={sweepIndex >= sweepCount - 1 || loading}
                onClick={() => setSweepIndex((i) => Math.min(sweepCount - 1, i + 1))}
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
