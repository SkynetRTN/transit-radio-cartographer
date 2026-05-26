/*
 * ============================================================================
 *  HELP CONTENT — Image section
 * ----------------------------------------------------------------------------
 *  Edit prose freely. Look for [USER TODO] markers for places to add domain
 *  insight. To attach a screenshot, see the comment at the top of
 *  OverviewSection.tsx — same procedure.
 *  Suggested screenshot filenames (drop into ../images/):
 *    image-palette.png, image-max-flux.png, image-save.png
 * ============================================================================
 */

export function ImageSection() {
  return (
    <section className="help-section">
      <h2>Image Workflow</h2>

      <p>
        The Image view is where you inspect the final gridded radio map,
        adjust the palette for publication-quality figures, and save outputs.
      </p>

      <h3>1. Inspecting the image</h3>
      <p>
        After <strong>Make Image</strong> runs, the gridded map appears as a
        2D color image. <strong>Hover</strong> any pixel to see its RA, Dec,
        and flux value in the corner readout.
      </p>
      <p className="help-figure-placeholder">
        [Screenshot: image-palette.png — image with corner readout]
      </p>

      <h3>2. Find the true peak</h3>
      <p>
        The brightest-colored pixel isn't always the maximum flux pixel — if
        the palette range clips, several pixels may share the top color. Move
        the mouse over the suspected peak region and watch the corner flux
        readout to identify the true maximum.
      </p>
      <p className="help-todo">
        [USER TODO] — Add: how often students misidentify the peak, why this
        matters for flux calibration.
      </p>

      <h3>3. Open the Palette editor</h3>
      <p>
        Open the palette controls (verify exact entry point during use — the
        Palette editor may be reached from a side button or a menu item).
        From there you can change the color mapping, the min and max flux
        clipping range, and the channel colors.
      </p>

      <h4>3a. Adjust max flux</h4>
      <p>
        <strong>Type</strong> the maximum flux value in Jy. Anything above this
        clips to the top color of the palette. Set it to your true peak (from
        step 2) to maximize dynamic range.
      </p>
      <p className="help-figure-placeholder">
        [Screenshot: image-max-flux.png — palette editor with max flux field]
      </p>

      <h4>3b. Adjust min flux</h4>
      <p>
        <strong>Type</strong> the minimum flux value in Jy. Anything below this
        clips to the bottom color. Often a small negative value (just below the
        noise floor) gives the cleanest background.
      </p>

      <h4>3c. Pick a palette</h4>
      <p>
        Choose a color mapping. Grayscale is good for publications; perceptual
        color maps (viridis-style) preserve dynamic range visually; custom RGB
        is useful for highlighting structure.
      </p>

      <h3>4. Save the image</h3>
      <ul>
        <li>
          <code>Image → Save Image</code> — Saves the app-native image format
          back to the current path.
        </li>
        <li>
          <code>Image → Save Image As…</code> — Saves to a new path.
        </li>
        <li>
          <code>Image → Save Bitmap As…</code> — Exports a <code>.png</code> /{' '}
          <code>.bmp</code> for use in papers / slides.
        </li>
      </ul>
      <p className="help-figure-placeholder">
        [Screenshot: image-save.png — Image menu with save options]
      </p>

      <h3>5. Compose multiple images (advanced)</h3>
      <ul>
        <li>
          <code>Image → Append Image…</code> — Stitch two scalar maps side by
          side.
        </li>
        <li>
          <code>Image → Superimpose Image…</code> — Overlay two scalar maps in
          the same field.
        </li>
        <li>
          <code>Image → Make Bi-Color Image…</code> — Assigns two scalar maps
          to two color channels for a two-band composite.
        </li>
        <li>
          <code>Image → Make Tri-Color Image…</code> — Three-band RGB
          composite. If you already have a bi-color image, this can extend it
          by adding the unused channel.
        </li>
      </ul>

      <p className="help-todo">
        [USER TODO] — Add: common palette pitfalls (color blindness, clipping
        the peak), when to use bi/tri-color vs. single channel, how to align
        composites.
      </p>
    </section>
  );
}
