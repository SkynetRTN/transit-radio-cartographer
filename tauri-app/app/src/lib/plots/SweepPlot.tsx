import { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';
import type { SweepInline } from '../../ipc/client';
import { useTheme } from '../../state/theme-context';
import { plotChrome, dataColors } from './plot-theme';

interface Props {
  sweep: SweepInline;
  title: string;
  testId?: string;
}

export function SweepPlot({ sweep, title, testId }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const chrome = plotChrome(theme);
    const dc = dataColors(theme);
    const xs = sweep.dec.length === sweep.flux.length
      ? sweep.dec
      : sweep.flux.map((_, i) => i);
    const data: Plotly.Data[] = [
      {
        x: xs,
        y: sweep.flux,
        type: 'scattergl',
        mode: 'lines',
        line: { color: dc.seriesSecondary, width: 1 },
        name: 'Flux',
      },
    ];
    const layout: Partial<Plotly.Layout> = {
      title: { text: title },
      margin: { l: 50, r: 20, t: 40, b: 40 },
      paper_bgcolor: chrome.paperBg,
      plot_bgcolor: chrome.plotBg,
      font: { family: 'Tahoma, sans-serif', size: 11, color: chrome.fontColor },
      xaxis: {
        title: { text: 'Dec' },
        zeroline: false,
        gridcolor: chrome.gridColor,
        linecolor: chrome.axisColor,
        tickcolor: chrome.axisColor,
      },
      yaxis: {
        title: { text: 'Flux' },
        zeroline: false,
        gridcolor: chrome.gridColor,
        linecolor: chrome.axisColor,
        tickcolor: chrome.axisColor,
      },
      dragmode: 'select',
    };
    Plotly.react(node, data, layout, { displayModeBar: false, responsive: true });
    return () => {
      Plotly.purge(node);
    };
  }, [sweep, title, theme]);

  return <div data-testid={testId ?? 'sweep-plot'} ref={ref} style={{ width: '100%', height: '320px' }} />;
}
