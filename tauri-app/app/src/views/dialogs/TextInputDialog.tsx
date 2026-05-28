import { useState } from 'react';

export interface TextPrompt {
  title: string;
  label: string;
  defaultValue: string;
  onSubmit: (value: string) => void;
}

interface Props {
  prompt: TextPrompt;
  onCancel: () => void;
}

export function TextInputDialog({ prompt, onCancel }: Props) {
  const [value, setValue] = useState<string>(prompt.defaultValue);
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      setError('Please enter a name');
      return;
    }
    prompt.onSubmit(trimmed);
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-label={prompt.title}>
      <div className="modal">
        <div className="modal-title">{prompt.title}</div>
        <div className="modal-row">
          <span>{prompt.label}</span>
          <input
            type="text"
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
