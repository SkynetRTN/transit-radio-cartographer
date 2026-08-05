import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { rpcClient, type ScanViewPayload } from '../ipc/client';
import { useScan } from '../state/scan-context';
import { useTheme } from '../state/theme-context';
import { PointScatter, type Point } from '../lib/plots/PointScatter';
import { dataColors } from '../lib/plots/plot-theme';
import { WorkspaceBody } from './WorkspaceBody';
import { SelectInputDialog } from './dialogs/SelectInputDialog';
import type { PeakFitKind } from '../state/scan-context';

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
  const {
    scan,
    overview,
    handle,
    setViewMode,
    refreshOverview,
    setOverview,
    markDirty,
    peakFitKind,
    setPeakFitKind,
  } = useScan();
  const { theme } = useTheme();
  const dc = useMemo(() => dataColors(theme), [theme]);
  const [view, setView] = useState<ScanViewPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoverPoint, setHoverPoint] = useState<Point | null>(null);
  const [stickyPoint, setStickyPoint] = useState<Point | null>(null);
  const [mode, setMode] = useState<Mode>({ kind: 'idle' });
  const [dragRange, setDragRange] = useState<{ x0: number; x1: number } | null>(null);
  const [dragDecRange, setDragDecRange] = useState<{ y0: number; y1: number } | null>(null);
  const [pendingBaselinePoint, setPendingBaselinePoint] = useState<
    { ra: number; flux: number } | null
  >(null);
  // BUG-007 (dan): the baseline rubber-band tracks the FREE cursor (raw data
  // coords), not the nearest data point — matching the survey "Removed" plot's
  // free-floating recovery line. Endpoints come from `onCursorClick`.
  const [baselineCursor, setBaselineCursor] = useState<{ x: number; y: number } | null>(null);
  // BUG-002 (dan): the Determine-Peak fit model is chosen from a side button on
  // the scan screen (moved off the Scan menu), backed by this local dialog.
  const [fitDialogOpen, setFitDialogOpen] = useState(false);
  // Polynomial / Gaussian / cos² curve from the most recent Determine Peak
  // fit. Drawn over the flux plot so the user can see how the fit lays
  // through their selection; cleared whenever the view reloads. Engine
  // doesn't persist this — only the resulting `peak_flux` lives on the
  // workspace.
  const [pendingPeakFit, setPendingPeakFit] = useState<
    { ra: number[]; flux: number[] } | null
  >(null);
  // For the Max Value fit kind we ring the chosen sample instead of drawing
  // a curve; this is the (ra, flux) of that sample.
  const [pendingPeakHighlight, setPendingPeakHighlight] = useState<
    { ra: number; flux: number } | null
  >(null);
  const dragOrigin = useRef<number | null>(null);
  const dragDecOrigin = useRef<number | null>(null);

  // BUG-022: the fit-curve overlay is transient UI state the engine never
  // persists, so a plain reload wipes it. To make Undo restore the model fit
  // (not just the reverted peak flux), we keep a frontend history of the
  // overlay, pushed before every source-side mutation so it stays 1:1 with the
  // engine's source undo stack. On undo we stage the popped overlay and let the
  // `[view]` reset effect re-apply it after the reload clears it.
  type PeakOverlay = {
    fit: { ra: number[]; flux: number[] } | null;
    highlight: { ra: number; flux: number } | null;
  };
  const overlayHistoryRef = useRef<PeakOverlay[]>([]);
  const overlayRestoreRef = useRef<PeakOverlay | null>(null);
  const peakFitRef = useRef(pendingPeakFit);
  const peakHighlightRef = useRef(pendingPeakHighlight);
  useEffect(() => {
    peakFitRef.current = pendingPeakFit;
  }, [pendingPeakFit]);
  useEffect(() => {
    peakHighlightRef.current = pendingPeakHighlight;
  }, [pendingPeakHighlight]);
  const pushOverlayHistory = useCallback(() => {
    overlayHistoryRef.current.push({
      fit: peakFitRef.current,
      highlight: peakHighlightRef.current,
    });
  }, []);

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
    // Re-fetch when flux calibration flips so the plotted data is redrawn in
    // Jy as soon as a `.cal` is loaded. Without this the engine workspace is
    // converted but the cached `view` state stays in GCU, and any subsequent
    // Determine Peak fit (run on the engine in Jy) overlays a curve that
    // doesn't sit on the visible points. Also re-fetch when the source count
    // grows (BUG-006 append), which is driven from the Scan menu rather than
    // from this view's own handlers.
  }, [loadView, overview?.flux_calibrated, overview?.source_count]);

  // Reset transient interaction state whenever the underlying view changes
  // (e.g. after a Cut / Baseline Source / Select Declination completes). The
  // fit overlay is normally cleared too, unless an undo staged one to restore
  // (BUG-022) — in which case we re-apply it here, after the reload.
  useEffect(() => {
    setStickyPoint(null);
    setPendingBaselinePoint(null);
    setBaselineCursor(null);
    setDragRange(null);
    setDragDecRange(null);
    const restore = overlayRestoreRef.current;
    overlayRestoreRef.current = null;
    setPendingPeakFit(restore ? restore.fit : null);
    setPendingPeakHighlight(restore ? restore.highlight : null);
  }, [view]);

  // Drop the overlay history when the scan itself changes or its flux
  // calibration flips (both invalidate any earlier fit).
  useEffect(() => {
    overlayHistoryRef.current = [];
    overlayRestoreRef.current = null;
  }, [handle, overview?.flux_calibrated]);

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
        { points: cut, color: dc.seriesPrimary, name: 'cut', faded: true },
        { points: kept, color: dc.seriesPrimary, name: 'source' },
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
      { points: make(view.initial_on.ra, view.initial_on.dec, view.initial_on.flux, view.initial_on.mask), color: dc.seriesPrimary, name: 'initial-on' },
      { points: make(view.initial_off.ra, view.initial_off.dec, view.initial_off.flux, view.initial_off.mask), color: dc.seriesPrimary, name: 'initial-off' },
      { points: make(view.source.ra, view.source.dec, view.source.flux, view.source.mask), color: dc.seriesPrimary, name: 'source' },
      { points: make(view.terminal_on.ra, view.terminal_on.dec, view.terminal_on.flux, view.terminal_on.mask), color: dc.seriesPrimary, name: 'terminal-on' },
      { points: make(view.terminal_off.ra, view.terminal_off.dec, view.terminal_off.flux, view.terminal_off.mask), color: dc.seriesPrimary, name: 'terminal-off' },
    ];
  }, [view, dc]);

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
        { points: cut, color: dc.seriesSecondary, name: 'cut', faded: true },
        { points: kept, color: dc.seriesSecondary, name: 'source' },
      ];
    }
    const make = (raArr: number[], decArr: number[], fluxArr: number[], mask: boolean[]): Point[] =>
      raArr.map((ra, i) => ({ x: ra, y: decArr[i], ra, dec: decArr[i], flux: fluxArr[i] })).filter((_, i) => mask[i]);
    return [
      { points: make(view.initial_on.ra, view.initial_on.dec, view.initial_on.flux, view.initial_on.mask), color: dc.seriesSecondary, name: 'initial-on' },
      { points: make(view.initial_off.ra, view.initial_off.dec, view.initial_off.flux, view.initial_off.mask), color: dc.seriesSecondary, name: 'initial-off' },
      { points: make(view.source.ra, view.source.dec, view.source.flux, view.source.mask), color: dc.seriesSecondary, name: 'source' },
      { points: make(view.terminal_on.ra, view.terminal_on.dec, view.terminal_on.flux, view.terminal_on.mask), color: dc.seriesSecondary, name: 'terminal-on' },
      { points: make(view.terminal_off.ra, view.terminal_off.dec, view.terminal_off.flux, view.terminal_off.mask), color: dc.seriesSecondary, name: 'terminal-off' },
    ];
  }, [view, dc]);

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

  const handleHover = useCallback((p: Point | null) => {
    setHoverPoint(p);
  }, []);

  const handleClick = useCallback(
    (p: Point) => {
      // Peak fits are committed by the drag-end handler; the baseline tool is
      // driven by the FREE cursor (handleCursorClick) so its endpoints track
      // the raw cursor rather than snapping to the nearest sample (BUG-007).
      // In either mode a point click must not pin the readout.
      if (mode.kind === 'peak' || mode.kind === 'baseline') return;
      setStickyPoint(p);
    },
    [mode.kind],
  );

  const handleEmptyClick = useCallback(() => {
    // In baseline mode empty-space clicks are real endpoints (handled by
    // handleCursorClick); don't treat them as a cancel/unpin.
    if (mode.kind === 'baseline') return;
    setStickyPoint(null);
  }, [mode.kind]);

  // BUG-007 (dan): free-cursor baseline. First click sets the anchor endpoint at
  // the raw cursor position; the second click subtracts the line between the two
  // free-cursor positions. The rubber-band preview follows the live cursor.
  const handleCursorMove = useCallback(
    (x: number, y: number) => {
      if (mode.kind === 'baseline') setBaselineCursor({ x, y });
    },
    [mode.kind],
  );

  const handleCursorClick = useCallback(
    async (x: number, y: number) => {
      if (mode.kind !== 'baseline' || handle === null) return;
      if (!pendingBaselinePoint) {
        setPendingBaselinePoint({ ra: x, flux: y });
        return;
      }
      try {
        pushOverlayHistory();
        await rpcClient.baselineScanSource(
          handle,
          pendingBaselinePoint.ra,
          pendingBaselinePoint.flux,
          x,
          y,
        );
        await Promise.all([loadView(), refreshOverview()]);
        markDirty();
        setPendingBaselinePoint(null);
        setBaselineCursor(null);
      } catch (e) {
        setError((e as Error).message);
      }
    },
    [mode.kind, handle, pendingBaselinePoint, pushOverlayHistory, loadView, refreshOverview, markDirty],
  );

  const fluxDragHandlers = useMemo(
    () => ({
      onDragStart: (x: number) => {
        if (mode.kind !== 'cut' && mode.kind !== 'peak') return;
        dragOrigin.current = x;
        setDragRange({ x0: x, x1: x });
      },
      onDragUpdate: (x: number) => {
        if (mode.kind !== 'cut' && mode.kind !== 'peak') return;
        if (dragOrigin.current === null) return;
        const origin = dragOrigin.current;
        setDragRange({ x0: Math.min(origin, x), x1: Math.max(origin, x) });
      },
      onDragEnd: async () => {
        const range = dragRange;
        const activeMode = mode.kind;
        dragOrigin.current = null;
        if ((activeMode !== 'cut' && activeMode !== 'peak') || !range || handle === null) {
          setDragRange(null);
          return;
        }
        if (range.x0 === range.x1) {
          setDragRange(null);
          return;
        }
        setDragRange(null);
        try {
          // Record the pre-op overlay so an undo of this cut / peak fit can
          // restore it (BUG-022).
          pushOverlayHistory();
          if (activeMode === 'cut') {
            await rpcClient.cutScanSegment(handle, range.x0, range.x1);
            await Promise.all([loadView(), refreshOverview()]);
            markDirty();
          } else {
            // Dispatch on the selected fit kind. The Gaussian / cos² /
            // polynomial RPCs all return a fit-curve grid that lays through
            // the selection; Max Value returns a single (ra, flux) sample
            // that the UI rings instead of drawing a curve.
            let res;
            switch (peakFitKind) {
              case 'gaussian':
                res = await rpcClient.determineScanPeakGaussian(handle, range.x0, range.x1);
                break;
              case 'cos2':
                res = await rpcClient.determineScanPeakSquaredCosine(handle, range.x0, range.x1);
                break;
              case 'poly2':
                res = await rpcClient.determineScanPeakFit(handle, range.x0, range.x1, 2);
                break;
              case 'poly3':
                res = await rpcClient.determineScanPeakFit(handle, range.x0, range.x1, 3);
                break;
              case 'poly4':
                res = await rpcClient.determineScanPeakFit(handle, range.x0, range.x1, 4);
                break;
              case 'max':
                res = await rpcClient.determineScanPeakMaxValue(handle, range.x0, range.x1);
                break;
            }
            setOverview(res.overview);
            if (peakFitKind === 'max') {
              setPendingPeakFit(null);
              setPendingPeakHighlight({ ra: res.peak_ra, flux: res.peak_flux });
            } else {
              setPendingPeakHighlight(null);
              setPendingPeakFit({ ra: res.fit_ra, flux: res.fit_flux });
            }
            markDirty();
          }
        } catch (e) {
          setError((e as Error).message);
        }
      },
    }),
    [
      mode.kind,
      dragRange,
      handle,
      loadView,
      refreshOverview,
      markDirty,
      peakFitKind,
      setOverview,
    ],
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
        try {
          pushOverlayHistory();
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
      setBaselineCursor(null);
    },
    [],
  );

  const handleUndo = useCallback(async () => {
    if (handle === null) return;
    try {
      const res = await rpcClient.undoScan(handle);
      // If a source op was reverted, stage the overlay that was current before
      // it so the reload re-applies it (BUG-022). The history stays aligned
      // with the engine's source undo stack; when it's empty the undo popped a
      // pre-session (e.g. calibration) snapshot and there's nothing to restore.
      if (res.undone && overlayHistoryRef.current.length > 0) {
        overlayRestoreRef.current = overlayHistoryRef.current.pop() ?? null;
      }
      await Promise.all([loadView(), refreshOverview()]);
      markDirty();
    } catch (e) {
      setError((e as Error).message);
    }
  }, [handle, loadView, refreshOverview, markDirty]);

  // Live baseline rubber-band — first endpoint to the FREE cursor position
  // (BUG-007), so the line can sit above every sample the way the legacy
  // "Baseline Source" gesture drew it.
  const baselineOverlay = useMemo(() => {
    if (mode.kind !== 'baseline' || !pendingBaselinePoint || !baselineCursor) return [];
    return [
      {
        points: [
          { x: pendingBaselinePoint.ra, y: pendingBaselinePoint.flux },
          { x: baselineCursor.x, y: baselineCursor.y },
        ],
        color: dc.baseline,
        width: 1,
      },
    ];
  }, [mode.kind, pendingBaselinePoint, baselineCursor, dc]);

  if (!scan || !overview || handle === null) {
    return (
      <div className="survey-view empty">
        <p>No scan loaded. Use Scan → New Scan... to open an .md1 file.</p>
      </div>
    );
  }

  const readoutPoint = stickyPoint ?? hoverPoint;

  // Polynomial-fit curve overlay from the most recent Determine Peak. Drawn
  // edge-to-edge of the fit's RA grid so the user can see how the polynomial
  // lays through the selected band. Frontend-only — not persisted.
  const peakFitOverlay = pendingPeakFit
    ? [
        {
          points: pendingPeakFit.ra.map((ra, i) => ({ x: ra, y: pendingPeakFit.flux[i] })),
          color: dc.peak,
          width: 2,
        },
      ]
    : [];

  const fluxOverlays = [...peakFitOverlay, ...baselineOverlay] as Array<{
    points: { x: number; y: number }[];
    color?: string;
    width?: number;
  }>;

  const hint = (() => {
    if (mode.kind === 'cut') return 'Cut Segment: drag on the flux plot…';
    if (mode.kind === 'select-dec') return 'Select Declination: drag on the declination plot…';
    if (mode.kind === 'baseline')
      return pendingBaselinePoint
        ? 'Baseline Source: click the second point (the line follows your cursor)…'
        : 'Baseline Source: click anywhere for the first point…';
    if (mode.kind === 'peak') {
      const fitLabel = {
        gaussian: 'Gaussian',
        cos2: 'squared cosine',
        poly2: 'polynomial degree 2',
        poly3: 'polynomial degree 3',
        poly4: 'polynomial degree 4',
        max: 'max value',
      }[peakFitKind];
      return `Determine Peak: drag an RA range over the peak (${fitLabel})…`;
    }
    return null;
  })();

  return (
    <div className="survey-view workspace scan-view">
      <div className="workspace-frame">
        <div className="workspace-title">{overview.name}</div>

        <WorkspaceBody
          plots={
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
                    onCursorMove={handleCursorMove}
                    onCursorClick={handleCursorClick}
                    pinnedPoint={
                      pendingBaselinePoint
                        ? { x: pendingBaselinePoint.ra, y: pendingBaselinePoint.flux }
                        : stickyPoint
                          ? { x: stickyPoint.ra, y: stickyPoint.flux }
                          : null
                    }
                    highlightPoint={
                      pendingPeakHighlight
                        ? { x: pendingPeakHighlight.ra, y: pendingPeakHighlight.flux }
                        : null
                    }
                    highlightRange={dragRange}
                    highlightColor={mode.kind === 'peak' ? dc.peakSoft : undefined}
                    onDragStart={fluxDragHandlers.onDragStart}
                    onDragUpdate={fluxDragHandlers.onDragUpdate}
                    onDragEnd={fluxDragHandlers.onDragEnd}
                    dragEnabled={mode.kind === 'cut' || mode.kind === 'peak'}
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
                    xTickFormatter={formatRa}
                  />
                )}
              </div>
            </div>
          </div>
          }
          side={
          <div className="workspace-side">
            <div className="side-buttons">
              <button
                onClick={() => setViewMode('calibrate-scan')}
                className="primary"
                title="Open the cut-segment / select-declination view for the cal brackets"
              >
                {calibrated ? 'Re-Calibrate Scan' : 'Calibrate Scan'}
              </button>
              {/* BUG-009 (dan): the reduction tools stay visible but grayed
                  until the scan is calibrated, matching the survey screen. */}
              <button
                onClick={() => toggleMode('select-dec')}
                className={mode.kind === 'select-dec' ? 'active' : ''}
                disabled={!calibrated}
                title={
                  calibrated
                    ? 'KEEPS data: drag on the declination plot to keep only the source samples inside that band (everything outside is removed). (Opposite of Cut Segment, which removes.)'
                    : 'Calibrate the scan first'
                }
              >
                {mode.kind === 'select-dec' ? 'Select Declination (drag…)' : 'Select Declination'}
              </button>
              <button
                onClick={() => toggleMode('baseline')}
                className={mode.kind === 'baseline' ? 'active' : ''}
                disabled={!calibrated}
                title={
                  calibrated
                    ? 'Click two points anywhere on the flux plot to subtract the line between them as a baseline (the line follows your cursor).'
                    : 'Calibrate the scan first'
                }
              >
                {mode.kind === 'baseline' ? 'Baseline Source (click…)' : 'Baseline Source'}
              </button>
              <button
                onClick={() => toggleMode('peak')}
                className={mode.kind === 'peak' ? 'active' : ''}
                disabled={!calibrated}
                title={
                  calibrated
                    ? 'Drag an RA range over the peak only; the chosen model is fit and its maximum becomes the peak flux.'
                    : 'Calibrate the scan first'
                }
              >
                {mode.kind === 'peak' ? 'Determine Peak (drag…)' : 'Determine Peak'}
              </button>
              <button
                onClick={() => setFitDialogOpen(true)}
                disabled={!calibrated}
                title={
                  calibrated
                    ? 'Choose the model used by Determine Peak (polynomial degree, Gaussian, squared cosine, or max value).'
                    : 'Calibrate the scan first'
                }
              >
                Change Peak Fit…
              </button>
              <button
                onClick={() => toggleMode('cut')}
                className={mode.kind === 'cut' ? 'active' : ''}
                disabled={!calibrated}
                title={
                  calibrated
                    ? 'REMOVES data: drag on the flux plot to delete the source samples inside that RA range. (Opposite of Select Declination, which keeps.)'
                    : 'Calibrate the scan first'
                }
              >
                {mode.kind === 'cut' ? 'Cut Segment (drag…)' : 'Cut Segment'}
              </button>
              <button
                onClick={() => void handleUndo()}
                disabled={!overview.can_undo}
                title="Undo the most recent cut / baseline / peak / append operation"
              >
                Undo
              </button>
            </div>

            {calibrated && overview.peak_flux !== null && (
              <div className="readout peak-readout">
                <strong>Peak Flux:</strong> {overview.peak_flux.toFixed(3)}{' '}
                {unit === 'jy' ? 'Jy' : unit === 'gain' ? 'GCU' : 'V'}
              </div>
            )}

            <div className="readout">
              <div>RA: {readoutPoint ? formatRa(readoutPoint.ra) : '--:--:--'}</div>
              <div>Dec: {readoutPoint ? formatDec(readoutPoint.dec) : '--:--:--'}</div>
              <div>
                Flux:{' '}
                {readoutPoint
                  ? formatFlux(readoutPoint.flux, unit)
                  : `-- ${unit === 'jy' ? 'Jy' : unit === 'gain' ? 'GCU' : 'V'}`}
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
          }
        />
      </div>

      {fitDialogOpen && (
        <SelectInputDialog
          prompt={{
            title: 'Change Determine Peak Fit',
            label: 'Fit model:',
            defaultValue: peakFitKind,
            options: [
              { value: 'poly2', label: '2nd Degree Polynomial' },
              { value: 'poly3', label: '3rd Degree Polynomial' },
              { value: 'poly4', label: '4th Degree Polynomial' },
              { value: 'gaussian', label: 'Gaussian' },
              { value: 'cos2', label: 'Squared Cosine' },
              { value: 'max', label: 'Max Value' },
            ],
            onSubmit: (value) => {
              setFitDialogOpen(false);
              setPeakFitKind(value as PeakFitKind);
            },
          }}
          onCancel={() => setFitDialogOpen(false)}
        />
      )}
    </div>
  );
}

