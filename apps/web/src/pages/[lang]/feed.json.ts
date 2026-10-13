/** Per-locale JSON Feed 1.1: /vi/feed.json, /en/feed.json (D-038). */
import type { APIRoute } from "astro";
import { SITE_AUTHOR } from "@/consts";
import { buildJsonFeed } from "@/lib/feeds";
import { LOCALES, UI, type Lang } from "@/lib/i18n";
import { getPostsByLang } from "@/lib/posts";

export function getStaticPaths() {
  return LOCALES.map((lang) => ({ params: { lang } }));
}

export const GET: APIRoute = async ({ params, site }) => {
  const lang = params.lang as Lang;
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
    `/${lang}/feed.json`,
  );

  return new Response(JSON.stringify(feed, null, 2), {
    headers: { "Content-Type": "application/feed+json; charset=utf-8" },
  });
};
