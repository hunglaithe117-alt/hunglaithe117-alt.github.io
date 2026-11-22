/** Per-tag RSS 2.0 feeds: /tags/<tag>/rss.xml. */
import type { APIRoute } from "astro";
import { SITE_AUTHOR } from "@/consts";
import { buildRssResponse } from "@/lib/feeds";
import { DEFAULT_LOCALE, tagFeedPath, UI } from "@/lib/i18n";
import { collectTags, getListingPosts } from "@/lib/posts";

export async function getStaticPaths() {
  const tags = collectTags(await getListingPosts());
  return tags.map((tag) => ({ params: { tag } }));
}

export const GET: APIRoute = async ({ params, site }) => {
  const tag = params.tag as string;
  const lang = DEFAULT_LOCALE;
  const t = UI[lang];
  const posts = (await getListingPosts()).filter((post) => post.data.tags.includes(tag));

  return buildRssResponse(
    {
      lang,
      title: `${t.siteTitle} — ${tag} (RSS)`,
      description: `${t.siteDescription} · ${tag}`,
      site: site!,
      author: SITE_AUTHOR,
    },
    posts,
    tagFeedPath(tag),
  );
};
