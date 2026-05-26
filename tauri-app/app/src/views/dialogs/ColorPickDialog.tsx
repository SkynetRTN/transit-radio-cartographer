import { useEffect } from 'react';
import type { ChannelColor } from '../../ipc/client';

interface Props {
  title: string;
  message: string;
  disabledColors?: ChannelColor[];
  onPick: (color: ChannelColor) => void;
  onCancel: () => void;
}

const SWATCH: Record<ChannelColor, string> = {
  r: 'rgb(220, 30, 30)',
  g: 'rgb(40, 180, 40)',
  b: 'rgb(40, 80, 220)',
};

export function ColorPickDialog({
  title,
  message,
  disabledColors = [],
  onPick,
  onCancel,
}: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const colors: ChannelColor[] = ['r', 'g', 'b'];
  return (
    <div className="modal-backdrop" role="dialog" aria-label={title}>
      <div className="modal">
        <div className="modal-title">{title}</div>
        <div className="modal-row">
          <span>{message}</span>
        </div>
        <div className="modal-buttons">
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => onPick(c)}
              disabled={disabledColors.includes(c)}
              title={disabledColors.includes(c) ? 'Already used' : ''}
              style={{
                background: SWATCH[c],
                color: 'white',
                minWidth: 64,
              }}
            >
              {c === 'r' ? 'Red' : c === 'g' ? 'Green' : 'Blue'}
            </button>
          ))}
          <button onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
