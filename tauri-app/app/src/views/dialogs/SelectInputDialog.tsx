import { useState } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectPrompt {
  title: string;
  label: string;
  defaultValue: string;
  options: SelectOption[];
  onSubmit: (value: string) => void;
}

interface Props {
  prompt: SelectPrompt;
  onCancel: () => void;
}

export function SelectInputDialog({ prompt, onCancel }: Props) {
  const [value, setValue] = useState<string>(prompt.defaultValue);

  const submit = () => {
    prompt.onSubmit(value);
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-label={prompt.title}>
      <div className="modal">
        <div className="modal-title">{prompt.title}</div>
        <div className="modal-row">
          <span>{prompt.label}</span>
          <select
            aria-label={prompt.label}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
              if (e.key === 'Escape') onCancel();
            }}
          >
            {prompt.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
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
