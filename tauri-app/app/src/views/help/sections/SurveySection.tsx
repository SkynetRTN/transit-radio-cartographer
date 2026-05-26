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
      <p className="help-figure-placeholder">
        [Screenshot: survey-load.png — File → Open dialog with .md2 selected]
      </p>

      <h3>2. Calibrate the survey</h3>
      <p>
        If the file is uncalibrated, click <strong>Calibrate Survey</strong>.
        The bracket-cleaning UI is the <em>same</em> as Calibrate Scan: Cut
        Segment (horizontal drag), Select Declination (vertical drag), toggle
        Initial / Terminal, Undo, then click <strong>Calibrate Survey</strong>{' '}
        to apply.
      </p>
      <p className="help-figure-placeholder">
        [Screenshot: survey-calibrate-brackets.png — the two-bracket cal UI]
      </p>
      <p className="help-todo">
        [USER TODO] — Note any survey-specific calibration quirks vs. scan.
      </p>

      <h3>3. Sweep-by-sweep RFI removal</h3>
      <p>
        Each sweep has its own Flux plot (top) and Declination plot. At the
        bottom, the <strong>Removed plot</strong> shows samples you've taken
        out — empty until you remove something. For each sweep:
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
      <p className="help-figure-placeholder">
        [Screenshot: survey-remove-rfi.png — two endpoints with a band marked]
      </p>

      <h4>3a. Restore removed samples</h4>
      <p>
        Made a mistake? <strong>Drag a declination range on the Removed
        plot</strong> to put those samples back into the sweep. <code>Undo</code>{' '}
        also reverts the most recent removal or restore.
      </p>
      <p className="help-figure-placeholder">
        [Screenshot: survey-removed-restore.png — drag on the Removed plot]
      </p>

      <h4>3b. Accept the sweep</h4>
      <p>
        When the sweep looks clean, click <strong>Accept Sweep</strong>. The
        sweep is marked accepted (a tag appears in the side panel) and pending
        edits are committed.
      </p>
      <p className="help-figure-placeholder">
        [Screenshot: survey-accept-sweep.png — side panel showing accepted tag]
      </p>

      <h3>4. Navigate sweeps</h3>
      <p>
        Use the <strong>Prev</strong> / <strong>Next</strong> buttons or{' '}
        <strong>type a sweep number</strong> in the sweep input field. Using <strong>Prev</strong> / <strong>Next</strong> buttons or{' '}
        <strong>typing a sweep number</strong> in the sweep input field does not accept sweeps. The
        progress indicator <code>N / M sweeps accepted</code> updates live.
      </p>

      <h3>5. Save partway through (optional)</h3>
      <p>
        Click <code>File → Save As…</code> to write a <code>.srv</code>. You
        can come back later, reopen the <code>.srv</code>, and resume on the
        next unaccepted sweep.
      </p>

      <h3>6. Move on to imaging</h3>
      <p>
        Once <em>all</em> sweeps are accepted, the{' '}
        <strong>Create Pre-Image</strong> button enables. Click it to continue
        to the Pre-Image stage.
      </p>

      <p className="help-todo">
        [USER TODO] — Add: what RFI vs. real sources look like, common student
        mistakes (accepting too fast, removing real flux), how aggressive to be
        with declination bands.
      </p>
    </section>
  );
}
