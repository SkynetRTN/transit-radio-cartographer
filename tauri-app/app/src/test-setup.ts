import '@testing-library/jest-dom';

// BUG-012: MainWindow subscribes to a Tauri `engine_restarted` event on mount
// (the sidecar-restart recovery path). Outside the Tauri runtime there is no
// `window.__TAURI_INTERNALS__`, so the real `listen` rejects and pollutes
// every test that renders MainWindow. A no-op default keeps Vitest output
// clean; tests that need to drive the event override this with their own
// `vi.mock('@tauri-apps/api/event', …)`.
vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(() => Promise.resolve(() => {})),
}));
