import { fireEvent, render, screen } from '@testing-library/react';
import { PaletteEditor } from '../views/PaletteEditor';
import { rpcClient } from '../ipc/client';
vi.mock('../ipc/client',()=>({rpcClient:{loadPalette:vi.fn(), savePalette:vi.fn()}}));

test('control point limit and rpc use', ()=>{
  render(<PaletteEditor/>);
  const add = screen.getByText('Add Control Point');
  for(let i=0;i<100;i++) fireEvent.click(add);
  expect(screen.getByText('100')).toBeInTheDocument();
  fireEvent.click(add);
  expect(screen.getByText(/Maximum 100/)).toBeInTheDocument();
  fireEvent.click(screen.getByText('Load Palette'));
  fireEvent.click(screen.getByText('Save Palette'));
  expect(rpcClient.loadPalette).toHaveBeenCalled();
  expect(rpcClient.savePalette).toHaveBeenCalled();
});
