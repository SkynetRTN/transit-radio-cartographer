import { useEffect, useState } from 'react';
import { OverviewSection } from './sections/OverviewSection';
import { ScanSection } from './sections/ScanSection';
import { SurveySection } from './sections/SurveySection';
import { PreImageSection } from './sections/PreImageSection';
import { ImageSection } from './sections/ImageSection';
import { FluxCalibrationSection } from './sections/FluxCalibrationSection';

export type HelpSectionId =
  | 'overview'
  | 'scan'
  | 'survey'
  | 'pre-image'
  | 'image'
  | 'flux-cal';

interface Props {
  onClose: () => void;
  initialSection?: HelpSectionId;
}

const NAV: { id: HelpSectionId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'scan', label: 'Scan' },
  { id: 'survey', label: 'Survey' },
  { id: 'pre-image', label: 'Pre-Image' },
  { id: 'image', label: 'Image' },
  { id: 'flux-cal', label: 'Flux Calibration' },
];

export function HelpDialog({ onClose, initialSection = 'overview' }: Props) {
  const [section, setSection] = useState<HelpSectionId>(initialSection);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-label="Help and Tutorial"
      onClick={onClose}
    >
      <div
        className="modal help-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="help-modal-header">
          <div className="modal-title">Help &amp; Tutorial</div>
          <button
            type="button"
            className="help-close"
            aria-label="Close help"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="help-modal-body">
          <nav className="help-nav" aria-label="Help sections">
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
            {section === 'overview' && (
              <OverviewSection onJump={setSection} />
            )}
            {section === 'scan' && <ScanSection />}
            {section === 'survey' && <SurveySection />}
            {section === 'pre-image' && <PreImageSection />}
            {section === 'image' && <ImageSection />}
            {section === 'flux-cal' && <FluxCalibrationSection />}
          </div>
        </div>
      </div>
    </div>
  );
}
