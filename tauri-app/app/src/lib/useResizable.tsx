import { useCallback, useEffect, useRef, useState } from 'react';

function clamp(v: number, lo: number, hi: number): number {
  if (!Number.isFinite(v)) return lo;
  return Math.min(hi, Math.max(lo, v));
}

function readStored(key: string): number | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return null;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : null;
  } catch {
    // localStorage can throw in private mode / when disabled — degrade to the
    // in-memory default rather than crashing the view.
    return null;
  }
}

function writeStored(key: string, n: number | null): void {
  try {
    if (n === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, String(Math.round(n)));
  } catch {
    // Ignore — resizing still works for the session, it just won't persist.
  }
}

interface ResizeOptions {
  min: number;
  max: number;
  /** 'x' drags horizontally (panel width); 'y' drags vertically (panel height). */
  axis: 'x' | 'y';
}

interface Resizable {
  /** Current size in px, or null to fall back to the CSS default. */
  size: number | null;
  setSize: (n: number | null) => void;
  /**
   * Begin a drag from a divider's `onPointerDown`. When `size` is still null
   * (never dragged), pass the divider's current on-screen size as `fallbackPx`
   * so the first drag starts from where the panel actually is — no jump.
   */
  startDrag: (e: React.PointerEvent, fallbackPx?: number) => void;
}

/**
 * A persisted, pointer-draggable pixel size. Models the window-level drag idiom
 * used by PaletteEditor's channel bars: `startDrag` arms a ref, window
 * `pointermove`/`pointerup` listeners (bound once) update and persist it.
 *
 * Sign convention: the resized panel sits to the RIGHT of a vertical divider
 * (axis 'x') or BELOW a horizontal one (axis 'y'), so dragging toward the drag
 * origin — left or up — grows it.
 */
export function useResizable(
  key: string,
  defaultPx: number | null,
  opts: ResizeOptions,
): Resizable {
  const { min, max, axis } = opts;
  const [size, setSizeState] = useState<number | null>(() => readStored(key) ?? defaultPx);
  // Drag state lives in a ref so the window listeners (bound once) always read
  // the latest origin without re-subscribing on every pointer move.
  const dragRef = useRef<{ origin: number; start: number } | null>(null);

  const setSize = useCallback(
    (n: number | null) => {
      setSizeState(n);
      writeStored(key, n);
    },
    [key],
  );

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const pos = axis === 'x' ? e.clientX : e.clientY;
      setSizeState(clamp(d.start + (d.origin - pos), min, max));
      // The plot components that use Plotly's `responsive: true` (PointScatter,
      // SweepPlot) only refit on a *window* resize — dragging this divider
      // changes their container but fires no such event, so the plot used to
      // stay its old width while only the panel moved. Nudge a resize so they
      // reflow live with the drag. ImagePlot has its own ResizeObserver and is
      // unaffected by the extra event. Plotly debounces resize internally.
      window.dispatchEvent(new Event('resize'));
    };
    const onUp = () => {
      if (!dragRef.current) return;
      dragRef.current = null;
      document.body.classList.remove('ws-resizing');
      // Persist the size the drag settled on (onMove only touched React state).
      setSizeState((cur) => {
        writeStored(key, cur);
        return cur;
      });
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [axis, min, max, key]);

  const startDrag = useCallback(
    (e: React.PointerEvent, fallbackPx?: number) => {
      e.preventDefault();
      const origin = axis === 'x' ? e.clientX : e.clientY;
      const start = clamp(size ?? fallbackPx ?? min, min, max);
      dragRef.current = { origin, start };
      document.body.classList.add('ws-resizing');
    },
    [axis, size, min],
  );

  return { size, setSize, startDrag };
}

interface ResizeDividerProps {
  /** 'vertical' = an upright grab bar between two columns (drag left/right).
   *  'horizontal' = a flat grab bar between two rows (drag up/down). */
  orientation: 'vertical' | 'horizontal';
  onPointerDown: (e: React.PointerEvent) => void;
  title?: string;
}

/** A thin grab bar with a centered handle line; wire `onPointerDown` to a
 *  `useResizable().startDrag`. */
export function ResizeDivider({ orientation, onPointerDown, title }: ResizeDividerProps) {
  return (
    <div
      className={`ws-divider ws-divider-${orientation}`}
      role="separator"
      aria-orientation={orientation}
      title={title ?? 'Drag to resize'}
      onPointerDown={onPointerDown}
    >
      <div className="ws-divider-line" />
    </div>
  );
}
