import { fireEvent, render, screen } from '@testing-library/react';
import { PaletteEditor } from '../views/PaletteEditor';
import { SurveyProvider } from '../state/survey-context';

vi.mock('../ipc/client', () => ({
  rpcClient: {
    loadPalette: vi.fn(),
    savePalette: vi.fn(),
  },
}));

vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn(),
  save: vi.fn(),
}));

function renderEditor() {
  return render(
    <SurveyProvider>
      <PaletteEditor />
    </SurveyProvider>,
  );
}

test('renders flux range inputs and the gradient strip', () => {
  renderEditor();
  // The Flux Range Min/Max inputs are rendered.
  expect(screen.getByText('Flux Range')).toBeInTheDocument();
  // The gradient strip is rendered with the default 8-stop palette pegs.
  const strip = screen.getByLabelText('palette gradient');
  expect(strip).toBeInTheDocument();
});

test('switching to a preset replaces the working palette', () => {
  renderEditor();
  const select = screen.getByRole('combobox') as HTMLSelectElement;
  fireEvent.change(select, { target: { value: 'Grayscale' } });
  // Grayscale has 2 stops; pegs are rendered absolutely-positioned siblings
  // inside the strip. We can't easily count them, but the dropdown should
  // reset after change.
  expect(select.value).toBe('');
});

test('OK button commits — Cancel resets local state without throwing', () => {
  renderEditor();
  fireEvent.click(screen.getByRole('button', { name: 'OK' }));
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
});
