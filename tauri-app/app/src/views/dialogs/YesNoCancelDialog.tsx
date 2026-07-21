import { useEffect } from 'react';
import DialogContentText from '@mui/material/DialogContentText';
import { AppDialog, useIsModern } from './AppDialog';

interface Props {
  title: string;
  message: string;
  onYes: () => void;
  onNo: () => void;
  onCancel: () => void;
}

export function YesNoCancelDialog({ title, message, onYes, onNo, onCancel }: Props) {
  const modern = useIsModern();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <AppDialog
      title={title}
      onClose={onCancel}
      buttons={[
        { label: 'Yes', onClick: onYes, primary: true, autoFocus: true },
        { label: 'No', onClick: onNo },
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
