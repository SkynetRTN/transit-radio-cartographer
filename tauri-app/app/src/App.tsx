import './App.css';
import { MainWindow } from './views/MainWindow';
import { SurveyProvider } from './state/survey-context';
import { ScanProvider } from './state/scan-context';
import { FluxCalibrationProvider } from './state/flux-cal-context';

export default function App() {
  return (
    <SurveyProvider>
      <ScanProvider>
        <FluxCalibrationProvider>
          <MainWindow />
        </FluxCalibrationProvider>
      </ScanProvider>
    </SurveyProvider>
  );
}
