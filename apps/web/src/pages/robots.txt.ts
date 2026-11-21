/**
 * `robots.txt`, generated so the `Sitemap:` line carries the real origin from
 * `PUBLIC_SITE_URL`. A file under `public/` cannot know the deployed domain.
 */
import type { APIRoute } from "astro";

export const GET: APIRoute = ({ site }) => {
  // `astro.config.mjs` already refuses to start without PUBLIC_SITE_URL, so a missing
  // origin here means the config was bypassed — fail rather than emit a placeholder domain.
  if (!site) {
    throw new Error("robots.txt needs the site origin: set PUBLIC_SITE_URL before building.");
  }
  const origin = site.href.replace(/\/$/, "");
  const body = ["User-agent: *", "Allow: /", "", `Sitemap: ${origin}/sitemap-index.xml`, ""].join(
    "\n",
  );

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
