import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import { useIsModern } from '../dialogs/AppDialog';

/** The bottom-of-window status strip. Modern themes render a slim MUI `Box`
 *  themed from the palette; retro keeps the original `.status-bar`. Preserves
 *  `role="status"` so assistive tech and tests still find it. */
export function StatusBar({ children }: { children: ReactNode }) {
  const modern = useIsModern();
  if (!modern) {
    return (
      <div className="status-bar" role="status">
        {children}
      </div>
    );
  }
  return (
    <Box
      role="status"
      sx={{
        px: 1.5,
        py: 0.75,
        fontSize: 11,
        color: 'text.secondary',
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      {children}
    </Box>
  );
}
