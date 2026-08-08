import { useCallback, useMemo } from 'react';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { rpcClient } from '../ipc/client';
import { useFluxCal } from '../state/flux-cal-context';
import { useScan } from '../state/scan-context';
import { PointScatter, type Point, type PointSeries } from '../lib/plots/PointScatter';
import { dataColors } from '../lib/plots/plot-theme';
import { useTheme } from '../state/theme-context';

function promptKnownJy(defaultJy: number, name: string): number | null {
  const raw = window.prompt(`Known flux (Jy) for ${name || 'source'}:`, String(defaultJy));
  if (raw === null) return null;
  const value = Number(raw);
  if (!Number.isFinite(value)) return null;
  return value;
}

export function FluxCalibrationView() {
  const {
    table,
    slope,
    appliedSlope,
    error,
    filePath,
    dirty,
    loading,
    saving,
    rpcError,
    newCalibration,
    addEntry,
    removeEntry,
    refit,
    setCaption,
    applyToWorkspace,
  } = useFluxCal();
  const { overview: scanOverview, handle: scanHandle } = useScan();
  const { theme } = useTheme();
  const dc = useMemo(() => dataColors(theme), [theme]);

  const handleAddFromFile = useCallback(async () => {
    let path: string | null = null;
    try {
      const selected = await openDialog({
        multiple: false,
        directory: false,
        title: 'Add Source from .scn',
        filters: [
          { name: 'Scan (.scn)', extensions: ['scn'] },
          { name: 'All files', extensions: ['*'] },
        ],
      });
      path = typeof selected === 'string' ? selected : null;
    } catch (err) {
      console.error('file dialog failed', err);
      return;
    }
    if (!path) return;
    let peakInfo;
    try {
      peakInfo = await rpcClient.fluxCalReadScnPeak(path);
    } catch (err) {
      // The dialog offers an "All files" filter, so unreadable/corrupt picks
      // are expected — surface the engine's message instead of silently
      // dropping an unhandled rejection.
      window.alert(`Could not read that file as a .scn: ${(err as Error).message}`);
      return;
    }
    if (peakInfo.peak_flux === 0) {
      window.alert(
        `${peakInfo.name || 'this .scn'} has no peak flux in its header. ` +
          'Open it in Scan view and use "Determine Peak" first.',
      );
      return;
    }
    const known = promptKnownJy(peakInfo.default_known_jy, peakInfo.name);
    if (known === null) return;
    await addEntry({
      name: peakInfo.name,
      measured_flux: peakInfo.peak_flux,
      known_flux: known,
    });
  }, [addEntry]);

  const handleAddCurrentScan = useCallback(async () => {
    if (!scanOverview || scanHandle === null || scanOverview.peak_flux === null) return;
    let defaults;
    try {
      defaults = await rpcClient.fluxCalDefaultKnownJy(scanOverview.name);
    } catch (err) {
      window.alert(`Could not look up the default known flux: ${(err as Error).message}`);
      return;
    }
    const known = promptKnownJy(defaults.default_known_jy, scanOverview.name);
    if (known === null) return;
    await addEntry({
      name: scanOverview.name,
      measured_flux: scanOverview.peak_flux,
      known_flux: known,
    });
  }, [addEntry, scanOverview, scanHandle]);

  const canAddCurrentScan =
    scanOverview !== null && scanOverview.peak_flux !== null;

  const scatterSeries = useMemo<PointSeries[]>(() => {
    const points: Point[] =
      table?.entries.map((e) => ({
        x: e.measured_flux,
        y: e.known_flux,
        ra: 0,
        dec: 0,
        flux: e.measured_flux,
      })) ?? [];
    return [{ points, color: dc.seriesSecondary, name: 'calibrators' }];
  }, [table, dc]);

  const fitLine = useMemo(() => {
    if (slope === null || slope === 0 || !table || table.entries.length === 0) return [];
    const maxX = Math.max(...table.entries.map((e) => e.measured_flux), 0);
    if (maxX <= 0) return [];
    return [
      {
        points: [
          { x: 0, y: 0 },
          { x: maxX, y: maxX * slope },
        ],
        color: dc.baseline,
        width: 2,
      },
    ];
  }, [slope, table, dc]);

  if (!table) {
    return (
      <div className="aux-view flux-cal-view" style={{ padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Flux Calibration</h2>
        <p>
          No calibration is loaded. Start a fresh table below, or use{' '}
          <strong>Flux Calibration → Select Calibration…</strong> to open an
          existing <code>.cal</code> file (which applies to your workspace
          right away).
        </p>
        <button onClick={newCalibration}>New Calibration</button>
        {rpcError && <p style={{ color: 'crimson' }}>Error: {rpcError}</p>}
      </div>
    );
  }

  return (
    <div className="aux-view flux-cal-view" style={{ padding: 16 }}>
      <header style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <h2 style={{ margin: 0 }}>Flux Calibration</h2>
        <input
          aria-label="calibration name"
          value={table.caption}
          onChange={(e) => setCaption(e.target.value)}
          style={{ fontSize: 14, padding: '2px 6px', minWidth: 220 }}
        />
        <span style={{ color: 'var(--text-subtle)', fontSize: 12 }}>
          {filePath ?? '(unsaved)'}
          {dirty ? ' *' : ''}
          {loading && ' · loading…'}
          {saving && ' · saving…'}
        </span>
      </header>

      <section style={{ display: 'flex', gap: 24, marginTop: 12 }}>
        <div style={{ flex: '0 0 320px' }}>
          <div style={{ marginBottom: 8 }}>
            <strong>Slope:</strong> {slope === null ? '—' : `${slope.toPrecision(6)} Jy/GCU`}
            <br />
            <strong>Error (RMS):</strong>{' '}
            {error === null ? '—' : `${error.toPrecision(4)} Jy`}
            <br />
            <strong>Entries:</strong> {table.entries.length}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button onClick={() => void handleAddFromFile()}>Add Source from File…</button>
            <button
              onClick={() => void handleAddCurrentScan()}
              disabled={!canAddCurrentScan}
              title={
                canAddCurrentScan
                  ? `Use ${scanOverview!.name} peak = ${scanOverview!.peak_flux}`
                  : 'Open a scan and run Determine Peak first'
              }
            >
              Add Current Scan as Source
            </button>
            <button
              onClick={() => void refit()}
              disabled={table.entries.length < 1}
            >
              Fit Calibration
            </button>
            {/* BUG-004 (dan): fitting alone doesn't touch the workspace — this
                button is what pushes the current fit into it. */}
            <button
              onClick={() => void applyToWorkspace()}
              disabled={slope === null || slope === 0}
              title={
                slope === null || slope === 0
                  ? 'Fit a calibration line first'
                  : 'Apply this calibration to the open survey / scan / image'
              }
            >
              {appliedSlope !== null && appliedSlope === slope
                ? 'Applied to Workspace ✓'
                : 'Apply to Workspace'}
            </button>
          </div>
          <table
            style={{
              marginTop: 16,
              borderCollapse: 'collapse',
              fontSize: 13,
              width: '100%',
            }}
          >
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '4px 6px' }}>Name</th>
                <th style={{ padding: '4px 6px', textAlign: 'right' }}>Measured (GCU)</th>
                <th style={{ padding: '4px 6px', textAlign: 'right' }}>Known (Jy)</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {table.entries.map((entry, i) => (
                <tr key={`${entry.name}-${i}`}>
                  <td style={{ padding: '4px 6px' }}>{entry.name}</td>
                  <td style={{ padding: '4px 6px', textAlign: 'right' }}>
                    {entry.measured_flux.toPrecision(4)}
                  </td>
                  <td style={{ padding: '4px 6px', textAlign: 'right' }}>
                    {entry.known_flux.toPrecision(4)}
                  </td>
                  <td style={{ padding: '4px 6px' }}>
                    <button
                      aria-label={`remove ${entry.name}`}
                      onClick={() => void removeEntry(i)}
                      style={{ fontSize: 11 }}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
              {table.entries.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: 12, color: 'var(--text-subtle)', textAlign: 'center' }}>
                    Add at least one calibration source to fit.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <PointScatter
            series={scatterSeries}
            xAxisLabel="Measured (GCU)"
            yAxisLabel="Known (Jy)"
            overlayLines={fitLine}
            height={360}
            testId="flux-cal-scatter"
          />
        </div>
      </section>

      {rpcError && (
        <p style={{ color: 'crimson', marginTop: 12 }}>Error: {rpcError}</p>
      )}
    </div>
  );
}

// Backwards-compatible re-export for any callers still importing the old name.
export const CalibrationView = FluxCalibrationView;
