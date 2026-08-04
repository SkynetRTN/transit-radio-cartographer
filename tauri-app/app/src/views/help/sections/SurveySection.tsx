/*
 * ============================================================================
 *  HELP CONTENT — Survey section
 * ----------------------------------------------------------------------------
 *  Edit prose freely. Look for [USER TODO] markers for places to add domain
 *  insight. To attach a screenshot, see the comment at the top of
 *  OverviewSection.tsx — same procedure.
 *  Suggested screenshot filenames (drop into ../images/):
 *    survey-load.png, survey-calibrate-brackets.png, survey-remove-rfi.png,
 *    survey-removed-restore.png, survey-accept-sweep.png
 * ============================================================================
 */

import calibrateBracketsShot from '../images/survey-calibrate-brackets.png?url';
import removeRfiShot from '../images/survey-remove-rfi.png?url';
import removedRestoreShot from '../images/survey-removed-restore-real.png?url';

export function SurveySection() {
  return (
    <section className="help-section">
      <h2>Survey Workflow</h2>

      <p>
        A <em>survey</em> is many sweeps over a patch of sky. The workflow is
        to calibrate, then walk through each sweep removing RFI, then move on
        to Pre-Image once every sweep is accepted.
      </p>

      <h3>1. Open the survey</h3>
      <ol>
        <li>
          <strong>Click</strong> <code>File → Open…</code> in the menu bar.
        </li>
        <li>
          Pick a <code>.md2</code> file (raw) or a <code>.srv</code> file (in
          progress / partially accepted).
        </li>
      </ol>

      <h3>2. Calibrate the survey</h3>
      <p>
        If the file is uncalibrated, click <strong>Calibrate Survey</strong>.
        The bracket-cleaning UI is the <em>same</em> as Calibrate Scan: Cut
        Segment (horizontal drag), Select Declination (vertical drag), toggle
        Pre / Post, Undo, then click <strong>Calibrate Survey</strong>{' '}
        to apply.
      </p>
      <figure className="help-figure">
        <img src={calibrateBracketsShot} alt="The two-bracket survey calibration UI" />
        <figcaption>
          The bracket-cleaning UI for a survey — the same Pre/Post bracket tools
          as Calibrate Scan.
        </figcaption>
      </figure>

      <h3>3. Sweep-by-sweep RFI removal</h3>
      <p>
        Each sweep has its own Flux plot (top) and Declination plot. At the
        bottom, the <strong>Removed plot</strong> shows samples you've taken
        out — empty until you remove something. You'll want to remove sharp dropouts
        and other artifacts. For each sweep:
      </p>
      <ol>
        <li>
          <strong>Click</strong> <code>Remove RFI</code>. The button label
          changes to <code>Remove RFI (click…)</code> to confirm it's armed.
        </li>
        <li>
          <strong>Click one endpoint</strong> on the Flux plot. A pending
          marker appears.
        </li>
        <li>
          <strong>Click a second endpoint.</strong> A line is drawn between the
          two points and samples inside that declination band are moved to the
          Removed plot. The tool stays armed so you can keep removing.
        </li>
      </ol>
      <figure className="help-figure">
        <img src={removeRfiShot} alt="Two endpoints marking a declination band on the Flux plot" />
        <figcaption>
          A Remove RFI line drawn between two endpoints; samples in that
          declination band move down to the Removed plot.
        </figcaption>
      </figure>
      <p>
        <strong>Hover</strong> any point to read its RA, Dec, and flux in the
        side readout, and <strong>click</strong> a point to pin those values (a
        📌 appears; click empty space to release). The readout keeps updating as
        you click, even while <code>Remove RFI</code> is armed, so you can check
        exactly which samples a band will take out before committing.
      </p>

      <h4>3a. Undo a removal by re-drawing the baseline</h4>
      <p>
        The Flux plot and the Removed plot always add up to the original data —
        removing RFI just moves structure from the top plot down to the bottom
        one. Restoring works the same way in reverse, and it isn't a &ldquo;put
        the samples back&rdquo; button: you <strong>draw a new baseline line
        across the Removed plot</strong> and the two plots re-split along it.
      </p>
      <p>
        With <code>Remove RFI</code> still armed (and at least one sample already
        removed), use the same two-click gesture on the bottom panel: click one
        endpoint, then a second. The line is free, not snapped to a sample. For
        every removed sample whose declination falls inside the line's span, the
        removed residual is laid onto the line you drew and the part above the
        line flows back into the Flux plot:
      </p>
      <ul>
        <li>
          Draw the line <strong>along zero</strong> to send the full residual
          back to the flux — this is the case that reproduces the original
          samples.
        </li>
        <li>
          Draw it <strong>through the removed points</strong> to leave them as
          they are (nothing moves).
        </li>
        <li>
          Draw it <strong>anywhere between</strong> to split the difference —
          the flux keeps what sits above your line, the Removed plot keeps the
          rest.
        </li>
      </ul>
      <p>
        <code>Undo</code> also reverts the most recent removal or restore.
      </p>
      <figure className="help-figure">
        <img src={removedRestoreShot} alt="A baseline line drawn across the Removed plot" />
        <figcaption>
          Drawing a baseline line across the Removed plot re-splits the samples
          between the Flux and Removed plots.
        </figcaption>
      </figure>

      <h4>3b. Accept the sweep</h4>
      <p>
        When the sweep looks clean, click <strong>Accept Sweep</strong>. The
        sweep is marked accepted (a tag appears next to the file name and sweep number) and pending
        edits are committed. When you click <strong>Accept Sweep</strong> it will
        automatically advance to the next unaccepted sweep.
      </p>
      <p>
        Accepting isn't final — you can navigate back to an accepted sweep and
        its removed samples are still shown on the Removed plot. Remove more RFI
        or draw a baseline to restore points just as before; the accept button
        now reads <strong>Apply Edits</strong> and re-commits your changes
        without un-accepting the sweep. (This history is per session: it lasts
        while the survey is open, but reopening a saved <code>.srv</code> starts
        each sweep from its committed flux with an empty Removed plot.)
      </p>

      <h3>4. Navigate sweeps</h3>
      <p>
        Use the <strong>Prev</strong> / <strong>Next</strong> buttons or{' '}
        <strong>type a sweep number</strong> in the sweep input field — these
        just move between sweeps and do <em>not</em> accept anything. This allows you to
        navigate between sweeps without committing changes. The
        progress indicator <code>N / M sweeps accepted</code> updates live.
      </p>
      <p>
        <strong>Keyboard shortcuts</strong> (active whenever the sweep-number
        field isn't focused): <code>←</code> moves to the previous sweep, and{' '}
        <code>→</code> <em>accepts</em> the current sweep and advances once the
        survey is calibrated (before calibration it just moves forward).
      </p>
      <p>
        Accepting a sweep jumps you to the next <em>unaccepted</em> one and wraps
        around — so if you accept out of order, accepting the last sweep loops
        back to the first sweep you still need to finish. That wrap is how you
        track down any stragglers before the image can be built.
      </p>

      <h3>5. Save partway through (optional)</h3>
      <p>
        Click <code>File → Save As…</code> to write a <code>.srv</code>. You
        can come back later, reopen the <code>.srv</code>, and resume on the
        next unaccepted sweep. Note that if you save a <code>.srv</code> upon 
        re-open you can no longer be able to restore removed points from previously
        accepted sweeps. You will still be able to return to the accepted sweeps and
        remove more points.
      </p>

      <h3>6. Move on to imaging</h3>
      <p>
        Once <em>all</em> sweeps are accepted, the{' '}
        <strong>Create Pre-Image</strong> button enables. Click it to continue
        to the Pre-Image stage.
      </p>

    </section>
  );
}
