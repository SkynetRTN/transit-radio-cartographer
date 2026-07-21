import './App.css';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { MainWindow } from './views/MainWindow';
import { ErrorBoundary } from './views/ErrorBoundary';
import { SurveyProvider, useSurvey } from './state/survey-context';
import { ScanProvider, useScan } from './state/scan-context';
import { FluxCalibrationProvider } from './state/flux-cal-context';
import { ThemeProvider, useTheme } from './state/theme-context';
import { muiThemeFor } from './theme/mui-theme';

/** Bridges the app's theme (light/dark/retro) into MUI's ThemeProvider so every
 *  MUI component picks up the matching palette. Nested inside `ThemeProvider`
 *  (below) so `data-theme` and the MUI theme always come from one source.
 *  We deliberately omit `<CssBaseline>` — the app's base/layout styling lives in
 *  App.css and the retro reset would fight MUI's global reset. */
function MuiThemeBridge({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  return <MuiThemeProvider theme={muiThemeFor(theme)}>{children}</MuiThemeProvider>;
}

function ErrorFallback({ error, reset }: { error: Error | null; reset: () => void }) {
  // Reset hook fires inside the providers so it can wipe every workspace.
  // This is the "always returns to home" safety net — if something downstream
  // (e.g. opening a malformed image) throws during render, the boundary
  // catches it and gives the user a way back to the empty workspace without
  // having to restart the app.
  const { close: closeSurvey } = useSurvey();
  const { close: closeScan } = useScan();
  const handleReturnHome = () => {
    void closeSurvey();
    void closeScan();
    reset();
  };
  return (
    <div className="error-fallback">
      <h2>Something went wrong</h2>
      <p>{error?.message ?? 'The app encountered an unexpected error.'}</p>
      <button onClick={handleReturnHome} className="primary">
        Return to home
      </button>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MuiThemeBridge>
        <SurveyProvider>
          <ScanProvider>
            <FluxCalibrationProvider>
              <ErrorBoundary
                fallback={({ error, reset }) => <ErrorFallback error={error} reset={reset} />}
              >
                <MainWindow />
              </ErrorBoundary>
            </FluxCalibrationProvider>
          </ScanProvider>
        </SurveyProvider>
      </MuiThemeBridge>
    </ThemeProvider>
  );
}
