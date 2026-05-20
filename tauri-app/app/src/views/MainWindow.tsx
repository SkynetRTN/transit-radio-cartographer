import { useCallback, useEffect, useRef, useState } from 'react';
import { open as openDialog, save as saveDialog } from '@tauri-apps/plugin-dialog';
import { SurveyView } from './SurveyView';
import { ScanView } from './ScanView';
import { CalibrateScanView } from './CalibrateScanView';
import { CalibrateSurveyView } from './CalibrateSurveyView';
import { FluxCalibrationView } from './CalibrationView';
import { PaletteEditor } from './PaletteEditor';
import { AboutBox } from './AboutBox';
import { PreImageView } from './PreImageView';
import { ImageView } from './ImageView';
import { useSurvey } from '../state/survey-context';
import { useScan } from '../state/scan-context';
import { useFluxCal } from '../state/flux-cal-context';

type AuxView = 'flux-cal' | 'pal' | 'about' | null;
type MenuKey = 'file' | 'image' | 'survey' | 'scan' | 'calibration' | null;

export function MainWindow() {
  const [auxView, setAuxView] = useState<AuxView>(null);
  const [openMenu, setOpenMenu] = useState<MenuKey>(null);
  const menuRef = useRef<HTMLElement | null>(null);
  const {
    survey,
    workspace,
    viewMode,
    image,
    loading,
    error,
    open,
    close,
    savePath: surveySavePath,
    dirty: surveyDirty,
    save: saveSurvey,
  } = useSurvey();
  const {
    scan,
    overview: scanOverview,
    viewMode: scanViewMode,
    loading: scanLoading,
    error: scanError,
    open: openScan,
    close: closeScan,
    savePath: scanSavePath,
    dirty: scanDirty,
    save: saveScan,
  } = useScan();
  const fluxCal = useFluxCal();
  const hasSurvey = survey !== null;
  // Image-menu items act on a built image, so they enable as soon as one
  // exists — whether we're currently on the Image screen or back on Pre Image.
  const hasImage = image !== null;
  const hasScan = scan !== null;
  const hasScanSavePath = scanSavePath !== null;
  const hasSurveySavePath = surveySavePath !== null;

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

  const pickSavePath = useCallback(
    async (kind: 'scan' | 'survey', defaultPath: string | null) => {
      try {
        const filter =
          kind === 'scan'
            ? { name: 'Scan (.scn)', extensions: ['scn'] }
            : { name: 'Survey (.srv)', extensions: ['srv'] };
        const selected = await saveDialog({
          title: kind === 'scan' ? 'Save Scan As' : 'Save Survey As',
          defaultPath: defaultPath ?? undefined,
          filters: [filter],
        });
        return typeof selected === 'string' ? selected : null;
      } catch (err) {
        console.error('save dialog failed', err);
        return null;
      }
    },
    [],
  );

  const handleSaveScan = useCallback(async () => {
    setOpenMenu(null);
    if (!hasScan) return;
    if (scanSavePath) {
      await saveScan();
      return;
    }
    const path = await pickSavePath('scan', scanOverview?.path ?? null);
    if (!path) return;
    await saveScan(path);
  }, [hasScan, scanSavePath, scanOverview?.path, pickSavePath, saveScan]);

  const handleSaveScanAs = useCallback(async () => {
    setOpenMenu(null);
    if (!hasScan) return;
    const path = await pickSavePath('scan', scanSavePath ?? scanOverview?.path ?? null);
    if (!path) return;
    await saveScan(path);
  }, [hasScan, scanSavePath, scanOverview?.path, pickSavePath, saveScan]);

  const handleSaveSurvey = useCallback(async () => {
    setOpenMenu(null);
    if (!hasSurvey) return;
    if (surveySavePath) {
      await saveSurvey();
      return;
    }
    const path = await pickSavePath('survey', workspace?.path ?? null);
    if (!path) return;
    await saveSurvey(path);
  }, [hasSurvey, surveySavePath, workspace?.path, pickSavePath, saveSurvey]);

  const handleSaveSurveyAs = useCallback(async () => {
    setOpenMenu(null);
    if (!hasSurvey) return;
    const path = await pickSavePath('survey', surveySavePath ?? workspace?.path ?? null);
    if (!path) return;
    await saveSurvey(path);
  }, [hasSurvey, surveySavePath, workspace?.path, pickSavePath, saveSurvey]);

  const pickAndOpenScan = useCallback(async () => {
    setOpenMenu(null);
    let path: string | null = null;
    try {
      const selected = await openDialog({
        multiple: false,
        directory: false,
        title: 'New Scan',
        filters: [
          { name: 'Scan (.md1)', extensions: ['md1'] },
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
    await openScan(path);
  }, [openScan]);

  const pickAndLoadCal = useCallback(async () => {
    setOpenMenu(null);
    let path: string | null = null;
    try {
      const selected = await openDialog({
        multiple: false,
        directory: false,
        title: 'Select Calibration',
        filters: [
          { name: 'Calibration (.cal)', extensions: ['cal'] },
          { name: 'All files', extensions: ['*'] },
        ],
      });
      path = typeof selected === 'string' ? selected : null;
    } catch (err) {
      console.error('file dialog failed', err);
      return;
    }
    if (!path) return;
    await fluxCal.loadFromFile(path);
  }, [fluxCal]);

  const handleSaveCal = useCallback(async () => {
    setOpenMenu(null);
    if (!fluxCal.table) return;
    if (fluxCal.filePath) {
      await fluxCal.save();
      return;
    }
    let target: string | null = null;
    try {
      const selected = await saveDialog({
        title: 'Save Calibration',
        defaultPath: undefined,
        filters: [{ name: 'Calibration (.cal)', extensions: ['cal'] }],
      });
      target = typeof selected === 'string' ? selected : null;
    } catch (err) {
      console.error('save dialog failed', err);
      return;
    }
    if (!target) return;
    await fluxCal.saveAs(target);
  }, [fluxCal]);

  const handleSaveCalAs = useCallback(async () => {
    setOpenMenu(null);
    if (!fluxCal.table) return;
    let target: string | null = null;
    try {
      const selected = await saveDialog({
        title: 'Save Calibration As',
        defaultPath: fluxCal.filePath ?? undefined,
        filters: [{ name: 'Calibration (.cal)', extensions: ['cal'] }],
      });
      target = typeof selected === 'string' ? selected : null;
    } catch (err) {
      console.error('save dialog failed', err);
      return;
    }
    if (!target) return;
    await fluxCal.saveAs(target);
  }, [fluxCal]);

  const handleNewCalibration = useCallback(() => {
    setOpenMenu(null);
    fluxCal.newCalibration();
    setAuxView('flux-cal');
  }, [fluxCal]);

  const handleChangeCalibrationName = useCallback(() => {
    setOpenMenu(null);
    if (!fluxCal.table) return;
    const next = window.prompt('Calibration name:', fluxCal.table.caption);
    if (next !== null) fluxCal.setCaption(next);
  }, [fluxCal]);

  const toggleMenu = (key: MenuKey) =>
    setOpenMenu((current) => (current === key ? null : key));

  const closeAndReturnToMain = () => {
    setOpenMenu(null);
    setAuxView(null);
    void close();
    void closeScan();
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
                About OG Radio Cartographer
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
              <button
                role="menuitem"
                disabled={!hasSurvey || !hasSurveySavePath}
                onClick={() => void handleSaveSurvey()}
              >
                Save Survey
              </button>
              <button
                role="menuitem"
                disabled={!hasSurvey}
                onClick={() => void handleSaveSurveyAs()}
              >
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
              <button role="menuitem" onClick={pickAndOpenScan}>
                New Scan…
              </button>
              <button role="menuitem" disabled>
                Open Scan…
              </button>
              <button
                role="menuitem"
                disabled={!hasScan || !hasScanSavePath}
                onClick={() => void handleSaveScan()}
              >
                Save Scan
              </button>
              <button
                role="menuitem"
                disabled={!hasScan}
                onClick={() => void handleSaveScanAs()}
              >
                Save Scan As…
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
          <button onClick={() => toggleMenu('calibration')}>Flux Calibration</button>
          {openMenu === 'calibration' && (
            <div role="menu" className="menu-popup">
              <button role="menuitem" onClick={() => void pickAndLoadCal()}>
                Select Calibration…
              </button>
              <div className="menu-sep" />
              <button role="menuitem" onClick={handleNewCalibration}>
                New Calibration…
              </button>
              <button
                role="menuitem"
                onClick={() => {
                  setOpenMenu(null);
                  if (fluxCal.table) setAuxView('flux-cal');
                  else void pickAndLoadCal();
                }}
              >
                Open Calibration…
              </button>
              <button
                role="menuitem"
                disabled={!fluxCal.table || !fluxCal.filePath || !fluxCal.dirty}
                onClick={() => void handleSaveCal()}
              >
                Save Calibration
              </button>
              <button
                role="menuitem"
                disabled={!fluxCal.table}
                onClick={() => void handleSaveCalAs()}
              >
                Save Calibration As…
              </button>
              <div className="menu-sep" />
              <button
                role="menuitem"
                disabled={!fluxCal.table}
                onClick={handleChangeCalibrationName}
              >
                Change Calibration Name…
              </button>
            </div>
          )}
        </div>
      </nav>

      {(loading || error || scanLoading || scanError || (survey && workspace) || (scan && scanOverview)) && (
        <div className="status-bar" role="status">
          {(loading || scanLoading) && <span>Loading…</span>}
          {error && !loading && <span className="error">Error: {error}</span>}
          {scanError && !scanLoading && <span className="error">Error: {scanError}</span>}
          {!loading && !error && survey && workspace && (
            <span>
              {workspace.name}
              {surveyDirty ? '*' : ''} loaded · {workspace.source_count} source sweeps ·{' '}
              {workspace.flux_calibrated
                ? 'flux calibrated (Jy)'
                : workspace.calibrated
                  ? 'gain calibrated (GCU)'
                  : 'raw (volts)'}
              {viewMode === 'calibrate-survey' && ' · Calibrate Survey'}
              {viewMode === 'pre-image' && ' · Pre Image'}
              {viewMode === 'image' && ' · Image'}
            </span>
          )}
          {!scanLoading && !scanError && scan && scanOverview && (
            <span>
              {scanOverview.name}
              {scanDirty ? '*' : ''} scan · {scanOverview.source_kept}/{scanOverview.source_count} samples ·{' '}
              {scanOverview.flux_calibrated
                ? 'flux calibrated (Jy)'
                : scanOverview.calibrated
                  ? 'gain calibrated (GCU)'
                  : 'raw (volts)'}
              {scanViewMode === 'calibrate-scan' && ' · Calibrate Scan'}
            </span>
          )}
        </div>
      )}

      <div className="view-area">
        {auxView === 'about' ? (
          <AboutBox />
        ) : auxView === 'pal' ? (
          <PaletteEditor />
        ) : auxView === 'flux-cal' ? (
          <FluxCalibrationView />
        ) : scan ? (
          scanViewMode === 'calibrate-scan' ? (
            <CalibrateScanView />
          ) : (
            <ScanView />
          )
        ) : !survey ? (
          <div className="opening-hint">
            <p>
              Open a survey file via <strong>Survey → New Survey…</strong> or a scan via{' '}
              <strong>Scan → New Scan…</strong> to begin.
            </p>
          </div>
        ) : viewMode === 'calibrate-survey' ? (
          <CalibrateSurveyView />
        ) : viewMode === 'pre-image' ? (
          <PreImageView />
        ) : viewMode === 'image' ? (
          <ImageView />
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
