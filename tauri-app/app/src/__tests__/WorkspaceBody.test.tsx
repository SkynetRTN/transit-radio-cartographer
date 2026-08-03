import { fireEvent, render, screen } from '@testing-library/react';
import { WorkspaceBody } from '../views/WorkspaceBody';

beforeEach(() => {
  window.localStorage.clear();
});

function renderBody() {
  return render(
    <WorkspaceBody
      plots={<div className="workspace-plots">plots</div>}
      side={<div className="workspace-side">side</div>}
    />,
  );
}

test('defaults to the CSS clamp width and renders a vertical divider', () => {
  const { container } = renderBody();
  const body = container.querySelector('.workspace-body') as HTMLElement;
  // Undragged: third track is the original clamp, so the default layout is
  // unchanged.
  expect(body.style.gridTemplateColumns).toContain('clamp(150px, 16%, 220px)');
  const divider = screen.getByRole('separator');
  expect(divider).toHaveAttribute('aria-orientation', 'vertical');
});

test('dragging the divider resizes the side column and persists the width', () => {
  const { container } = renderBody();
  const body = container.querySelector('.workspace-body') as HTMLElement;
  const divider = screen.getByRole('separator');

  // Drag left by 100px. getBoundingClientRect is 0 in jsdom, so the drag seeds
  // from the 150px floor; +100 → 250px. jsdom's PointerEvent drops clientX from
  // the init dict, so dispatch MouseEvents under the pointer-event names.
  fireEvent(divider, new MouseEvent('pointerdown', { clientX: 500, bubbles: true }));
  fireEvent(window, new MouseEvent('pointermove', { clientX: 400, bubbles: true }));
  fireEvent(window, new MouseEvent('pointerup', { clientX: 400, bubbles: true }));

  expect(body.style.gridTemplateColumns).toContain('250px');
  expect(window.localStorage.getItem('ogrc.workspaceSideWidth')).toBe('250');
});

test('restores a persisted width on mount', () => {
  window.localStorage.setItem('ogrc.workspaceSideWidth', '320');
  const { container } = renderBody();
  const body = container.querySelector('.workspace-body') as HTMLElement;
  expect(body.style.gridTemplateColumns).toContain('320px');
});
