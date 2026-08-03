/** The tutorial's navigable sections. Shared by the tutorial window shell and
 *  the sections that cross-link to one another (e.g. OverviewSection's jump
 *  buttons). Order here is not significant — display order lives in the NAV
 *  array in TutorialWindow.tsx. */
export type HelpSectionId =
  | 'overview'
  | 'scan'
  | 'survey'
  | 'pre-image'
  | 'image'
  | 'flux-cal';

/** Narrow an arbitrary string (e.g. a URL query param) to a HelpSectionId,
 *  falling back to 'overview' for anything unrecognised. */
export function toHelpSectionId(value: string | null | undefined): HelpSectionId {
  switch (value) {
    case 'scan':
    case 'survey':
    case 'pre-image':
    case 'image':
    case 'flux-cal':
      return value;
    default:
      return 'overview';
  }
}
