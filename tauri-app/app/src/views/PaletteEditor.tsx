import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { open as openDialog, save as saveDialog } from '@tauri-apps/plugin-dialog';
import { rpcClient, type PaletteStop } from '../ipc/client';
import { useSurvey } from '../state/survey-context';

// Built-in starter palettes — anchors in 0..255 (the legacy .pal convention).
// Power users can still load any .pal off disk; these short-circuit the file
// dialog for the most common ramps.
const PRESETS: Record<string, PaletteStop[]> = {
  'Default (Radio Cartographer)': [
    { anchor: 0, r: 0, g: 0, b: 0 },
    { anchor: 255 / 7, r: 255, g: 0, b: 255 },
    { anchor: (255 * 2) / 7, r: 0, g: 0, b: 255 },
    { anchor: (255 * 3) / 7, r: 0, g: 255, b: 255 },
    { anchor: (255 * 4) / 7, r: 0, g: 255, b: 0 },
    { anchor: (255 * 5) / 7, r: 255, g: 255, b: 0 },
    { anchor: (255 * 6) / 7, r: 255, g: 0, b: 0 },
    { anchor: 255, r: 255, g: 255, b: 255 },
  ],
  'Grayscale': [
    { anchor: 0, r: 0, g: 0, b: 0 },
    { anchor: 255, r: 255, g: 255, b: 255 },
  ],
  'Inverse Gray': [
    { anchor: 0, r: 255, g: 255, b: 255 },
    { anchor: 255, r: 0, g: 0, b: 0 },
  ],
  'Heat (Red)': [
    { anchor: 0, r: 0, g: 0, b: 0 },
    { anchor: 128, r: 255, g: 0, b: 0 },
    { anchor: 200, r: 255, g: 200, b: 0 },
    { anchor: 255, r: 255, g: 255, b: 255 },
  ],
  'Cool (Blue)': [
    { anchor: 0, r: 0, g: 0, b: 0 },
    { anchor: 128, r: 0, g: 100, b: 200 },
    { anchor: 200, r: 100, g: 200, b: 255 },
    { anchor: 255, r: 255, g: 255, b: 255 },
  ],
};

const STRIP_WIDTH = 600;
const STRIP_HEIGHT = 40;

function clamp(v: number, lo: number, hi: number): number {
  // Defend against NaN / blank inputs — clearing a number input would otherwise
  // poison the palette state and crash Plotly downstream.
  if (!Number.isFinite(v)) return lo;
  return Math.max(lo, Math.min(hi, v));
}

function interpRgb(stops: PaletteStop[], anchor: number): { r: number; g: number; b: number } {
  if (stops.length === 0) return { r: 0, g: 0, b: 0 };
  const sorted = [...stops].sort((a, b) => a.anchor - b.anchor);
  if (anchor <= sorted[0].anchor) return { r: sorted[0].r, g: sorted[0].g, b: sorted[0].b };
  if (anchor >= sorted[sorted.length - 1].anchor) {
    const last = sorted[sorted.length - 1];
    return { r: last.r, g: last.g, b: last.b };
  }
  for (let i = 1; i < sorted.length; i++) {
    if (anchor <= sorted[i].anchor) {
      const lo = sorted[i - 1];
      const hi = sorted[i];
      const span = hi.anchor - lo.anchor || 1;
      const t = (anchor - lo.anchor) / span;
      return {
        r: lo.r + t * (hi.r - lo.r),
        g: lo.g + t * (hi.g - lo.g),
        b: lo.b + t * (hi.b - lo.b),
      };
    }
  }
  const last = sorted[sorted.length - 1];
  return { r: last.r, g: last.g, b: last.b };
}

function rgbCss({ r, g, b }: { r: number; g: number; b: number }): string {
  const ri = clamp(Math.round(r), 0, 255);
  const gi = clamp(Math.round(g), 0, 255);
  const bi = clamp(Math.round(b), 0, 255);
  return `rgb(${ri}, ${gi}, ${bi})`;
}

interface Props {
  onClose?: () => void;
}

export function PaletteEditor({ onClose }: Props = {}) {
  const { image, imagePalette, imageFluxRange, setImagePalette } = useSurvey();
  const defaultStops = useMemo(
    () => imagePalette ?? PRESETS['Default (Radio Cartographer)'],
    [imagePalette],
  );
  const [stops, setStops] = useState<PaletteStop[]>(defaultStops);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const initialMin = imageFluxRange?.min ?? image?.min_flux ?? 0;
  const initialMax = imageFluxRange?.max ?? image?.max_flux ?? 1;
  const [fluxMin, setFluxMin] = useState<number>(initialMin);
  const [fluxMax, setFluxMax] = useState<number>(initialMax);
  const [error, setError] = useState<string | null>(null);
  const stripRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef<{ index: number } | null>(null);

  useEffect(() => {
    setStops(defaultStops);
  }, [defaultStops]);

  const gradientCss = useMemo(() => {
    // Skip non-finite stops so a transient NaN (cleared input field) doesn't
    // poison the gradient declaration and turn the strip into a CSS error.
    const finite = stops.filter(
      (s) =>
        Number.isFinite(s.anchor) &&
        Number.isFinite(s.r) &&
        Number.isFinite(s.g) &&
        Number.isFinite(s.b),
    );
    if (finite.length === 0) return 'black';
    const sorted = [...finite].sort((a, b) => a.anchor - b.anchor);
    const segs = sorted.map((s) => `${rgbCss(s)} ${(s.anchor / 255) * 100}%`);
    return `linear-gradient(to right, ${segs.join(', ')})`;
  }, [stops]);

  const onStripPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!stripRef.current) return;
      const rect = stripRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const anchor = clamp((x / rect.width) * 255, 0, 255);
      // Hit-test existing pegs (within 6px).
      const sorted = stops.map((s, i) => ({ s, i })).sort((a, b) => a.s.anchor - b.s.anchor);
      const hit = sorted.find(({ s }) => Math.abs((s.anchor / 255) * rect.width - x) <= 6);
      if (hit) {
        setSelectedIndex(hit.i);
        draggingRef.current = { index: hit.i };
        return;
      }
      // Otherwise insert a new stop at this anchor with interpolated color.
      const rgb = interpRgb(stops, anchor);
      const next: PaletteStop = { anchor, r: rgb.r, g: rgb.g, b: rgb.b };
      const updated = [...stops, next];
      setStops(updated);
      setSelectedIndex(updated.length - 1);
    },
    [stops],
  );

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!draggingRef.current || !stripRef.current) return;
      const rect = stripRef.current.getBoundingClientRect();
      if (rect.width <= 0) return; // safeguard if the strip isn't yet laid out
      const x = clamp(e.clientX - rect.left, 0, rect.width);
      const anchor = clamp((x / rect.width) * 255, 0, 255);
      setStops((prev) =>
        prev.map((s, i) => (i === draggingRef.current!.index ? { ...s, anchor } : s)),
      );
    };
    const onUp = () => {
      draggingRef.current = null;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, []);

  const selectedStop = selectedIndex !== null ? stops[selectedIndex] : null;

  const updateSelected = useCallback(
    (patch: Partial<PaletteStop>) => {
      if (selectedIndex === null) return;
      setStops((prev) => prev.map((s, i) => (i === selectedIndex ? { ...s, ...patch } : s)));
    },
    [selectedIndex],
  );

  const removeSelected = useCallback(() => {
    if (selectedIndex === null) return;
    if (stops.length <= 2) {
      setError('A palette needs at least 2 stops.');
      return;
    }
    setStops((prev) => prev.filter((_, i) => i !== selectedIndex));
    setSelectedIndex(null);
    setError(null);
  }, [selectedIndex, stops.length]);

  const applyPreset = useCallback((name: string) => {
    const p = PRESETS[name];
    if (!p) return;
    setStops(p.map((s) => ({ ...s })));
    setSelectedIndex(null);
    setError(null);
  }, []);

  const loadFromFile = useCallback(async () => {
    let path: string | null = null;
    try {
      const selected = await openDialog({
        multiple: false,
        directory: false,
        title: 'Load Palette',
        filters: [{ name: 'Palette (.pal)', extensions: ['pal', 'PAL'] }],
      });
      path = typeof selected === 'string' ? selected : null;
    } catch (err) {
      console.error('palette open dialog failed', err);
      return;
    }
    if (!path) return;
    try {
      const result = await rpcClient.loadPalette(path);
      setStops(result.stops);
      setSelectedIndex(null);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  const saveToFile = useCallback(async () => {
    let path: string | null = null;
    try {
      const selected = await saveDialog({
        title: 'Save Palette As',
        filters: [{ name: 'Palette (.pal)', extensions: ['pal'] }],
      });
      path = typeof selected === 'string' ? selected : null;
    } catch (err) {
      console.error('palette save dialog failed', err);
      return;
    }
    if (!path) return;
    try {
      await rpcClient.savePalette(path, stops);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [stops]);

  const resetFluxRange = useCallback(() => {
    if (image) {
      setFluxMin(image.min_flux);
      setFluxMax(image.max_flux);
    }
  }, [image]);

  const onOk = useCallback(() => {
    if (!Number.isFinite(fluxMin) || !Number.isFinite(fluxMax)) {
      setError('Flux Min/Max must be numeric.');
      return;
    }
    if (fluxMax <= fluxMin) {
      setError('Flux Max must exceed Flux Min.');
      return;
    }
    setImagePalette(stops, { min: fluxMin, max: fluxMax });
    onClose?.();
  }, [setImagePalette, stops, fluxMin, fluxMax, onClose]);

  const onCancel = useCallback(() => {
    // Revert local edits and dismiss — survey-context state is unchanged.
    setStops(defaultStops);
    setFluxMin(initialMin);
    setFluxMax(initialMax);
    setSelectedIndex(null);
    setError(null);
    onClose?.();
  }, [defaultStops, initialMin, initialMax, onClose]);

  return (
    <div className="palette-editor">
      <div className="palette-row">
        <strong>Flux Range</strong>
        <label>
          Min:
          <input
            type="number"
            step="any"
            value={fluxMin}
            onChange={(e) => setFluxMin(parseFloat(e.target.value))}
          />
        </label>
        <label>
          Max:
          <input
            type="number"
            step="any"
            value={fluxMax}
            onChange={(e) => setFluxMax(parseFloat(e.target.value))}
          />
        </label>
        <button onClick={resetFluxRange}>Reset</button>
      </div>

      <div
        ref={stripRef}
        className="palette-strip"
        style={{
          width: STRIP_WIDTH,
          height: STRIP_HEIGHT,
          background: gradientCss,
          position: 'relative',
          border: '1px solid #888',
          cursor: 'crosshair',
        }}
        onPointerDown={onStripPointerDown}
        aria-label="palette gradient"
      >
        {stops.map((s, i) => {
          // Skip pegs with non-finite anchors — they'd render at NaN px and
          // disappear silently; the editor's panel still shows the stop so
          // the user can fix the value.
          if (!Number.isFinite(s.anchor)) return null;
          const left = (clamp(s.anchor, 0, 255) / 255) * STRIP_WIDTH;
          const isSel = i === selectedIndex;
          return (
            <div
              key={i}
              className="palette-peg"
              style={{
                position: 'absolute',
                left: left - 6,
                top: STRIP_HEIGHT,
                width: 0,
                height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: `10px solid ${isSel ? '#1e63b0' : '#222'}`,
                cursor: 'grab',
              }}
              title={`Stop ${i + 1} · anchor ${s.anchor.toFixed(1)}`}
            />
          );
        })}
      </div>
      <div className="palette-hint">
        Click a peg to select it · drag to move · click empty space to add a stop
      </div>

      {selectedStop && (
        <div className="palette-row">
          <strong>Selected stop {selectedIndex! + 1}</strong>
          <label>
            anchor (0–255):
            <input
              type="number"
              min={0}
              max={255}
              step="any"
              value={Math.round(selectedStop.anchor * 100) / 100}
              onChange={(e) => updateSelected({ anchor: clamp(parseFloat(e.target.value), 0, 255) })}
            />
          </label>
          <label>
            R:
            <input
              type="number"
              min={0}
              max={255}
              value={Math.round(selectedStop.r)}
              onChange={(e) => updateSelected({ r: clamp(parseFloat(e.target.value), 0, 255) })}
            />
          </label>
          <label>
            G:
            <input
              type="number"
              min={0}
              max={255}
              value={Math.round(selectedStop.g)}
              onChange={(e) => updateSelected({ g: clamp(parseFloat(e.target.value), 0, 255) })}
            />
          </label>
          <label>
            B:
            <input
              type="number"
              min={0}
              max={255}
              value={Math.round(selectedStop.b)}
              onChange={(e) => updateSelected({ b: clamp(parseFloat(e.target.value), 0, 255) })}
            />
          </label>
          <span
            className="palette-swatch"
            style={{
              display: 'inline-block',
              width: 24,
              height: 24,
              border: '1px solid #555',
              background: rgbCss(selectedStop),
              verticalAlign: 'middle',
            }}
          />
          <button onClick={removeSelected}>Remove stop</button>
        </div>
      )}

      <div className="palette-row">
        <label>
          Preset:
          <select
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) applyPreset(e.target.value);
              e.target.value = '';
            }}
          >
            <option value="">— pick a preset —</option>
            {Object.keys(PRESETS).map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <button onClick={loadFromFile}>Load .pal…</button>
        <button onClick={saveToFile}>Save .pal…</button>
      </div>

      {error && <div className="modal-error">{error}</div>}

      <div className="palette-buttons">
        <button className="primary" onClick={onOk}>
          OK
        </button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
