/**
 * Static journeys — end-to-end tests against the built static site:
 *   root home (unified post list) -> header search dropdown (Pagefind) -> open post
 *   -> per-post language switch -> theme toggle -> mobile drawer.
 */
import { expect, test } from "./fixtures";

test.describe("static journeys (real static build)", () => {
  test("test_root_home_renders_unified_post_list", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en-US");
    await expect(page.locator("main ul.post-list")).toBeVisible();
    await expect(page.locator("header a.site-name")).toHaveText("Chuquanpho29");
    await expect(page.locator("main header h1")).toHaveCount(0);

    // One row per article; a paired post lists its English row only.
    const list = page.locator("main ul.post-list");
    await expect(list.locator('a[href$="/en/posts/write-english-to-learn/"]')).toHaveCount(1);
    await expect(list.locator('a[href$="/en/posts/hello-world/"]')).toHaveCount(1);
    // The Vietnamese variant of the paired post is not a second row. (A Vietnamese-only
    // post would be listed with a `VI` label, so do not assert "no /vi/ row" here.)
    await expect(list.locator('a[href$="/vi/posts/hello-world/"]')).toHaveCount(0);
  });

  test("test_home_to_search_dropdown_pagefind_query_opens_post", async ({ page }) => {
    // 1. Root home (real) — unified post list, no hero or locale home.
    await page.goto("/");
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator("main ul.post-list")).toBeVisible();

    // 2. Open header search dropdown from the search icon.
    const searchTrigger = page.locator('header button[aria-controls="header-search-dropdown"]');
    await searchTrigger.click();
    const dropdown = page.locator("#header-search-dropdown");
    await expect(dropdown).toBeVisible();

    // 3. Pagefind Component UI loads client-side and upgrades to a real <input>.
    const input = dropdown.locator("pagefind-input input");
    await expect(input).toBeVisible();
    await input.fill("hello");

    // 4. Pagefind returns both "Hello world" posts; pick the English one by href.
    const result = dropdown.locator(
      'pagefind-results a.pf-result-link[href*="/en/posts/hello-world"]',
    );
    await expect(result.first()).toBeVisible();

    // 5. Open the post from the result.
    await result.first().click();
    await expect(page).toHaveURL(/\/en\/posts\/hello-world\/?$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hello world");
  });

  test("test_search_dropdown_closes_on_escape_and_outside_click", async ({ page }) => {
    await page.goto("/");
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
    await page.goto("/");
    const toggle = page.locator("[data-theme-toggle]");
    const initialTheme = await page.evaluate(() => document.documentElement.dataset.theme);

    await toggle.click();
    const nextTheme = await page.evaluate(() => document.documentElement.dataset.theme);
    expect(nextTheme).not.toBe(initialTheme);
    await expect(toggle).toHaveAttribute("aria-pressed", String(nextTheme === "dark"));
  });

  test("test_header_has_no_global_language_switch", async ({ page }) => {
    for (const path of ["/", "/about/"]) {
      await page.goto(path);
      await expect(page.locator("header .lang-switch")).toHaveCount(0);
      await expect(page.locator("header .post-lang-switch")).toHaveCount(0);
      await expect(page.locator("header [data-theme-toggle]")).toBeVisible();
    }
  });

  test("test_bilingual_post_shows_inline_switch_both_ways", async ({ page }) => {
    await page.goto("/en/posts/hello-world/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hello world");

    await page.locator("article .post-lang-switch").click();
    await expect(page).toHaveURL(/\/vi\/posts\/hello-world\/?$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Xin chào");
    await expect(page.locator("html")).toHaveAttribute("lang", "vi-VN");

    await page.locator("article .post-lang-switch").click();
    await expect(page).toHaveURL(/\/en\/posts\/hello-world\/?$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hello world");
  });

  test("test_monolingual_post_has_no_switch_or_alternates", async ({ page }) => {
    await page.goto("/en/posts/write-english-to-learn/");
    // Identify the page by its canonical, not its title: the title is editorial content.
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      /\/en\/posts\/write-english-to-learn\/$/,
    );
    await expect(page.locator(".post-lang-switch")).toHaveCount(0);
    await expect(page.locator('link[rel="alternate"][hreflang="vi-VN"]')).toHaveCount(0);
    await expect(page.locator('meta[property="og:locale:alternate"]')).toHaveCount(0);

    const response = await page.goto("/vi/posts/write-english-to-learn/");
    expect(response?.status()).toBe(404);
  });

  test("test_mobile_drawer_has_no_language_entry", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.locator('header button[aria-haspopup="dialog"]').click();
    await expect(page.locator("dialog.blog-nav-drawer")).toBeVisible();
    await expect(page.locator('dialog.blog-nav-drawer a[href^="/vi/"]')).toHaveCount(0);
  });

  test("test_toc_rail_is_sticky_and_tracks_active_section", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/en/posts/write-english-to-learn/");

    const rail = page.locator("nav.toc");
    await expect(rail).toBeVisible();

    // The placeholder post's sections are too short to scroll, so tall spacers go after every
    // heading but the last: that short final section is what exercises the atBottom path.
    await page.evaluate(() => {
      const headings = document.querySelectorAll(".prose h2");
      headings.forEach((heading, index) => {
        if (index === headings.length - 1) return;
        const spacer = document.createElement("div");
        spacer.setAttribute("aria-hidden", "true");
        spacer.style.height = "60vh";
        heading.after(spacer);
      });
    });

    const links = rail.locator("a[data-toc-link]");
    await expect(links).toHaveCount(3);
    const slugs = await page.evaluate(() =>
      Array.from(document.querySelectorAll(".prose h2"), (heading) => heading.id),
    );

    // Mid-article the rail sticks 24px below the viewport top (`--space-md`), so it stays put.
    await page.evaluate(() => {
      document.querySelectorAll(".prose h2")[1]?.scrollIntoView({ block: "start" });
    });
    await expect
      .poll(async () => {
        const box = await rail.boundingBox();
        return box ? Math.abs(box.y - 24) <= 2 : false;
      })
      .toBe(true);

    const activeLink = rail.locator('a[aria-current="location"]');
    await expect(activeLink).toHaveCount(1);
    await expect(activeLink).toHaveAttribute("href", `#${slugs[1]}`);

    const lastLink = links.last();
    await lastLink.click();
    await expect.poll(async () => lastLink.getAttribute("aria-current")).toBe("location");
    // Wait past the 700ms click suppression: settling must not hand the highlight back.
    await page.waitForTimeout(900);
    await expect(lastLink).toHaveAttribute("aria-current", "location");
    await expect(activeLink).toHaveCount(1);

    // At the page bottom the rail is pinned to the article's own end, never over Tags/Related.
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect
      .poll(() =>
        page.evaluate(
          () => window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2,
        ),
      )
      .toBe(true);
    await expect.poll(async () => lastLink.getAttribute("aria-current")).toBe("location");
    await expect(activeLink).toHaveCount(1);
    await expect
      .poll(async () => {
        const railBox = await rail.boundingBox();
        const articleBox = await page.locator("article.article-main").boundingBox();
        if (!railBox || !articleBox) return Number.POSITIVE_INFINITY;
        return railBox.y + railBox.height - (articleBox.y + articleBox.height);
      })
      .toBeLessThanOrEqual(1);
  });
});
