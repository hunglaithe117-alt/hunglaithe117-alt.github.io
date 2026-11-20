/**
 * Static journeys (T6.1) — REAL pages, served from the built output.
 *
 * Covers the critical reading journey end to end against the built static site:
 *   home (post list) -> header search dropdown (Pagefind) -> open a post -> language switch -> theme toggle.
 *
 * Test names follow `test_<unit>_<scenario>_<expected_result>` (code-style.md).
 */
import { expect, test } from "./fixtures";

test.describe("static journeys (real static build)", () => {
  test("test_root_redirect_default_locale_vi_home", async ({ page }) => {
    await page.goto("/");
    // Astro emits a meta-refresh redirect page for `/` -> `/vi/` (default locale).
    await expect(page).toHaveURL(/\/vi\/$/);
    await expect(page.locator("main ul.post-list")).toBeVisible();
    await expect(page.locator("header a.site-name")).toHaveText("Chuquanpho29");
    await expect(page.locator("main header h1")).toHaveCount(0);
  });

  test("test_home_to_search_dropdown_pagefind_query_opens_post", async ({ page }) => {
    // 1. Home (real) — post list directly, no hero or bottom search/all-posts links.
    await page.goto("/en/");
    await expect(page).toHaveURL(/\/en\/$/);
    await expect(page.locator("main ul.post-list")).toBeVisible();
    await expect(page.locator('main a[href="/en/search/"]')).toHaveCount(0);

    // 2. Open header search dropdown from the search icon.
    const searchTrigger = page.locator('header button[aria-controls="header-search-dropdown"]');
    await searchTrigger.click();
    const dropdown = page.locator("#header-search-dropdown");
    await expect(dropdown).toBeVisible();

    // 3. Pagefind Component UI loads client-side and upgrades to a real <input>.
    const input = dropdown.locator("pagefind-input input");
    await expect(input).toBeVisible();
    await input.fill("hello");

    // 4. Pagefind returns the matching post (real index, queried offline).
    const result = dropdown.locator("pagefind-results a.pf-result-link", {
      hasText: "Hello world",
    });
    await expect(result.first()).toBeVisible();

    // 5. Open the post from the result.
    await result.first().click();
    await expect(page).toHaveURL(/\/en\/posts\/hello-world\/?$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hello world");
  });

  test("test_search_dropdown_closes_on_escape_and_outside_click", async ({ page }) => {
    await page.goto("/en/");
    const searchTrigger = page.locator('header button[aria-controls="header-search-dropdown"]');
    const dropdown = page.locator("#header-search-dropdown");

    await expect(
      page.locator("astro-island", {
        has: page.locator('button[aria-controls="header-search-dropdown"]'),
      }),
    ).not.toHaveAttribute("ssr", "");
    await searchTrigger.click();
    await expect(dropdown).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dropdown).toBeHidden();

    await searchTrigger.click();
    await expect(dropdown).toBeVisible();

    await page.locator("main").click({ position: { x: 10, y: 10 } });
    await expect(dropdown).toBeHidden();
  });

  test("test_theme_toggle_switches_data_theme_and_aria_pressed", async ({ page }) => {
    await page.goto("/en/");
    const toggle = page.locator("[data-theme-toggle]");
    const initialTheme = await page.evaluate(() => document.documentElement.dataset.theme);

    await toggle.click();
    const nextTheme = await page.evaluate(() => document.documentElement.dataset.theme);
    expect(nextTheme).not.toBe(initialTheme);
    await expect(toggle).toHaveAttribute("aria-pressed", String(nextTheme === "dark"));
  });

  test("test_language_switch_home_en_to_vi_same_page", async ({ page }) => {
    await page.goto("/en/");
    await page.locator("header a.lang-switch:visible").first().click();
    await expect(page).toHaveURL(/\/vi\/$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "vi-VN");
    await expect(page.locator("main ul.post-list")).toBeVisible();
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
