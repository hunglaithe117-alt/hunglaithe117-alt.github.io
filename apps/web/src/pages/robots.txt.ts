/**
 * `robots.txt`, generated so the `Sitemap:` line carries the real origin from
 * `PUBLIC_SITE_URL`. A file under `public/` cannot know the deployed domain.
 *
 * A build with `PUBLIC_NOINDEX` disallows everything instead: the mirror deployment must
 * not be crawled, and pointing a crawler at its sitemap would contradict that.
 */
import type { APIRoute } from "astro";
import { NOINDEX } from "@/lib/indexing";

export const GET: APIRoute = ({ site }) => {
  // `astro.config.mjs` already refuses to start without PUBLIC_SITE_URL, so a missing
  // origin here means the config was bypassed — fail rather than emit a placeholder domain.
  if (!site) {
    throw new Error("robots.txt needs the site origin: set PUBLIC_SITE_URL before building.");
  }
  const origin = site.href.replace(/\/$/, "");
  const body = NOINDEX
    ? [
        "# Mirror deployment — the canonical site is linked from the repository.",
        "User-agent: *",
        "Disallow: /",
        "",
      ]
    : ["User-agent: *", "Allow: /", "", `Sitemap: ${origin}/sitemap-index.xml`, ""];

  return new Response(body.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
