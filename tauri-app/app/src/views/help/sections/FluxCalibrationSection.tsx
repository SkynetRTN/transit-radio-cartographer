/*
 * ============================================================================
 *  HELP CONTENT — Flux Calibration section
 * ----------------------------------------------------------------------------
 *  Edit prose freely. Look for [USER TODO] markers for places to add domain
 *  insight. To attach a screenshot, see the comment at the top of
 *  OverviewSection.tsx — same procedure.
 *  Suggested screenshot filenames (drop into ../images/):
 *    fluxcal-add-source.png, fluxcal-fit.png, fluxcal-save.png
 * ============================================================================
 */

import addSourceShot from '../images/fluxcal-add-source.png?url';
import fitShot from '../images/fluxcal-fit.png?url';

export function FluxCalibrationSection() {
  return (
    <section className="help-section">
      <h2>Flux Calibration Workflow</h2>

      <p>
        Flux Calibration converts calibrated machine output (GCU) into Janskies (Jy)
        by fitting a slope through one or more known calibrators. The output
        is a <code>.cal</code> file that the rest of the app can use.
      </p>

      <h3>Applying an existing calibration to your workspace</h3>
      <p>
        If you already have a <code>.cal</code> file that fits your data (same
        telescope, epoch, and frequency band), you don't need to build a new
        one — just load it and the app converts whatever is currently in your
        workspace from GCU into Janskies for you.
      </p>
      <ol>
        <li>
          Make sure the workspace you want to convert is already{' '}
          <strong>calibrated</strong> (in GCU). Loading a <code>.cal</code>{' '}
          converts GCU to Janskies, it does not perform gain calibration.
        </li>
        <li>
          <strong>Click</strong>{' '}
          <code>Flux Calibration → Select Calibration…</code> and pick your{' '}
          <code>.cal</code> file.
        </li>
        <li>
          The app reads the fitted slope (Jy/GCU) from the file and{' '}
          <strong>automatically applies it</strong> to whatever is open — the
          survey, the current scan, and any generated image — so their values
          are now in Janskies. Already-flux-calibrated workspaces are skipped,
          so re-loading won't double-convert.
        </li>
      </ol>
      <p>
        This is the common path once a good calibration exists: build
        the <code>.cal</code> once (steps below), then just load it for every
        other data set.
      </p>

      <h3>1. What you need first</h3>
      <p>
        Each calibrator must be a scan that already has a measured peak flux.
        If a scan's peak hasn't been measured yet, open it in the Scan view
        and run <strong>Determine Peak</strong> first (see the{' '}
        <em>Scan</em> section).
      </p>

      <h3>2. Open the Flux Calibration tool</h3>
      <ul>
        <li>
          <code>Flux Calibration → Open Flux Calibration Tool</code> opens the
          editor. If a calibration is already loaded it shows that one on the
          plot; otherwise it starts a fresh, empty table.
        </li>
        <li>
          <code>Flux Calibration → Select Calibration…</code> is different: it
          loads a <code>.cal</code> file and applies it to your workspace right
          away (see &ldquo;Applying an existing calibration&rdquo; above). Use the
          tool when you want to build or adjust a fit before applying it.
        </li>
      </ul>

      <h3>3. Name your calibration</h3>
      <p>
        At the top of the view there's a caption field — <strong>type</strong> a
        descriptive name like <code>"cyga_2026"</code>. This is
        stored in the <code>.cal</code> file so you can tell calibrations apart
        later.
      </p>

      <h3>4. Add calibration sources</h3>

      <h4>4a. From a saved .scn file</h4>
      <ol>
        <li>
          <strong>Click</strong> <code>Add Source from File…</code>.
        </li>
        <li>
          Pick a <code>.scn</code> file. (If its header has no peak flux, the
          app will tell you to run Determine Peak first.)
        </li>
        <li>
          A prompt appears: <strong>Type</strong> the known flux of that source
          in Janskies, then <code>OK</code>. Taurus A (Crab), Virgo A, and Cygnus
          A are our best calibrators, but any source with a known flux is valid. 
          Those three sources will automatically populate the prompt with their 
          known fluxes. The 40 foot recieve operates at 1350 MHz to 1430 MHz.
        </li>
      </ol>
      <figure className="help-figure">
        <img src={addSourceShot} alt="Known-flux prompt when adding a calibration source" />
        <figcaption>
          Adding a source: after picking a <code>.scn</code> file, enter the
          source's known flux in Janskies.
        </figcaption>
      </figure>

      <h4>4b. From the currently open scan</h4>
      <p>
        If you already have a scan open in the Scan view with a measured peak,
        click <code>Add Current Scan as Source</code>. A prompt asks for the
        known flux just like above.
      </p>

      <h4>4c. Remove an entry</h4>
      <p>
        Each row in the calibrator table has a <code>✕</code> button.{' '}
        <strong>Click</strong> it to drop that calibrator from the fit.
      </p>

      <h3>5. Fit the calibration</h3>
      <ol>
        <li>
          <strong>Click</strong> <code>Fit Calibration</code>.
        </li>
        <li>
          The scatter plot shows <strong>Measured (GCU)</strong> on the X-axis
          vs. <strong>Known (Jy)</strong> on the Y-axis. A magenta line is the
          best-fit slope through (0,0). You do not need multiple calibrators to 
          fit a slope, but more points give a better estimate of the slope and 
          its error.
        </li>
        <li>
          Read the slope (Jy/GCU) and RMS error from the panel above the
          buttons. A large RMS relative to the slope is a hint that one of
          your calibrators is bad — drop it and refit.
        </li>
      </ol>
      <figure className="help-figure">
        <img src={fitShot} alt="Flux calibration scatter plot with magenta best-fit line" />
        <figcaption>
          The fit: Measured (GCU) vs. Known (Jy), with the magenta best-fit
          slope through the origin. Read the slope and RMS error above the
          buttons.
        </figcaption>
      </figure>

      <h3>6. Apply it to your workspace</h3>
      <p>
        Building and fitting a calibration in the tool does <em>not</em> change
        your data on its own — adding sources and fitting only update the plot.
        When you're happy with the fit, click <strong>Apply to Workspace</strong>
        {' '}to convert the open survey / scan / image from GCU into Janskies
        using the current slope. (If the workspace was already in Jy from an
        earlier calibration, applying replaces it.) The button reads{' '}
        <strong>Applied to Workspace ✓</strong> once the current fit is in effect.
      </p>

      <h3>7. Save the .cal</h3>
      <p>
        <strong>Click</strong> <code>Flux Calibration → Save Calibration As…</code>
        {' '}to write the calibration to disk (or <code>Save Calibration</code>{' '}
        to overwrite the file you opened).
      </p>

    </section>
  );
}
