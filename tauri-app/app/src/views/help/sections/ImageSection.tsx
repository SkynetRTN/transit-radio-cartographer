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

import imageShot from '../images/image.png?url';
import paletteShot from '../images/image-palette.png?url';

export function ImageSection() {
  return (
    <section className="help-section">
      <h2>Image Workflow</h2>

      <p>
        The Image view is where you inspect the final gridded radio map — pan
        and zoom into it, pin and magnify pixels to read off values, tune the
        palette for publication-quality figures, and save or compose outputs.
      </p>

      <h3>1. Inspecting the image</h3>
      <p>
        After <strong>Make Image</strong> runs, the gridded map appears as a 2D
        color image, with Right Ascension on the horizontal axis (increasing to
        the left, as on the sky) and Declination on the vertical.{' '}
        <strong>Hover</strong> any pixel to see its RA, Dec, and flux in the
        readout panel on the right; that panel also shows the image dimensions.
        The readout keeps its last value when the cursor leaves the image.
      </p>
      <figure className="help-figure">
        <img src={imageShot} alt="Gridded radio map with RA/Dec/flux side readout" />
        <figcaption>
          The Image view: the gridded map with RA on the horizontal axis and Dec
          on the vertical, and the RA/Dec/flux readout in the side panel.
        </figcaption>
      </figure>

      <h4>1a. Zoom and pan</h4>
      <p>
        <strong>Drag a box</strong> anywhere on the image to zoom the axes to
        that region — any shape works, the view fits exactly what you draw and
        keeps the correct (dec-corrected) sky proportions of the zoomed region.
        You can also zoom with <strong>Ctrl</strong> <code>+</code> /{' '}
        <strong>Ctrl</strong> <code>-</code> (⌘ on macOS).{' '}
        <strong>Double-click</strong> to reset to the full map — which restores
        the full-image shape. The <strong>right mouse button</strong> never
        zooms; it only opens the magnifier.
      </p>

      <h4>1b. Pin a pixel</h4>
      <p>
        <strong>Left-click</strong> a pixel to <strong>pin</strong> it. A target
        ring marks the spot and the readout locks to that pixel's RA, Dec, and
        flux (tagged <em>pinned</em>) so the numbers stay put while you move the
        mouse or zoom elsewhere. Click <code>Unpin</code> — directly under the
        readout — to release it. If you zoom to a region that doesn't contain
        the pinned pixel, the readout still shows its values even though the ring
        is off-screen. <strong>Double-clicking</strong> to zoom back out never
        pins a point — and it releases any pin you had.
      </p>

      <h4>1c. Magnifier</h4>
      <p>
        Click <strong>Open Magnifier</strong> in the side panel to open the{' '}
        <strong>magnifier</strong> — a zoomed inset of the sky, shown right below
        the button. (<strong>Right-clicking</strong> a pixel also opens it,
        centered on that cell; neither way pins a point.) Use the{' '}
        <strong>arrow keys</strong> to nudge the magnified area (hold{' '}
        <code>Shift</code> for ×5 steps), and <strong>Close Magnifier</strong>{' '}
        (same button) to dismiss it. The loupe is always square on the
        dec-corrected sky; set its half-width in <strong>degrees</strong> with{' '}
        <code>Image → Change Magnifier Size…</code>. Right-clicking only opens
        the magnifier — it never disturbs your current zoom.
      </p>
      <p>
        While the magnifier is open, three buttons below the RA/Dec/Flux readout
        let you total the flux in and around the magnified box:
      </p>
      <ul>
        <li>
          <code>Sum Flux (Box)</code> — adds up the flux of every covered pixel
          inside the magnifier box, and shows how many pixels went into the sum.
        </li>
        <li>
          <code>Average Flux (Box)</code> — the mean flux over those same
          covered pixels (no-coverage cells are ignored, so blank sky in the box
          doesn't pull the average down).
        </li>
        <li>
          <code>Sum Flux (Outside Box)</code> — the total flux of the whole map
          <em>excluding</em> the magnifier box, useful for separating a source
          from its surroundings.
        </li>
      </ul>
      <p>
        Each button toggles its value on or off, and the numbers update{' '}
        <strong>live</strong> as you move the box with the arrow keys or
        right-click a new spot — so you can watch a total change as you slide the
        box across a source. Values use the same flux unit as the pixel readout.
      </p>

      <h4>1d. Display shape</h4>
      <p>
        <code>Image → Image Display ▸</code> sets the aspect ratio of the
        default (un-zoomed) view:
      </p>
      <ul>
        <li>
          <strong>Declination Corrected</strong> (default) — applies a
          cos(declination) correction at the image center so the displayed shape
          matches the true sky.
        </li>
        <li>
          <strong>No Declination Correction</strong> — RA-seconds → degrees only
          (1/240); accurate at the celestial equator.
        </li>
        <li>
          <strong>Snap to Square</strong> — each pixel cell renders square on
          screen; handy for inspecting very thin or very wide surveys.
        </li>
        <li>
          <strong>Stretch to Fill</strong> — no aspect lock; the map stretches
          to fill the workspace area.
        </li>
      </ul>

      <h3>2. Find the true peak</h3>
      <p>
        The brightest-colored pixel isn't always the maximum flux pixel — if the
        palette range clips, several pixels may share the top color. Sweep the
        cursor over the suspected peak region and watch the readout, or open the{' '}
        <strong>magnifier</strong> on it, to identify the true maximum; then{' '}
        <strong>pin</strong> it so its value stays on screen while you set the
        palette range or compare candidates.
      </p>
      <h3>3. Tune the palette</h3>
      
      <p>
        Open the palette controls with <code>Image → Show Palette…</code>{' '}
        (enabled once an image is built or loaded). From there you can change the
        color mapping, the min and max flux clipping range, and — for composites
        — the channel colors.
      </p>
      <figure className="help-figure">
        <img src={paletteShot} alt="Palette editor with color mapping and min/max flux controls" />
        <figcaption>
          The palette editor: change the color mapping, set the min and max flux
          clipping range, and drag the color stops to build your own ramp.
        </figcaption>
      </figure>

      <h4>3a. Adjust max flux</h4>
      <p>
        <strong>Type</strong> the maximum flux value. Anything above it clips to
        the top color of the palette. Set it to your true peak (from step 2) to
        maximize dynamic range.
      </p>

      <h4>3b. Adjust min flux</h4>
      <p>
        <strong>Type</strong> the minimum flux value. Anything below it clips to
        the bottom color. 
      </p>

      <h4>3c. Pick a palette</h4>
      <p>
        There are default presets, or you can load in a .pal file.
        You can make your own by dragging the color stops. Stops
        stay ordered and spaced automatically, so you can add many of them or
        drag them to the edges without breaking the ramp. If you want to 
        save the palette for later, click <code>Save Palette…</code> to write a .pal file.
      </p>

      <h3>4. Save the image</h3>
      <p>
        Saving lives on the <code>Image</code> menu (the Image view itself has no
        save buttons):
      </p>
      <ul>
        <li>
          <code>Save Image</code> — Saves the app-native image format back to
          the current path.
        </li>
        <li>
          <code>Save Image As…</code> — Saves to a new path (<code>.img</code> or{' '}
          <code>.fits</code>).
        </li>
        <li>
          <code>Save as FITS…</code> — Exports directly to a <code>.fits</code>
          {' '}file for use in other astronomy tools.
        </li>
        <li>
          <code>Save as PNG…</code> — Exports a full-resolution <code>.png</code>
          {' '}for use in papers / slides.
        </li>
      </ul>

      <h3>5. Compose multiple images</h3>
      <ul>
        <li>
          <code>Image → Append Image…</code> — Stitch scalar maps side by
          side; you can pick several at once. Where footprints overlap, each
          cell takes the <strong>maximum</strong> flux of the covering maps.
        </li>
        <li>
          <code>Image → Superimpose Image…</code> — Overlay scalar maps in the
          same field; you can pick several at once. Where footprints overlap,
          each cell takes the <strong>average</strong> of the covering maps.
          Two maps can be blended with a custom weight; three or more are
          always weighted <strong>evenly</strong> — to adjust individual
          weights, superimpose one map at a time.
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
      <p>
        A composite (bi/tri-color) opens in the same view. It supports the same{' '}
        <strong>drag-to-zoom</strong> and <strong>right-click magnifier</strong>,
        and hovering shows an RA/Dec readout. Use{' '}
        <code>Export as PNG…</code> to write the composite out as an image for
        papers or slides, and <code>Back to Image</code> to return to the scalar
        map it was built from.
      </p>
    </section>
  );
}
