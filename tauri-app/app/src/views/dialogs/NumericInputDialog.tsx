import { useState } from 'react';
import TextField from '@mui/material/TextField';
import { AppDialog, useIsModern } from './AppDialog';

export interface NumericPrompt {
  title: string;
  label: string;
  defaultValue: number;
  onSubmit: (value: number) => void;
  // Optional explanatory line rendered under the input — used to clarify what
  // the number actually means when the label alone would be ambiguous.
  hint?: string;
}

interface Props {
  prompt: NumericPrompt;
  onCancel: () => void;
}

export function NumericInputDialog({ prompt, onCancel }: Props) {
  const modern = useIsModern();
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

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') submit();
    if (e.key === 'Escape') onCancel();
  };

  return (
    <AppDialog
      title={prompt.title}
      onClose={onCancel}
      buttons={[
        { label: 'OK', onClick: submit, primary: true },
        { label: 'Cancel', onClick: onCancel },
      ]}
    >
      {modern ? (
        <TextField
          type="number"
          label={prompt.label}
          slotProps={{ htmlInput: { step: 'any', 'aria-label': prompt.label } }}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          error={!!error}
          helperText={error ?? prompt.hint ?? undefined}
          autoFocus
          fullWidth
          size="small"
          margin="dense"
        />
      ) : (
        <>
          <div className="modal-row">
            <span>{prompt.label}</span>
            <input
              type="number"
              step="any"
              aria-label={prompt.label}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoFocus
              onKeyDown={onKeyDown}
            />
          </div>
          {error ? (
            <div className="modal-error">{error}</div>
          ) : (
            prompt.hint && <div className="modal-hint">{prompt.hint}</div>
          )}
        </>
      )}
    </AppDialog>
  );
}
