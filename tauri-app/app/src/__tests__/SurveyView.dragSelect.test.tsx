import { fireEvent, render, screen } from '@testing-library/react';
import { SurveyView } from '../views/SurveyView';

test('drag double click right click selection behavior', ()=>{
  render(<SurveyView/>);
  const p = screen.getByTestId('survey-plot');
  fireEvent.mouseDown(p);
  expect(p).toHaveTextContent('selected');
  fireEvent.contextMenu(p);
  expect(p).not.toHaveTextContent('selected');
  fireEvent.mouseDown(p);
  fireEvent.doubleClick(p);
  expect(p).not.toHaveTextContent('selected');
});
