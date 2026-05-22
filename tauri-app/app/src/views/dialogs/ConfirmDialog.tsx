import { useEffect } from 'react';

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
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter') onConfirm();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel, onConfirm]);

  return (
    <div className="modal-backdrop" role="dialog" aria-label={title}>
      <div className="modal">
        <div className="modal-title">{title}</div>
        <div className="modal-row">
          <span>{message}</span>
        </div>
        <div className="modal-buttons">
          <button onClick={onConfirm} className="primary" autoFocus>
            {confirmLabel}
          </button>
          <button onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
