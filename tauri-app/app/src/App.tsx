import './App.css';
import { MainWindow } from './views/MainWindow';
import { SurveyProvider } from './state/survey-context';

export default function App() {
  return (
    <SurveyProvider>
      <MainWindow />
    </SurveyProvider>
  );
}
