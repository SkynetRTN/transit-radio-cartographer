import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { rpcClient, type ScanViewPayload } from '../ipc/client';
import { useScan } from '../state/scan-context';
import { PointScatter, type Point } from '../lib/plots/PointScatter';

function formatRa(seconds: number): string {
  // RA in `.md1` is given in arc-time seconds (matches the survey format).
  const total = Math.max(0, seconds);
  const hours = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = Math.floor(total % 60);
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function formatDec(deg: number): string {
  // The .md1 declination column is decimal degrees (the legacy formats as
  // ``Int(|Dec|) : Int(|Dec|·60 mod 60) : Int(|Dec|·3600 mod 60)`` at
  // `vb/scanform.frm:2240-2242`).
  const sign = deg < 0 ? '-' : '';
  const abs = Math.abs(deg);
  const d = Math.floor(abs);
  const m = Math.floor((abs - d) * 60);
  const s = Math.floor((abs - d - m / 60) * 3600);
  return `${sign}${String(d).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatFlux(v: number, unit: 'volts' | 'gain' | 'jy'): string {
  const label = unit === 'volts' ? 'V' : unit === 'jy' ? 'Jy' : 'GCU';
  return `${v.toFixed(3)} ${label}`;
}

interface Mode {
  kind: 'idle' | 'cut' | 'select-dec' | 'baseline' | 'peak';
}

export function ScanView() {
  const { scan, overview, handle, setViewMode, close, refreshOverview, setOverview, markDirty } = useScan();
  const [view, setView] = useState<ScanViewPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoverPoint, setHoverPoint] = useState<Point | null>(null);
  const [stickyPoint, setStickyPoint] = useState<Point | null>(null);
  const [hoverY, setHoverY] = useState<number | null>(null);
  const [mode, setMode] = useState<Mode>({ kind: 'idle' });
  const [dragRange, setDragRange] = useState<{ x0: number; x1: number } | null>(null);
  const [dragDecRange, setDragDecRange] = useState<{ y0: number; y1: number } | null>(null);
  const [pendingBaselinePoint, setPendingBaselinePoint] = useState<
    { ra: number; flux: number } | null
  >(null);
  const dragOrigin = useRef<number | null>(null);
  const dragDecOrigin = useRef<number | null>(null);

  const loadView = useCallback(async () => {
    if (handle === null) return;
    setLoading(true);
    setError(null);
    try {
      const v = await rpcClient.getScanView(handle);
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

  // Reset transient interaction state whenever the underlying view changes
  // (e.g. after a Cut / Baseline Source / Determine Peak completes).
  useEffect(() => {
    setStickyPoint(null);
    setPendingBaselinePoint(null);
    setDragRange(null);
    setDragDecRange(null);
  }, [view]);

  const unit: 'volts' | 'gain' | 'jy' = view?.unit ?? 'volts';
  const calibrated = view?.calibrated === true;

  // Build scatter series. Pre-cal renders cal blocks separately so the
  // user can see where the cal-on / cal-off bands sit; post-cal renders
  // only the source samples.
  const fluxSeries = useMemo(() => {
    if (!view) return [];
    if (view.calibrated) {
      const pts: Point[] = view.source.ra.map((ra, i) => ({
        x: ra,
        y: view.source.flux[i],
        ra,
        dec: view.source.dec[i],
        flux: view.source.flux[i],
      }));
      const kept = pts.filter((_, i) => view.source.mask[i]);
      const cut = pts.filter((_, i) => !view.source.mask[i]);
      return [
        { points: cut, color: '#d80000', name: 'cut', faded: true },
        { points: kept, color: '#d80000', name: 'source' },
      ];
    }
    const make = (
      raArr: number[],
      decArr: number[],
      fluxArr: number[],
      mask: boolean[],
    ): Point[] =>
      raArr.map((ra, i) => ({
        x: ra,
        y: fluxArr[i],
        ra,
        dec: decArr[i],
        flux: fluxArr[i],
      })).filter((_, i) => mask[i]);
    // Cal and source samples share the same red so the whole pre-cal sweep
    // reads as one continuous track; the vertical separator lines drawn
    // through `verticalLines` are what tell the user where the cal-on /
    // cal-off / source blocks begin and end.
    return [
      { points: make(view.initial_on.ra, view.initial_on.dec, view.initial_on.flux, view.initial_on.mask), color: '#d80000', name: 'initial-on' },
      { points: make(view.initial_off.ra, view.initial_off.dec, view.initial_off.flux, view.initial_off.mask), color: '#d80000', name: 'initial-off' },
      { points: make(view.source.ra, view.source.dec, view.source.flux, view.source.mask), color: '#d80000', name: 'source' },
      { points: make(view.terminal_on.ra, view.terminal_on.dec, view.terminal_on.flux, view.terminal_on.mask), color: '#d80000', name: 'terminal-on' },
      { points: make(view.terminal_off.ra, view.terminal_off.dec, view.terminal_off.flux, view.terminal_off.mask), color: '#d80000', name: 'terminal-off' },
    ];
  }, [view]);

  const decSeries = useMemo(() => {
    if (!view) return [];
    if (view.calibrated) {
      const pts: Point[] = view.source.ra.map((ra, i) => ({
        x: ra,
        y: view.source.dec[i],
        ra,
        dec: view.source.dec[i],
        flux: view.source.flux[i],
      }));
      const kept = pts.filter((_, i) => view.source.mask[i]);
      const cut = pts.filter((_, i) => !view.source.mask[i]);
      return [
        { points: cut, color: '#1855c0', name: 'cut', faded: true },
        { points: kept, color: '#1855c0', name: 'source' },
      ];
    }
    const make = (raArr: number[], decArr: number[], fluxArr: number[], mask: boolean[]): Point[] =>
      raArr.map((ra, i) => ({ x: ra, y: decArr[i], ra, dec: decArr[i], flux: fluxArr[i] })).filter((_, i) => mask[i]);
    return [
      { points: make(view.initial_on.ra, view.initial_on.dec, view.initial_on.flux, view.initial_on.mask), color: '#1855c0', name: 'initial-on' },
      { points: make(view.initial_off.ra, view.initial_off.dec, view.initial_off.flux, view.initial_off.mask), color: '#1855c0', name: 'initial-off' },
      { points: make(view.source.ra, view.source.dec, view.source.flux, view.source.mask), color: '#1855c0', name: 'source' },
      { points: make(view.terminal_on.ra, view.terminal_on.dec, view.terminal_on.flux, view.terminal_on.mask), color: '#1855c0', name: 'terminal-on' },
      { points: make(view.terminal_off.ra, view.terminal_off.dec, view.terminal_off.flux, view.terminal_off.mask), color: '#1855c0', name: 'terminal-off' },
    ];
  }, [view]);

  // Pre-cal vertical separator lines (legacy `vb/scanform.frm:1385-1396`):
  // at the midpoint between cal-on/off and at each cal/source boundary.
  const verticalLines = useMemo<number[]>(() => {
    if (!view || view.calibrated) return [];
    const lastInitOn = view.initial_on.ra[view.initial_on.ra.length - 1];
    const firstInitOff = view.initial_off.ra[0];
    const lastInitOff = view.initial_off.ra[view.initial_off.ra.length - 1];
    const firstSrc = view.source.ra[0];
    const lastSrc = view.source.ra[view.source.ra.length - 1];
    const firstTermOn = view.terminal_on.ra[0];
    const lastTermOn = view.terminal_on.ra[view.terminal_on.ra.length - 1];
    const firstTermOff = view.terminal_off.ra[0];
    return [
      (lastInitOn + firstInitOff) / 2,
      (lastInitOff + firstSrc) / 2,
      (lastSrc + firstTermOn) / 2,
      (lastTermOn + firstTermOff) / 2,
    ];
  }, [view]);

  // Track hover Y while in peak mode so we can draw a horizontal cursor line.
  // The legacy gesture (`vb/scanform.frm:1796-1820`) paints a blue line at
  // the cursor's Y on the flux plot.
  const handleHover = useCallback(
    (p: Point | null) => {
      setHoverPoint(p);
      if (mode.kind === 'peak' && p) setHoverY(p.flux);
    },
    [mode.kind],
  );

  const handleClick = useCallback(
    async (p: Point) => {
      if (mode.kind === 'peak' && handle !== null) {
        try {
          const res = await rpcClient.determineScanPeak(handle, p.flux);
          setOverview(res.overview);
          markDirty();
          setMode({ kind: 'idle' });
          setHoverY(null);
        } catch (e) {
          setError((e as Error).message);
        }
        return;
      }
      if (mode.kind === 'baseline' && handle !== null) {
        if (!pendingBaselinePoint) {
          setPendingBaselinePoint({ ra: p.ra, flux: p.flux });
          return;
        }
        try {
          await rpcClient.baselineScanSource(
            handle,
            pendingBaselinePoint.ra,
            pendingBaselinePoint.flux,
            p.ra,
            p.flux,
          );
          await Promise.all([loadView(), refreshOverview()]);
          markDirty();
          setMode({ kind: 'idle' });
          setPendingBaselinePoint(null);
        } catch (e) {
          setError((e as Error).message);
        }
        return;
      }
      setStickyPoint(p);
    },
    [mode.kind, handle, pendingBaselinePoint, loadView, refreshOverview, setOverview, markDirty],
  );

  const handleEmptyClick = useCallback(() => {
    if (mode.kind === 'baseline' && pendingBaselinePoint) {
      // Empty-space click cancels a pending first endpoint (matches the
      // legacy right-click cancel; we approximate with empty-space click).
      setPendingBaselinePoint(null);
      return;
    }
    setStickyPoint(null);
  }, [mode.kind, pendingBaselinePoint]);

  const fluxDragHandlers = useMemo(
    () => ({
      onDragStart: (x: number) => {
        if (mode.kind !== 'cut') return;
        dragOrigin.current = x;
        setDragRange({ x0: x, x1: x });
      },
      onDragUpdate: (x: number) => {
        if (mode.kind !== 'cut' || dragOrigin.current === null) return;
        const origin = dragOrigin.current;
        setDragRange({ x0: Math.min(origin, x), x1: Math.max(origin, x) });
      },
      onDragEnd: async () => {
        const range = dragRange;
        dragOrigin.current = null;
        if (mode.kind !== 'cut' || !range || handle === null) {
          setDragRange(null);
          return;
        }
        if (range.x0 === range.x1) {
          setDragRange(null);
          return;
        }
        setDragRange(null);
        setMode({ kind: 'idle' });
        try {
          await rpcClient.cutScanSegment(handle, range.x0, range.x1);
          await Promise.all([loadView(), refreshOverview()]);
          markDirty();
        } catch (e) {
          setError((e as Error).message);
        }
      },
    }),
    [mode.kind, dragRange, handle, loadView, refreshOverview, markDirty],
  );

  const decDragHandlers = useMemo(
    () => ({
      onDragStart: (y: number) => {
        if (mode.kind !== 'select-dec') return;
        dragDecOrigin.current = y;
        setDragDecRange({ y0: y, y1: y });
      },
      onDragUpdate: (y: number) => {
        if (mode.kind !== 'select-dec' || dragDecOrigin.current === null) return;
        const origin = dragDecOrigin.current;
        setDragDecRange({ y0: Math.min(origin, y), y1: Math.max(origin, y) });
      },
      onDragEnd: async () => {
        const range = dragDecRange;
        dragDecOrigin.current = null;
        if (mode.kind !== 'select-dec' || !range || handle === null) {
          setDragDecRange(null);
          return;
        }
        if (range.y0 === range.y1) {
          setDragDecRange(null);
          return;
        }
        setDragDecRange(null);
        setMode({ kind: 'idle' });
        try {
          await rpcClient.selectScanDeclination(handle, range.y0, range.y1);
          await Promise.all([loadView(), refreshOverview()]);
          markDirty();
        } catch (e) {
          setError((e as Error).message);
        }
      },
    }),
    [mode.kind, dragDecRange, handle, loadView, refreshOverview, markDirty],
  );

  const toggleMode = useCallback(
    (kind: Mode['kind']) => {
      setMode((m) => (m.kind === kind ? { kind: 'idle' } : { kind }));
      setPendingBaselinePoint(null);
      setHoverY(null);
    },
    [],
  );

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

  // Live baseline rubber-band — first endpoint to current hover point.
  const baselineOverlay = useMemo(() => {
    if (mode.kind !== 'baseline' || !pendingBaselinePoint || !hoverPoint) return [];
    return [
      {
        points: [
          { x: pendingBaselinePoint.ra, y: pendingBaselinePoint.flux },
          { x: hoverPoint.ra, y: hoverPoint.flux },
        ],
        color: '#c020c0',
        width: 1,
      },
    ];
  }, [mode.kind, pendingBaselinePoint, hoverPoint]);

  if (!scan || !overview || handle === null) {
    return (
      <div className="survey-view empty">
        <p>No scan loaded. Use Scan → New Scan... to open an .md1 file.</p>
      </div>
    );
  }

  const readoutPoint = stickyPoint ?? hoverPoint;

  // Peak-mode horizontal line overlay on the flux plot.
  const peakLineOverlay = mode.kind === 'peak' && hoverY !== null && view?.calibrated
    ? [
        {
          points: [
            { x: view.source.ra[0], y: hoverY },
            { x: view.source.ra[view.source.ra.length - 1], y: hoverY },
          ],
          color: '#0080ff',
          width: 2,
        },
      ]
    : [];

  const fluxOverlays = [...peakLineOverlay, ...baselineOverlay] as Array<{
    points: { x: number; y: number }[];
    color?: string;
    width?: number;
  }>;

  const hint = (() => {
    if (mode.kind === 'cut') return 'Cut Segment: drag on the flux plot…';
    if (mode.kind === 'select-dec') return 'Select Declination: drag on the declination plot…';
    if (mode.kind === 'baseline')
      return pendingBaselinePoint ? 'Baseline Source: click endpoint…' : 'Baseline Source: click first point…';
    if (mode.kind === 'peak') return 'Determine Peak: click at the peak flux level…';
    return null;
  })();

  return (
    <div className="survey-view workspace scan-view">
      <div className="workspace-frame">
        <div className="workspace-title">{overview.name}</div>

        <div className="workspace-body">
          <div className="workspace-plots">
            <div className="plot-row">
              <div className="axis-label-y">Flux</div>
              <div className="plot-cell">
                {loading && <div className="plot-status">Loading scan…</div>}
                {error && <div className="plot-status error">{error}</div>}
                {hint && <div className="plot-status">{hint}</div>}
                {view && (
                  <PointScatter
                    series={fluxSeries}
                    xAxisLabel=""
                    yAxisLabel=""
                    verticalLines={verticalLines}
                    overlayLines={fluxOverlays}
                    onHover={handleHover}
                    onPointClick={handleClick}
                    onEmptyClick={handleEmptyClick}
                    pinnedPoint={
                      pendingBaselinePoint
                        ? { x: pendingBaselinePoint.ra, y: pendingBaselinePoint.flux }
                        : stickyPoint
                          ? { x: stickyPoint.ra, y: stickyPoint.flux }
                          : null
                    }
                    highlightRange={dragRange}
                    onDragStart={fluxDragHandlers.onDragStart}
                    onDragUpdate={fluxDragHandlers.onDragUpdate}
                    onDragEnd={fluxDragHandlers.onDragEnd}
                    dragEnabled={mode.kind === 'cut'}
                    testId="scan-flux-plot"
                    height={240}
                    showXTicks={false}
                  />
                )}
              </div>
            </div>

            <div className="plot-row-label">
              <div className="axis-label-y-spacer" />
              <div className="x-axis-label">Right Ascension</div>
            </div>

            <div className="plot-row">
              <div className="axis-label-y">Declination</div>
              <div className="plot-cell">
                {view && (
                  <PointScatter
                    series={decSeries}
                    xAxisLabel=""
                    yAxisLabel=""
                    verticalLines={verticalLines}
                    onHover={handleHover}
                    onPointClick={handleClick}
                    onEmptyClick={handleEmptyClick}
                    pinnedPoint={
                      stickyPoint ? { x: stickyPoint.ra, y: stickyPoint.dec } : null
                    }
                    highlightYRange={dragDecRange}
                    onDragStart={decDragHandlers.onDragStart}
                    onDragUpdate={decDragHandlers.onDragUpdate}
                    onDragEnd={decDragHandlers.onDragEnd}
                    dragEnabled={mode.kind === 'select-dec'}
                    dragAxis="y"
                    testId="scan-dec-plot"
                    height={200}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="workspace-side">
            <div className="side-buttons">
              {!calibrated && (
                <button
                  onClick={() => setViewMode('calibrate-scan')}
                  className="primary"
                  title="Open the cut-segment / select-declination view for the cal brackets"
                >
                  Calibrate Scan
                </button>
              )}
              {calibrated && (
                <>
                  <button
                    onClick={() => toggleMode('select-dec')}
                    className={mode.kind === 'select-dec' ? 'active' : ''}
                    title="Drag on the declination plot to keep only source samples inside that band"
                  >
                    {mode.kind === 'select-dec' ? 'Select Declination (drag…)' : 'Select Declination'}
                  </button>
                  <button
                    onClick={() => toggleMode('baseline')}
                    className={mode.kind === 'baseline' ? 'active' : ''}
                    title="Click two points on the flux plot to subtract the line between them as a baseline"
                  >
                    {mode.kind === 'baseline'
                      ? pendingBaselinePoint
                        ? 'Baseline Source (click…)'
                        : 'Baseline Source (click…)'
                      : 'Baseline Source'}
                  </button>
                  <button
                    onClick={() => toggleMode('peak')}
                    className={mode.kind === 'peak' ? 'active' : ''}
                    title="Click on the flux plot at the peak of your source"
                  >
                    {mode.kind === 'peak' ? 'Determine Peak (click…)' : 'Determine Peak'}
                  </button>
                  <button
                    onClick={() => toggleMode('cut')}
                    className={mode.kind === 'cut' ? 'active' : ''}
                    title="Drag on the flux plot to remove source samples inside that RA range"
                  >
                    {mode.kind === 'cut' ? 'Cut Segment (drag…)' : 'Cut Segment'}
                  </button>
                </>
              )}
              <button
                onClick={() => void handleUndo()}
                disabled={!overview.can_undo}
                title="Undo the most recent cut / baseline / peak operation"
              >
                Undo
              </button>
              <button onClick={() => void close()}>Cancel</button>
            </div>

            {calibrated && overview.peak_flux !== null && (
              <div className="readout peak-readout">
                <strong>Peak Flux:</strong> {overview.peak_flux.toFixed(3)} {unit === 'gain' ? 'GCU' : 'V'}
              </div>
            )}

            <div className="readout">
              <div>RA: {readoutPoint ? formatRa(readoutPoint.ra) : '--:--:--'}</div>
              <div>Dec: {readoutPoint ? formatDec(readoutPoint.dec) : '--:--:--'}</div>
              <div>
                Flux: {readoutPoint ? formatFlux(readoutPoint.flux, unit) : `-- ${unit === 'gain' ? 'GCU' : 'V'}`}
              </div>
              {stickyPoint && mode.kind === 'idle' && (
                <div className="readout-pin">📌 pinned (click empty space to release)</div>
              )}
            </div>

            <div className="cal-sidebar">
              <div className="cal-title">Calibrations</div>
              <div className="cal-row">Initial: {overview.cal1.toFixed(3)} V</div>
              <div className="cal-row">Terminal: {overview.cal2.toFixed(3)} V</div>
              <div className="cal-row">Source samples: {overview.source_kept} / {overview.source_count}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

