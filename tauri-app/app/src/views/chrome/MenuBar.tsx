import { forwardRef, type ReactNode } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import { useIsModern } from '../dialogs/AppDialog';

/** Outer menu-bar container. Modern themes render an MUI `AppBar`/`Toolbar`;
 *  retro renders the original `<nav className="menu-bar">`. In both cases the
 *  children are the existing `.menu-root` blocks (trigger + dropdown popup), so
 *  the dropdown behaviour and its tests are unchanged — only the bar chrome and
 *  the trigger buttons are modernised. The forwarded ref (used for the
 *  click-outside handler) lands on the outer element. */
export const MenuBarShell = forwardRef<HTMLElement, { children: ReactNode }>(
  function MenuBarShell({ children }, ref) {
    const modern = useIsModern();
    if (!modern) {
      return (
        <nav aria-label="main menu" className="menu-bar" ref={ref}>
          {children}
        </nav>
      );
    }
    return (
      <AppBar
        ref={ref as React.Ref<HTMLDivElement>}
        component="nav"
        aria-label="main menu"
        position="static"
        color="default"
        elevation={1}
        enableColorOnDark
      >
        <Toolbar
          variant="dense"
          disableGutters
          sx={{ minHeight: 38, px: 1, gap: 0.25 }}
        >
          {children}
        </Toolbar>
      </AppBar>
    );
  },
);

/** A top-level menu trigger (Help / Image / Survey / …). Modern → MUI `Button`;
 *  retro → the plain `<button>` the legacy `.menu-bar` styles. Keeps the same
 *  text, `aria-haspopup`/`aria-expanded`, and click handler so queries and the
 *  open/close model are unchanged. */
export function MenuTrigger({
  label,
  open,
  onClick,
}: {
  label: string;
  open: boolean;
  onClick: () => void;
}) {
  const modern = useIsModern();
  if (!modern) {
    return (
      <button onClick={onClick} aria-haspopup="menu" aria-expanded={open}>
        {label}
      </button>
    );
  }
  return (
    <Button
      color="inherit"
      size="small"
      onClick={onClick}
      aria-haspopup="menu"
      aria-expanded={open}
      disableElevation
      sx={{
        textTransform: 'none',
        minWidth: 0,
        px: 1.25,
        py: 0.5,
        fontSize: 13,
        lineHeight: 1.4,
        borderRadius: 1,
        color: 'text.primary',
        bgcolor: open ? 'action.selected' : 'transparent',
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      {label}
    </Button>
  );
}
