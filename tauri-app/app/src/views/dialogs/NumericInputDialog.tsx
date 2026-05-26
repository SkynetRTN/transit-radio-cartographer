import { useState } from 'react';

export interface NumericPrompt {
  title: string;
  label: string;
  defaultValue: number;
  onSubmit: (value: number) => void;
}

interface Props {
  prompt: NumericPrompt;
  onCancel: () => void;
}

export function NumericInputDialog({ prompt, onCancel }: Props) {
  const [value, setValue] = useState<string>(String(prompt.defaultValue));
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const num = parseFloat(value);
    if (!Number.isFinite(num)) {
      setError('Please enter a numeric value');
      return;
    }
    prompt.onSubmit(num);
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-label={prompt.title}>
      <div className="modal">
        <div className="modal-title">{prompt.title}</div>
        <div className="modal-row">
          <span>{prompt.label}</span>
          <input
            type="number"
            step="any"
            aria-label={prompt.label}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
              if (e.key === 'Escape') onCancel();
            }}
          />
        </div>
        {error && <div className="modal-error">{error}</div>}
        <div className="modal-buttons">
          <button onClick={submit} className="primary">
            OK
          </button>
          <button onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
