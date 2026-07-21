import { useEffect } from 'react';
import DialogContentText from '@mui/material/DialogContentText';
import { AppDialog, useIsModern } from './AppDialog';

interface Props {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
}

export function ConfirmDialog({
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'OK',
}: Props) {
  const modern = useIsModern();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter') onConfirm();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel, onConfirm]);

  return (
    <AppDialog
      title={title}
      onClose={onCancel}
      buttons={[
        { label: confirmLabel, onClick: onConfirm, primary: true, autoFocus: true },
        { label: 'Cancel', onClick: onCancel },
      ]}
    >
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
