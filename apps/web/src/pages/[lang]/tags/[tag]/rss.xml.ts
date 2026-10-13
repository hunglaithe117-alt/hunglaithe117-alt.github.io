/** Per-tag RSS 2.0 feeds: /<locale>/tags/<tag>/rss.xml (D-038). */
import type { APIRoute } from "astro";
import { SITE_AUTHOR } from "@/consts";
import { buildRssResponse } from "@/lib/feeds";
import { LOCALES, UI, type Lang } from "@/lib/i18n";
import { collectTags, getPostsByLang } from "@/lib/posts";

export async function getStaticPaths() {
  const paths: { params: { lang: Lang; tag: string } }[] = [];
  for (const lang of LOCALES) {
    const posts = await getPostsByLang(lang);
    for (const tag of collectTags(posts)) {
      paths.push({ params: { lang, tag } });
    }
  }
  return paths;
}

export const GET: APIRoute = async ({ params, site }) => {
  const lang = params.lang as Lang;
  const tag = params.tag as string;
  const t = UI[lang];
  const posts = (await getPostsByLang(lang)).filter((post) => post.data.tags.includes(tag));

  return buildRssResponse(
    {
      lang,
      title: `${t.siteTitle} — ${tag} (RSS)`,
      description: `${t.siteDescription} · ${tag}`,
      site: site!,
      author: SITE_AUTHOR,
    },
    posts,
    `/${lang}/tags/${tag}/rss.xml`,
  );
};
