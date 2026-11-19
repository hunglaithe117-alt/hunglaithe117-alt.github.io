/**
 * Shared Playwright entry point for the T6.1 E2E suite.
 *
 * The suite exercises the **real** built static site (`apps/web/dist`) served by
 * `serve-dist.mjs`; it makes no network calls outside that origin, so the specs
 * re-export Playwright's own `test`/`expect` rather than stubbing the app.
 */
export { expect, test } from "@playwright/test";
