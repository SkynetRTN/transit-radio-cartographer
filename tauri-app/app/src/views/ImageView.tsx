import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSurvey } from '../state/survey-context';
import { ImagePlot, type ImagePoint, type BoxOverlay } from '../lib/plots/ImagePlot';
import { RgbImagePlot } from '../lib/plots/RgbImagePlot';
import type { ImageMeta, ImagePixels } from '../ipc/client';

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
}

// Slice the source pixel grid around (col, row) with a half-size in cells, and
// derive a sub-meta + local flux range so the magnifier rescales the palette
// to its own min/max (the legacy behavior — even a faint patch shows the full
// palette stretched into it).
function buildMagnifier(
  pixels: ImagePixels,
  meta: ImageMeta | null,
  center: { col: number; row: number },
  half: number,
): MagnifierData {
  const colMin = Math.max(0, center.col - half);
  const colMax = Math.min(pixels.width - 1, center.col + half);
  const rowMin = Math.max(0, center.row - half);
  const rowMax = Math.min(pixels.height - 1, center.row + half);
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
    setViewMode,
  } = useSurvey();

  const [hoverPoint, setHoverPoint] = useState<ImagePoint | null>(null);
  const [pinnedPoint, setPinnedPoint] = useState<ImagePoint | null>(null);
  const [magnifierCenter, setMagnifierCenter] = useState<ImagePoint | null>(null);

  const handleBack = useCallback(() => {
    setViewMode('pre-image');
  }, [setViewMode]);

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
    return buildMagnifier(imagePixels, image, magnifierCenter, magnifierHalfSize);
  }, [magnifierCenter, imagePixels, image, magnifierHalfSize]);

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
        <div className="workspace-body">
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
              />
            ) : (
              // RGB composite (bi/tri-color). Magnifier/pin features are
              // intentionally not wired here yet — those rely on per-cell flux
              // semantics that don't carry over to a 3-channel image.
              <RgbImagePlot
                image={rgbImagePixels!}
                meta={rgbImage}
                title=""
                testId="rgb-image-plot"
              />
            )}
          </div>

          <div className="workspace-side">
            {hasScalar && (
              <div className="side-hint">
                Right-click the image to open the magnifier.
                {magnifierCenter && <> Arrow keys move it (Shift = ×5).</>}
              </div>
            )}
            <div className="side-buttons">
              {workspace && (
                <button onClick={handleBack}>Back to Pre Image</button>
              )}
              {magnifierCenter && (
                <button onClick={() => setMagnifierCenter(null)}>
                  Close Magnifier
                </button>
              )}
              {pinnedPoint && (
                <button onClick={() => setPinnedPoint(null)}>Unpin</button>
              )}
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
                </div>
              )}
            </div>

            {magnifier && (
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
                  fixedHeight={200}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
