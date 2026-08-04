import { useEffect, useState } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { listen } from '@tauri-apps/api/event';
import { OverviewSection } from './sections/OverviewSection';
import { ScanSection } from './sections/ScanSection';
import { SurveySection } from './sections/SurveySection';
import { PreImageSection } from './sections/PreImageSection';
import { ImageSection } from './sections/ImageSection';
import { FluxCalibrationSection } from './sections/FluxCalibrationSection';
import { type HelpSectionId, toHelpSectionId } from './types';

const NAV: { id: HelpSectionId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'scan', label: 'Scan' },
  { id: 'survey', label: 'Survey' },
  { id: 'pre-image', label: 'Pre-Image' },
  { id: 'image', label: 'Image' },
  { id: 'flux-cal', label: 'Flux Calibration' },
];

/** Event name the main window emits to steer an already-open tutorial window to
 *  the section matching the user's current work. Payload is a HelpSectionId. */
const NAVIGATE_EVENT = 'tutorial:navigate';

/** Full-window tutorial shell. Unlike the old in-app modal, this mounts as its
 *  own native window (see tutorial-main.tsx) so it can be dragged to a second
 *  monitor or snapped beside the main window. The side-button section switching
 *  is preserved. Initial section comes from the `?section=` URL param the main
 *  window sets when it spawns us; re-clicking Tutorial re-focuses this window
 *  and emits NAVIGATE_EVENT to jump sections without a reload. */
export function TutorialWindow() {
  const [section, setSection] = useState<HelpSectionId>(() =>
    toHelpSectionId(new URLSearchParams(window.location.search).get('section')),
  );

  // Jump to the section the main window asks for when it re-focuses us.
  useEffect(() => {
    const unlisten = listen<HelpSectionId>(NAVIGATE_EVENT, (e) => {
      setSection(toHelpSectionId(e.payload));
    });
    return () => {
      void unlisten.then((f) => f());
    };
  }, []);

  // Escape closes the whole window (native close), matching the old modal's Esc.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') void getCurrentWindow().close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="tutorial-window">
      <nav className="tutorial-nav" aria-label="Help sections">
        {NAV.map((item) => (
          <button
            key={item.id}
            type="button"
            className={section === item.id ? 'active' : undefined}
            onClick={() => setSection(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div className="help-content">
        {section === 'overview' && <OverviewSection onJump={setSection} />}
        {section === 'scan' && <ScanSection />}
        {section === 'survey' && <SurveySection />}
        {section === 'pre-image' && <PreImageSection />}
        {section === 'image' && <ImageSection />}
        {section === 'flux-cal' && <FluxCalibrationSection />}
      </div>
    </div>
  );
}
