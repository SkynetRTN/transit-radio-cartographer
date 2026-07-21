import { useState } from 'react';
import TextField from '@mui/material/TextField';
import { AppDialog, useIsModern } from './AppDialog';

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
  const modern = useIsModern();
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
          type="text"
          label={prompt.label}
          slotProps={{ htmlInput: { 'aria-label': prompt.label } }}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          error={!!error}
          helperText={error ?? undefined}
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
              type="text"
              aria-label={prompt.label}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoFocus
              onKeyDown={onKeyDown}
            />
          </div>
          {error && <div className="modal-error">{error}</div>}
        </>
      )}
    </AppDialog>
  );
}
