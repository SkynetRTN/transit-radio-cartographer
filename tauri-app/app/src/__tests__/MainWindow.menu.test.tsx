import { render, screen } from '@testing-library/react';
import { MainWindow } from '../views/MainWindow';

test('menu order and no fits', ()=>{
  render(<MainWindow/>);
  expect(screen.getByRole('navigation', {name:/main menu/i})).toBeInTheDocument();
  ['File','Image','Survey','Scan','Calibration'].forEach(t=>expect(screen.getByText(t)).toBeInTheDocument());
  expect(screen.getByText('Save Image As BMP…')).toBeDisabled();
  expect(screen.queryByText(/FITS/i)).not.toBeInTheDocument();
});
