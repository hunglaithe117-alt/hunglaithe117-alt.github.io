/** Root RSS alias for the default locale (`/rss.xml`). */
import type { APIRoute } from "astro";
import { SITE_AUTHOR } from "@/consts";
import { buildRssResponse } from "@/lib/feeds";
import { DEFAULT_LOCALE, UI } from "@/lib/i18n";
import { getPostsByLang } from "@/lib/posts";

export const GET: APIRoute = async ({ site }) => {
  const lang = DEFAULT_LOCALE;
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
    "/rss.xml",
  );
};
