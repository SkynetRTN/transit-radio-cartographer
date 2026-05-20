import { useCallback } from 'react';
import { useSurvey } from '../state/survey-context';
import { ImagePlot } from '../lib/plots/ImagePlot';

export function ImageView() {
  const { workspace, image, imagePixels, setViewMode } = useSurvey();

  const handleBack = useCallback(() => {
    setViewMode('pre-image');
  }, [setViewMode]);

  if (!workspace) {
    return (
      <div className="survey-view empty">
        <p>No survey loaded.</p>
      </div>
    );
  }

  return (
    <div className="survey-view workspace image-view">
      <div className="workspace-frame">
        <div className="workspace-title">{`${workspace.name} - Image`}</div>
        <div className="workspace-body">
          <div className="workspace-plots">
            {imagePixels ? (
              <ImagePlot image={imagePixels} meta={image} title="" testId="image-plot" />
            ) : (
              <div className="plot-status">No image built yet.</div>
            )}
          </div>

          <div className="workspace-side">
            <div className="side-buttons">
              {/* Image-level controls (Save Image, Save Bitmap As, Show Palette,
                  Append Image, Make Bi/Tri-Color, Change Magnifier Size, …)
                  belong here. They live on the Image File menu today but will
                  also be wired into this side panel in a follow-up. */}
              <button onClick={handleBack}>Back to Pre Image</button>
            </div>

            {image !== null && imagePixels && (
              <div className="readout">
                <div>
                  Image: {imagePixels.width} × {imagePixels.height}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
