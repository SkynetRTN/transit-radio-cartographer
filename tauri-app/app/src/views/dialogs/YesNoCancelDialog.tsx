import { useEffect } from 'react';

interface Props {
  title: string;
  message: string;
  onYes: () => void;
  onNo: () => void;
  onCancel: () => void;
}

export function YesNoCancelDialog({ title, message, onYes, onNo, onCancel }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div className="modal-backdrop" role="dialog" aria-label={title}>
      <div className="modal">
        <div className="modal-title">{title}</div>
        <div className="modal-row">
          <span>{message}</span>
        </div>
        <div className="modal-buttons">
          <button onClick={onYes} className="primary" autoFocus>
            Yes
          </button>
          <button onClick={onNo}>No</button>
          <button onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
