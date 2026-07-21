import type { ReactNode } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import { useTheme } from '../../state/theme-context';

/** True when the active theme is one of the modern (MUI) themes. Retro renders
 *  through the legacy custom-CSS path. */
export function useIsModern(): boolean {
  return useTheme().theme !== 'retro';
}

/** Declarative footer button. Rendered as an MUI `Button` in the modern themes
 *  and a plain `<button>` in retro, from the same descriptor so callers don't
 *  fork. */
export interface DialogButton {
  label: string;
  onClick: () => void;
  /** Filled/primary styling (the default action). */
  primary?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  /** Hover tooltip (e.g. "Already used"). */
  title?: string;
  /** Optional custom fill — used by the RGB channel picker swatches. */
  background?: string;
  /** Text colour paired with `background`. */
  color?: string;
  minWidth?: number;
}

interface Props {
  title: string;
  /** Escape / backdrop dismissal. */
  onClose: () => void;
  /** Body content. Each dialog renders MUI or plain controls per `useIsModern`. */
  children: ReactNode;
  buttons: DialogButton[];
}

/** Shared modal shell. Modern themes render an MUI `Dialog`; retro renders the
 *  original `.modal-backdrop / .modal` markup byte-for-byte so the classic look
 *  is preserved. */
export function AppDialog({ title, onClose, children, buttons }: Props) {
  const modern = useIsModern();

  if (!modern) {
    return (
      <div className="modal-backdrop" role="dialog" aria-label={title}>
        <div className="modal">
          <div className="modal-title">{title}</div>
          {children}
          <div className="modal-buttons">
            {buttons.map((b) => (
              <button
                key={b.label}
                onClick={b.onClick}
                disabled={b.disabled}
                title={b.title}
                autoFocus={b.autoFocus}
                className={b.primary ? 'primary' : undefined}
                style={
                  b.background
                    ? { background: b.background, color: b.color, minWidth: b.minWidth }
                    : b.minWidth
                      ? { minWidth: b.minWidth }
                      : undefined
                }
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Dialog open onClose={onClose} aria-label={title} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontSize: 15, fontWeight: 600, pb: 1 }}>{title}</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>{children}</DialogContent>
      <DialogActions>
        {buttons.map((b) => (
          <Button
            key={b.label}
            onClick={b.onClick}
            disabled={b.disabled}
            title={b.title}
            autoFocus={b.autoFocus}
            variant={b.primary ? 'contained' : 'outlined'}
            sx={
              b.background
                ? {
                    minWidth: b.minWidth,
                    bgcolor: b.background,
                    color: b.color ?? '#fff',
                    '&:hover': { bgcolor: b.background, filter: 'brightness(0.92)' },
                  }
                : { minWidth: b.minWidth }
            }
          >
            {b.label}
          </Button>
        ))}
      </DialogActions>
    </Dialog>
  );
}
