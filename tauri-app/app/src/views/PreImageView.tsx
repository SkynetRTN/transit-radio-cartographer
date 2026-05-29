import { useCallback, useEffect, useState } from 'react';
import { rpcClient, type ImageMeta, type ImagePixels } from '../ipc/client';
import { useSurvey } from '../state/survey-context';
import { ImagePlot } from '../lib/plots/ImagePlot';
import { NumericInputDialog, type NumericPrompt } from './dialogs/NumericInputDialog';

// Default pixel resolution for the auto-generated pre-image and the Make
// Image dialog. Legacy VB defaulted to 2 (vb/survform.frm:1509); we use 1
// for a sharper preview by default.
const DEFAULT_PIX = 1;

export function PreImageView() {
  const {
    survey,
    workspace,
    workspaceHandle,
    setViewMode,
    makeImage,
    imageDisplay,
  } = useSurvey();
  const [imagePixels, setImagePixels] = useState<ImagePixels | null>(null);
  const [imageMeta, setImageMeta] = useState<ImageMeta | null>(null);
  const [pix, setPix] = useState<number>(DEFAULT_PIX);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<NumericPrompt | null>(null);
  // Track whether each reduction has been run at least once in this Pre Image
  // session. The Make Image button only enables after all three have fired —
  // returning to the per-sweep view unmounts this component, so the flags
  // implicitly reset on re-entry.
  const [didSmooth, setDidSmooth] = useState(false);
  const [didBaseline, setDidBaseline] = useState(false);
  const [didAlign, setDidAlign] = useState(false);

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
        setStatus(null);
      } catch (e) {
        setError((e as Error).message);
        setStatus(null);
      } finally {
        setBusy(false);
      }
    },
    [survey, workspaceHandle],
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
      title: 'Input Pixel Resolution',
      label: 'Pixel Resolution (Pixels):',
      defaultValue: pix,
      onSubmit: async (value) => {
        const intPix = Math.trunc(value);
        if (intPix <= 0 || intPix !== value) {
          setError('Invalid Pixel Resolution');
          setPrompt(null);
          return;
        }
        setPrompt(null);
        setPix(intPix);
        // Commit: build the final gridded image and switch to the Image view.
        // `makeImage` on the survey context stores meta+pixels and flips
        // `viewMode` to 'image' so MainWindow unmounts PreImageView.
        setBusy(true);
        setError(null);
        setStatus('Building image…');
        try {
          await makeImage(intPix);
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
      setDidSmooth(true);
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
          setDidBaseline(true);
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
          setDidAlign(true);
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

  const canMakeImage = didSmooth && didBaseline && didAlign;
  const remainingSteps: string[] = [];
  if (!didSmooth) remainingSteps.push('smooth sweeps');
  if (!didBaseline) remainingSteps.push('apply a baseline');
  if (!didAlign) remainingSteps.push('align sweeps');
  const makeImageTitle = canMakeImage
    ? 'Build the gridded image at a chosen pixel resolution (default 2)'
    : `Before making the image you must: smooth sweeps, apply a baseline, align sweeps. Remaining: ${remainingSteps.join(', ')}.`;

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
        <div className="workspace-body">
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
              />
            ) : (
              !status && !error && <div className="plot-status">No image yet.</div>
            )}
          </div>

          <div className="workspace-side">
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
              </div>
            )}
          </div>
        </div>
      </div>

      {prompt && <NumericInputDialog prompt={prompt} onCancel={() => setPrompt(null)} />}
    </div>
  );
}
