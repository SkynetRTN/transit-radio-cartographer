import './App.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from './state/theme-context';
import { TutorialWindow } from './views/help/TutorialWindow';

// Entry point for the standalone tutorial window (tutorial.html). Deliberately
// minimal: it mounts ONLY the tutorial content, wrapped in ThemeProvider so it
// tracks `data-theme`. It does NOT mount the Survey/Scan/FluxCal providers or
// touch the Python engine — the tutorial is pure, read-only content.
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <TutorialWindow />
    </ThemeProvider>
  </React.StrictMode>,
);
