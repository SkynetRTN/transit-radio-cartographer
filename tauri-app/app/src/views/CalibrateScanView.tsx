import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  rpcClient,
  type ScanCalibrationView,
  type CalibrationBracket,
} from '../ipc/client';
import { useScan } from '../state/scan-context';
import { PointScatter, type Point } from '../lib/plots/PointScatter';
import { dataColors } from '../lib/plots/plot-theme';
import { useTheme } from '../state/theme-context';

function formatRa(seconds: number): string {
  const total = Math.max(0, seconds);
  const hours = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = Math.floor(total % 60);
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function formatDec(deg: number): string {
  const sign = deg < 0 ? '-' : '';
  const abs = Math.abs(deg);
  const d = Math.floor(abs);
  const m = Math.floor((abs - d) * 60);
  const s = Math.floor((abs - d - m / 60) * 3600);
  return `${sign}${String(d).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

interface ScatterPoint extends Point {
  kept: boolean;
}

interface BracketLayout {
  fluxPoints: ScatterPoint[];
  decPoints: ScatterPoint[];
  xRange: [number, number];
  fluxYRange: [number, number];
  decYRange: [number, number];
  separator: number;
}

function bracketLayout(bracket: CalibrationBracket): BracketLayout {
  const fluxPoints: ScatterPoint[] = [];
  const decPoints: ScatterPoint[] = [];
  const pushPoints = (series: typeof bracket.on) => {
    const out = { fluxes: [] as number[], decs: [] as number[], ras: [] as number[] };
    for (let i = 0; i < series.ra.length; i++) {
      const ra = series.ra[i];
      const dec = series.dec[i];
      const flux = series.flux[i];
      const kept = series.mask[i];
      fluxPoints.push({ x: ra, y: flux, ra, dec, flux, kept });
      decPoints.push({ x: ra, y: dec, ra, dec, flux, kept });
      out.fluxes.push(flux);
      out.decs.push(dec);
      out.ras.push(ra);
    }
    return out;
  };
  const on = pushPoints(bracket.on);
  const off = pushPoints(bracket.off);
  const allRa = [...on.ras, ...off.ras];
  const ramin = Math.min(...allRa);
  const ramax = Math.max(...allRa);
  const raPad = Math.max((ramax - ramin) * 0.04, 1);
  let separator = (ramin + ramax) / 2;
  if (on.ras.length > 0 && off.ras.length > 0) {
    const lastOn = Math.max(...on.ras);
    const firstOff = Math.min(...off.ras);
    separator = (lastOn + firstOff) / 2;
  }
  const fluxes = [...on.fluxes, ...off.fluxes];
  const decs = [...on.decs, ...off.decs];
  const fmin = Math.min(...fluxes);
  const fmax = Math.max(...fluxes);
  const fluxYPad = Math.max((fmax - fmin) * 0.15, 0.001);
  const dmin = Math.min(...decs);
  const dmax = Math.max(...decs);
  const decYPad = Math.max((dmax - dmin) * 0.15, 0.01);
  return {
    fluxPoints,
    decPoints,
    xRange: [ramin - raPad, ramax + raPad],
    fluxYRange: [fmin - fluxYPad, fmax + fluxYPad],
    decYRange: [dmin - decYPad, dmax + decYPad],
    separator,
  };
}

function splitKeptCut(points: ScatterPoint[], color: string) {
  const kept = points.filter((p) => p.kept);
  const cut = points.filter((p) => !p.kept);
  return [
    { points: cut, color, name: 'cut', faded: true },
    { points: kept, color, name: 'kept' },
  ];
}

export function CalibrateScanView() {
  const { overview, handle, setViewMode, refreshOverview, setOverview, markDirty } = useScan();
  const { theme } = useTheme();
  const dc = dataColors(theme);
  const [view, setView] = useState<ScanCalibrationView | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'idle' | 'cut' | 'select-dec'>('idle');
  const [dragRange, setDragRange] = useState<
    | { bracket: 'initial' | 'terminal'; x0: number; x1: number }
    | null
  >(null);
  const [dragDecRange, setDragDecRange] = useState<
    | { bracket: 'initial' | 'terminal'; y0: number; y1: number }
    | null
  >(null);
  const [hoverPoint, setHoverPoint] = useState<Point | null>(null);
  const [stickyPoint, setStickyPoint] = useState<Point | null>(null);
  const dragOrigin = useRef<{ bracket: 'initial' | 'terminal'; x: number } | null>(null);
  const dragDecOrigin = useRef<{ bracket: 'initial' | 'terminal'; y: number } | null>(null);

  const loadView = useCallback(async () => {
    if (handle === null) return;
    setLoading(true);
    setError(null);
    try {
      const v = await rpcClient.getScanCalibrationView(handle);
      setView(v);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [handle]);

  useEffect(() => {
    void loadView();
  }, [loadView]);

  const initialLayout = useMemo<BracketLayout | null>(
    () => (view ? bracketLayout(view.initial) : null),
    [view],
  );
  const terminalLayout = useMemo<BracketLayout | null>(
    () => (view ? bracketLayout(view.terminal) : null),
    [view],
  );

  const handleHover = useCallback((p: Point | null) => setHoverPoint(p), []);
  const handleClick = useCallback((p: Point) => setStickyPoint(p), []);
  const handleEmptyClick = useCallback(() => setStickyPoint(null), []);

  const pinnedBracket: 'initial' | 'terminal' | null = useMemo(() => {
    if (!stickyPoint || !initialLayout || !terminalLayout) return null;
    const [iLo, iHi] = initialLayout.xRange;
    if (stickyPoint.ra >= iLo && stickyPoint.ra <= iHi) return 'initial';
    const [tLo, tHi] = terminalLayout.xRange;
    if (stickyPoint.ra >= tLo && stickyPoint.ra <= tHi) return 'terminal';
    return null;
  }, [stickyPoint, initialLayout, terminalLayout]);

  const makeDragHandlers = (bracket: 'initial' | 'terminal') => ({
    onDragStart: (x: number) => {
      if (mode !== 'cut') return;
      dragOrigin.current = { bracket, x };
      setDragRange({ bracket, x0: x, x1: x });
    },
    onDragUpdate: (x: number) => {
      if (mode !== 'cut' || !dragOrigin.current || dragOrigin.current.bracket !== bracket) return;
      const origin = dragOrigin.current.x;
      setDragRange({ bracket, x0: Math.min(origin, x), x1: Math.max(origin, x) });
    },
    onDragEnd: async () => {
      const range = dragRange;
      dragOrigin.current = null;
      if (mode !== 'cut' || !range || range.bracket !== bracket || handle === null) {
        setDragRange(null);
        return;
      }
      if (range.x0 === range.x1) {
        setDragRange(null);
        return;
      }
      setDragRange(null);
      try {
        await rpcClient.cutScanCalibrationSegment(handle, range.x0, range.x1);
        await Promise.all([loadView(), refreshOverview()]);
        markDirty();
      } catch (e) {
        setError((e as Error).message);
      }
    },
  });

  const makeDecDragHandlers = (bracket: 'initial' | 'terminal') => ({
    onDragStart: (y: number) => {
      if (mode !== 'select-dec') return;
      dragDecOrigin.current = { bracket, y };
      setDragDecRange({ bracket, y0: y, y1: y });
    },
    onDragUpdate: (y: number) => {
      if (mode !== 'select-dec' || !dragDecOrigin.current || dragDecOrigin.current.bracket !== bracket) {
        return;
      }
      const origin = dragDecOrigin.current.y;
      setDragDecRange({ bracket, y0: Math.min(origin, y), y1: Math.max(origin, y) });
    },
    onDragEnd: async () => {
      const range = dragDecRange;
      dragDecOrigin.current = null;
      if (mode !== 'select-dec' || !range || range.bracket !== bracket || handle === null) {
        setDragDecRange(null);
        return;
      }
      if (range.y0 === range.y1) {
        setDragDecRange(null);
        return;
      }
      setDragDecRange(null);
      try {
        await rpcClient.selectScanCalibrationDeclination(handle, range.y0, range.y1, bracket);
        await Promise.all([loadView(), refreshOverview()]);
        markDirty();
      } catch (e) {
        setError((e as Error).message);
      }
    },
  });

  const handleUndo = useCallback(async () => {
    if (handle === null) return;
    try {
      await rpcClient.undoScan(handle);
      await Promise.all([loadView(), refreshOverview()]);
      markDirty();
    } catch (e) {
      setError((e as Error).message);
    }
  }, [handle, loadView, refreshOverview, markDirty]);

  const handleApplyCalibration = useCallback(async () => {
    if (handle === null) return;
    try {
      const overv = await rpcClient.applyScanCalibration(handle);
      setOverview(overv);
      markDirty();
      setViewMode('scan');
    } catch (e) {
      setError((e as Error).message);
    }
  }, [handle, setOverview, setViewMode, markDirty]);

  const toggleInitial = useCallback(
    async (enabled: boolean) => {
      if (handle === null) return;
      const overv = await rpcClient.setScanBracketEnabled(handle, 'initial', enabled);
      setOverview(overv);
      await loadView();
    },
    [handle, loadView, setOverview],
  );

  const toggleTerminal = useCallback(
    async (enabled: boolean) => {
      if (handle === null) return;
      const overv = await rpcClient.setScanBracketEnabled(handle, 'terminal', enabled);
      setOverview(overv);
      await loadView();
    },
    [handle, loadView, setOverview],
  );

  if (!overview || handle === null) {
    return (
      <div className="survey-view empty">
        <p>No scan loaded. Use Scan → New Scan… first.</p>
      </div>
    );
  }

  const readoutPoint = stickyPoint ?? hoverPoint;
  const initialDrag = makeDragHandlers('initial');
  const terminalDrag = makeDragHandlers('terminal');
  const initialDecDrag = makeDecDragHandlers('initial');
  const terminalDecDrag = makeDecDragHandlers('terminal');

  return (
    <div className="survey-view workspace calibrate-view calibrate-scan-view">
      <div className="workspace-frame">
        <div className="workspace-title">{overview.name}</div>

        <div className="workspace-body">
          <div className="workspace-plots">
            <div className="plot-row">
              <div className="axis-label-y">Flux</div>
              <div className="bracket-split">
                <div className="plot-cell">
                  {loading && <div className="plot-status">Loading calibration view…</div>}
                  {error && <div className="plot-status error">{error}</div>}
                  {view && initialLayout && (
                    <PointScatter
                      series={splitKeptCut(initialLayout.fluxPoints, dc.seriesPrimary)}
                      xAxisLabel=""
                      yAxisLabel=""
                      onHover={handleHover}
                      onPointClick={handleClick}
                      onEmptyClick={handleEmptyClick}
                      pinnedPoint={
                        stickyPoint && pinnedBracket === 'initial'
                          ? { x: stickyPoint.ra, y: stickyPoint.flux }
                          : null
                      }
                      highlightRange={dragRange?.bracket === 'initial' ? dragRange : null}
                      verticalLines={[initialLayout.separator]}
                      onDragStart={initialDrag.onDragStart}
                      onDragUpdate={initialDrag.onDragUpdate}
                      onDragEnd={initialDrag.onDragEnd}
                      dragEnabled={mode === 'cut'}
                      testId="scan-cal-flux-initial"
                      height={240}
                      fixedXRange={initialLayout.xRange}
                      fixedYRange={initialLayout.fluxYRange}
                      showXTicks={false}
                    />
                  )}
                </div>
                <div className="plot-cell">
                  {view && terminalLayout && (
                    <PointScatter
                      series={splitKeptCut(terminalLayout.fluxPoints, dc.seriesPrimary)}
                      xAxisLabel=""
                      yAxisLabel=""
                      onHover={handleHover}
                      onPointClick={handleClick}
                      onEmptyClick={handleEmptyClick}
                      pinnedPoint={
                        stickyPoint && pinnedBracket === 'terminal'
                          ? { x: stickyPoint.ra, y: stickyPoint.flux }
                          : null
                      }
                      highlightRange={dragRange?.bracket === 'terminal' ? dragRange : null}
                      verticalLines={[terminalLayout.separator]}
                      onDragStart={terminalDrag.onDragStart}
                      onDragUpdate={terminalDrag.onDragUpdate}
                      onDragEnd={terminalDrag.onDragEnd}
                      dragEnabled={mode === 'cut'}
                      testId="scan-cal-flux-terminal"
                      height={240}
                      fixedXRange={terminalLayout.xRange}
                      fixedYRange={terminalLayout.fluxYRange}
                      showXTicks={false}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="plot-row-label">
              <div className="axis-label-y-spacer" />
              <div className="x-axis-label">Right Ascension</div>
            </div>

            <div className="plot-row">
              <div className="axis-label-y">Declination</div>
              <div className="bracket-split">
                <div className="plot-cell">
                  {view && initialLayout && (
                    <PointScatter
                      series={splitKeptCut(initialLayout.decPoints, dc.seriesSecondary)}
                      xAxisLabel=""
                      yAxisLabel=""
                      onHover={handleHover}
                      onPointClick={handleClick}
                      onEmptyClick={handleEmptyClick}
                      pinnedPoint={
                        stickyPoint && pinnedBracket === 'initial'
                          ? { x: stickyPoint.ra, y: stickyPoint.dec }
                          : null
                      }
                      highlightRange={dragRange?.bracket === 'initial' ? dragRange : null}
                      highlightYRange={
                        mode === 'select-dec' && dragDecRange?.bracket === 'initial'
                          ? dragDecRange
                          : null
                      }
                      verticalLines={[initialLayout.separator]}
                      onDragStart={initialDecDrag.onDragStart}
                      onDragUpdate={initialDecDrag.onDragUpdate}
                      onDragEnd={initialDecDrag.onDragEnd}
                      dragEnabled={mode === 'select-dec'}
                      dragAxis="y"
                      testId="scan-cal-dec-initial"
                      height={180}
                      fixedXRange={initialLayout.xRange}
                      fixedYRange={initialLayout.decYRange}
                      showXTicks={false}
                    />
                  )}
                </div>
                <div className="plot-cell">
                  {view && terminalLayout && (
                    <PointScatter
                      series={splitKeptCut(terminalLayout.decPoints, dc.seriesSecondary)}
                      xAxisLabel=""
                      yAxisLabel=""
                      onHover={handleHover}
                      onPointClick={handleClick}
                      onEmptyClick={handleEmptyClick}
                      pinnedPoint={
                        stickyPoint && pinnedBracket === 'terminal'
                          ? { x: stickyPoint.ra, y: stickyPoint.dec }
                          : null
                      }
                      highlightRange={dragRange?.bracket === 'terminal' ? dragRange : null}
                      highlightYRange={
                        mode === 'select-dec' && dragDecRange?.bracket === 'terminal'
                          ? dragDecRange
                          : null
                      }
                      verticalLines={[terminalLayout.separator]}
                      onDragStart={terminalDecDrag.onDragStart}
                      onDragUpdate={terminalDecDrag.onDragUpdate}
                      onDragEnd={terminalDecDrag.onDragEnd}
                      dragEnabled={mode === 'select-dec'}
                      dragAxis="y"
                      testId="scan-cal-dec-terminal"
                      height={180}
                      fixedXRange={terminalLayout.xRange}
                      fixedYRange={terminalLayout.decYRange}
                      showXTicks={false}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="workspace-side">
            <div className="side-buttons">
              <button onClick={() => void handleApplyCalibration()} className="primary">
                Calibrate Scan
              </button>
              <div className="button-gap" />
              <button
                onClick={() => setMode((m) => (m === 'cut' ? 'idle' : 'cut'))}
                className={mode === 'cut' ? 'active' : ''}
                title="Drag on either flux panel to remove RA samples from that cal bracket"
              >
                {mode === 'cut' ? 'Cut Segment (drag…)' : 'Cut Segment'}
              </button>
              <button
                onClick={() => setMode((m) => (m === 'select-dec' ? 'idle' : 'select-dec'))}
                className={mode === 'select-dec' ? 'active' : ''}
                title="Drag a horizontal band on either declination panel to keep only cal samples inside that Dec range"
              >
                {mode === 'select-dec' ? 'Select Declination (drag…)' : 'Select Declination'}
              </button>
              <button
                onClick={() => void handleUndo()}
                disabled={!view?.can_undo}
                title="Restore the most recent cut or declination selection"
              >
                Undo
              </button>
              <button onClick={() => setViewMode('scan')}>Cancel</button>
            </div>

            <div className="cal-sidebar">
              <div className="cal-title">Calibrations</div>
              <label className="cal-row">
                <input
                  type="checkbox"
                  checked={view?.initial_enabled ?? true}
                  onChange={(e) => void toggleInitial(e.target.checked)}
                />
                Pre: {(view?.cal1 ?? 0).toFixed(3)} V
              </label>
              <label className="cal-row">
                <input
                  type="checkbox"
                  checked={view?.terminal_enabled ?? true}
                  onChange={(e) => void toggleTerminal(e.target.checked)}
                />
                Post: {(view?.cal2 ?? 0).toFixed(3)} V
              </label>
            </div>

            <div className="readout">
              <div>RA: {readoutPoint ? formatRa(readoutPoint.ra) : '--:--:--'}</div>
              <div>Dec: {readoutPoint ? formatDec(readoutPoint.dec) : '--:--:--'}</div>
              <div>Flux: {readoutPoint ? `${readoutPoint.flux.toFixed(3)} V` : '-- V'}</div>
              {stickyPoint && (
                <div className="readout-pin">📌 pinned (click empty space to release)</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
