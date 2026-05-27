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
import { NumericInputDialog, type NumericPrompt } from './dialogs/NumericInputDialog';
import { TextInputDialog, type TextPrompt } from './dialogs/TextInputDialog';
import { YesNoCancelDialog } from './dialogs/YesNoCancelDialog';
import { ColorPickDialog } from './dialogs/ColorPickDialog';
import { ConfirmDialog } from './dialogs/ConfirmDialog';
import { HelpDialog } from './help/HelpDialog';
import { useSurvey } from '../state/survey-context';
import { useScan } from '../state/scan-context';
import { useFluxCal } from '../state/flux-cal-context';
import { rpcClient, type ChannelColor, type ImageMeta, type RgbImageMeta } from '../ipc/client';

type AuxView = 'flux-cal' | 'pal' | 'about' | null;
type MenuKey = 'file' | 'image' | 'survey' | 'scan' | 'calibration' | null;

export function MainWindow() {
  const [auxView, setAuxView] = useState<AuxView>(null);
  const [openMenu, setOpenMenu] = useState<MenuKey>(null);
  const [helpOpen, setHelpOpen] = useState(false);
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
    setImage,
    setRgbImage,
    rgbImage,
    rgbImagePixels,
    setImageName,
    imageName,
    imageSavePath,
    saveImage,
    setSurveyName,
    magnifierHalfSize,
    setMagnifierHalfSize,
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
    setScanName,
    peakFitDegree,
    setPeakFitDegree,
  } = useScan();
  const fluxCal = useFluxCal();
  const hasSurvey = survey !== null;
  // Image-menu items act on a built image, so they enable as soon as one
  // exists — whether we're currently on the Image screen or back on Pre Image.
  const hasImage = image !== null;
  // Detect the unused channel of an RGB image (all-zero channel). Used to
  // decide whether Tri-Color can extend a bi-color result, and to label the
  // dialog accordingly. Returns null if every channel has data (already a
  // tricolor) or if there's no RGB image.
  const rgbUnusedChannel: ChannelColor | null = (() => {
    if (!rgbImagePixels) return null;
    const channelHas = (grid: number[][]) => grid.some((row) => row.some((v) => v > 0));
    const r = channelHas(rgbImagePixels.r);
    const g = channelHas(rgbImagePixels.g);
    const b = channelHas(rgbImagePixels.b);
    const used = [r, g, b].filter(Boolean).length;
    if (used !== 2) return null;
    if (!r) return 'r';
    if (!g) return 'g';
    return 'b';
  })();
  const hasScan = scan !== null;
  const hasScanSavePath = scanSavePath !== null;
  const hasSurveySavePath = surveySavePath !== null;

  // ─── Image-menu dialog cascade state (Open Image, Append, Superimpose).
  // The compose flows need a sequence of yes/no/numeric dialogs; rather than
  // chain promises through window.confirm/prompt (which the IDE blocks), we
  // store the current step and render the matching component below.
  type ComposeMode = 'append' | 'superimpose';
  interface ComposeStep {
    mode: ComposeMode;
    otherPath: string;
    sameCalibration: boolean;
    weight: number; // 0..1, only used for superimpose
    raShiftSeconds: number;
    decShiftDegrees: number;
    pix: number;
    stage:
      | 'same-cal'
      | 'equal-weight'
      | 'weight-pct'
      | 'shift-q'
      | 'shift-ra'
      | 'shift-dec'
      | 'pix'
      | 'commit';
  }
  const [compose, setCompose] = useState<ComposeStep | null>(null);

  // ── Bi/Tri-color dialog cascade. The compose state above is for
  // append/superimpose (scalar-result); this one is distinct because the
  // sequence and parameters differ (color picks, multiple files).
  //
  // Three modes:
  //   - bicolor: scalar primary + one new image, user picks 2 colors.
  //   - tricolor-from-scalar: scalar primary + two new images, user picks 2
  //     colors (third is the remaining one, since R/G/B is determined).
  //   - tricolor-from-rgb: existing bi-color image + one new image, no color
  //     picks (the unused channel of the bi-color is auto-filled).
  type ColorMode = 'bicolor' | 'tricolor-from-scalar' | 'tricolor-from-rgb';
  interface ColorStep {
    mode: ColorMode;
    secondPath: string;
    thirdPath: string;
    primaryChannel: ChannelColor;
    secondaryChannel: ChannelColor;
    sameCalibration: boolean;
    raShiftSeconds: number;
    decShiftDegrees: number;
    pix: number;
    stage:
      | 'pick-primary-color'
      | 'pick-secondary-color'
      | 'same-cal'
      | 'shift-q'
      | 'shift-ra'
      | 'shift-dec'
      | 'pix'
      | 'commit';
  }
  const [colorCompose, setColorCompose] = useState<ColorStep | null>(null);
  const [colorPrompt, setColorPrompt] = useState<{
    title: string;
    message: string;
    disabled: ChannelColor[];
    onPick: (c: ChannelColor) => void;
  } | null>(null);

  const [numericPrompt, setNumericPrompt] = useState<NumericPrompt | null>(null);
  const [textPrompt, setTextPrompt] = useState<TextPrompt | null>(null);
  const [yesNoPrompt, setYesNoPrompt] = useState<{
    title: string;
    message: string;
    onYes: () => void;
    onNo: () => void;
  } | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  // Confirm before discarding a currently-loaded survey/scan/image when the
  // user clicks an Open/New button. `onConfirm` runs on OK; Cancel just
  // dismisses without changing state.
  const [discardPrompt, setDiscardPrompt] = useState<{ onConfirm: () => void } | null>(null);

  // Names of currently-loaded workspaces, in display order. Scalar and RGB
  // image are mutually exclusive in the context, so collapse to one "Image".
  const loadedItems: string[] = [];
  if (hasSurvey) loadedItems.push('Survey');
  if (hasScan) loadedItems.push('Scan');
  if (hasImage || rgbImage !== null) loadedItems.push('Image');
  const hasAnythingLoaded = loadedItems.length > 0;
  // English list join: "A", "A and B", "A, B and C".
  const loadedList =
    loadedItems.length <= 1
      ? loadedItems.join('')
      : `${loadedItems.slice(0, -1).join(', ')} and ${loadedItems[loadedItems.length - 1]}`;

  // Wraps Open/New handlers: shows a discard warning if anything is currently
  // loaded, otherwise runs the handler directly. Always closes the menu so
  // the prompt is the only visible UI.
  const confirmDiscard = useCallback(
    (onConfirm: () => void) => {
      setOpenMenu(null);
      if (!hasAnythingLoaded) {
        onConfirm();
        return;
      }
      setDiscardPrompt({ onConfirm });
    },
    [hasAnythingLoaded],
  );

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

  const pickAndOpenSavedSurvey = useCallback(async () => {
    setOpenMenu(null);
    let path: string | null = null;
    try {
      const selected = await openDialog({
        multiple: false,
        directory: false,
        title: 'Open Survey',
        filters: [
          { name: 'Survey (.srv)', extensions: ['srv'] },
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

  const pickAndOpenSavedScan = useCallback(async () => {
    setOpenMenu(null);
    let path: string | null = null;
    try {
      const selected = await openDialog({
        multiple: false,
        directory: false,
        title: 'Open Scan',
        filters: [
          { name: 'Scan (.scn)', extensions: ['scn'] },
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

  // ─── Image menu handlers ───────────────────────────────────────────────

  const adoptImage = useCallback(
    async (meta: ImageMeta, savePath: string | null) => {
      try {
        const pixels = await rpcClient.getImagePixels(meta.handle);
        setImage(meta, pixels, savePath);
      } catch (e) {
        setWarning((e as Error).message);
      }
    },
    [setImage],
  );

  const pickAndOpenImage = useCallback(async () => {
    setOpenMenu(null);
    let path: string | null = null;
    try {
      const selected = await openDialog({
        multiple: false,
        directory: false,
        title: 'Open Image',
        filters: [
          { name: 'Image (.img, .fits)', extensions: ['img', 'fits', 'fit'] },
          { name: 'All files', extensions: ['*'] },
        ],
      });
      path = typeof selected === 'string' ? selected : null;
    } catch (err) {
      console.error('file dialog failed', err);
      return;
    }
    if (!path) return;
    try {
      const meta = await rpcClient.openImage(path);
      await adoptImage(meta, path);
      // Use the file name as the image name unless one was already in place.
      const fileName = path.split(/[/\\]/).pop() ?? 'image';
      setImageName(fileName.replace(/\.[^.]+$/, ''));
    } catch (e) {
      setWarning((e as Error).message);
    }
  }, [adoptImage, setImageName]);

  const handleSaveImage = useCallback(async () => {
    setOpenMenu(null);
    if (!image) return;
    if (imageSavePath) {
      await saveImage(imageSavePath);
      return;
    }
    let target: string | null = null;
    try {
      const selected = await saveDialog({
        title: 'Save Image As',
        defaultPath: `${imageName || 'image'}.img`,
        filters: [
          { name: 'Image (.img)', extensions: ['img'] },
          { name: 'FITS (.fits)', extensions: ['fits'] },
        ],
      });
      target = typeof selected === 'string' ? selected : null;
    } catch (err) {
      console.error('save dialog failed', err);
      return;
    }
    if (!target) return;
    await saveImage(target);
  }, [image, imageSavePath, imageName, saveImage]);

  const handleSaveImageAs = useCallback(async () => {
    setOpenMenu(null);
    if (!image) return;
    let target: string | null = null;
    try {
      const selected = await saveDialog({
        title: 'Save Image As',
        defaultPath: imageSavePath ?? `${imageName || 'image'}.img`,
        filters: [
          { name: 'Image (.img)', extensions: ['img'] },
          { name: 'FITS (.fits)', extensions: ['fits'] },
        ],
      });
      target = typeof selected === 'string' ? selected : null;
    } catch (err) {
      console.error('save dialog failed', err);
      return;
    }
    if (!target) return;
    await saveImage(target);
  }, [image, imageSavePath, imageName, saveImage]);

  const handleSaveBitmapAs = useCallback(async () => {
    setOpenMenu(null);
    if (!image) return;
    let target: string | null = null;
    try {
      const selected = await saveDialog({
        title: 'Save Bitmap As',
        defaultPath: `${imageName || 'image'}.bmp`,
        filters: [{ name: 'Bitmap (.bmp)', extensions: ['bmp'] }],
      });
      target = typeof selected === 'string' ? selected : null;
    } catch (err) {
      console.error('save dialog failed', err);
      return;
    }
    if (!target) return;
    await saveImage(target);
  }, [image, imageName, saveImage]);

  const startCompose = useCallback(
    async (mode: ComposeMode) => {
      setOpenMenu(null);
      if (!image) return;
      let path: string | null = null;
      try {
        const selected = await openDialog({
          multiple: false,
          directory: false,
          title: mode === 'append' ? 'Select Image to Append' : 'Select Image to Superimpose',
          filters: [
            { name: 'Image (.img, .fits)', extensions: ['img', 'fits', 'fit'] },
            { name: 'All files', extensions: ['*'] },
          ],
        });
        path = typeof selected === 'string' ? selected : null;
      } catch (err) {
        console.error('file dialog failed', err);
        return;
      }
      if (!path) return;
      setCompose({
        mode,
        otherPath: path,
        sameCalibration: true,
        weight: 0.5,
        raShiftSeconds: 0,
        decShiftDegrees: 0,
        pix: 1,
        stage: 'same-cal',
      });
    },
    [image],
  );

  const cancelCompose = useCallback(() => {
    setCompose(null);
    setYesNoPrompt(null);
    setNumericPrompt(null);
  }, []);

  // Walk through the dialog cascade based on the current `compose.stage`.
  // Each stage prepares the next dialog (or commits) — kept in this effect so
  // we don't have to chain async dialog calls.
  useEffect(() => {
    if (!compose) return;
    const next = (patch: Partial<ComposeStep>) => setCompose((c) => (c ? { ...c, ...patch } : c));

    if (compose.stage === 'same-cal') {
      setYesNoPrompt({
        title: 'Calibration check',
        message: 'Do the two images use the same calibration?',
        onYes: () => {
          setYesNoPrompt(null);
          next({ sameCalibration: true, stage: compose.mode === 'superimpose' ? 'equal-weight' : 'shift-q' });
        },
        onNo: () => {
          setYesNoPrompt(null);
          setWarning(
            'Images with different calibrations may produce nonsensical composites — proceeding anyway.',
          );
          next({ sameCalibration: false, stage: compose.mode === 'superimpose' ? 'equal-weight' : 'shift-q' });
        },
      });
      return;
    }

    if (compose.stage === 'equal-weight') {
      setYesNoPrompt({
        title: 'Equal weighting',
        message: 'Are both images weighted equally?',
        onYes: () => {
          setYesNoPrompt(null);
          next({ weight: 0.5, stage: 'shift-q' });
        },
        onNo: () => {
          setYesNoPrompt(null);
          next({ stage: 'weight-pct' });
        },
      });
      return;
    }

    if (compose.stage === 'weight-pct') {
      setNumericPrompt({
        title: 'Superimposing image weight',
        label: 'Weight of second image (percent, 0–100):',
        defaultValue: 50,
        onSubmit: (value) => {
          if (!Number.isFinite(value) || value < 0 || value > 100) {
            setWarning('Weight must be 0–100; cancelling.');
            cancelCompose();
            return;
          }
          setNumericPrompt(null);
          // We track the primary's share; if the secondary's weight is X%,
          // the primary's share is (100 - X) / 100.
          next({ weight: (100 - value) / 100, stage: 'shift-q' });
        },
      });
      return;
    }

    if (compose.stage === 'shift-q') {
      setYesNoPrompt({
        title: 'Shift second image?',
        message: 'Do you want to shift the second image?',
        onYes: () => {
          setYesNoPrompt(null);
          next({ stage: 'shift-ra' });
        },
        onNo: () => {
          setYesNoPrompt(null);
          next({ raShiftSeconds: 0, decShiftDegrees: 0, stage: 'pix' });
        },
      });
      return;
    }

    if (compose.stage === 'shift-ra') {
      setNumericPrompt({
        title: 'RA Shift',
        label: 'Shift in RA (minutes):',
        defaultValue: 0,
        onSubmit: (value) => {
          setNumericPrompt(null);
          // Convert RA minutes → sidereal seconds (1 min RA = 60 s).
          next({ raShiftSeconds: value * 60, stage: 'shift-dec' });
        },
      });
      return;
    }

    if (compose.stage === 'shift-dec') {
      setNumericPrompt({
        title: 'Dec Shift',
        label: 'Shift in Dec (degrees):',
        defaultValue: 0,
        onSubmit: (value) => {
          setNumericPrompt(null);
          next({ decShiftDegrees: value, stage: 'pix' });
        },
      });
      return;
    }

    if (compose.stage === 'pix') {
      setNumericPrompt({
        title: 'Pixel resolution',
        label: 'Pixel resolution (pixels):',
        defaultValue: compose.pix,
        onSubmit: (value) => {
          setNumericPrompt(null);
          next({ pix: Math.max(1, Math.trunc(value)), stage: 'commit' });
        },
      });
      return;
    }

    if (compose.stage === 'commit') {
      const c = compose;
      setCompose(null);
      void (async () => {
        if (!image) return;
        try {
          const meta =
            c.mode === 'append'
              ? await rpcClient.appendImage(image.handle, c.otherPath, {
                  ra_shift_seconds: c.raShiftSeconds,
                  dec_shift_degrees: c.decShiftDegrees,
                  pix: c.pix,
                })
              : await rpcClient.superimposeImage(image.handle, c.otherPath, {
                  weight: c.weight,
                  ra_shift_seconds: c.raShiftSeconds,
                  dec_shift_degrees: c.decShiftDegrees,
                  pix: c.pix,
                });
          await adoptImage(meta, null);
        } catch (e) {
          setWarning((e as Error).message);
        }
      })();
    }
  }, [compose, image, adoptImage, cancelCompose]);

  // ── Bi-color / Tri-color flow ──────────────────────────────────────────

  const startColorCompose = useCallback(
    async (mode: ColorMode) => {
      setOpenMenu(null);
      // tricolor-from-rgb requires an existing bi-color; all other modes
      // require a scalar primary image.
      if (mode === 'tricolor-from-rgb') {
        if (!rgbImage || rgbUnusedChannel === null) return;
      } else if (!image) {
        return;
      }
      // First file pick — every mode needs at least one new file.
      let secondPath: string | null = null;
      try {
        const selected = await openDialog({
          multiple: false,
          directory: false,
          title:
            mode === 'bicolor'
              ? 'Select Second Image for Bi-Color'
              : mode === 'tricolor-from-scalar'
                ? 'Select Second Image for Tri-Color'
                : 'Select Image to Extend Bi-Color',
          filters: [
            { name: 'Image (.img, .fits)', extensions: ['img', 'fits', 'fit'] },
            { name: 'All files', extensions: ['*'] },
          ],
        });
        secondPath = typeof selected === 'string' ? selected : null;
      } catch (err) {
        console.error('file dialog failed', err);
        return;
      }
      if (!secondPath) return;
      // tricolor-from-scalar also needs a third file.
      let thirdPath = '';
      if (mode === 'tricolor-from-scalar') {
        try {
          const selected = await openDialog({
            multiple: false,
            directory: false,
            title: 'Select Third Image for Tri-Color',
            filters: [
              { name: 'Image (.img, .fits)', extensions: ['img', 'fits', 'fit'] },
              { name: 'All files', extensions: ['*'] },
            ],
          });
          thirdPath = typeof selected === 'string' ? selected : '';
        } catch (err) {
          console.error('file dialog failed', err);
          return;
        }
        if (!thirdPath) return;
      }
      setColorCompose({
        mode,
        secondPath,
        thirdPath,
        primaryChannel: 'r',
        secondaryChannel: 'g',
        sameCalibration: true,
        raShiftSeconds: 0,
        decShiftDegrees: 0,
        pix: 1,
        // tricolor-from-rgb auto-fills the unused channel — no color picks.
        // All other modes ask the user to pick colors explicitly.
        stage: mode === 'tricolor-from-rgb' ? 'same-cal' : 'pick-primary-color',
      });
    },
    [image, rgbImage, rgbUnusedChannel],
  );

  const cancelColorCompose = useCallback(() => {
    setColorCompose(null);
    setColorPrompt(null);
    setYesNoPrompt(null);
    setNumericPrompt(null);
  }, []);

  // Cascade engine for bi/tri-color, mirroring the append/superimpose effect.
  useEffect(() => {
    if (!colorCompose) return;
    const next = (patch: Partial<ColorStep>) =>
      setColorCompose((c) => (c ? { ...c, ...patch } : c));

    if (colorCompose.stage === 'pick-primary-color') {
      setColorPrompt({
        title: 'Primary Image Color',
        message: 'Pick a color for the current (primary) image:',
        disabled: [],
        onPick: (c) => {
          setColorPrompt(null);
          next({ primaryChannel: c, stage: 'pick-secondary-color' });
        },
      });
      return;
    }
    if (colorCompose.stage === 'pick-secondary-color') {
      setColorPrompt({
        title: 'Second Image Color',
        message:
          colorCompose.mode === 'tricolor-from-scalar'
            ? 'Pick a color for the second image (third image gets the remaining color):'
            : 'Pick a color for the second image:',
        disabled: [colorCompose.primaryChannel],
        onPick: (c) => {
          if (c === colorCompose.primaryChannel) {
            setWarning('Invalid color selection — already in use.');
            return;
          }
          setColorPrompt(null);
          next({ secondaryChannel: c, stage: 'same-cal' });
        },
      });
      return;
    }
    if (colorCompose.stage === 'same-cal') {
      setYesNoPrompt({
        title: 'Calibration check',
        message: 'Do the images use the same calibration?',
        onYes: () => {
          setYesNoPrompt(null);
          next({ sameCalibration: true, stage: 'shift-q' });
        },
        onNo: () => {
          setYesNoPrompt(null);
          setWarning(
            'Images with different calibrations may produce nonsensical composites — proceeding anyway.',
          );
          next({ sameCalibration: false, stage: 'shift-q' });
        },
      });
      return;
    }
    if (colorCompose.stage === 'shift-q') {
      setYesNoPrompt({
        title: 'Shift second image?',
        message: 'Do you want to shift the second image?',
        onYes: () => {
          setYesNoPrompt(null);
          next({ stage: 'shift-ra' });
        },
        onNo: () => {
          setYesNoPrompt(null);
          next({ raShiftSeconds: 0, decShiftDegrees: 0, stage: 'pix' });
        },
      });
      return;
    }
    if (colorCompose.stage === 'shift-ra') {
      setNumericPrompt({
        title: 'RA Shift',
        label: 'Shift in RA (minutes):',
        defaultValue: 0,
        onSubmit: (value) => {
          setNumericPrompt(null);
          next({ raShiftSeconds: value * 60, stage: 'shift-dec' });
        },
      });
      return;
    }
    if (colorCompose.stage === 'shift-dec') {
      setNumericPrompt({
        title: 'Dec Shift',
        label: 'Shift in Dec (degrees):',
        defaultValue: 0,
        onSubmit: (value) => {
          setNumericPrompt(null);
          next({ decShiftDegrees: value, stage: 'pix' });
        },
      });
      return;
    }
    if (colorCompose.stage === 'pix') {
      setNumericPrompt({
        title: 'Pixel resolution',
        label: 'Pixel resolution (pixels):',
        defaultValue: colorCompose.pix,
        onSubmit: (value) => {
          setNumericPrompt(null);
          next({ pix: Math.max(1, Math.trunc(value)), stage: 'commit' });
        },
      });
      return;
    }
    if (colorCompose.stage === 'commit') {
      const c = colorCompose;
      setColorCompose(null);
      void (async () => {
        if (!image) return;
        try {
          let meta: RgbImageMeta;
          if (c.mode === 'bicolor') {
            if (!image) return;
            meta = await rpcClient.bicolorImage(
              image.handle,
              c.secondPath,
              c.primaryChannel,
              c.secondaryChannel,
              {
                ra_shift_seconds: c.raShiftSeconds,
                dec_shift_degrees: c.decShiftDegrees,
                pix: c.pix,
              },
            );
          } else if (c.mode === 'tricolor-from-scalar') {
            if (!image) return;
            // Tri-color from a scalar primary: user picked colors for the
            // first two images; the third image is assigned the remaining
            // (unused) channel. The engine's tricolor_image method always
            // produces R/G/B in fixed order from (primary, second, third),
            // so we permute the inputs to match the user's color picks.
            const remaining = (['r', 'g', 'b'] as ChannelColor[]).find(
              (ch) => ch !== c.primaryChannel && ch !== c.secondaryChannel,
            )!;
            // Map each color → which input file slot it should come from.
            const slotFor: Record<ChannelColor, 'primary' | 'second' | 'third'> = {
              [c.primaryChannel]: 'primary',
              [c.secondaryChannel]: 'second',
              [remaining]: 'third',
            } as Record<ChannelColor, 'primary' | 'second' | 'third'>;
            // The engine will assign R=arg1, G=arg2, B=arg3, so order the
            // arguments so each color lines up with its intended slot.
            const slotsByRgb: ('primary' | 'second' | 'third')[] = [
              slotFor.r,
              slotFor.g,
              slotFor.b,
            ];
            // Each "slot" name → the actual path/handle.
            const sourceForSlot = (slot: 'primary' | 'second' | 'third'): string =>
              // tricolor_image expects file paths for the 2nd/3rd inputs, but
              // the primary is passed as a handle. We can only swap among the
              // two path arguments — the primary stays as the handle. To make
              // permutation work, we first rewrite the engine call to take
              // three paths instead of (handle + 2 paths). For now: if the
              // user's primary color is not R, we pre-open the appropriate
              // path so we always pass paths in slot order. But the engine
              // signature requires a handle for the primary. So we keep the
              // simpler convention: the *current image* (primary) goes to
              // whatever color the user picked first, and the second/third
              // file paths fill the remaining colors in pick-order.
              slot === 'primary' ? '' : slot === 'second' ? c.secondPath : c.thirdPath;
            void slotsByRgb;
            void sourceForSlot;
            // Simplified mapping: primary input keeps user's primary color,
            // secondPath gets secondary color, thirdPath gets the remaining
            // color. The engine produces R=primary, G=second, B=third, so we
            // just need to reorder the paths so the engine's fixed RGB order
            // ends up matching the user's pick order.
            //
            // engine call: tricolorImage(primary_handle, p2, p3)
            //   → output channels R = primary, G = p2, B = p3
            // We want:
            //   user's primaryChannel ← primary image
            //   user's secondaryChannel ← secondPath
            //   user's remaining ← thirdPath
            //
            // If primaryChannel = 'r', the engine's R already gets primary; good.
            // If primaryChannel = 'g', we need to swap the args so primary
            //   ends up in G. The engine always puts primary in R, so we
            //   can't actually do that without a different RPC shape.
            //
            // Workaround: produce the tri-color, then permute the channels
            // on the client side by repeatedly swapping. For simplicity we
            // do the permutation entirely on the client: get the pixels back
            // in (R, G, B) = (primary, second, third) order, then remap so
            // (primaryChannel, secondaryChannel, remaining) ← (primary, second, third).
            const intermediate = await rpcClient.tricolorImage(
              image.handle,
              c.secondPath,
              c.thirdPath,
              {
                ra_shift_seconds: c.raShiftSeconds,
                dec_shift_degrees: c.decShiftDegrees,
                pix: c.pix,
              },
            );
            meta = intermediate;
            // Permute channels client-side based on user's color picks.
            const intermediatePixels = await rpcClient.getRgbImagePixels(intermediate.handle);
            const permuted = {
              ...intermediatePixels,
              r:
                c.primaryChannel === 'r'
                  ? intermediatePixels.r
                  : c.secondaryChannel === 'r'
                    ? intermediatePixels.g
                    : intermediatePixels.b,
              g:
                c.primaryChannel === 'g'
                  ? intermediatePixels.r
                  : c.secondaryChannel === 'g'
                    ? intermediatePixels.g
                    : intermediatePixels.b,
              b:
                c.primaryChannel === 'b'
                  ? intermediatePixels.r
                  : c.secondaryChannel === 'b'
                    ? intermediatePixels.g
                    : intermediatePixels.b,
            };
            setRgbImage(meta, permuted);
            return;
          } else {
            // tricolor-from-rgb: extend the existing bi-color with one new
            // image in the unused channel.
            if (!rgbImage) return;
            meta = await rpcClient.extendRgbImage(rgbImage.handle, c.secondPath, {
              ra_shift_seconds: c.raShiftSeconds,
              dec_shift_degrees: c.decShiftDegrees,
            });
          }
          const pixels = await rpcClient.getRgbImagePixels(meta.handle);
          setRgbImage(meta, pixels);
        } catch (e) {
          setWarning((e as Error).message);
        }
      })();
    }
  }, [colorCompose, image, rgbImage, setRgbImage]);

  const handleChangeCalibrationName = useCallback(() => {
    setOpenMenu(null);
    if (!fluxCal.table) return;
    setTextPrompt({
      title: 'Change Calibration Name',
      label: 'Calibration name:',
      defaultValue: fluxCal.table.caption,
      onSubmit: (value) => {
        setTextPrompt(null);
        fluxCal.setCaption(value);
      },
    });
  }, [fluxCal]);

  const handleChangeImageName = useCallback(() => {
    setOpenMenu(null);
    if (!image) return;
    setTextPrompt({
      title: 'Change Image Name',
      label: 'Image name:',
      defaultValue: imageName,
      onSubmit: (value) => {
        setTextPrompt(null);
        setImageName(value);
      },
    });
  }, [image, imageName, setImageName]);

  const handleChangeSurveyName = useCallback(() => {
    setOpenMenu(null);
    if (!workspace) return;
    setTextPrompt({
      title: 'Change Survey Name',
      label: 'Survey name:',
      defaultValue: workspace.name,
      onSubmit: (value) => {
        setTextPrompt(null);
        void setSurveyName(value);
      },
    });
  }, [workspace, setSurveyName]);

  const handleChangeScanName = useCallback(() => {
    setOpenMenu(null);
    if (!scanOverview) return;
    setTextPrompt({
      title: 'Change Scan Name',
      label: 'Scan name:',
      defaultValue: scanOverview.name,
      onSubmit: (value) => {
        setTextPrompt(null);
        void setScanName(value);
      },
    });
  }, [scanOverview, setScanName]);

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
              <button
                role="menuitem"
                onClick={() => {
                  setOpenMenu(null);
                  setHelpOpen(true);
                }}
              >
                Help / Tutorial…
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
              <button
                role="menuitem"
                onClick={() => confirmDiscard(() => void pickAndOpenImage())}
              >
                Open Image…
              </button>
              <button
                role="menuitem"
                disabled={!hasImage}
                onClick={() => void handleSaveImage()}
                title={hasImage ? undefined : 'Available after you build or upload an image'}
              >
                Save Image
              </button>
              <button
                role="menuitem"
                disabled={!hasImage}
                onClick={() => void handleSaveImageAs()}
                title={hasImage ? undefined : 'Available after you build or upload an image'}
              >
                Save Image As…
              </button>
              <div className="menu-sep" />
              <button
                role="menuitem"
                disabled={!hasImage}
                onClick={() => void handleSaveBitmapAs()}
                title={hasImage ? undefined : 'Available after you build or upload an image'}
              >
                Save Bitmap As…
              </button>
              <div className="menu-sep" />
              <button
                role="menuitem"
                disabled={!hasImage}
                onClick={() => void startCompose('append')}
                title={hasImage ? undefined : 'Available after you build or upload an image'}
              >
                Append Image…
              </button>
              <button
                role="menuitem"
                disabled={!hasImage}
                onClick={() => void startCompose('superimpose')}
                title={hasImage ? undefined : 'Available after you build or upload an image'}
              >
                Superimpose Image…
              </button>
              <div className="menu-sep" />
              <button
                role="menuitem"
                disabled={!hasImage}
                onClick={() => void startColorCompose('bicolor')}
                title={hasImage ? undefined : 'Available after you build or upload an image'}
              >
                Make Bi-Color Image…
              </button>
              <button
                role="menuitem"
                disabled={!hasImage && rgbUnusedChannel === null}
                onClick={() =>
                  void startColorCompose(
                    rgbUnusedChannel !== null ? 'tricolor-from-rgb' : 'tricolor-from-scalar',
                  )
                }
                title={
                  !hasImage && rgbUnusedChannel === null
                    ? 'Available after you build a bi-color image or have a scalar image to extend'
                    : rgbUnusedChannel !== null
                      ? `Adds the selected image into the unused ${rgbUnusedChannel.toUpperCase()} channel of the current bi-color image.`
                      : 'Picks two more images and lets you assign R/G/B channels.'
                }
              >
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
                title={hasImage ? undefined : 'Available after you build or upload an image'}
              >
                Show Palette…
              </button>
              <div className="menu-sep" />
              <button
                role="menuitem"
                disabled={!hasImage}
                onClick={() => {
                  setOpenMenu(null);
                  if (!image) return;
                  setNumericPrompt({
                    title: 'Change Magnifier Size',
                    label: 'Magnifier half-width (cells, 1–200):',
                    defaultValue: magnifierHalfSize,
                    onSubmit: (value) => {
                      setNumericPrompt(null);
                      setMagnifierHalfSize(value);
                    },
                  });
                }}
                title={hasImage ? undefined : 'Available after you build or upload an image'}
              >
                Change Magnifier Size…
              </button>
              <button
                role="menuitem"
                disabled={!hasImage}
                onClick={handleChangeImageName}
                title={hasImage ? undefined : 'Available after you build or upload an image'}
              >
                Change Image Name…
              </button>
            </div>
          )}
        </div>

        <div className="menu-root">
          <button onClick={() => toggleMenu('survey')}>Survey</button>
          {openMenu === 'survey' && (
            <div role="menu" className="menu-popup">
              <button
                role="menuitem"
                onClick={() => confirmDiscard(() => void pickAndOpenSurvey())}
              >
                New Survey…
              </button>
              <button
                role="menuitem"
                onClick={() => confirmDiscard(() => void pickAndOpenSavedSurvey())}
              >
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
              <button
                role="menuitem"
                disabled={!hasSurvey}
                onClick={handleChangeSurveyName}
              >
                Change Survey Name…
              </button>
            </div>
          )}
        </div>

        <div className="menu-root">
          <button onClick={() => toggleMenu('scan')}>Scan</button>
          {openMenu === 'scan' && (
            <div role="menu" className="menu-popup">
              <button
                role="menuitem"
                onClick={() => confirmDiscard(() => void pickAndOpenScan())}
              >
                New Scan…
              </button>
              <button
                role="menuitem"
                onClick={() => confirmDiscard(() => void pickAndOpenSavedScan())}
              >
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
              <button
                role="menuitem"
                disabled={!hasScan}
                onClick={handleChangeScanName}
              >
                Change Scan Name…
              </button>
              <div className="menu-sep" />
              <button
                role="menuitem"
                disabled={!hasScan}
                onClick={() => {
                  setOpenMenu(null);
                  setNumericPrompt({
                    title: 'Change Determine Peak Fit',
                    label: 'Fit kind (0 = Gaussian, 2/3/4 = polynomial degree):',
                    defaultValue: peakFitDegree,
                    onSubmit: (value) => {
                      setNumericPrompt(null);
                      // Round-then-clamp: anything outside {0, 2, 3, 4}
                      // collapses to the nearest valid kind. `1` snaps up to
                      // `2` since there's no degree-1 fit for finding a peak.
                      const r = Math.round(value);
                      const clamped = r <= 0 ? 0 : r === 1 ? 2 : r > 4 ? 4 : r;
                      setPeakFitDegree(clamped);
                    },
                  });
                }}
              >
                Change Determine Peak Fit…
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
          <PaletteEditor onClose={() => setAuxView(null)} />
        ) : auxView === 'flux-cal' ? (
          <FluxCalibrationView />
        ) : scan ? (
          scanViewMode === 'calibrate-scan' ? (
            <CalibrateScanView />
          ) : (
            <ScanView />
          )
        ) : !survey && (image || rgbImage) ? (
          // Standalone image (Image → Open Image…, or a bi/tri-color built
          // from one) — no survey or scan loaded but we have something to
          // display.
          <ImageView />
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

      {yesNoPrompt && (
        <YesNoCancelDialog
          title={yesNoPrompt.title}
          message={yesNoPrompt.message}
          onYes={yesNoPrompt.onYes}
          onNo={yesNoPrompt.onNo}
          onCancel={() => {
            cancelCompose();
            cancelColorCompose();
          }}
        />
      )}
      {numericPrompt && (
        <NumericInputDialog
          prompt={numericPrompt}
          onCancel={() => {
            cancelCompose();
            cancelColorCompose();
          }}
        />
      )}
      {textPrompt && (
        <TextInputDialog prompt={textPrompt} onCancel={() => setTextPrompt(null)} />
      )}
      {colorPrompt && (
        <ColorPickDialog
          title={colorPrompt.title}
          message={colorPrompt.message}
          disabledColors={colorPrompt.disabled}
          onPick={colorPrompt.onPick}
          onCancel={cancelColorCompose}
        />
      )}
      {discardPrompt && (
        <ConfirmDialog
          title="Discard current work?"
          message={`Open ${loadedList} will be discarded.`}
          onConfirm={() => {
            const cb = discardPrompt.onConfirm;
            setDiscardPrompt(null);
            // Actually clear the previous workspace so e.g. opening an image
            // over a survey doesn't leave the survey's workspace handle
            // around (which would keep "Back to Pre Image" available even
            // though we said it'd be discarded). `close()` here also wipes
            // image/rgbImage; `closeScan()` wipes the scan side. Aux views
            // (palette editor, flux-cal panel) also close so the next view
            // is clean.
            setAuxView(null);
            void close();
            void closeScan();
            cb();
          }}
          onCancel={() => setDiscardPrompt(null)}
        />
      )}
      {warning && (
        <div className="warning-toast" role="status" onClick={() => setWarning(null)}>
          {warning}
        </div>
      )}
      {helpOpen && <HelpDialog onClose={() => setHelpOpen(false)} />}

      <footer style={{ display: 'none' }}>
        {String(hasSurvey)}
        {String(hasScan)}
      </footer>
    </div>
  );
}
