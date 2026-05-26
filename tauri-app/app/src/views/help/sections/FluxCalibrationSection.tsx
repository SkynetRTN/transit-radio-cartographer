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

export function FluxCalibrationSection() {
  return (
    <section className="help-section">
      <h2>Flux Calibration Workflow</h2>

      <p>
        Flux Calibration converts raw machine output (GCU) into Janskies (Jy)
        by fitting a slope through one or more known calibrators. The output
        is a <code>.cal</code> file that the rest of the app can use.
      </p>

      <h3>1. What you need first</h3>
      <p>
        Each calibrator must be a scan that already has a measured peak flux.
        If a scan's peak hasn't been measured yet, open it in the Scan view
        and run <strong>Determine Peak</strong> first (see the{' '}
        <em>Scan</em> section).
      </p>

      <h3>2. Open Flux Calibration</h3>
      <ul>
        <li>
          To start a fresh table: <code>Flux Calibration → New Calibration…</code>
        </li>
        <li>
          To edit an existing one:{' '}
          <code>Flux Calibration → Select Calibration…</code> and pick a{' '}
          <code>.cal</code> file.
        </li>
      </ul>

      <h3>3. Name your calibration</h3>
      <p>
        At the top of the view there's a caption field — <strong>type</strong> a
        descriptive name like <code>"March 2026 — 1.4 GHz"</code>. This is
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
          in Janskies, then <code>OK</code>.
        </li>
      </ol>
      <p className="help-figure-placeholder">
        [Screenshot: fluxcal-add-source.png — known-flux prompt]
      </p>

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
          best-fit slope through (0,0).
        </li>
        <li>
          Read the slope (Jy/GCU) and RMS error from the panel above the
          buttons. A large RMS relative to the slope is a hint that one of
          your calibrators is bad — drop it and refit.
        </li>
      </ol>
      <p className="help-figure-placeholder">
        [Screenshot: fluxcal-fit.png — scatter + magenta fit line]
      </p>
      <p className="help-todo">
        [USER TODO] — Add: how many calibrators is "enough", how to recognize
        a bad calibrator from the scatter, which standard sources are reliable
        at which frequencies.
      </p>

      <h3>6. Save the .cal</h3>
      <p>
        <strong>Click</strong> <code>File → Save As…</code> to write the
        calibration to disk. The filename is by convention something like{' '}
        <code>cal18a.cal</code> (epoch + frequency band code).
      </p>
      <p className="help-figure-placeholder">
        [Screenshot: fluxcal-save.png — Save As dialog with .cal extension]
      </p>

      <p className="help-todo">
        [USER TODO] — Add a "common student mistakes" callout: forgetting to
        run Determine Peak, mixing calibrators across frequencies, throwing
        out good points to make the fit look better.
      </p>
    </section>
  );
}
