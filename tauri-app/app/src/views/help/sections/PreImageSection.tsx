/*
 * ============================================================================
 *  HELP CONTENT — Pre-Image section
 * ----------------------------------------------------------------------------
 *  Edit prose freely. Look for [USER TODO] markers for places to add domain
 *  insight. To attach a screenshot, see the comment at the top of
 *  OverviewSection.tsx — same procedure.
 *  Suggested screenshot filenames (drop into ../images/):
 *    preimage-smooth.png, preimage-baseline.png, preimage-align.png,
 *    preimage-makeimage.png
 * ============================================================================
 */

export function PreImageSection() {
  return (
    <section className="help-section">
      <h2>Pre-Image Workflow</h2>

      <p>
        Pre-Image takes all your accepted sweeps and runs three reductions on
        them — smooth, baseline, align — before gridding into a final image.
        The three reductions <strong>must be run in order</strong>, and{' '}
        <strong>Make Image</strong> only enables once all three are done.
      </p>

      <p>
        A 1-pixel preview is generated automatically when you arrive, so you
        can see how the reductions change the result.
      </p>

      <h3>1. Smooth Sweeps</h3>
      <p>
        <strong>Click</strong> <code>Smooth Sweeps</code>. The smoothing window
        is fixed at 5 samples; the preview redraws when it's done. No dialog —
        one click and you're done.
      </p>
      <p className="help-figure-placeholder">
        [Screenshot: preimage-smooth.png — preview before/after smoothing]
      </p>

      <h3>2. Baseline Sweeps</h3>
      <ol>
        <li>
          <strong>Click</strong> <code>Baseline Sweeps</code>.
        </li>
        <li>
          A dialog asks for <strong>Baseline Length (Degrees)</strong>. Default
          is 5°.
        </li>
        <li>
          <strong>Type</strong> a value (or accept the default), then click{' '}
          <code>OK</code>.
        </li>
      </ol>
      <p className="help-figure-placeholder">
        [Screenshot: preimage-baseline.png — baseline length dialog]
      </p>
      <p className="help-todo">
        [USER TODO] — Add: how to pick a baseline length, what changes when
        you increase / decrease it, when 5° is the wrong default.
      </p>

      <h3>3. Align Sweeps</h3>
      <ol>
        <li>
          <strong>Click</strong> <code>Align Sweeps</code>.
        </li>
        <li>
          A dialog asks for <strong>Maximum Declination Shift (Degrees)</strong>.
          Default is 0.5°.
        </li>
        <li>
          <strong>Type</strong> a value, click <code>OK</code>.
        </li>
      </ol>
      <p className="help-figure-placeholder">
        [Screenshot: preimage-align.png — align shift dialog]
      </p>
      <p className="help-todo">
        [USER TODO] — Add: what alignment is correcting for, signs that 0.5°
        is too tight or too loose.
      </p>

      <h3>4. Make Image</h3>
      <ol>
        <li>
          Confirm all three reduction buttons show their "done" state — only
          then does <strong>Make Image</strong> enable.
        </li>
        <li>
          <strong>Click</strong> <code>Make Image</code>.
        </li>
        <li>
          A dialog asks for <strong>Pixel Resolution (Pixels)</strong> — i.e.
          pixels per beam. The default tracks your previous run.
        </li>
        <li>
          <strong>Type</strong> a value, click <code>OK</code>. The final
          gridded image is built and you'll switch to the Image view.
        </li>
      </ol>
      <p className="help-figure-placeholder">
        [Screenshot: preimage-makeimage.png — pixel resolution dialog]
      </p>
      <p className="help-todo">
        [USER TODO] — Add a rule of thumb for pixel resolution at GBT-20m
        beam sizes.
      </p>

      <h3>5. Back to Sweeps (if needed)</h3>
      <p>
        If the preview reveals a bad sweep slipped through, click{' '}
        <strong>Back to Sweeps</strong>. Your sweep acceptances are
        preserved, so you can un-accept just the bad one, fix it, re-accept,
        and come back to redo the reductions.
      </p>
    </section>
  );
}
