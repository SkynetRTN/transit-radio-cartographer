import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// Single source of truth for the app version shown in the About box: read it
// from the Tauri config so it never drifts from the packaged version.
const appVersion: string = JSON.parse(
  readFileSync(new URL("./src-tauri/tauri.conf.json", import.meta.url), "utf-8"),
).version ?? "0.0.0";

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },

  // Two HTML entries: the main app and the standalone tutorial window
  // (opened as a separate native window). Both build into `../dist`.
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL("./index.html", import.meta.url)),
        tutorial: fileURLToPath(new URL("./tutorial.html", import.meta.url)),
      },
    },
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
