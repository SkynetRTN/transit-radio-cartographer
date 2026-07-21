/** Material UI theme bridge.
 *
 *  The app's colour system lives as CSS custom properties in `App.css`, keyed by
 *  the `data-theme` attribute on <html> (see `state/theme-context.tsx`). MUI
 *  components render through Emotion and can't read those CSS variables at theme-
 *  construction time, so this module mirrors the same tokens into concrete MUI
 *  `Theme` objects — one per app theme.
 *
 *  This is the single source of truth for MUI colours, the same way
 *  `lib/plots/plot-theme.ts` is the single source of truth for Plotly colours.
 *  When a token changes in `App.css`, update the matching value here.
 *
 *  Retro keeps rendering through the legacy custom-CSS path, so its MUI theme is a
 *  faithful fallback for any shared MUI primitive that happens to mount in retro —
 *  it should never be the primary look for retro chrome. */

import { createTheme, type Theme as MuiTheme } from '@mui/material/styles';
import type { Theme } from '../state/theme-context';

const MODERN_FONT =
  '"Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif';
const RETRO_FONT = 'Tahoma, "Segoe UI", "DejaVu Sans", sans-serif';

/** Modern Light — mirrors the `:root` tokens in App.css. */
const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#2563eb', dark: '#1d4ed8', contrastText: '#ffffff' },
    background: { default: '#f3f4f6', paper: '#ffffff' },
    text: {
      primary: '#111827', // slate-900
      secondary: '#374151', // slate-700
      disabled: '#9ca3af', // slate-400
    },
    divider: '#e5e7eb', // slate-200
    error: { main: '#b91c1c' },
    warning: { main: '#d97706' },
  },
  typography: { fontFamily: MODERN_FONT, fontSize: 12 },
  shape: { borderRadius: 4 },
});

/** Modern Dark — mirrors the `[data-theme="dark"]` tokens in App.css. */
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#3b82f6', dark: '#2563eb', contrastText: '#ffffff' },
    background: { default: '#09090b', paper: '#18181b' }, // zinc-900
    text: {
      primary: '#f4f4f5', // zinc-100
      secondary: '#d4d4d8', // zinc-300
      disabled: '#71717a', // zinc-500
    },
    divider: '#3f3f46', // zinc-700
    error: { main: '#f87171' },
    warning: { main: '#a37b00' },
  },
  typography: { fontFamily: MODERN_FONT, fontSize: 12 },
  shape: { borderRadius: 4 },
});

/** Retro — mirrors the `[data-theme="retro"]` tokens in App.css. Fallback only;
 *  retro chrome primarily renders through the legacy custom-CSS path. */
const retroTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#2e7ec0', contrastText: '#ffffff' },
    background: { default: '#bdbdbd', paper: '#ffffff' },
    text: { primary: '#111', secondary: '#444', disabled: '#888' },
    divider: '#c8c8c8',
    error: { main: '#a40000' },
    warning: { main: '#c0a000' },
  },
  typography: { fontFamily: RETRO_FONT, fontSize: 12 },
  shape: { borderRadius: 2 },
});

/** Resolve the MUI theme for the given app theme. */
export function muiThemeFor(theme: Theme): MuiTheme {
  switch (theme) {
    case 'dark':
      return darkTheme;
    case 'retro':
      return retroTheme;
    default:
      return lightTheme;
  }
}
