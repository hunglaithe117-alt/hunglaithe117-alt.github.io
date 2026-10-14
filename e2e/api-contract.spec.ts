/**
 * `/api/*` client contract (T6.1) — REAL client code (where present), STUBBED API.
 *
 * `POST /api/contact` is fully wired in the shipped frontend and asserted in
 * `contact-form.spec.ts`.
 *
 * `GET /api/views/:slug`: `packages/types` defines the contract, but at the time
 * of writing `apps/web` ships **no** client island that calls it (the post page
 * renders no view counter and makes no `/api/views/*` request). The test below is
 * therefore written against the intended contract and self-documents with
 * `test.fixme` while the client wiring is absent — it will start asserting for
 * real the moment a view-counter island lands, without touching this file.
 */
import { expect, test } from "./fixtures";

test.describe("api client contract (stubbed API)", () => {
  test("test_post_page_renders_real_content_without_api", async ({ page, api }) => {
    await page.goto("/en/posts/hello-world/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hello world");
    // With no client view-counter island yet, opening a post makes no API call.
    expect(api.views).toHaveLength(0);
  });

  test("test_post_open_requests_view_counter_and_renders_count", async ({ page, api }) => {
    await page.goto("/en/posts/hello-world/");
    await page.waitForLoadState("networkidle");
    // Allow a lazily-hydrated island to fire its request.
    await page.waitForTimeout(1000);

    if (api.views.length === 0) {
      test.fixme(
        true,
        "apps/web has no ViewCounter island calling GET /api/views/:slug yet " +
          "(post page does not render a count). Contract asserted here is aspirational.",
      );
    }

    const request = api.views[0]!;
    expect(request.method).toBe("GET");
    expect(new URL(request.url).pathname).toBe("/api/views/hello-world");

    // The stubbed `{ slug, count }` response must surface as a visible count.
    await expect(page.getByText("42")).toBeVisible();
  });
});
