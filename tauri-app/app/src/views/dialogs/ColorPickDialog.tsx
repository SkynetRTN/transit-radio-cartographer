import { useEffect } from 'react';
import DialogContentText from '@mui/material/DialogContentText';
import type { ChannelColor } from '../../ipc/client';
import { AppDialog, useIsModern, type DialogButton } from './AppDialog';

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

const NAME: Record<ChannelColor, string> = { r: 'Red', g: 'Green', b: 'Blue' };

export function ColorPickDialog({
  title,
  message,
  disabledColors = [],
  onPick,
  onCancel,
}: Props) {
  const modern = useIsModern();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const colors: ChannelColor[] = ['r', 'g', 'b'];
  const buttons: DialogButton[] = [
    ...colors.map((c) => ({
      label: NAME[c],
      onClick: () => onPick(c),
      disabled: disabledColors.includes(c),
      title: disabledColors.includes(c) ? 'Already used' : undefined,
      background: SWATCH[c],
      color: 'white',
      minWidth: 64,
    })),
    { label: 'Cancel', onClick: onCancel },
  ];

  return (
    <AppDialog title={title} onClose={onCancel} buttons={buttons}>
      {modern ? (
        <DialogContentText>{message}</DialogContentText>
      ) : (
        <div className="modal-row">
          <span>{message}</span>
        </div>
      )}
    </AppDialog>
  );
}
