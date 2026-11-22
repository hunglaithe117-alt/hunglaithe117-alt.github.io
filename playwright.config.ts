import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for the Phase 6 T6.1 end-to-end suite.
 *
 * The suite targets the **pre-built static site** (`apps/web/dist`), served by a
 * tiny dependency-free node server (`e2e/serve-dist.mjs`) that Playwright starts
 * via `webServer`. It runs fully offline against the static build; the site has
 * no API, database, or runtime call to stub.
 *
 * Pre-requisite: build the site once before running the suite:
 *   pnpm --filter @blog/web build
 *
 * Override the target/served port with E2E_BASE_URL / E2E_PORT.
 */
const port = Number(process.env.E2E_PORT ?? 4321);
const host = "127.0.0.1";
const baseURL = process.env.E2E_BASE_URL ?? `http://${host}:${port}`;

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",
  outputDir: "./e2e/.artifacts/test-results",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["html", { outputFolder: "e2e/.artifacts/report", open: "never" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Skip the managed server when pointing at an external/staging deployment.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "node e2e/serve-dist.mjs",
        url: `${baseURL}/`,
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
        env: { PORT: String(port), HOST: host },
      },
});
