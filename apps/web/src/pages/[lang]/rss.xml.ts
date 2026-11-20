/** Per-locale RSS 2.0 feed: /en/rss.xml, /vi/rss.xml. */
import type { APIRoute } from "astro";
import { SITE_AUTHOR } from "@/consts";
import { buildRssResponse } from "@/lib/feeds";
import { LOCALES, UI, type Lang } from "@/lib/i18n";
import { getPostsByLang } from "@/lib/posts";

export function getStaticPaths() {
  return LOCALES.map((lang) => ({ params: { lang } }));
}

export const GET: APIRoute = async ({ params, site }) => {
  const lang = params.lang as Lang;
  const t = UI[lang];
  const posts = await getPostsByLang(lang);

  return buildRssResponse(
    {
      lang,
      title: `${t.siteTitle} — RSS`,
      description: t.siteDescription,
      site: site!,
      author: SITE_AUTHOR,
    },
    posts,
    `/${lang}/rss.xml`,
  );
};
