/**
 * `/api/*` client contract (T6.1) — REAL client code, STUBBED API.
 *
 * `POST /api/contact` is fully wired in the shipped frontend and asserted in
 * `contact-form.spec.ts`.
 *
 * `GET /api/views/:slug`: the `ViewCounter` island (`packages/ui/ViewCounter.vue`) is
 * wired into the post page (`client:visible`) and fires exactly one request after
 * hydration. The stub below returns `{ slug, count }` for the requested slug.
 */
import { expect, test } from "./fixtures";

test.describe("api client contract (stubbed API)", () => {
  test("test_post_page_renders_real_content", async ({ page }) => {
    await page.goto("/en/posts/hello-world/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hello world");
  });

  test("test_post_open_requests_view_counter_and_renders_count", async ({ page, api }) => {
    await page.goto("/en/posts/hello-world/");
    await page.waitForLoadState("networkidle");
    // The `client:visible` island hydrates after load — poll for its request.
    await expect.poll(() => api.views.length, { timeout: 5000 }).toBeGreaterThan(0);

    const request = api.views[0]!;
    expect(request.method).toBe("GET");
    expect(new URL(request.url).pathname).toBe("/api/views/hello-world");

    // The stubbed `{ slug, count }` response must surface as a visible count.
    await expect(page.getByText("42")).toBeVisible();
  });
});
