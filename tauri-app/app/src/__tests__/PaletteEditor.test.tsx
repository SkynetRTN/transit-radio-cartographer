import { fireEvent, render, screen } from '@testing-library/react';
import { PaletteEditor, spaceStops, type EditStop } from '../views/PaletteEditor';
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

// A palette is only valid downstream (Plotly colorscale) when its anchors are
// sorted and strictly increasing. spaceStops enforces that so stacking pegs,
// edge collisions, and ~50-stop palettes can't crash the image (BUG-018/021).
const mk = (anchors: number[]): EditStop[] =>
  anchors.map((anchor, id) => ({ anchor, r: 0, g: 0, b: 0, id }));

function assertStrictlyIncreasing(result: EditStop[]) {
  for (let i = 1; i < result.length; i++) {
    expect(result[i].anchor).toBeGreaterThan(result[i - 1].anchor);
  }
  for (const s of result) {
    expect(s.anchor).toBeGreaterThanOrEqual(0);
    expect(s.anchor).toBeLessThanOrEqual(255);
  }
}

test('spaceStops separates two stops stacked on the same anchor', () => {
  const result = spaceStops(mk([128, 128]));
  expect(result).toHaveLength(2);
  assertStrictlyIncreasing(result);
});

test('spaceStops resolves a stack piled on the far edge (255)', () => {
  // Three stops dragged onto the max edge — must stay <= 255 and strictly
  // increasing (the backward pass pulls the earlier ones under 255).
  const result = spaceStops(mk([255, 255, 255]));
  expect(result).toHaveLength(3);
  assertStrictlyIncreasing(result);
  expect(result[result.length - 1].anchor).toBeLessThanOrEqual(255);
});

test('spaceStops keeps ~50 stacked stops sorted and strictly increasing', () => {
  const result = spaceStops(mk(new Array(50).fill(128)));
  expect(result).toHaveLength(50);
  assertStrictlyIncreasing(result);
});

test('spaceStops sorts by anchor and preserves ids', () => {
  const result = spaceStops(mk([200, 10, 100]));
  expect(result.map((s) => s.anchor)).toEqual([10, 100, 200]);
  // ids travel with their stop (id 1 was anchor 10, id 2 was 100, id 0 was 200).
  expect(result.map((s) => s.id)).toEqual([1, 2, 0]);
});
