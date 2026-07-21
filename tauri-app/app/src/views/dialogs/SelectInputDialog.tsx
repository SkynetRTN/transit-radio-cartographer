import { useState } from 'react';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { AppDialog, useIsModern } from './AppDialog';

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
  const modern = useIsModern();
  const [value, setValue] = useState<string>(prompt.defaultValue);

  const submit = () => {
    prompt.onSubmit(value);
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
        <FormControl fullWidth size="small" margin="dense">
          <InputLabel id="select-input-dialog-label">{prompt.label}</InputLabel>
          <Select
            labelId="select-input-dialog-label"
            label={prompt.label}
            aria-label={prompt.label}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
          >
            {prompt.options.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ) : (
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
      )}
    </AppDialog>
  );
}
