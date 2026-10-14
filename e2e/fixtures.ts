/**
 * Shared Playwright fixtures + `/api/*` stubs for the T6.1 E2E suite.
 *
 * REAL vs STUBBED
 * ---------------
 * - Pages (HTML, Pagefind index, islands, assets) are **real** — served from the
 *   built `apps/web/dist`.
 * - Every `/api/*` call is **stubbed** with `page.route`. The deployed Cloudflare
 *   Worker + Go API are not available in this environment, so the tests assert the
 *   *client* contract (method, URL, JSON body) and how the UI reacts to a canned
 *   response. No real backend, database or email service is touched.
 *
 * Wire shapes come from `packages/types/index.ts`:
 *   POST /api/contact   -> ContactRequest { name, email, body }
 *                          ContactResponse { id, ok }
 *   GET  /api/views/:slug -> ViewResponse { slug, count }
 *   errors                -> ApiError { error }
 */
import { test as base, expect } from "@playwright/test";

export interface RecordedRequest {
  url: string;
  method: string;
  body: unknown;
}

export interface ApiRecorder {
  /** Observed POST /api/contact requests. */
  contact: RecordedRequest[];
  /** Observed GET /api/views/:slug requests. */
  views: RecordedRequest[];
  /** Mutable per-test override for the stubbed POST /api/contact status. */
  contactStatus: number;
}

function pathOf(rawUrl: string): string {
  return new URL(rawUrl).pathname;
}

export const test = base.extend<{ api: ApiRecorder }>({
  api: async ({ page }, use) => {
    const api: ApiRecorder = { contact: [], views: [], contactStatus: 200 };

    // POST /api/contact -> stubbed.
    await page.route("**/api/contact", async (route) => {
      const request = route.request();
      api.contact.push({
        url: request.url(),
        method: request.method(),
        body: request.postDataJSON(),
      });
      const ok = api.contactStatus < 400;
      await route.fulfill({
        status: api.contactStatus,
        contentType: "application/json",
        body: JSON.stringify(ok ? { id: "stub-contact-1", ok } : { error: "stub failure" }),
      });
    });

    // GET /api/views/:slug -> stubbed.
    await page.route("**/api/views/**", async (route) => {
      const request = route.request();
      api.views.push({ url: request.url(), method: request.method(), body: null });
      const slug = pathOf(request.url()).split("/").filter(Boolean).pop() ?? "";
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ slug, count: 42 }),
      });
    });

    await use(api);
  },
});

export { expect };
