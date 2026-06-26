import { fireEvent, render, screen } from '@testing-library/react';
import { MainWindow } from '../views/MainWindow';
import { SurveyProvider } from '../state/survey-context';
import { ThemeProvider, THEME_STORAGE_KEY } from '../state/theme-context';

vi.mock('@tauri-apps/plugin-dialog', () => ({ open: vi.fn(), save: vi.fn() }));
vi.mock('../lib/plots/SweepPlot', () => ({ SweepPlot: () => null }));
vi.mock('../lib/plots/ImagePlot', () => ({ ImagePlot: () => null }));
vi.mock('../lib/plots/RgbImagePlot', () => ({ RgbImagePlot: () => null }));
vi.mock('../lib/plots/PointScatter', () => ({ PointScatter: () => null }));
vi.mock('../ipc/client', () => ({
  rpcClient: {
    closeHandle: vi.fn().mockResolvedValue({ closed: 1 }),
    getWorkspaceOverview: vi.fn(),
    getScanOverview: vi.fn(),
  },
}));

import { ScanProvider } from '../state/scan-context';
import { FluxCalibrationProvider } from '../state/flux-cal-context';

function renderApp() {
  return render(
    <ThemeProvider>
      <SurveyProvider>
        <ScanProvider>
          <FluxCalibrationProvider>
            <MainWindow />
          </FluxCalibrationProvider>
        </ScanProvider>
      </SurveyProvider>
    </ThemeProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
});

/** Open Help, then click the "Theme ▸" parent to reveal the side submenu. */
function openThemeMenu() {
  fireEvent.click(screen.getByText('Help'));
  fireEvent.click(screen.getByRole('menuitem', { name: /Theme/ }));
}

test('defaults to Modern Light and marks it active', () => {
  renderApp();
  expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  openThemeMenu();
  expect(
    screen.getByRole('menuitem', { name: /Modern Light/ }).textContent,
  ).toMatch(/✓/);
  expect(
    screen.getByRole('menuitem', { name: /Modern Dark/ }).textContent,
  ).not.toMatch(/✓/);
  expect(screen.getByRole('menuitem', { name: /Retro/ }).textContent).not.toMatch(/✓/);
});

test('selecting a theme flips data-theme, persists it, and moves the check', () => {
  renderApp();

  // Switch to Dark.
  openThemeMenu();
  fireEvent.click(screen.getByRole('menuitem', { name: /Modern Dark/ }));
  expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  openThemeMenu();
  expect(
    screen.getByRole('menuitem', { name: /Modern Dark/ }).textContent,
  ).toMatch(/✓/);

  // Switch to Retro.
  fireEvent.click(screen.getByRole('menuitem', { name: /Retro/ }));
  expect(document.documentElement.getAttribute('data-theme')).toBe('retro');
  expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('retro');
  openThemeMenu();
  expect(screen.getByRole('menuitem', { name: /Retro/ }).textContent).toMatch(/✓/);
});

test('restores a persisted theme on mount', () => {
  localStorage.setItem(THEME_STORAGE_KEY, 'dark');
  renderApp();
  expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
});
