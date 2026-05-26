import './App.css';
import { MainWindow } from './views/MainWindow';
import { ErrorBoundary } from './views/ErrorBoundary';
import { SurveyProvider, useSurvey } from './state/survey-context';
import { ScanProvider, useScan } from './state/scan-context';
import { FluxCalibrationProvider } from './state/flux-cal-context';

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
  );
}
