/** Root JSON Feed alias for the default locale (`/feed.json` -> the `vi` feed). */
import type { APIRoute } from "astro";
import { SITE_AUTHOR } from "@/consts";
import { buildJsonFeed } from "@/lib/feeds";
import { DEFAULT_LOCALE, UI } from "@/lib/i18n";
import { getPostsByLang } from "@/lib/posts";

export const GET: APIRoute = async ({ site }) => {
  const lang = DEFAULT_LOCALE;
  const t = UI[lang];
  const posts = await getPostsByLang(lang);

  const feed = await buildJsonFeed(
    {
      lang,
      title: t.siteTitle,
      description: t.siteDescription,
      site: site!,
      author: SITE_AUTHOR,
    },
    posts,
    "/feed.json",
  );

  return new Response(JSON.stringify(feed, null, 2), {
    headers: { "Content-Type": "application/feed+json; charset=utf-8" },
  });
};
