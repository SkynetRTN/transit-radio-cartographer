import { ResizeDivider, useResizable } from '../lib/useResizable';

interface WorkspaceBodyProps {
  /** The `.workspace-plots` column (left). */
  plots: React.ReactNode;
  /** The `.workspace-side` column (right). */
  side: React.ReactNode;
}

/**
 * The two-column workspace layout (plots | side) shared by every workspace
 * view, with a draggable divider between the columns. The side-panel width is
 * persisted globally (one width for all screens). Until first dragged it falls
 * back to the original CSS clamp, so the default layout is unchanged.
 *
 * The plots refit themselves when the columns resize — ImagePlot/RgbImagePlot
 * observe their wrapper — so no extra glue is needed here.
 */
export function WorkspaceBody({ plots, side }: WorkspaceBodyProps) {
  const { size, startDrag } = useResizable('ogrc.workspaceSideWidth', null, {
    min: 150,
    max: 640,
    axis: 'x',
  });

  const sideTrack = size != null ? `${size}px` : 'clamp(150px, 16%, 220px)';

  const onDividerDown = (e: React.PointerEvent) => {
    // Seed the first drag from the side panel's current rendered width (the
    // divider's next sibling in DOM order) so it doesn't jump from the CSS
    // clamp default straight to `min`.
    const sideEl = (e.currentTarget as HTMLElement).nextElementSibling as HTMLElement | null;
    startDrag(e, sideEl?.getBoundingClientRect().width);
  };

  return (
    <div
      className="workspace-body"
      style={{ gridTemplateColumns: `minmax(0, 1fr) var(--ws-divider-w) ${sideTrack}`, gap: 0 }}
    >
      {plots}
      <ResizeDivider
        orientation="vertical"
        onPointerDown={onDividerDown}
        title="Drag to resize the side panel"
      />
      {side}
    </div>
  );
}
