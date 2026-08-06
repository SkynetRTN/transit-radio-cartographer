import { useCallback } from 'react';
import { save as saveDialog } from '@tauri-apps/plugin-dialog';
import { useSurvey } from '../state/survey-context';

/**
 * Shared save actions for the current scalar image, used by both the Image menu
 * (MainWindow) and the in-view Save buttons (ImageView) so there is a single
 * save path. Each action opens the Tauri save dialog (except the quick-save
 * fast path, which reuses the last saved path) and delegates the actual write
 * to the survey context's `saveImage` — which routes `.png` to the PNG writer
 * and `.img` / `.fits` to the image writer.
 *
 * The dialog itself is wrapped so a cancelled/failed picker is a no-op; the
 * underlying `saveImage` call may still throw, so callers should try/catch and
 * surface the message however suits them (menu → warning banner, in-view →
 * inline error).
 */
export function useImageSave() {
  const { image, imageName, imageSavePath, saveImage } = useSurvey();

  const pickPath = useCallback(
    async (opts: Parameters<typeof saveDialog>[0]): Promise<string | null> => {
      try {
        const selected = await saveDialog(opts);
        return typeof selected === 'string' ? selected : null;
      } catch (err) {
        console.error('save dialog failed', err);
        return null;
      }
    },
    [],
  );

  // Quick save: write straight back to the last saved path if there is one,
  // otherwise fall back to a Save-As prompt.
  const saveImageQuick = useCallback(async () => {
    if (!image) return;
    if (imageSavePath) {
      await saveImage(imageSavePath);
      return;
    }
    const target = await pickPath({
      title: 'Save Image As',
      defaultPath: `${imageName || 'image'}.img`,
      filters: [
        { name: 'Image (.img)', extensions: ['img'] },
        { name: 'FITS (.fits)', extensions: ['fits'] },
      ],
    });
    if (!target) return;
    await saveImage(target);
  }, [image, imageSavePath, imageName, saveImage, pickPath]);

  const saveImageAs = useCallback(async () => {
    if (!image) return;
    const target = await pickPath({
      title: 'Save Image As',
      defaultPath: imageSavePath ?? `${imageName || 'image'}.img`,
      filters: [
        { name: 'Image (.img)', extensions: ['img'] },
        { name: 'FITS (.fits)', extensions: ['fits'] },
      ],
    });
    if (!target) return;
    await saveImage(target);
  }, [image, imageSavePath, imageName, saveImage, pickPath]);

  // BUG-005 (dan): raster export is now PNG (replaces the old .bmp).
  const savePngAs = useCallback(async () => {
    if (!image) return;
    const target = await pickPath({
      title: 'Save as PNG',
      defaultPath: `${imageName || 'image'}.png`,
      filters: [{ name: 'PNG Image (.png)', extensions: ['png'] }],
    });
    if (!target) return;
    await saveImage(target);
  }, [image, imageName, saveImage, pickPath]);

  return { saveImageQuick, saveImageAs, savePngAs };
}
