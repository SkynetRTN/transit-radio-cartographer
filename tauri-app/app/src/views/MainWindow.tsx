import { useCallback, useEffect, useRef, useState } from 'react';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { SurveyView } from './SurveyView';
import { CalibrateSurveyView } from './CalibrateSurveyView';
import { CalibrationView } from './CalibrationView';
import { PaletteEditor } from './PaletteEditor';
import { AboutBox } from './AboutBox';
import { PreImageView } from './PreImageView';
import { useSurvey } from '../state/survey-context';

type AuxView = 'cal' | 'pal' | 'about' | null;
type MenuKey = 'file' | 'image' | 'survey' | 'scan' | 'calibration' | null;

export function MainWindow() {
  const [auxView, setAuxView] = useState<AuxView>(null);
  const [openMenu, setOpenMenu] = useState<MenuKey>(null);
  const menuRef = useRef<HTMLElement | null>(null);
  const { survey, workspace, viewMode, loading, error, open, close } = useSurvey();
  const hasSurvey = survey !== null;
  const hasImage = viewMode === 'pre-image';
  const hasScan = false;

  useEffect(() => {
    if (!openMenu) return;
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    window.addEventListener('mousedown', onClickOutside);
    return () => window.removeEventListener('mousedown', onClickOutside);
  }, [openMenu]);

  const pickAndOpenSurvey = useCallback(async () => {
    setOpenMenu(null);
    let path: string | null = null;
    try {
      const selected = await openDialog({
        multiple: false,
        directory: false,
        title: 'New Survey',
        filters: [
          { name: 'Survey (.md2)', extensions: ['md2'] },
          { name: 'All files', extensions: ['*'] },
        ],
      });
      path = typeof selected === 'string' ? selected : null;
    } catch (err) {
      console.error('file dialog failed', err);
      return;
    }
    if (!path) return;
    setAuxView(null);
    await open(path);
  }, [open]);

  const toggleMenu = (key: MenuKey) =>
    setOpenMenu((current) => (current === key ? null : key));

  const closeAndReturnToMain = () => {
    setOpenMenu(null);
    setAuxView(null);
    void close();
  };

  return (
    <div className="main-window">
      <nav aria-label="main menu" className="menu-bar" ref={menuRef}>
        <div className="menu-root">
          <button
            onClick={() => toggleMenu('file')}
            aria-haspopup="menu"
            aria-expanded={openMenu === 'file'}
          >
            File
          </button>
          {openMenu === 'file' && (
            <div role="menu" className="menu-popup">
              <button
                role="menuitem"
                onClick={() => {
                  setOpenMenu(null);
                  setAuxView('about');
                }}
              >
                About "Karaleah"…
              </button>
              <div className="menu-sep" />
              <button
                role="menuitem"
                onClick={closeAndReturnToMain}
                title="Close the survey and return to the empty workspace"
              >
                Exit
              </button>
            </div>
          )}
        </div>

        <div className="menu-root">
          <button onClick={() => toggleMenu('image')}>Image</button>
          {openMenu === 'image' && (
            <div role="menu" className="menu-popup">
              <button role="menuitem" disabled>
                Open Image…
              </button>
              <button role="menuitem" disabled={!hasImage}>
                Save Image
              </button>
              <button role="menuitem" disabled={!hasImage}>
                Save Image As…
              </button>
              <div className="menu-sep" />
              <button role="menuitem" disabled={!hasImage}>
                Save Bitmap As…
              </button>
              <div className="menu-sep" />
              <button role="menuitem" disabled={!hasImage}>
                Print Image
              </button>
              <div className="menu-sep" />
              <button role="menuitem" disabled={!hasImage}>
                Append Image…
              </button>
              <button role="menuitem" disabled={!hasImage}>
                Superimpose Image…
              </button>
              <div className="menu-sep" />
              <button role="menuitem" disabled={!hasImage}>
                Make Bi-Color Image…
              </button>
              <button role="menuitem" disabled={!hasImage}>
                Make Tri-Color Image…
              </button>
              <div className="menu-sep" />
              <button
                role="menuitem"
                disabled={!hasImage}
                onClick={() => {
                  setOpenMenu(null);
                  setAuxView('pal');
                }}
              >
                Show Palette…
              </button>
              <div className="menu-sep" />
              <button role="menuitem" disabled={!hasImage}>
                Change Magnifier Size…
              </button>
              <button role="menuitem" disabled={!hasImage}>
                Change Image Name…
              </button>
            </div>
          )}
        </div>

        <div className="menu-root">
          <button onClick={() => toggleMenu('survey')}>Survey</button>
          {openMenu === 'survey' && (
            <div role="menu" className="menu-popup">
              <button role="menuitem" onClick={pickAndOpenSurvey}>
                New Survey…
              </button>
              <button role="menuitem" disabled>
                Open Survey…
              </button>
              <button role="menuitem" disabled={!hasSurvey}>
                Save Survey
              </button>
              <button role="menuitem" disabled={!hasSurvey}>
                Save Survey As…
              </button>
              <div className="menu-sep" />
              <button role="menuitem" disabled={!hasSurvey}>
                Goto Sweep…
              </button>
              <div className="menu-sep" />
              <button role="menuitem" disabled={!hasSurvey}>
                Change Survey Name…
              </button>
            </div>
          )}
        </div>

        <div className="menu-root">
          <button onClick={() => toggleMenu('scan')}>Scan</button>
          {openMenu === 'scan' && (
            <div role="menu" className="menu-popup">
              <button role="menuitem" disabled>
                New Scan…
              </button>
              <button role="menuitem" disabled>
                Open Scan…
              </button>
              <button role="menuitem" disabled={!hasScan}>
                Save Scan
              </button>
              <button role="menuitem" disabled={!hasScan}>
                Save Scan As…
              </button>
              <div className="menu-sep" />
              <button role="menuitem" disabled={!hasScan}>
                Print Scan
              </button>
              <div className="menu-sep" />
              <button role="menuitem" disabled={!hasScan}>
                Append Scan…
              </button>
              <div className="menu-sep" />
              <button role="menuitem" disabled={!hasScan}>
                Change Scan Name…
              </button>
            </div>
          )}
        </div>

        <div className="menu-root">
          <button onClick={() => toggleMenu('calibration')}>Calibration</button>
          {openMenu === 'calibration' && (
            <div role="menu" className="menu-popup">
              <button role="menuitem" disabled>
                Select Calibration…
              </button>
              <div className="menu-sep" />
              <button role="menuitem" disabled>
                New Calibration…
              </button>
              <button role="menuitem" disabled>
                Open Calibration…
              </button>
              <button role="menuitem" disabled>
                Save Calibration
              </button>
              <button role="menuitem" disabled>
                Save Calibration As…
              </button>
              <div className="menu-sep" />
              <button role="menuitem" disabled>
                Print Calibration
              </button>
              <div className="menu-sep" />
              <button role="menuitem" disabled>
                Change Calibration Name…
              </button>
            </div>
          )}
        </div>
      </nav>

      {(loading || error || (survey && workspace)) && (
        <div className="status-bar" role="status">
          {loading && <span>Loading survey…</span>}
          {error && !loading && <span className="error">Error: {error}</span>}
          {!loading && !error && survey && workspace && (
            <span>
              {workspace.name} loaded · {workspace.source_count} source sweeps ·{' '}
              {workspace.calibrated ? 'gain calibrated (GCU)' : 'raw (volts)'}
              {viewMode === 'calibrate-survey' && ' · Calibrate Survey'}
              {viewMode === 'pre-image' && ' · Pre Image'}
            </span>
          )}
        </div>
      )}

      <div className="view-area">
        {auxView === 'about' ? (
          <AboutBox />
        ) : auxView === 'pal' ? (
          <PaletteEditor />
        ) : auxView === 'cal' ? (
          <CalibrationView />
        ) : !survey ? (
          <div className="opening-hint">
            <p>
              Open a survey file via <strong>Survey → New Survey…</strong> to begin.
            </p>
          </div>
        ) : viewMode === 'calibrate-survey' ? (
          <CalibrateSurveyView />
        ) : viewMode === 'pre-image' ? (
          <PreImageView />
        ) : (
          <SurveyView />
        )}
        {auxView !== null && (
          <div className="aux-close">
            <button onClick={() => setAuxView(null)}>Back to workspace</button>
          </div>
        )}
      </div>

      <footer style={{ display: 'none' }}>
        {String(hasSurvey)}
        {String(hasScan)}
      </footer>
    </div>
  );
}
