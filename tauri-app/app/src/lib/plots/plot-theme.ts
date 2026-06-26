/** Theme-driven colours for the Plotly plots.
 *
 *  Plotly renders to a canvas/SVG it owns, so it can't read the app's CSS
 *  custom properties — plot colours have to be passed in as concrete strings.
 *  This module is the single source of truth for them, split into two parts:
 *
 *    1. `plotChrome(theme)` — the *chrome*: backgrounds, grid, axes, font, plus
 *       a couple of theme-aware neutrals (faded points, cursor lines) that have
 *       to contrast with the background.
 *    2. `dataColors(theme)` — the *data* palette: the semantic series/overlay
 *       colours (primary/secondary series, baseline, peak, selection, …). The
 *       modern themes adopt the website observability-chart's orange/blue
 *       series pairing; Retro keeps the app's original harsh red/blue so the
 *       classic look stays faithful.
 *
 *  The palette mirrors the website observability-chart design system (slate /
 *  zinc greys, blue accent) so the app and site read as one product. The image
 *  heatmap colorscale (`RADIO_CARTOGRAPHER_PALETTE` in ImagePlot) is scientific
 *  data and lives there untouched. */

import type { Theme } from '../../state/theme-context';

export interface PlotChrome {
  /** Outer plot background (`paper_bgcolor`). */
  paperBg: string;
  /** Inner plotting-area background (`plot_bgcolor`). */
  plotBg: string;
  /** Grid line colour. */
  gridColor: string;
  /** Tick + axis-title font colour. */
  fontColor: string;
  /** Axis line / tick colour. */
  axisColor: string;
  /** Zero-line colour. */
  zeroLineColor: string;
  /** De-emphasised (cut / out-of-selection) points — dim but still visible
   *  against the plot background. */
  fadedColor: string;
  /** Vertical marker / cursor lines — reads as foreground against the plot. */
  cursorColor: string;
}

/** Shared by Modern Light + Retro (chart `LIGHT_THEME`). */
const LIGHT: PlotChrome = {
  paperBg: '#ffffff',
  plotBg: '#ffffff',
  gridColor: '#e5e7eb', // slate-200
  fontColor: '#1f2937', // slate-800
  axisColor: '#9ca3af', // slate-400
  zeroLineColor: '#d1d5db', // slate-300
  fadedColor: '#cbd5e1', // slate-300
  cursorColor: '#475569', // slate-600
};

/** Modern Dark (chart `DARK_THEME`). */
const DARK: PlotChrome = {
  paperBg: '#18181b', // zinc-900
  plotBg: '#27272a', // zinc-800
  gridColor: '#3f3f46', // zinc-700
  fontColor: '#e5e7eb', // gray-200
  axisColor: '#a1a1aa', // zinc-400
  zeroLineColor: '#52525b', // zinc-600
  fadedColor: '#52525b', // zinc-600
  cursorColor: '#d4d4d8', // zinc-300
};

export function plotChrome(theme: Theme): PlotChrome {
  return theme === 'dark' ? DARK : LIGHT;
}

/** Semantic data-series colours.
 *
 *  - `seriesPrimary`   kept / source samples (the main data track)
 *  - `seriesSecondary` removed / declination / secondary-channel samples
 *  - `baseline`        fitted baseline / model overlay line
 *  - `peak`            peak-fit highlight (curve + marker)
 *  - `peakSoft`        lighter peak tint used for the peak-mode selection band
 *  - `selectionFill`   translucent x-range selection rectangle
 *  - `selectionBand`   translucent y-range (declination) selection band
 *  - `pinned`          ring drawn around a pinned point */
export interface DataColors {
  seriesPrimary: string;
  seriesSecondary: string;
  baseline: string;
  peak: string;
  peakSoft: string;
  selectionFill: string;
  selectionBand: string;
  pinned: string;
}

/** Modern Light + Dark. The primary/secondary series adopt the website
 *  observability-chart pairing — orange + blue — so the app and site share a
 *  palette; the rest is a refined Tailwind-grade set. Shared across both modern
 *  themes so the series meaning never shifts between light and dark. */
const MODERN_DATA: DataColors = {
  seriesPrimary: '#ff7f0e', // observability orange
  seriesSecondary: '#1f77b4', // observability blue
  baseline: '#c026d3', // fuchsia-600
  peak: '#1f77b4', // observability blue (peak overlay)
  peakSoft: '#6ba8d6', // lighter observability-blue tint
  selectionFill: '#22c55e', // green-500
  selectionBand: '#fbbf24', // amber-400
  pinned: '#f59e0b', // amber-500
};

/** Retro — the app's original data colours, preserved so the classic look is
 *  faithful (harsh red / blue series, the legacy magenta / yellow / gold
 *  overlays). */
const RETRO_DATA: DataColors = {
  seriesPrimary: '#d80000',
  seriesSecondary: '#1855c0',
  baseline: '#c020c0',
  peak: '#0080ff',
  peakSoft: '#5fb7ff',
  selectionFill: '#00c000',
  selectionBand: '#f7e000',
  pinned: '#f5b400',
};

export function dataColors(theme: Theme): DataColors {
  return theme === 'retro' ? RETRO_DATA : MODERN_DATA;
}
