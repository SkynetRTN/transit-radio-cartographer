import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { save as saveDialog } from '@tauri-apps/plugin-dialog';
import { useSurvey, type ImageDisplayMode } from '../state/survey-context';
import { ImagePlot, type ImagePoint, type BoxOverlay } from '../lib/plots/ImagePlot';
import { RgbImagePlot, type RgbImagePoint } from '../lib/plots/RgbImagePlot';
import { useImageSave } from '../lib/useImageSave';
import { computeFluxStats } from '../lib/fluxStats';
import { ResizeDivider, useResizable } from '../lib/useResizable';
import { WorkspaceBody } from './WorkspaceBody';
import {
  rpcClient,
  type ImageMeta,
  type ImagePixels,
  type RgbImageMeta,
  type RgbImagePixels,
} from '../ipc/client';

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function formatRaSeconds(ra: number): string {
  let s = ra;
  while (s < 0) s += 86400;
  s = s % 86400;
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s - hrs * 3600) / 60);
  const secs = Math.floor(s - hrs * 3600 - mins * 60);
  return `${pad2(hrs)}:${pad2(mins)}:${pad2(secs)}`;
}

function formatDecDegrees(dec: number): string {
  const sign = dec < 0 ? '-' : '';
  const abs = Math.abs(dec);
  const deg = Math.floor(abs);
  const mins = Math.floor((abs - deg) * 60);
  const secs = Math.floor((abs - deg - mins / 60) * 3600);
  return `${sign}${pad2(deg)}:${pad2(mins)}:${pad2(secs)}`;
}

// Format an aggregated flux value for the magnifier stats readout, matching the
// per-cell readout's 4-decimal style and appending the flux unit when known.
function formatFlux(value: number, unit: string): string {
  const text = value.toFixed(4);
  return unit ? `${text} ${unit}` : text;
}

function pointFromColRow(
  pixels: ImagePixels,
  meta: ImageMeta | null,
  col: number,
  row: number,
): ImagePoint {
  const c = Math.max(0, Math.min(pixels.width - 1, col));
  const r = Math.max(0, Math.min(pixels.height - 1, row));
  // Preserve `null` for no-coverage cells (BUG-014) — fluxReadout treats it
  // as blank rather than substituting 0, which would be misleading.
  const raw = pixels.pixels[r]?.[c];
  const flux = raw === null || raw === undefined ? null : raw;
  const ra =
    meta && pixels.width > 1
      ? meta.max_ra - (c / (pixels.width - 1)) * (meta.max_ra - meta.min_ra)
      : c;
  const dec =
    meta && pixels.height > 1
      ? meta.min_dec + (r / (pixels.height - 1)) * (meta.max_dec - meta.min_dec)
      : r;
  return { col: c, row: r, ra, dec, flux };
}

interface MagnifierData {
  pixels: ImagePixels;
  meta: ImageMeta | null;
  fluxRange: { min: number; max: number };
  // Box drawn on the *main* plot to show what region is being magnified.
  overlay: BoxOverlay | null;
  // Inclusive cell bounds of the magnified region in the *full* source grid.
  // These match the white overlay box exactly and drive the flux-aggregation
  // buttons (sum/average inside, sum outside).
  bounds: { colMin: number; colMax: number; rowMin: number; rowMax: number };
}

// Choose the half-window (in cells) so the magnified region is roughly SQUARE
// ON SCREEN for the current display mode — not a square block of cells. On a
// sky-aspect image a square cell block draws as a rectangle, which made the
// magnifier's location box look nothing like the (square) magnifier. Balancing
// the two cell counts by the on-screen cell aspect keeps the box square and the
// magnified region honest.
function magnifierHalfExtents(
  meta: ImageMeta | null,
  w: number,
  h: number,
  half: number,
  displayMode: ImageDisplayMode,
): { colHalf: number; rowHalf: number } {
  const bounded =
    meta &&
    w > 1 &&
    h > 1 &&
    Number.isFinite(meta.min_ra) &&
    Number.isFinite(meta.max_ra) &&
    Number.isFinite(meta.min_dec) &&
    Number.isFinite(meta.max_dec) &&
    meta.max_ra > meta.min_ra &&
    meta.max_dec > meta.min_dec;
  // No sky geometry to honor ('stretch' or an unbounded image) — fall back to a
  // square cell block.
  if (!bounded || displayMode === 'stretch') return { colHalf: half, rowHalf: half };
  const raSpan = meta!.max_ra - meta!.min_ra;
  const decSpan = meta!.max_dec - meta!.min_dec;
  const decCenter = (meta!.min_dec + meta!.max_dec) / 2;
  const raPerCell = raSpan / (w - 1);
  const decPerCell = decSpan / (h - 1);
  // px-per-RA ÷ px-per-Dec — the same `ratio` ImagePlot.plotAspect uses.
  const ratio =
    displayMode === 'raw'
      ? 1 / 240
      : displayMode === 'pixel'
        ? (decSpan * w) / (raSpan * h)
        : Math.cos((decCenter * Math.PI) / 180) / 240;
  // On-screen width of one column-cell ÷ height of one row-cell. The box is
  // square on screen when rowHalf / colHalf == cellAspect; split the change
  // around a geometric mean so neither dimension's window blows up.
  const cellAspect = (ratio * raPerCell) / decPerCell;
  if (!Number.isFinite(cellAspect) || cellAspect <= 0) return { colHalf: half, rowHalf: half };
  const k = Math.sqrt(cellAspect);
  return { colHalf: Math.max(1, Math.round(half / k)), rowHalf: Math.max(1, Math.round(half * k)) };
}

// Slice the source pixel grid around (col, row) with per-axis half-sizes in
// cells (see magnifierHalfExtents), and derive a sub-meta + local flux range so
// the magnifier rescales the palette to its own min/max (the legacy behavior —
// even a faint patch shows the full palette stretched into it).
function buildMagnifier(
  pixels: ImagePixels,
  meta: ImageMeta | null,
  center: { col: number; row: number },
  half: number,
  displayMode: ImageDisplayMode,
): MagnifierData {
  const { colHalf, rowHalf } = magnifierHalfExtents(meta, pixels.width, pixels.height, half, displayMode);
  const colMin = Math.max(0, center.col - colHalf);
  const colMax = Math.min(pixels.width - 1, center.col + colHalf);
  const rowMin = Math.max(0, center.row - rowHalf);
  const rowMax = Math.min(pixels.height - 1, center.row + rowHalf);
  // Pass `null` through to the magnifier's heatmap z-array — Plotly renders
  // null cells transparent against `plot_bgcolor` (BUG-014). The min/max scan
  // ignores null so a no-data corner doesn't break the local palette stretch.
  const subPixels: (number | null)[][] = [];
  let localMin = Number.POSITIVE_INFINITY;
  let localMax = Number.NEGATIVE_INFINITY;
  for (let r = rowMin; r <= rowMax; r++) {
    const row: (number | null)[] = [];
    for (let c = colMin; c <= colMax; c++) {
      const v = pixels.pixels[r][c];
      row.push(v);
      if (v !== null && v !== undefined) {
        if (v < localMin) localMin = v;
        if (v > localMax) localMax = v;
      }
    }
    subPixels.push(row);
  }
  if (!Number.isFinite(localMin)) localMin = 0;
  if (!Number.isFinite(localMax) || localMax <= localMin) localMax = localMin + 1;

  const w = colMax - colMin + 1;
  const h = rowMax - rowMin + 1;
  let subMeta: ImageMeta | null = null;
  let overlay: BoxOverlay | null = null;
  if (meta && pixels.width > 1 && pixels.height > 1) {
    // col 0 = max_ra, col (W-1) = min_ra (RA decreases with column).
    const raAt = (c: number) =>
      meta.max_ra - (c / (pixels.width - 1)) * (meta.max_ra - meta.min_ra);
    const decAt = (r: number) =>
      meta.min_dec + (r / (pixels.height - 1)) * (meta.max_dec - meta.min_dec);
    const raLo = raAt(colMax);
    const raHi = raAt(colMin);
    const decLo = decAt(rowMin);
    const decHi = decAt(rowMax);
    subMeta = {
      ...meta,
      width: w,
      height: h,
      min_ra: raLo,
      max_ra: raHi,
      min_dec: decLo,
      max_dec: decHi,
      min_flux: localMin,
      max_flux: localMax,
    };
    overlay = {
      raCenter: (raLo + raHi) / 2,
      decCenter: (decLo + decHi) / 2,
      raHalfWidth: (raHi - raLo) / 2,
      decHalfHeight: (decHi - decLo) / 2,
    };
  }

  return {
    pixels: { pixels: subPixels, width: w, height: h },
    meta: subMeta,
    fluxRange: { min: localMin, max: localMax },
    overlay,
    bounds: { colMin, colMax, rowMin, rowMax },
  };
}

interface RgbMagnifierData {
  pixels: RgbImagePixels;
  meta: RgbImageMeta | null;
  overlay: BoxOverlay | null;
}

// RGB counterpart of buildMagnifier (BUG-017): slice the 3 channels around the
// cell and derive a sub-meta + box overlay. There's no flux/palette to rescale
// — the composite already carries its own colour.
function buildRgbMagnifier(
  pixels: RgbImagePixels,
  meta: RgbImageMeta | null,
  center: { col: number; row: number },
  half: number,
): RgbMagnifierData {
  const colMin = Math.max(0, center.col - half);
  const colMax = Math.min(pixels.width - 1, center.col + half);
  const rowMin = Math.max(0, center.row - half);
  const rowMax = Math.min(pixels.height - 1, center.row + half);
  const slice = (grid: (number | null)[][]) => {
    const out: (number | null)[][] = [];
    for (let r = rowMin; r <= rowMax; r++) out.push(grid[r].slice(colMin, colMax + 1));
    return out;
  };
  const w = colMax - colMin + 1;
  const h = rowMax - rowMin + 1;
  let subMeta: RgbImageMeta | null = null;
  let overlay: BoxOverlay | null = null;
  if (meta && pixels.width > 1 && pixels.height > 1) {
    // col 0 = max_ra, col (W-1) = min_ra (RA decreases with column).
    const raAt = (c: number) =>
      meta.max_ra - (c / (pixels.width - 1)) * (meta.max_ra - meta.min_ra);
    const decAt = (r: number) =>
      meta.min_dec + (r / (pixels.height - 1)) * (meta.max_dec - meta.min_dec);
    const raLo = raAt(colMax);
    const raHi = raAt(colMin);
    const decLo = decAt(rowMin);
    const decHi = decAt(rowMax);
    subMeta = { ...meta, width: w, height: h, min_ra: raLo, max_ra: raHi, min_dec: decLo, max_dec: decHi };
    overlay = {
      raCenter: (raLo + raHi) / 2,
      decCenter: (decLo + decHi) / 2,
      raHalfWidth: (raHi - raLo) / 2,
      decHalfHeight: (decHi - decLo) / 2,
    };
  }
  return {
    pixels: { r: slice(pixels.r), g: slice(pixels.g), b: slice(pixels.b), width: w, height: h },
    meta: subMeta,
    overlay,
  };
}

export function ImageView() {
  const {
    workspace,
    image,
    imagePixels,
    rgbImage,
    rgbImagePixels,
    imagePalette,
    imageFluxRange,
    imageName,
    magnifierHalfSize,
    imageDisplay,
    setViewMode,
    restoreScalarImage,
    canRestoreScalar,
  } = useSurvey();

  const { saveImageQuick, saveImageAs, saveBitmapAs } = useImageSave();

  // Draggable magnifier height (persisted). Replaces the old fixed 200px so a
  // cramped loupe can be dragged taller via the divider above it.
  const magHeight = useResizable('ogrc.magnifierHeight', 200, {
    min: 120,
    max: 900,
    axis: 'y',
  });

  const [hoverPoint, setHoverPoint] = useState<ImagePoint | null>(null);
  const [pinnedPoint, setPinnedPoint] = useState<ImagePoint | null>(null);
  const [magnifierCenter, setMagnifierCenter] = useState<ImagePoint | null>(null);
  // Which flux-aggregation stats are shown under the magnifier. Toggling a
  // button in/out of this set reveals/hides its live-updating value.
  const [shownStats, setShownStats] = useState<Set<'sum' | 'avg' | 'outside'>>(
    () => new Set(),
  );
  const toggleStat = useCallback((key: 'sum' | 'avg' | 'outside') => {
    setShownStats((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);
  const closeMagnifier = useCallback(() => {
    setMagnifierCenter(null);
    setShownStats(new Set());
  }, []);
  // RGB-composite cursor + magnifier (BUG-017). Kept separate from the scalar
  // state above because RGB cells carry no flux.
  const [rgbHover, setRgbHover] = useState<RgbImagePoint | null>(null);
  const [rgbMagCenter, setRgbMagCenter] = useState<RgbImagePoint | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  // Latest composited RGB bitmap (PNG data URL), captured from RgbImagePlot for
  // client-side export (BUG-015).
  const rgbBitmapRef = useRef<string | null>(null);
  const handleRgbBitmap = useCallback((dataUrl: string) => {
    rgbBitmapRef.current = dataUrl;
  }, []);

  const handleBack = useCallback(() => {
    // From a bi/tri-color composite, restore the scalar image it was built from
    // rather than dropping back to the survey pre-image (BUG-016).
    if (rgbImage && restoreScalarImage()) return;
    setViewMode('pre-image');
  }, [rgbImage, restoreScalarImage, setViewMode]);

  // In-view Save buttons (BUG-024) so saving doesn't require the Image menu.
  // They share the same path as the menu via useImageSave; errors surface
  // inline here rather than as the menu's warning banner.
  const runSave = useCallback(async (action: () => Promise<void>) => {
    setSaveError(null);
    try {
      await action();
    } catch (e) {
      setSaveError((e as Error).message);
    }
  }, []);

  // Export the bi/tri-color composite as a PNG (BUG-015). The bitmap is what
  // RgbImagePlot rendered (display resolution); the engine just writes the
  // decoded bytes to the chosen path.
  const exportRgbPng = useCallback(async () => {
    const dataUrl = rgbBitmapRef.current;
    if (!dataUrl) return;
    const selected = await saveDialog({
      title: 'Export Image As',
      defaultPath: `${imageName || 'image'}.png`,
      filters: [{ name: 'PNG Image', extensions: ['png'] }],
    });
    const target = typeof selected === 'string' ? selected : null;
    if (!target) return;
    await rpcClient.saveRgbPng(target, dataUrl);
  }, [imageName]);

  // Right-click on the main plot opens (or moves) the magnifier centered at
  // the cell currently under the cursor. The legacy guide describes this as
  // "a box around your cursor will appear" — i.e. the magnifier follows
  // where you right-click, not the live cursor.
  const handleContextMenu = useCallback((p: ImagePoint | null) => {
    if (p) setMagnifierCenter(p);
  }, []);

  // Left-click pins the currently hovered point. The legacy guide notes
  // "the release needs to be something other than clicking empty space",
  // hence the explicit Unpin button below.
  const handleClick = useCallback((p: ImagePoint) => {
    setPinnedPoint(p);
  }, []);

  const magnifier = useMemo(() => {
    if (!magnifierCenter || !imagePixels) return null;
    return buildMagnifier(imagePixels, image, magnifierCenter, magnifierHalfSize, imageDisplay);
  }, [magnifierCenter, imagePixels, image, magnifierHalfSize, imageDisplay]);

  // Live flux stats for the current magnifier box. Recomputed whenever the box
  // (or the underlying image) changes, so the shown values track arrow-key
  // moves and re-right-clicks. Skipped entirely when no stat is toggled on.
  const fluxStats = useMemo(() => {
    if (!imagePixels || !magnifier || shownStats.size === 0) return null;
    return computeFluxStats(imagePixels, magnifier.bounds);
  }, [imagePixels, magnifier, shownStats]);

  // RGB-composite hover + right-click magnifier (BUG-017).
  const handleRgbContextMenu = useCallback((p: RgbImagePoint | null) => {
    if (p) setRgbMagCenter(p);
  }, []);

  const rgbMagnifier = useMemo(() => {
    if (!rgbMagCenter || !rgbImagePixels) return null;
    return buildRgbMagnifier(rgbImagePixels, rgbImage, rgbMagCenter, magnifierHalfSize);
  }, [rgbMagCenter, rgbImagePixels, rgbImage, magnifierHalfSize]);

  // Arrow keys nudge the magnifier center while it's open. Hold Shift to
  // step in larger jumps. We skip the handler when an input is focused so
  // typing in the magnifier-size dialog (or any other field) still works.
  useEffect(() => {
    if (!magnifierCenter || !imagePixels) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      const step = e.shiftKey ? 5 : 1;
      let dc = 0;
      let dr = 0;
      // Image is rendered with col 0 (= max_ra) on the visual LEFT thanks to
      // the reversed x axis, and row 0 (= min_dec) on the visual BOTTOM. So
      // Left arrow = decrease col; Up arrow = increase row.
      if (e.key === 'ArrowLeft') dc = -step;
      else if (e.key === 'ArrowRight') dc = step;
      else if (e.key === 'ArrowUp') dr = step;
      else if (e.key === 'ArrowDown') dr = -step;
      else return;
      e.preventDefault();
      setMagnifierCenter((prev) =>
        prev ? pointFromColRow(imagePixels, image, prev.col + dc, prev.row + dr) : prev,
      );
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [magnifierCenter, imagePixels, image]);

  // Show pinned point in the readout if set, else the live hover point.
  const displayPoint = pinnedPoint ?? hoverPoint;

  // Stable pinned-marker object so the plot effect doesn't re-run (and call
  // Plotly.react mid-zoom-drag) on every hover while a point is pinned (BUG-025).
  const pinnedMarker = useMemo(
    () => (pinnedPoint ? { ra: pinnedPoint.ra, dec: pinnedPoint.dec } : null),
    [pinnedPoint],
  );

  const hasScalar = image !== null && imagePixels !== null;
  const hasRgb = rgbImage !== null && rgbImagePixels !== null;
  if (!hasScalar && !hasRgb) {
    return (
      <div className="survey-view empty">
        <p>No image loaded.</p>
      </div>
    );
  }

  const title = workspace ? `${workspace.name} - Image` : `${imageName || 'Image'}`;
  // Flux unit priority:
  //   1. The image's own `unit` field if it loaded one (our `.img` writer
  //      always sets this; legacy `.img` files leave it null).
  //   2. The workspace's calibration state when the image was made in-app.
  //   3. "GCU" as the default for legacy `.img` files (the user's note: an
  //      image always implies at least gain calibration — never raw volts).
  //   4. Empty string for .fits files (no unit convention yet).
  const fluxUnit = (() => {
    if (image?.unit) return image.unit;
    if (workspace) {
      if (workspace.flux_calibrated) return 'Jy';
      if (workspace.calibrated) return 'GCU';
      return '';
    }
    // Standalone image (no workspace). Default to GCU for legacy `.img`.
    return 'GCU';
  })();

  return (
    <div className="survey-view workspace image-view">
      <div className="workspace-frame">
        <div className="workspace-title">{title}</div>
        <WorkspaceBody
          plots={
          <div className="workspace-plots">
            {hasScalar ? (
              <ImagePlot
                image={imagePixels!}
                meta={image!}
                title=""
                testId="image-plot"
                palette={imagePalette}
                fluxRange={imageFluxRange}
                onHover={setHoverPoint}
                onClick={handleClick}
                onContextMenu={handleContextMenu}
                boxOverlay={magnifier?.overlay ?? null}
                pinnedMarker={pinnedMarker}
                displayMode={imageDisplay}
              />
            ) : (
              // RGB composite (bi/tri-color): zooms in data coords, with a
              // right-click magnifier and RA/Dec hover readout (BUG-017).
              <RgbImagePlot
                image={rgbImagePixels!}
                meta={rgbImage}
                title=""
                testId="rgb-image-plot"
                onBitmap={handleRgbBitmap}
                onHover={setRgbHover}
                onContextMenu={handleRgbContextMenu}
                boxOverlay={rgbMagnifier?.overlay ?? null}
              />
            )}
          </div>
          }
          side={
          <div className="workspace-side">
            {hasScalar && (
              <div className="side-hint">
                Right-click the image to open the magnifier.
                {magnifierCenter && <> Arrow keys move it (Shift = ×5).</>}
              </div>
            )}
            {hasRgb && (
              <div className="side-hint">
                Drag to zoom (double-click to reset) · right-click to open the
                magnifier.
              </div>
            )}
            <div className="side-buttons">
              {(workspace || (rgbImage && canRestoreScalar)) && (
                <button onClick={handleBack}>
                  {rgbImage ? 'Back to Image' : 'Back to Pre Image'}
                </button>
              )}
              {magnifierCenter && (
                <button onClick={closeMagnifier}>
                  Close Magnifier
                </button>
              )}
              {rgbMagCenter && (
                <button onClick={() => setRgbMagCenter(null)}>
                  Close Magnifier
                </button>
              )}
              {hasScalar && (
                <>
                  <div className="button-gap" />
                  <button onClick={() => void runSave(saveImageQuick)}>
                    Save Image
                  </button>
                  <button onClick={() => void runSave(saveImageAs)}>
                    Save Image As…
                  </button>
                  <button onClick={() => void runSave(saveBitmapAs)}>
                    Save Bitmap As…
                  </button>
                </>
              )}
              {hasRgb && (
                <>
                  <div className="button-gap" />
                  <button onClick={() => void runSave(exportRgbPng)}>
                    Export as PNG…
                  </button>
                </>
              )}
              {saveError && <div className="side-error">{saveError}</div>}
            </div>

            <div className="readout">
              <div>
                Image:{' '}
                {hasScalar
                  ? `${imagePixels!.width} × ${imagePixels!.height}`
                  : `${rgbImagePixels!.width} × ${rgbImagePixels!.height} (RGB)`}
              </div>
              {/* Readout stays visible even when the cursor is off the image
                  — em-dashes fill in when there's no point under the cursor
                  (and no pinned point overriding it). */}
              {hasScalar && (
                <div className="point-readout">
                  <div>RA: {displayPoint ? formatRaSeconds(displayPoint.ra) : '—'}</div>
                  <div>Dec: {displayPoint ? formatDecDegrees(displayPoint.dec) : '—'}</div>
                  <div>
                    Flux:{' '}
                    {displayPoint
                      ? displayPoint.flux === null
                        ? '—'  /* BUG-014: no-coverage cell — blank, not "0.0000" */
                        : `${displayPoint.flux.toFixed(4)}${fluxUnit ? ` ${fluxUnit}` : ''}`
                      : '—'}
                  </div>
                  {pinnedPoint && <div className="pinned-tag">pinned</div>}
                  {pinnedPoint && (
                    <button
                      className="unpin-button"
                      onClick={() => setPinnedPoint(null)}
                    >
                      Unpin
                    </button>
                  )}
                </div>
              )}
              {hasRgb && (
                <div className="point-readout">
                  <div>RA: {rgbHover ? formatRaSeconds(rgbHover.ra) : '—'}</div>
                  <div>Dec: {rgbHover ? formatDecDegrees(rgbHover.dec) : '—'}</div>
                </div>
              )}
            </div>

            {/* Flux-aggregation buttons live directly below the RA/Dec/Flux
                readout (not up in the top button group) so they stay visible
                when the panel is scrolled down to the magnifier. */}
            {hasScalar && magnifierCenter && (
              <div className="side-buttons">
                <button
                  className={shownStats.has('sum') ? 'active' : undefined}
                  onClick={() => toggleStat('sum')}
                >
                  Sum Flux (Box)
                </button>
                <button
                  className={shownStats.has('avg') ? 'active' : undefined}
                  onClick={() => toggleStat('avg')}
                >
                  Average Flux (Box)
                </button>
                <button
                  className={shownStats.has('outside') ? 'active' : undefined}
                  onClick={() => toggleStat('outside')}
                >
                  Sum Flux (Outside Box)
                </button>
                {fluxStats && shownStats.size > 0 && (
                  <div className="magnifier-stats">
                    {shownStats.has('sum') && (
                      <div>
                        Box sum: {formatFlux(fluxStats.boxSum, fluxUnit)}
                        <span className="magnifier-stats-note">
                          {' '}({fluxStats.boxCount} cells)
                        </span>
                      </div>
                    )}
                    {shownStats.has('avg') && (
                      <div>
                        Box average:{' '}
                        {fluxStats.boxMean === null
                          ? '—'
                          : formatFlux(fluxStats.boxMean, fluxUnit)}
                      </div>
                    )}
                    {shownStats.has('outside') && (
                      <div>
                        Outside sum: {formatFlux(fluxStats.outsideSum, fluxUnit)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {magnifier && (
              <>
                <ResizeDivider
                  orientation="horizontal"
                  onPointerDown={(e) => magHeight.startDrag(e)}
                  title="Drag to resize the magnifier"
                />
                <div className="magnifier-panel">
                  <div className="magnifier-label">Magnifier</div>
                  <ImagePlot
                    image={magnifier.pixels}
                    meta={magnifier.meta}
                    title=""
                    testId="magnifier-plot"
                    palette={imagePalette}
                    fluxRange={magnifier.fluxRange}
                    onHover={setHoverPoint}
                    onClick={handleClick}
                    showColorBar={false}
                    fixedHeight={magHeight.size ?? 200}
                    square
                    hideAxes
                    displayMode={imageDisplay}
                  />
                </div>
              </>
            )}

            {rgbMagnifier && (
              <>
                <ResizeDivider
                  orientation="horizontal"
                  onPointerDown={(e) => magHeight.startDrag(e)}
                  title="Drag to resize the magnifier"
                />
                <div className="magnifier-panel">
                  <div className="magnifier-label">Magnifier</div>
                  <RgbImagePlot
                    image={rgbMagnifier.pixels}
                    meta={rgbMagnifier.meta}
                    title=""
                    testId="rgb-magnifier-plot"
                    fixedHeight={magHeight.size ?? 200}
                    square
                  />
                </div>
              </>
            )}
          </div>
          }
        />
      </div>
    </div>
  );
}
