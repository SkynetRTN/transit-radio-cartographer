import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  rpcClient,
  type ImageMeta,
  type ImagePixels,
  type SweepPath,
} from '../ipc/client';
import { useSurvey } from '../state/survey-context';
import { ImagePlot, type ImagePoint } from '../lib/plots/ImagePlot';
import { NumericInputDialog, type NumericPrompt } from './dialogs/NumericInputDialog';
import { WorkspaceBody } from './WorkspaceBody';

// Default on-sky pixel size in DEGREES for the auto-generated pre-image and
// the Make Image dialog: 1/20 of the 40 ft beam (1.2°) = 0.06° per pixel.
// Smaller = finer. (Legacy VB used a unitless integer coarseness factor.)
const DEFAULT_PIX = 0.06;

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

// RA is elapsed sidereal seconds in [0, 86400). Mirrors ImageView /
// vb/survform.frm:8055-8106 — wrap hours mod 24 so values past midnight (which
// the engine stores unwrapped, i.e. > 86400, for wrap surveys) don't print as
// "24:…".
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

// A sweep path with its samples sorted by declination, so RA can be
// interpolated at an arbitrary dec with a binary search.
interface SortedSweepPath {
  index: number;
  dec: number[];
  ra: number[];
}

function sortSweepPaths(paths: SweepPath[]): SortedSweepPath[] {
  return paths.map((p) => {
    const order = p.dec.map((_, i) => i).sort((a, b) => p.dec[a] - p.dec[b]);
    return {
      index: p.index,
      dec: order.map((i) => p.dec[i]),
      ra: order.map((i) => p.ra[i]),
    };
  });
}

// Circular RA distance in sidereal seconds. Handles the 0h↔24h wrap (and the
// engine's unwrapped > 86400 storage for wrap surveys) so a cell near 23h59m
// and a sweep near 00h01m read as close, not a full day apart.
function raCircularDistance(a: number, b: number): number {
  const DAY = 86400;
  let d = Math.abs(((a - b) % DAY) + DAY) % DAY;
  if (d > DAY / 2) d = DAY - d;
  return d;
}

// Interpolate a sweep's RA at the given declination. `inRange` is false when
// dec falls outside the sweep's dec span (RA is then clamped to the nearest
// end), which lets the caller prefer a sweep that actually covers the dec.
function raAtDec(sweep: SortedSweepPath, dec: number): { ra: number; inRange: boolean } {
  const { dec: ds, ra: rs } = sweep;
  const n = ds.length;
  if (n === 0) return { ra: NaN, inRange: false };
  if (n === 1) return { ra: rs[0], inRange: dec === ds[0] };
  if (dec <= ds[0]) return { ra: rs[0], inRange: dec === ds[0] };
  if (dec >= ds[n - 1]) return { ra: rs[n - 1], inRange: dec === ds[n - 1] };
  let lo = 0;
  let hi = n - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (ds[mid] <= dec) lo = mid;
    else hi = mid;
  }
  const span = ds[hi] - ds[lo];
  const t = span > 0 ? (dec - ds[lo]) / span : 0;
  return { ra: rs[lo] + t * (rs[hi] - rs[lo]), inRange: true };
}

// The 0-based index of the sweep whose track passes nearest the (ra, dec) cell
// under the cursor. Sweeps are near-constant-RA dec scans stepping through RA
// with the earth's rotation, so "nearest in RA at the hovered dec" is the sweep
// that contributed the cell. Sweeps that actually span the hovered dec win over
// ones only reachable by clamping. Returns null when no paths are loaded.
function nearestSweepIndex(sweeps: SortedSweepPath[], ra: number, dec: number): number | null {
  let best: number | null = null;
  let bestDist = Infinity;
  let bestInRange: number | null = null;
  let bestInRangeDist = Infinity;
  for (const s of sweeps) {
    const { ra: sweepRa, inRange } = raAtDec(s, dec);
    if (Number.isNaN(sweepRa)) continue;
    const d = raCircularDistance(ra, sweepRa);
    if (d < bestDist) {
      bestDist = d;
      best = s.index;
    }
    if (inRange && d < bestInRangeDist) {
      bestInRangeDist = d;
      bestInRange = s.index;
    }
  }
  return bestInRange ?? best;
}

export function PreImageView() {
  const {
    survey,
    workspace,
    workspaceHandle,
    setViewMode,
    makeImage,
    imageDisplay,
    reductionsDone,
    markReductionDone,
  } = useSurvey();
  const [imagePixels, setImagePixels] = useState<ImagePixels | null>(null);
  const [imageMeta, setImageMeta] = useState<ImageMeta | null>(null);
  // Per-sweep (dec, ra) tracks, used to resolve which sweep the hovered cell
  // came from. Reloaded whenever the image is rebuilt so Align Sweeps (which
  // shifts dec) keeps the readout accurate.
  const [sweepPaths, setSweepPaths] = useState<SweepPath[]>([]);
  const [hoverPoint, setHoverPoint] = useState<ImagePoint | null>(null);
  const [pix, setPix] = useState<number>(DEFAULT_PIX);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<NumericPrompt | null>(null);
  // Handle of the preview image currently held by the engine. Each
  // generateImage call allocates a fresh engine-side image, so the previous
  // one must be closed or it stays pinned in engine memory for the session.
  const previewHandleRef = useRef<number | null>(null);

  const generateImage = useCallback(
    async (pixValue: number) => {
      if (!survey) return;
      setBusy(true);
      setError(null);
      setStatus('Building pre-image…');
      try {
        const meta = await rpcClient.makeImage(survey.handle, pixValue, workspaceHandle);
        setImageMeta(meta);
        const pixels = await rpcClient.getImagePixels(meta.handle);
        setImagePixels(pixels);
        // Refresh the sweep tracks alongside the image so the hover readout's
        // sweep numbers stay in step with the (possibly aligned) grid. A
        // failure here shouldn't blank the image — just skip the sweep readout.
        if (workspaceHandle !== null && workspaceHandle !== undefined) {
          try {
            const paths = await rpcClient.getSweepPaths(workspaceHandle);
            setSweepPaths(paths.sweeps);
          } catch (e) {
            // Degrade gracefully — the RA/Dec/Flux readout still works without
            // sweep numbers. Log so a stale/missing engine method (e.g. an old
            // bundled sidecar without get_sweep_paths) is diagnosable rather
            // than silently showing "Sweep: —".
            console.warn('getSweepPaths failed; sweep readout disabled:', e);
            setSweepPaths([]);
          }
        }
        setStatus(null);
        const prev = previewHandleRef.current;
        previewHandleRef.current = meta.handle;
        if (prev !== null && prev !== meta.handle) {
          void rpcClient.closeHandle(prev).catch(() => {});
        }
      } catch (e) {
        setError((e as Error).message);
        setStatus(null);
      } finally {
        setBusy(false);
      }
    },
    [survey, workspaceHandle],
  );

  // Release the last preview on unmount. The committed image made via the
  // context's makeImage is a separate handle, so this never closes it.
  useEffect(
    () => () => {
      const h = previewHandleRef.current;
      previewHandleRef.current = null;
      if (h !== null) void rpcClient.closeHandle(h).catch(() => {});
    },
    [],
  );

  useEffect(() => {
    void generateImage(DEFAULT_PIX);
    // Rebuild the preview when flux calibration flips, so loading a `.cal`
    // while sitting on the Pre Image refreshes the gridded image in Jy
    // instead of leaving the GCU preview on screen.
  }, [generateImage, workspace?.flux_calibrated]);

  const openMakeImagePrompt = useCallback(() => {
    if (!survey) return;
    setPrompt({
      title: 'Pixel size',
      label: 'Pixel size (degrees):',
      hint: 'On-sky size of each pixel. Default 0.06° = 1/20 of the 40 ft beam (1.2°). Smaller = finer, more pixels.',
      defaultValue: pix,
      onSubmit: async (value) => {
        if (!(value > 0)) {
          setError('Pixel size must be a positive number of degrees');
          setPrompt(null);
          return;
        }
        setPrompt(null);
        setPix(value);
        // Commit: build the final gridded image and switch to the Image view.
        // `makeImage` on the survey context stores meta+pixels and flips
        // `viewMode` to 'image' so MainWindow unmounts PreImageView.
        setBusy(true);
        setError(null);
        setStatus('Building image…');
        try {
          await makeImage(value);
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setBusy(false);
          setStatus(null);
        }
      },
    });
  }, [survey, pix, makeImage]);

  const handleSmooth = useCallback(async () => {
    if (!survey) return;
    setBusy(true);
    setError(null);
    setStatus('Smoothing sweeps…');
    try {
      await rpcClient.smooth(survey.handle, 5, workspaceHandle);
      await generateImage(pix);
      markReductionDone('smooth');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      setStatus(null);
    }
  }, [survey, workspaceHandle, pix, generateImage]);

  const openBaselinePrompt = useCallback(() => {
    if (!survey) return;
    setPrompt({
      title: 'Input Baseline Length',
      label: 'Baseline Length (Degrees):',
      defaultValue: 5,
      onSubmit: async (value) => {
        setPrompt(null);
        setBusy(true);
        setError(null);
        setStatus('Applying baseline…');
        try {
          await rpcClient.baseline(survey.handle, value, workspaceHandle);
          await generateImage(pix);
          markReductionDone('baseline');
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setBusy(false);
          setStatus(null);
        }
      },
    });
  }, [survey, workspaceHandle, pix, generateImage]);

  const openAlignPrompt = useCallback(() => {
    if (!survey) return;
    setPrompt({
      title: 'Input Maximum Declination Shift',
      label: 'Maximum Declination Shift (Degrees):',
      defaultValue: 0.5,
      onSubmit: async (value) => {
        setPrompt(null);
        setBusy(true);
        setError(null);
        setStatus('Aligning sweeps…');
        try {
          await rpcClient.align(survey.handle, value, workspaceHandle);
          await generateImage(pix);
          markReductionDone('align');
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setBusy(false);
          setStatus(null);
        }
      },
    });
  }, [survey, workspaceHandle, pix, generateImage]);

  const handleBackToSweeps = useCallback(() => {
    // Return to the per-sweep view without resetting acceptances — every
    // sweep stays accepted so the user can re-edit one (e.g. add a baseline
    // segment on an already-accepted sweep) and come back via Create
    // Pre-Image.
    setViewMode('survey');
  }, [setViewMode]);

  const canMakeImage =
    reductionsDone.smooth && reductionsDone.baseline && reductionsDone.align;
  const remainingSteps: string[] = [];
  if (!reductionsDone.smooth) remainingSteps.push('smooth sweeps');
  if (!reductionsDone.baseline) remainingSteps.push('apply a baseline');
  if (!reductionsDone.align) remainingSteps.push('align sweeps');
  const makeImageTitle = canMakeImage
    ? 'Build the gridded image at a chosen pixel size in degrees (default 0.06° = 1/20 of the beam)'
    : `Before making the image you must: smooth sweeps, apply a baseline, align sweeps. Remaining: ${remainingSteps.join(', ')}.`;

  // Sort each sweep's samples by dec once so the hover handler can binary-search
  // for the RA at the cursor's dec without re-sorting on every mouse move.
  const sortedPaths = useMemo(() => sortSweepPaths(sweepPaths), [sweepPaths]);
  // 1-based sweep number under the cursor (matches SurveyView's numbering).
  const hoverSweepNumber = useMemo(() => {
    if (!hoverPoint) return null;
    const idx = nearestSweepIndex(sortedPaths, hoverPoint.ra, hoverPoint.dec);
    return idx === null ? null : idx + 1;
  }, [hoverPoint, sortedPaths]);
  // Flux unit for the readout: prefer the image's own unit, else the workspace
  // calibration state (an image always implies at least gain calibration).
  const fluxUnit = imageMeta?.unit ?? (workspace?.flux_calibrated ? 'Jy' : 'GCU');

  if (!workspace) {
    return (
      <div className="survey-view empty">
        <p>No survey loaded.</p>
      </div>
    );
  }

  return (
    <div className="survey-view workspace pre-image-view">
      <div className="workspace-frame">
        <div className="workspace-title">{`${workspace.name} - Pre Image`}</div>
        <WorkspaceBody
          plots={
          <div className="workspace-plots">
            {status && <div className="plot-status">{status}</div>}
            {error && <div className="plot-status error">{error}</div>}
            {imagePixels ? (
              <ImagePlot
                image={imagePixels}
                meta={imageMeta}
                title=""
                testId="pre-image-plot"
                displayMode={imageDisplay}
                onHover={setHoverPoint}
              />
            ) : (
              !status && !error && <div className="plot-status">No image yet.</div>
            )}
          </div>
          }
          side={
          <div className="workspace-side">
            {imagePixels && (
              <div className="side-hint">
                Drag a box on the image to zoom in; double-click to reset. Hover
                to read RA/Dec/Flux and the source sweep.
              </div>
            )}
            <div className="side-buttons">
              <button
                onClick={openMakeImagePrompt}
                disabled={busy || !canMakeImage}
                className="primary"
                title={makeImageTitle}
              >
                Make Image
              </button>
              <div className="button-gap" />
              <button
                onClick={() => void handleSmooth()}
                disabled={busy || !imagePixels}
                title="Smooth the accepted sweeps"
              >
                Smooth Sweeps
              </button>
              <button
                onClick={openBaselinePrompt}
                disabled={busy || !imagePixels}
                title="Apply a baseline (default 5 degrees) to the accepted sweeps"
              >
                Baseline Sweeps
              </button>
              <button
                onClick={openAlignPrompt}
                disabled={busy || !imagePixels}
                title="Align the accepted sweeps with a max declination shift (default 0.5°)"
              >
                Align Sweeps
              </button>
              <div className="button-gap" />
              <button onClick={handleBackToSweeps}>Back to Sweeps</button>
            </div>

            {imageMeta !== null && imagePixels && (
              <div className="readout">
                <div>
                  Image: {imagePixels.width} × {imagePixels.height}
                </div>
                {/* RA/Dec/Flux/Sweep readout for the cell under the cursor.
                    Em-dashes fill in when the cursor is off the image. */}
                <div className="point-readout">
                  <div>RA: {hoverPoint ? formatRaSeconds(hoverPoint.ra) : '—'}</div>
                  <div>Dec: {hoverPoint ? formatDecDegrees(hoverPoint.dec) : '—'}</div>
                  <div>
                    Flux:{' '}
                    {hoverPoint
                      ? hoverPoint.flux === null
                        ? '—'
                        : `${hoverPoint.flux.toFixed(4)}${fluxUnit ? ` ${fluxUnit}` : ''}`
                      : '—'}
                  </div>
                  <div>Sweep: {hoverSweepNumber ?? '—'}</div>
                </div>
              </div>
            )}
          </div>
          }
        />
      </div>

      {prompt && <NumericInputDialog prompt={prompt} onCancel={() => setPrompt(null)} />}
    </div>
  );
}
