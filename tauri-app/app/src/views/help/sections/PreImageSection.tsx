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
        The preview is built at the default pixel size (<code>0.06°</code>) when
        you click <strong>Create Pre-Image</strong>, so you can see how the
        reductions change the result. It's color-scaled to the data's actual
        min→max and drawn without gridlines. <strong>Drag a box</strong> on the
        preview to zoom into a region (the axes fit exactly what you draw, at the
        correct sky proportions) and <strong>double-click</strong> to reset to the
        full view; this is handy for checking whether a reduction cleaned up a
        particular patch of sky.
      </p>

      <h3>1. Smooth Sweeps</h3>
      <p>
        <strong>Click</strong> <code>Smooth Sweeps</code>. The smoothing window
        is fixed at 5 samples; the preview redraws when it's done. No dialog —
        one click and you're done.
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
          A dialog asks for <strong>Pixel size (degrees)</strong> — the on-sky
          size of each output pixel. The default <code>0.06°</code> is 1/20 of
          the 40 ft beam (1.2°). <strong>Smaller is finer:</strong> a smaller
          value gives more, finer pixels; a larger value coarsens the grid into
          fewer, blockier pixels. The default tracks your previous run.
        </li>
        <li>
          <strong>Type</strong> a value, click <code>OK</code>. The final
          gridded image is built and you'll switch to the Image view.
        </li>
      </ol>

      <h3>5. Back to Sweeps (if needed)</h3>
      <p>
        If the preview reveals some RFI slipped through, click{' '}
        <strong>Back to Sweeps</strong>. Your sweep acceptances are preserved,
        and the sweeps now show the <em>processed</em> data — if you've already
        smoothed / baselined / aligned, those reductions are reflected in the
        per-sweep plots. Fix the sweep, hit <code>Apply Edits</code>, then press{' '}
        <strong>Create Pre-Image</strong> again to rebuild. The reduction
        progress persists, so you don't have to re-run the whole pipeline just to
        get back to <code>Make Image</code>.
      </p>
    </section>
  );
}
