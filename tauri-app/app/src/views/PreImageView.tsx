import { useCallback, useEffect, useState } from 'react';
import { rpcClient, type ImageMeta, type ImagePixels } from '../ipc/client';
import { useSurvey } from '../state/survey-context';
import { ImagePlot } from '../lib/plots/ImagePlot';

interface NumericPrompt {
  title: string;
  label: string;
  defaultValue: number;
  onSubmit: (value: number) => void;
}

function NumericInputDialog({
  prompt,
  onCancel,
}: {
  prompt: NumericPrompt;
  onCancel: () => void;
}) {
  const [value, setValue] = useState<string>(String(prompt.defaultValue));
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const num = parseFloat(value);
    if (!Number.isFinite(num)) {
      setError('Please enter a numeric value');
      return;
    }
    prompt.onSubmit(num);
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-label={prompt.title}>
      <div className="modal">
        <div className="modal-title">{prompt.title}</div>
        <div className="modal-row">
          <span>{prompt.label}</span>
          <input
            type="number"
            step="any"
            aria-label={prompt.label}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
              if (e.key === 'Escape') onCancel();
            }}
          />
        </div>
        {error && <div className="modal-error">{error}</div>}
        <div className="modal-buttons">
          <button onClick={submit} className="primary">
            OK
          </button>
          <button onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// vb/survform.frm:1509 — the legacy "Input Pixel Resolution" dialog defaults
// to `"2"` on first open, then to whatever the user last entered.
const DEFAULT_PIX = 2;

export function PreImageView() {
  const { survey, workspace, workspaceHandle, setViewMode, resetSweepReview } = useSurvey();
  const [imagePixels, setImagePixels] = useState<ImagePixels | null>(null);
  const [imageMeta, setImageMeta] = useState<ImageMeta | null>(null);
  const [pix, setPix] = useState<number>(DEFAULT_PIX);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<NumericPrompt | null>(null);

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
  }, [generateImage]);

  const openMakeImagePrompt = useCallback(() => {
    if (!survey) return;
    setPrompt({
      title: 'Input Pixel Resolution',
      label: 'Pixel Resolution (Pixels):',
      defaultValue: pix,
      onSubmit: (value) => {
        const intPix = Math.trunc(value);
        if (intPix <= 0 || intPix !== value) {
          setError('Invalid Pixel Resolution');
          setPrompt(null);
          return;
        }
        setPrompt(null);
        setPix(intPix);
        void generateImage(intPix);
      },
    });
  }, [survey, pix, generateImage]);

  const handleSmooth = useCallback(async () => {
    if (!survey) return;
    setBusy(true);
    setError(null);
    setStatus('Smoothing sweeps…');
    try {
      await rpcClient.smooth(survey.handle, 5, workspaceHandle);
      await generateImage(pix);
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
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setBusy(false);
          setStatus(null);
        }
      },
    });
  }, [survey, workspaceHandle, pix, generateImage]);

  const handleCancel = useCallback(() => {
    // Cancel from Pre Image returns to the per-sweep view so the user can
    // re-accept sweeps. Matches the legacy app where Cancel on each screen
    // walks the user back one step.
    resetSweepReview();
    setViewMode('survey');
  }, [resetSweepReview, setViewMode]);

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
              />
            ) : (
              !status && !error && <div className="plot-status">No image yet.</div>
            )}
          </div>

          <div className="workspace-side">
            <div className="side-buttons">
              <button
                onClick={openMakeImagePrompt}
                disabled={busy}
                className="primary"
                title="Regenerate the gridded pre-image at a chosen pixel resolution (default 2)"
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
              <button onClick={handleCancel}>Cancel</button>
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
