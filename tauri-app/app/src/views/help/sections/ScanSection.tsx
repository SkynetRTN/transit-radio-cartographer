/*
 * ============================================================================
 *  HELP CONTENT — Scan section
 * ----------------------------------------------------------------------------
 *  Edit prose freely. Look for [USER TODO] markers for places to add domain
 *  insight. To attach a screenshot, see the comment at the top of
 *  OverviewSection.tsx — same procedure.
 *  Suggested screenshot filenames (drop into ../images/):
 *    scan-load.png, scan-calibrate-brackets.png, scan-cut-segment.png,
 *    scan-select-dec.png, scan-baseline.png, scan-determine-peak.png
 * ============================================================================
 */

export function ScanSection() {
  return (
    <section className="help-section">
      <h2>Scan Workflow</h2>

      <p>
        A <em>scan</em> is a single pass across one source, used mainly to
        measure that source's peak flux. The output (a <code>.scn</code> file)
        can later feed Flux Calibration.
      </p>

      <h3>1. Open the scan</h3>
      <ol>
        <li>
          <strong>Click</strong> <code>File → Open…</code> in the menu bar.
        </li>
        <li>
          Pick a <code>.md1</code> file (raw scan) or a <code>.scn</code> file
          (already calibrated).
        </li>
      </ol>
      <p className="help-figure-placeholder">
        [Screenshot: scan-load.png — File → Open dialog with a .md1 selected]
      </p>

      <h3>2. Inspect what loaded</h3>
      <p>
        Two stacked plots appear: <strong>Flux vs RA</strong> on top and{' '}
        <strong>Declination vs RA</strong> below. The cal-on, cal-off, and
        source samples are colored differently so you can tell where the
        calibration brackets begin and end.
      </p>

      <h3>3. Calibrate the scan</h3>
      <p>
        If you opened a raw <code>.md1</code>, click the{' '}
        <strong>Calibrate Scan</strong> button to enter the bracket-cleaning UI.
      </p>
      <p>Inside the calibration view you'll see four plots:</p>
      <ul>
        <li>Initial-bracket Flux (top left) and Terminal-bracket Flux (top right)</li>
        <li>Initial-bracket Dec (bottom left) and Terminal-bracket Dec (bottom right)</li>
      </ul>
      <p className="help-figure-placeholder">
        [Screenshot: scan-calibrate-brackets.png — the four-pane calibration UI]
      </p>
      <p>The tools here are:</p>
      <ul>
        <li>
          <strong>Cut Segment</strong> — Click the button, then{' '}
          <strong>drag horizontally</strong> across an RA range on either Flux
          plot to delete samples inside that range. Tool stays armed for
          repeated cuts.
        </li>
        <li>
          <strong>Select Declination</strong> — Click the button, then{' '}
          <strong>drag vertically</strong> across a Dec range on either Dec
          plot to keep only cal samples within that band.
        </li>
        <li>
          <strong>Initial / Terminal checkboxes</strong> — Toggle a whole
          bracket off if it's corrupted beyond repair.
        </li>
        <li>
          <strong>Undo</strong> — Reverts the last cut or selection.
        </li>
        <li>
          <strong>Calibrate Scan</strong> — Applies the calibration and returns
          you to the main scan view.
        </li>
      </ul>
      <p className="help-todo">
        [USER TODO] — Add: how to recognize a corrupted bracket, how much
        cleanup is "enough", typical RFI patterns at GBT-20m frequencies.
      </p>

      <h3>4. Clean the source samples</h3>
      <p>
        Back in the main scan view, four sticky tools become available. Each
        button toggles a mode and stays armed until you click it again or
        switch tools.
      </p>

      <h4>4a. Cut Segment</h4>
      <p>
        <strong>Click</strong> the <code>Cut Segment</code> button, then{' '}
        <strong>drag a horizontal range</strong> on the Flux plot. Source
        samples in that RA range are removed.
      </p>
      <p className="help-figure-placeholder">
        [Screenshot: scan-cut-segment.png — drag-rectangle across a glitch]
      </p>

      <h4>4b. Select Declination</h4>
      <p>
        <strong>Click</strong> <code>Select Declination</code>, then{' '}
        <strong>drag a vertical range</strong> on the Declination plot. Only
        source samples whose declination falls inside that band are kept.
      </p>
      <p className="help-figure-placeholder">
        [Screenshot: scan-select-dec.png — vertical drag on the Dec plot]
      </p>

      <h4>4c. Baseline Source</h4>
      <p>
        <strong>Click</strong> <code>Baseline Source</code>, then{' '}
        <strong>click two points</strong> on the Flux plot. A live rubber-band
        line follows your cursor between the first click and the second; the
        line between the two clicks is subtracted from the source, removing a
        background flux.
      </p>
      <p className="help-figure-placeholder">
        [Screenshot: scan-baseline.png — two endpoints with a fitted line]
      </p>

      <h4>4d. Determine Peak</h4>
      <p>
        <strong>Click</strong> <code>Determine Peak</code>, then{' '}
        <strong>drag a horizontal range</strong> across the peak on the Flux
        plot. A Gaussian fit is overlaid in blue, and the peak flux appears
        in the side panel. Adjusting <code>Peak Fit Degree</code> allows for a 2nd, 3rd or 4th 
        degree polynomial fit instead.
      </p>
      <p className="help-figure-placeholder">
        [Screenshot: scan-determine-peak.png — blue fit curve over a source]
      </p>
      <p className="help-todo">
        [USER TODO] — Add: when to use Gaussian vs. polynomial, how wide to
        make the peak range, what a "bad fit" looks like.
      </p>

      <h3>5. Hover and pin</h3>
      <p>
        <strong>Hover</strong> any point to read RA / Dec / Flux in the side
        panel. <strong>Click</strong> a point to pin the readout (a 📌
        indicator appears). <strong>Click empty space</strong> to unpin.
      </p>

      <h3>6. Save your work</h3>
      <p>
        <strong>Click</strong> <code>File → Save As…</code> to write a{' '}
        <code>.scn</code> file. The peak flux is stored in the file header, so
        Flux Calibration can pick it up later without re-opening the scan.
      </p>

      <p className="help-todo">
        [USER TODO] — Add a "common mistakes" callout: cuts that look harmless
        but bias the peak fit, students forgetting to baseline before peak
        fitting, etc.
      </p>
    </section>
  );
}
