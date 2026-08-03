/*
 * ============================================================================
 *  HELP CONTENT — Overview section
 * ----------------------------------------------------------------------------
 *  Edit the text below to refine wording.
 *  To drop in screenshots:
 *    1. Save a PNG to ../images/ (e.g. ../images/overview-task-bar.png).
 *    2. Add `import shot from '../images/overview-task-bar.png?url';` at top.
 *    3. Use `<figure className="help-figure"><img src={shot} alt="..."/>
 *       <figcaption>...</figcaption></figure>` in the JSX below.
 *  Look for [USER TODO] markers — those are places to add domain wisdom.
 * ============================================================================
 */

import type { HelpSectionId } from '../types';

interface Props {
  onJump: (section: HelpSectionId) => void;
}

export function OverviewSection({ onJump }: Props) {
  return (
    <section className="help-section">
      <h2>Welcome to Transit Radio Cartographer</h2>

      <p>
        Transit Radio Cartographer builds radio maps from Green Bank 20m data: it
        calibrates, cleans, and grids individual sweeps into a final image. This
        built-in tutorial walks through each stage of the workflow. Note, sometimes 
        you pull up another window while the tutorial is open, you may need to minimize
        and then maximize the Radio Cartographer window to see the tutorial again.
      </p>

      <h3>The five workflows</h3>

      <p>
        Jump straight to the workflow you need. Each section is a step-by-step
        walkthrough with screenshots.
      </p>

      <ul className="help-jump-list">
        <li>
          <button onClick={() => onJump('scan')}>Scan</button> — Open and
          measure a single source (.md1 → .scn).
        </li>
        <li>
          <button onClick={() => onJump('survey')}>Survey</button> — Open a
          multi-sweep survey, remove RFI, and accept sweeps (.md2 → .srv).
        </li>
        <li>
          <button onClick={() => onJump('pre-image')}>Pre-Image</button> —
          Smooth, baseline, align, and grid accepted sweeps into an image.
        </li>
        <li>
          <button onClick={() => onJump('image')}>Image</button> — Adjust
          palettes, inspect flux, and save the final image.
        </li>
        <li>
          <button onClick={() => onJump('flux-cal')}>Flux Calibration</button>{' '}
          — Build a measured-to-Jy calibration from known sources (.cal).
        </li>
      </ul>

      <h3>File types at a glance</h3>

      <table className="help-table">
        <thead>
          <tr>
            <th>Extension</th>
            <th>What it is</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>.md1</td>
            <td>Raw single scan from the telescope.</td>
          </tr>
          <tr>
            <td>.md2</td>
            <td>Raw multi-sweep survey from the telescope.</td>
          </tr>
          <tr>
            <td>.scn</td>
            <td>
              Processed scan (calibrated; may include a measured peak flux).
            </td>
          </tr>
          <tr>
            <td>.srv</td>
            <td>
              Processed survey (calibrated; per-sweep acceptance state
              preserved).
            </td>
          </tr>
          <tr>
            <td>.img</td>
            <td>Gridded survey image (binary raster produced from a survey).</td>
          </tr>
          <tr>
            <td>.cal</td>
            <td>Flux calibration table (measured-vs-known fit).</td>
          </tr>
        </tbody>
      </table>

      <h3>UI conventions used everywhere</h3>

      <ul>
        <li>
          <strong>Drag on a plot</strong> selects a range (for cutting,
          declination filtering, peak fitting, or restoring removed samples).
        </li>
        <li>
          <strong>Click a point</strong> pins the readout (📌) or sets an
          endpoint when a two-click tool (like Baseline Source or Remove RFI)
          is armed.
        </li>
        <li>
          <strong>Click empty space</strong> unpins or cancels a pending
          endpoint.
        </li>
        <li>
          <strong>Hover</strong> a point to see RA / Dec / Flux in the side
          panel.
        </li>
        <li>
          <strong>Undo</strong> reverts the most recent cut, removal, or
          restore.
        </li>
        <li>
          Tools are <strong>sticky</strong>: they stay armed after each
          operation so you can repeat without re-clicking the button.
        </li>
      </ul>

    </section>
  );
}
