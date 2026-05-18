import { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';
import type { ImagePixels } from '../../ipc/client';

interface Props {
  image: ImagePixels;
  title: string;
  testId?: string;
}

export function ImagePlot({ image, title, testId }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const data: Plotly.Data[] = [
      {
        z: image.pixels,
        type: 'heatmap',
        colorscale: 'Greys',
        reversescale: true,
        showscale: true,
      },
    ];
    const layout: Partial<Plotly.Layout> = {
      title: { text: title },
      margin: { l: 50, r: 20, t: 40, b: 40 },
      paper_bgcolor: '#f3f3f3',
      plot_bgcolor: '#f3f3f3',
      font: { family: 'Tahoma, sans-serif', size: 11 },
      xaxis: { title: { text: 'RA pixel' }, scaleanchor: 'y' },
      yaxis: { title: { text: 'Dec pixel' }, autorange: 'reversed' },
    };
    Plotly.react(node, data, layout, { displayModeBar: false, responsive: true });
    return () => {
      Plotly.purge(node);
    };
  }, [image, title]);

  return <div data-testid={testId ?? 'image-plot'} ref={ref} style={{ width: '100%', height: '420px' }} />;
}
