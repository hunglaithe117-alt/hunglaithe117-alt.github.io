/**
 * `robots.txt`, generated so the `Sitemap:` line carries the real origin from
 * `PUBLIC_SITE_URL`. A file under `public/` cannot know the deployed domain.
 */
import type { APIRoute } from "astro";

export const GET: APIRoute = ({ site }) => {
  const origin = (site ?? new URL("https://example.com")).href.replace(/\/$/, "");
  const body = ["User-agent: *", "Allow: /", "", `Sitemap: ${origin}/sitemap-index.xml`, ""].join(
    "\n",
  );

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
