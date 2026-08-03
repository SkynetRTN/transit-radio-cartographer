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

import calibrateBracketsShot from '../images/scan-calibrate-brackets.png?url';
import cutSegmentShot from '../images/scan-cut-segment.png?url';
import selectDecShot from '../images/scan-select-dec.png?url';
import baselineShot from '../images/scan-baseline.png?url';
import determinePeakShot from '../images/scan-determine-fit.png?url';

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
        <li>Pre-bracket Flux (top left) and Post-bracket Flux (top right)</li>
        <li>Pre-bracket Dec (bottom left) and Post-bracket Dec (bottom right)</li>
      </ul>
      <figure className="help-figure">
        <img src={calibrateBracketsShot} alt="Four-pane bracket calibration UI" />
        <figcaption>
          The bracket-cleaning UI: Pre- and Post-bracket Flux plots on
          top, their declination plots below.
        </figcaption>
      </figure>
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
          <strong>Pre / Post checkboxes</strong> — Toggle a whole
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
      <figure className="help-figure">
        <img src={cutSegmentShot} alt="Horizontal drag selecting an RA range on the Flux plot" />
        <figcaption>
          Cut Segment: drag a horizontal range on the Flux plot to remove
          source samples in that RA span.
        </figcaption>
      </figure>

      <h4>4b. Select Declination</h4>
      <p>
        <strong>Click</strong> <code>Select Declination</code>, then{' '}
        <strong>drag a vertical range</strong> on the Declination plot. Only
        source samples whose declination falls inside that band are kept.
      </p>
      <figure className="help-figure">
        <img src={selectDecShot} alt="Vertical drag selecting a Dec band on the Declination plot" />
        <figcaption>
          Select Declination: drag a vertical range on the Declination plot to
          keep only source samples within that band.
        </figcaption>
      </figure>

      <h4>4c. Baseline Source</h4>
      <p>
        <strong>Click</strong> <code>Baseline Source</code>, then{' '}
        <strong>click two points</strong> on the Flux plot. A live rubber-band
        line follows your cursor between the first click and the second; the
        line between the two clicks is subtracted from the source, removing a
        background flux.
      </p>
      <figure className="help-figure">
        <img src={baselineShot} alt="Two endpoints with a fitted baseline line on the Flux plot" />
        <figcaption>
          Baseline Source: click two points on the Flux plot; the line between
          them is subtracted to remove background flux.
        </figcaption>
      </figure>

      <h4>4d. Determine Peak</h4>
      <p>
        <strong>Click</strong> <code>Determine Peak</code>, then{' '}
        <strong>drag a horizontal range</strong> across the peak on the Flux
        plot. A Gaussian fit is overlaid in blue, and the peak flux appears
        in the side panel. Adjusting <code>Peak Fit Degree</code> underneath the scan menu allows for a 2nd, 3rd or 4th 
        degree polynomial fit instead.
      </p>
      <figure className="help-figure">
        <img src={determinePeakShot} alt="Blue Gaussian fit curve over a source peak on the Flux plot" />
        <figcaption>
          Determine Peak: drag across the peak on the Flux plot to overlay a
          fit (blue) and read the peak flux in the side panel.
        </figcaption>
      </figure>

      <h3>5. Hover and pin</h3>
      <p>
        <strong>Hover</strong> any point to read RA / Dec / Flux in the side
        panel. <strong>Click</strong> a point to pin the readout (a 📌
        indicator appears). <strong>Click empty space</strong> to unpin.
      </p>

      <h3>6. Save your work</h3>
      <p>
        <strong>Click</strong> <code>File → Save As…</code> to write a{' '}
        <code>.scn</code> file. If you found a peak flux, it will be stored in the file header, so
        Flux Calibration can pick it up later without re-opening the scan. 
      </p>

    </section>
  );
}
