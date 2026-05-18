import { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';
import type { SweepInline } from '../../ipc/client';

interface Props {
  sweep: SweepInline;
  title: string;
  testId?: string;
}

export function SweepPlot({ sweep, title, testId }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const xs = sweep.dec.length === sweep.flux.length
      ? sweep.dec
      : sweep.flux.map((_, i) => i);
    const data: Plotly.Data[] = [
      {
        x: xs,
        y: sweep.flux,
        type: 'scattergl',
        mode: 'lines',
        line: { color: '#1f4d9c', width: 1 },
        name: 'Flux',
      },
    ];
    const layout: Partial<Plotly.Layout> = {
      title: { text: title },
      margin: { l: 50, r: 20, t: 40, b: 40 },
      paper_bgcolor: '#f3f3f3',
      plot_bgcolor: '#f3f3f3',
      font: { family: 'Tahoma, sans-serif', size: 11 },
      xaxis: { title: { text: 'Dec' }, zeroline: false },
      yaxis: { title: { text: 'Flux' }, zeroline: false },
      dragmode: 'select',
    };
    Plotly.react(node, data, layout, { displayModeBar: false, responsive: true });
    return () => {
      Plotly.purge(node);
    };
  }, [sweep, title]);

  return <div data-testid={testId ?? 'sweep-plot'} ref={ref} style={{ width: '100%', height: '320px' }} />;
}
