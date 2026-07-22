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
const COMPONENT_STRIP_HEIGHT = 50;
const COMPONENT_CHANNELS = ['r', 'g', 'b'] as const;
const COMPONENT_FILLS: Record<(typeof COMPONENT_CHANNELS)[number], string> = {
  r: 'rgba(220, 40, 40, 0.85)',
  g: 'rgba(40, 180, 70, 0.85)',
  b: 'rgba(40, 90, 220, 0.85)',
};
const VERTICAL_BAR_HEIGHT = 160;
const VERTICAL_BAR_WIDTH = 36;

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

// Editor-internal stop carrying a stable id, so selection survives the array
// being re-sorted as anchors move. Ids are stripped before the palette leaves
// the editor.
export interface EditStop extends PaletteStop {
  id: number;
}

// Minimum separation between adjacent anchors. Kept well above the downstream
// colorscale's float epsilon (1e-6 normalized ≈ 2.5e-4 anchor units) so two
// stops can never collapse into a duplicate — a duplicate anchor crashes
// Plotly. This is what makes stacking pegs on the edge, dropping one onto
// another, and ~50-stop palettes safe (BUG-018 / BUG-021).
const MIN_ANCHOR_GAP = 0.5;

// Sort by anchor and force strictly-increasing anchors separated by at least
// MIN_ANCHOR_GAP, clamped to [0, 255]. Ids are preserved. A forward pass pushes
// colliding stops right; a backward pass pulls them back under 255 so the
// result stays in range and strictly increasing. Stops with a non-finite
// anchor are dropped (they can't be placed on the strip).
export function spaceStops(stops: EditStop[]): EditStop[] {
  const sorted = stops
    .filter((s) => Number.isFinite(s.anchor))
    .map((s) => ({ ...s, anchor: clamp(s.anchor, 0, 255) }))
    .sort((a, b) => a.anchor - b.anchor);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].anchor < sorted[i - 1].anchor + MIN_ANCHOR_GAP) {
      sorted[i].anchor = Math.min(255, sorted[i - 1].anchor + MIN_ANCHOR_GAP);
    }
  }
  for (let i = sorted.length - 2; i >= 0; i--) {
    if (sorted[i].anchor > sorted[i + 1].anchor - MIN_ANCHOR_GAP) {
      sorted[i].anchor = Math.max(0, sorted[i + 1].anchor - MIN_ANCHOR_GAP);
    }
  }
  return sorted;
}

function stripIds(stops: EditStop[]): PaletteStop[] {
  return stops.map(({ anchor, r, g, b }) => ({ anchor, r, g, b }));
}

function componentPolygonPoints(
  stops: PaletteStop[],
  channel: 'r' | 'g' | 'b',
  width: number,
  height: number,
): string {
  const finite = stops.filter(
    (s) =>
      Number.isFinite(s.anchor) &&
      Number.isFinite(s.r) &&
      Number.isFinite(s.g) &&
      Number.isFinite(s.b),
  );
  if (finite.length === 0) return '';
  const sorted = [...finite].sort((a, b) => a.anchor - b.anchor);
  const yFor = (val: number) => height - (clamp(val, 0, 255) / 255) * height;
  const xFor = (anchor: number) => (clamp(anchor, 0, 255) / 255) * width;
  // Extend horizontally to the edges using the endpoints' channel levels so
  // the filled region matches what interpRgb actually returns past the outer
  // stops (i.e. flat, not zero).
  const pts: Array<[number, number]> = [];
  pts.push([0, yFor(sorted[0][channel])]);
  for (const s of sorted) pts.push([xFor(s.anchor), yFor(s[channel])]);
  pts.push([width, yFor(sorted[sorted.length - 1][channel])]);
  pts.push([width, height]);
  pts.push([0, height]);
  return pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
}

interface VerticalChannelBarProps {
  channel: 'r' | 'g' | 'b';
  value: number | null;
  onChange?: (v: number) => void;
}

function VerticalChannelBar({ channel, value, onChange }: VerticalChannelBarProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const disabled = value === null || !onChange;

  const updateFromEvent = useCallback(
    (clientY: number) => {
      if (disabled || !onChange) return;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.height <= 0) return;
      const y = clamp(clientY - rect.top, 0, rect.height);
      const next = clamp(((rect.height - y) / rect.height) * 255, 0, 255);
      onChange(next);
    },
    [disabled, onChange],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      draggingRef.current = true;
      updateFromEvent(e.clientY);
    },
    [disabled, updateFromEvent],
  );

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      updateFromEvent(e.clientY);
    };
    const onUp = () => {
      draggingRef.current = false;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [updateFromEvent]);

  const safe = value !== null && Number.isFinite(value) ? clamp(value, 0, 255) : 0;
  const fillPct = (safe / 255) * 100;
  const label = channel.toUpperCase();

  return (
    <div className={`palette-vbar-wrap${disabled ? ' palette-vbar-disabled' : ''}`}>
      <div className="palette-vbar-label">{label}</div>
      <div
        ref={ref}
        className="palette-vbar"
        style={{ width: VERTICAL_BAR_WIDTH, height: VERTICAL_BAR_HEIGHT }}
        onPointerDown={onPointerDown}
        role="slider"
        aria-label={`${label} level`}
        aria-valuemin={0}
        aria-valuemax={255}
        aria-valuenow={disabled ? undefined : Math.round(safe)}
        aria-disabled={disabled || undefined}
      >
        {!disabled && (
          <div
            className="palette-vbar-fill"
            style={{
              height: `${fillPct}%`,
              background: COMPONENT_FILLS[channel],
            }}
          />
        )}
      </div>
      <div className="palette-vbar-value">{disabled ? '—' : Math.round(safe)}</div>
    </div>
  );
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
  const idRef = useRef(0);
  const withIds = useCallback(
    (arr: PaletteStop[]): EditStop[] => arr.map((s) => ({ ...s, id: idRef.current++ })),
    [],
  );
  // Stored stops are kept sorted by anchor and carry a stable id so selection
  // follows a peg as the array reorders under it (BUG-018 / BUG-021).
  const [stops, setStops] = useState<EditStop[]>(() => defaultStops.map((s) => ({ ...s, id: idRef.current++ })));
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const initialMin = imageFluxRange?.min ?? image?.min_flux ?? 0;
  const initialMax = imageFluxRange?.max ?? image?.max_flux ?? 1;
  const [fluxMin, setFluxMin] = useState<number>(initialMin);
  const [fluxMax, setFluxMax] = useState<number>(initialMax);
  const [error, setError] = useState<string | null>(null);
  const stripRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef<{ id: number } | null>(null);

  useEffect(() => {
    setStops(withIds(defaultStops));
  }, [defaultStops, withIds]);

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
      // Hit-test existing pegs (within 6px). Stops are already anchor-sorted.
      const hit = stops.find((s) => Math.abs((s.anchor / 255) * rect.width - x) <= 6);
      if (hit) {
        setSelectedId(hit.id);
        draggingRef.current = { id: hit.id };
        return;
      }
      // Otherwise insert a new stop at this anchor with interpolated color.
      // spaceStops keeps the array sorted and separated so the new stop can
      // never land exactly on top of an existing one.
      const rgb = interpRgb(stops, anchor);
      const next: EditStop = { anchor, r: rgb.r, g: rgb.g, b: rgb.b, id: idRef.current++ };
      setStops(spaceStops([...stops, next]));
      setSelectedId(next.id);
    },
    [stops],
  );

  const onComponentStripPointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      if (rect.width <= 0) return;
      const x = e.clientX - rect.left;
      const hit = stops
        .filter((s) => Number.isFinite(s.anchor))
        .find((s) => Math.abs((clamp(s.anchor, 0, 255) / 255) * rect.width - x) <= 6);
      if (hit) setSelectedId(hit.id);
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
      const id = draggingRef.current.id;
      // Move the dragged stop and keep the array anchor-sorted; selection is by
      // id so it follows the peg even as it crosses others. Final spacing is
      // applied on release (below) so the drag itself stays smooth.
      setStops((prev) =>
        [...prev.map((s) => (s.id === id ? { ...s, anchor } : s))].sort(
          (a, b) => a.anchor - b.anchor,
        ),
      );
    };
    const onUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = null;
      // Space-on-drop: separate any stops that were dragged onto each other so
      // the committed palette is always strictly increasing (BUG-018).
      setStops((prev) => spaceStops(prev));
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, []);

  const selectedStop = stops.find((s) => s.id === selectedId) ?? null;
  const selectedNumber = selectedStop ? stops.findIndex((s) => s.id === selectedStop.id) + 1 : 0;

  const updateSelected = useCallback(
    (patch: Partial<PaletteStop>) => {
      if (selectedId === null) return;
      setStops((prev) => {
        const next = prev.map((s) => (s.id === selectedId ? { ...s, ...patch } : s));
        // Re-sort when the anchor changed so peg order tracks anchor order;
        // colours don't affect ordering.
        return 'anchor' in patch ? [...next].sort((a, b) => a.anchor - b.anchor) : next;
      });
    },
    [selectedId],
  );

  const removeSelected = useCallback(() => {
    if (selectedId === null) return;
    if (stops.length <= 2) {
      setError('A palette needs at least 2 stops.');
      return;
    }
    setStops((prev) => prev.filter((s) => s.id !== selectedId));
    setSelectedId(null);
    setError(null);
  }, [selectedId, stops.length]);

  const applyPreset = useCallback(
    (name: string) => {
      const p = PRESETS[name];
      if (!p) return;
      setStops(withIds(p));
      setSelectedId(null);
      setError(null);
    },
    [withIds],
  );

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
      setStops(spaceStops(withIds(result.stops)));
      setSelectedId(null);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [withIds]);

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
      await rpcClient.savePalette(path, stripIds(spaceStops(stops)));
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
    // Emit a clean, strictly-increasing palette so the downstream colorscale
    // never sees duplicate/unsorted anchors (BUG-018 / BUG-021).
    setImagePalette(stripIds(spaceStops(stops)), { min: fluxMin, max: fluxMax });
    onClose?.();
  }, [setImagePalette, stops, fluxMin, fluxMax, onClose]);

  const onCancel = useCallback(() => {
    // Revert local edits and dismiss — survey-context state is unchanged.
    setStops(withIds(defaultStops));
    setFluxMin(initialMin);
    setFluxMax(initialMax);
    setSelectedId(null);
    setError(null);
    onClose?.();
  }, [withIds, defaultStops, initialMin, initialMax, onClose]);

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

      <div className="palette-top">
      <div className="palette-top-left">
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
          const isSel = s.id === selectedId;
          return (
            <div
              key={s.id}
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
      <svg
        className="palette-components"
        width={STRIP_WIDTH}
        height={COMPONENT_STRIP_HEIGHT * 3}
        aria-label="palette color components"
        onPointerDown={onComponentStripPointerDown}
        style={{ cursor: 'pointer' }}
      >
        {COMPONENT_CHANNELS.map((ch, row) => {
          const yOffset = row * COMPONENT_STRIP_HEIGHT;
          const points = componentPolygonPoints(
            stops,
            ch,
            STRIP_WIDTH,
            COMPONENT_STRIP_HEIGHT,
          );
          return (
            <g key={ch} transform={`translate(0, ${yOffset})`}>
              <rect
                x={0}
                y={0}
                width={STRIP_WIDTH}
                height={COMPONENT_STRIP_HEIGHT}
                fill="#ffffff"
                stroke="#888"
                strokeWidth={1}
              />
              {points && (
                <polygon points={points} fill={COMPONENT_FILLS[ch]} stroke="none" />
              )}
              {stops.map((s) => {
                if (!Number.isFinite(s.anchor)) return null;
                const x = (clamp(s.anchor, 0, 255) / 255) * STRIP_WIDTH;
                const isSel = s.id === selectedId;
                return (
                  <line
                    key={s.id}
                    x1={x}
                    x2={x}
                    y1={0}
                    y2={COMPONENT_STRIP_HEIGHT}
                    stroke={isSel ? '#1e63b0' : '#444'}
                    strokeWidth={isSel ? 1.5 : 1}
                    opacity={isSel ? 1 : 0.65}
                  />
                );
              })}
            </g>
          );
        })}
      </svg>

      <div className="palette-hint">
        Click a peg to select it · drag to move · click empty space to add a stop
      </div>
      </div>

      <div className="palette-components-panel">
        <div className="palette-vbars">
          <VerticalChannelBar
            channel="r"
            value={selectedStop ? selectedStop.r : null}
            onChange={selectedStop ? (v) => updateSelected({ r: v }) : undefined}
          />
          <VerticalChannelBar
            channel="g"
            value={selectedStop ? selectedStop.g : null}
            onChange={selectedStop ? (v) => updateSelected({ g: v }) : undefined}
          />
          <VerticalChannelBar
            channel="b"
            value={selectedStop ? selectedStop.b : null}
            onChange={selectedStop ? (v) => updateSelected({ b: v }) : undefined}
          />
        </div>
        <div className="palette-preview">
          <div className="palette-preview-label">Preview</div>
          <div
            className={`palette-preview-swatch${selectedStop ? '' : ' palette-preview-swatch-empty'}`}
            style={selectedStop ? { background: rgbCss(selectedStop) } : undefined}
            aria-label="selected stop color preview"
          />
        </div>
      </div>
      </div>

      {selectedStop && (
        <>
          <div className="palette-row">
            <strong>Selected stop {selectedNumber}</strong>
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
        </>
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
