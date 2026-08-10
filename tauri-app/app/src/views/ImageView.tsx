import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { save as saveDialog } from '@tauri-apps/plugin-dialog';
import { useSurvey } from '../state/survey-context';
import { ImagePlot, type ImagePoint, type BoxOverlay } from '../lib/plots/ImagePlot';
import { RgbImagePlot, type RgbImagePoint } from '../lib/plots/RgbImagePlot';
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

// BUG-025 (dan): the magnifier half-window is now specified in DEGREES and is
// always square on the DEC-CORRECTED sky (independent of display mode). Convert
// that angular half-size into per-axis cell counts: the box spans `halfDeg`
// degrees of declination and `halfDeg` degrees of on-sky arc in the RA
// direction (RA·cos(dec)). One degree of RA is 240 stored seconds, so the
// on-sky RA extent in seconds is halfDeg·240/cos(dec).
function magnifierHalfExtents(
  meta: ImageMeta | { min_ra: number; max_ra: number; min_dec: number; max_dec: number } | null,
  w: number,
  h: number,
  halfDeg: number,
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
  // No sky geometry to honor (unbounded/pixel-index image) — approximate cells
  // from a nominal 0.06°/cell so the window is still sized in degrees.
  if (!bounded) {
    const cells = Math.max(1, Math.round(halfDeg / 0.06));
    return { colHalf: cells, rowHalf: cells };
  }
  const raSpan = meta!.max_ra - meta!.min_ra; // seconds of RA
  const decSpan = meta!.max_dec - meta!.min_dec; // degrees of dec
  const decCenter = (meta!.min_dec + meta!.max_dec) / 2;
  const raPerCell = raSpan / (w - 1); // seconds / cell
  const decPerCell = decSpan / (h - 1); // degrees / cell
  const cosd = Math.max(0.01, Math.cos((decCenter * Math.PI) / 180));
  const rowHalf = Math.max(1, Math.round(halfDeg / decPerCell));
  const colHalf = Math.max(1, Math.round((halfDeg * 240) / (raPerCell * cosd)));
  return { colHalf, rowHalf };
}

// Slice the source pixel grid around (col, row) with per-axis half-sizes in
// cells (see magnifierHalfExtents), and derive a sub-meta + local flux range so
// the magnifier rescales the palette to its own min/max (the legacy behavior —
// even a faint patch shows the full palette stretched into it).
function buildMagnifier(
  pixels: ImagePixels,
  meta: ImageMeta | null,
  center: { col: number; row: number },
  halfDeg: number,
): MagnifierData {
  const { colHalf, rowHalf } = magnifierHalfExtents(meta, pixels.width, pixels.height, halfDeg);
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
  halfDeg: number,
): RgbMagnifierData {
  // BUG-025: size the RGB loupe in degrees, square on the dec-corrected sky,
  // the same way the scalar magnifier does.
  const { colHalf, rowHalf } = magnifierHalfExtents(meta, pixels.width, pixels.height, halfDeg);
  const colMin = Math.max(0, center.col - colHalf);
  const colMax = Math.min(pixels.width - 1, center.col + colHalf);
  const rowMin = Math.max(0, center.row - rowHalf);
  const rowMax = Math.min(pixels.height - 1, center.row + rowHalf);
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
  // BUG-024/028 (dan): an always-present "Open Magnifier" button opens the loupe
  // centered on the image (not on a clicked cell) and does NOT pin a point.
  const openMagnifier = useCallback(() => {
    if (!imagePixels) return;
    const col = Math.floor((imagePixels.width - 1) / 2);
    const row = Math.floor((imagePixels.height - 1) / 2);
    setMagnifierCenter(pointFromColRow(imagePixels, image, col, row));
  }, [imagePixels, image]);
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

  // BUG-020 (dan): zooming back out (double-click reset) never pins — and it
  // clears any pin left over from before the zoom.
  const handleZoomReset = useCallback(() => {
    setPinnedPoint(null);
  }, []);

  const magnifier = useMemo(() => {
    if (!magnifierCenter || !imagePixels) return null;
    return buildMagnifier(imagePixels, image, magnifierCenter, magnifierHalfSize);
  }, [magnifierCenter, imagePixels, image, magnifierHalfSize]);

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

  // BUG-024 (dan): open the RGB loupe centered on the composite (no pin).
  const openRgbMagnifier = useCallback(() => {
    if (!rgbImagePixels) return;
    const col = Math.floor((rgbImagePixels.width - 1) / 2);
    const row = Math.floor((rgbImagePixels.height - 1) / 2);
    const ra =
      rgbImage && rgbImagePixels.width > 1
        ? rgbImage.max_ra - (col / (rgbImagePixels.width - 1)) * (rgbImage.max_ra - rgbImage.min_ra)
        : col;
    const dec =
      rgbImage && rgbImagePixels.height > 1
        ? rgbImage.min_dec + (row / (rgbImagePixels.height - 1)) * (rgbImage.max_dec - rgbImage.min_dec)
        : row;
    setRgbMagCenter({ col, row, ra, dec });
  }, [rgbImagePixels, rgbImage]);

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

  // Default the color-scale window to the image's own data min→max — the same
  // values the Palette editor seeds its Min/Max from (image.min_flux /
  // image.max_flux). This makes the image render on that window immediately,
  // without the user having to open the editor first, and keeps it consistent
  // with the pre-image (which also anchors on the data minimum, not 0). A
  // user-chosen window (imageFluxRange) still wins once set.
  const effectiveFluxRange = useMemo<{ min: number; max: number } | null>(() => {
    if (imageFluxRange) return imageFluxRange;
    if (
      image &&
      Number.isFinite(image.min_flux) &&
      Number.isFinite(image.max_flux) &&
      image.max_flux > image.min_flux
    ) {
      return { min: image.min_flux, max: image.max_flux };
    }
    return null;
  }, [imageFluxRange, image]);

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
                fluxRange={effectiveFluxRange}
                onHover={setHoverPoint}
                onClick={handleClick}
                onContextMenu={handleContextMenu}
                onZoomReset={handleZoomReset}
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
            {/* BUG-027 (dan): side-panel order is Open/Close Magnifier →
                magnifier → pin/hover readout → sum/avg/outside at the bottom.
                BUG-026: the in-view scalar Save buttons are gone — saving lives
                in the Image menu. */}
            <div className="side-buttons">
              {(workspace || (rgbImage && canRestoreScalar)) && (
                <button onClick={handleBack}>
                  {rgbImage ? 'Back to Image' : 'Back to Pre Image'}
                </button>
              )}
              {/* BUG-024: an always-present Open/Close Magnifier toggle. */}
              {hasScalar && (
                <button onClick={magnifierCenter ? closeMagnifier : openMagnifier}>
                  {magnifierCenter ? 'Close Magnifier' : 'Open Magnifier'}
                </button>
              )}
              {hasRgb && (
                <button onClick={rgbMagCenter ? () => setRgbMagCenter(null) : openRgbMagnifier}>
                  {rgbMagCenter ? 'Close Magnifier' : 'Open Magnifier'}
                </button>
              )}
              {hasRgb && (
                <button onClick={() => void runSave(exportRgbPng)}>
                  Export as PNG…
                </button>
              )}
              {saveError && <div className="side-error">{saveError}</div>}
            </div>

            {hasScalar && (
              <div className="side-hint">
                Right-click the image also opens the magnifier at that cell.
                {magnifierCenter && <> Arrow keys move it (Shift = ×5).</>}
              </div>
            )}
            {hasRgb && (
              <div className="side-hint">
                Drag to zoom (double-click to reset).
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

            {/* BUG-027: flux-aggregation buttons at the bottom of the panel. */}
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
          </div>
          }
        />
      </div>
    </div>
  );
}
