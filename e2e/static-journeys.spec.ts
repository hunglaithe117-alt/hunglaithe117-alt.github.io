/**
 * Static journeys (T6.1) — REAL pages, served from the built output.
 *
 * Covers the critical reading journey end to end against the built static site:
 *   home -> search (Pagefind) -> open a post -> language switch.
 *
 * Test names follow `test_<unit>_<scenario>_<expected_result>` (code-style.md).
 */
import { expect, test } from "./fixtures";

test.describe("static journeys (real static build)", () => {
  test("test_root_redirect_default_locale_vi_home", async ({ page }) => {
    await page.goto("/");
    // Astro emits a meta-refresh redirect page for `/` -> `/vi/` (default locale).
    await expect(page).toHaveURL(/\/vi\/$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Chuquanpho29");
  });

  test("test_home_to_search_pagefind_query_opens_post", async ({ page }) => {
    // 1. Home (real).
    await page.goto("/en/");
    await expect(page).toHaveURL(/\/en\/$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Chuquanpho29");

    // 2. Home -> search page (real, JS-disabled-safe <a>).
    await page.locator('main a[href="/en/search/"]').click();
    await expect(page).toHaveURL(/\/en\/search\/$/);

    // 3. Pagefind Component UI loads client-side and upgrades to a real <input>.
    const input = page.locator("pagefind-input input");
    await expect(input).toBeVisible();
    await input.fill("hello");

    // 4. Pagefind returns the matching post (real index, queried offline).
    const result = page.locator("pagefind-results a.pf-result-link", { hasText: "Hello world" });
    await expect(result.first()).toBeVisible();

    // 5. Open the post from the result.
    await result.first().click();
    await expect(page).toHaveURL(/\/en\/posts\/hello-world\/?$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hello world");
  });

  test("test_language_switch_home_en_to_vi_same_page", async ({ page }) => {
    await page.goto("/en/");
    await page.locator("header a.lang-switch:visible").first().click();
    await expect(page).toHaveURL(/\/vi\/$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Chuquanpho29");
  });

  test("test_language_switch_post_uses_paired_translation", async ({ page }) => {
    await page.goto("/en/posts/hello-world/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hello world");

    await page.locator("header a.lang-switch:visible").first().click();
    // The switcher resolves to the post's paired translation, not the locale home.
    await expect(page).toHaveURL(/\/vi\/posts\/hello-world\/?$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Xin chào");
  });
});
