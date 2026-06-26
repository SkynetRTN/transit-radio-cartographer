import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

/** Selectable UI themes.
 *  - `light`  — Modern Light (the default; chart-aligned slate/zinc palette).
 *  - `dark`   — Modern Dark (chart-aligned zinc palette).
 *  - `retro`  — the original "90s" Radio Cartographer look, preserved 1:1. */
export type Theme = 'light' | 'dark' | 'retro';

export const THEMES: readonly Theme[] = ['light', 'dark', 'retro'];

/** localStorage key. Mirrored by the pre-paint script in `index.html` — keep
 *  the two in sync. */
export const THEME_STORAGE_KEY = 'rc-theme';

const DEFAULT_THEME: Theme = 'light';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeState | null>(null);

function isTheme(value: string | null): value is Theme {
  return value === 'light' || value === 'dark' || value === 'retro';
}

/** Read the persisted theme, falling back to the default. SSR/storage-safe. */
function readStoredTheme(): Theme {
  if (typeof localStorage === 'undefined') return DEFAULT_THEME;
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(stored) ? stored : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

/** Stamp the theme onto `<html data-theme=…>` so the CSS variable overrides
 *  apply. This is the single source of truth the stylesheet reads. */
function applyThemeAttr(theme: Theme): void {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(readStoredTheme);

  useEffect(() => {
    applyThemeAttr(theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Persistence is best-effort; the in-memory theme still applies.
    }
  }, [theme]);

  const value = useMemo<ThemeState>(() => ({ theme, setTheme }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** Resolve the current theme. Inside a `ThemeProvider` this returns the live
 *  context (with a working `setTheme`). Outside one — notably the plot-render
 *  unit tests, which mount components without app providers — it falls back to
 *  reading the `data-theme` attribute the provider/pre-paint script set on
 *  `<html>`, with a no-op setter. This keeps those tests provider-free. */
export function useTheme(): ThemeState {
  const ctx = useContext(ThemeContext);
  if (ctx) return ctx;
  const attr =
    typeof document !== 'undefined'
      ? document.documentElement.getAttribute('data-theme')
      : null;
  return { theme: isTheme(attr) ? attr : DEFAULT_THEME, setTheme: () => {} };
}
