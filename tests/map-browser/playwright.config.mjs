import { fileURLToPath } from "node:url";
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: ".", testMatch: "*.browser.mjs", workers: 1,
  outputDir: "../../test-results/map-browser",
  use: { baseURL: "http://127.0.0.1:3186", viewport: { width: 390, height: 844 }, channel: "chrome", headless: true },
  webServer: { cwd: fileURLToPath(new URL("../../", import.meta.url)), command: "node tests/map-browser/server.mjs", url: "http://127.0.0.1:3186", reuseExistingServer: false },
});
