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
        Back in the main scan view the source-reduction tools sit in the side
        panel. They stay visible but <strong>grayed out until the scan is
        calibrated</strong> (hover a grayed button to see why). Once calibrated,
        each button toggles a mode and stays armed until you click it again or
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

      <h4>4b. Rescale</h4>
      <p>
        Cut samples stay on the plot as faded markers, so a strong RFI spike
        can keep dominating the flux scale even after you cut it.{' '}
        <strong>Click</strong> <code>Rescale</code> to fit the flux axis to the{' '}
        <em>kept</em> samples only — the source pops into view. The button stays
        lit while active and re-fits automatically after each further cut;{' '}
        <strong>click it again</strong> to return to the full scale.
      </p>

      <h4>4c. Select Declination</h4>
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

      <h4>4d. Baseline Source</h4>
      <p>
        <strong>Click</strong> <code>Baseline Source</code>, then{' '}
        <strong>click two points anywhere</strong> on the Flux plot — the
        endpoints are free-floating and are <em>not</em> limited to data points,
        so you can place the line above the samples. A live rubber-band line
        follows your cursor between the first click and the second; the line
        between the two clicks is subtracted from the source, removing a
        background flux.
      </p>
      <figure className="help-figure">
        <img src={baselineShot} alt="Two endpoints with a fitted baseline line on the Flux plot" />
        <figcaption>
          Baseline Source: click two points on the Flux plot; the line between
          them is subtracted to remove background flux.
        </figcaption>
      </figure>

      <h4>4e. Determine Peak</h4>
      <p>
        <strong>Click</strong> <code>Determine Peak</code>, then{' '}
        <strong>drag a horizontal range over the peak only</strong> on the Flux
        plot. By default a <strong>2nd-degree polynomial</strong> is fit and its
        maximum becomes the peak flux (shown in the side panel). Keep the drag
        tight around the peak so the fit isn't pulled by the wings. To change the
        model, click <code>Change Peak Fit…</code> in the side panel — you can
        pick a 2nd/3rd/4th-degree polynomial, a Gaussian, a squared cosine, or
        the raw max value.
      </p>
      <figure className="help-figure">
        <img src={determinePeakShot} alt="Blue Gaussian fit curve over a source peak on the Flux plot" />
        <figcaption>
          Determine Peak: drag across the peak on the Flux plot to overlay a
          fit (blue) and read the peak flux in the side panel.
        </figcaption>
      </figure>

      <h4>4f. Append Scan</h4>
      <p>
        Once the scan is calibrated you can <code>Scan → Append Scan…</code> to
        pull another <code>.scn</code>'s samples straight onto the current plot.
        This is a plain overlay — the appended points are added to the track as-is
        (no regridding) — so you can build up coverage of the same source from
        several scans before determining the peak. <strong>Undo</strong> removes
        the most recent append.
      </p>

      <h3>5. Hover and pin</h3>
      <p>
        <strong>Hover</strong> any point to read RA / Dec / Flux in the side
        panel. <strong>Click</strong> a point to pin the readout (a 📌
        indicator appears). <strong>Click empty space</strong> to unpin.
      </p>

      <h3>6. Save your work</h3>
      <p>
        <strong>Click</strong> <code>Scan → Save Scan As…</code> to write a{' '}
        <code>.scn</code> file. Saving is only enabled once the scan is
        calibrated (the Save items stay grayed with a "must calibrate before
        saving" note until then). If you found a peak flux, it is stored in the
        file header, so Flux Calibration can pick it up later without re-opening
        the scan.
      </p>

    </section>
  );
}
