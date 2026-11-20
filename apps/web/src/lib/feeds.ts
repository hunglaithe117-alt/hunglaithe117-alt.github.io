/** Feed builders: per-locale RSS 2.0, JSON Feed 1.1, and per-tag RSS. */
import rss from "@astrojs/rss";
import { stat } from "node:fs/promises";
import path from "node:path";
import { absoluteUrl, FEED_LANG, homePath, postPath, type Lang } from "./i18n";
import { postHtml, slugOf, type Post } from "./posts";

export interface FeedMeta {
  lang: Lang;
  title: string;
  description: string;
  site: URL | string;
  author: string;
}

const MIME_BY_EXT: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
  svg: "image/svg+xml",
};

function mimeFor(coverPath: string): string {
  const ext = coverPath.split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXT[ext] ?? "application/octet-stream";
}

/** Resolve a public cover path to an RSS <enclosure>, reading its byte size from disk. */
async function enclosureFor(cover: string, site: URL | string) {
  const url = absoluteUrl(site, cover);
  let length = 0;
  try {
    const filePath = path.join(process.cwd(), "public", cover.replace(/^\//, ""));
    length = (await stat(filePath)).size;
  } catch {
    // Missing asset — keep a well-formed enclosure rather than failing the feed.
  }
  return { url, length, type: mimeFor(cover) };
}

function channelExtras(meta: FeedMeta, selfPath: string): string {
  const self = absoluteUrl(meta.site, selfPath);
  return [
    `<language>${FEED_LANG[meta.lang]}</language>`,
    `<ttl>60</ttl>`,
    `<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
    `<generator>Astro</generator>`,
    `<atom:link href="${self}" rel="self" type="application/rss+xml" />`,
  ].join("");
}

/** RSS 2.0 response for a locale (or a single tag within a locale). */
export async function buildRssResponse(
  meta: FeedMeta,
  posts: Post[],
  selfPath: string,
): Promise<Response> {
  const items = await Promise.all(
    posts.map(async (post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: postPath(meta.lang, slugOf(post)),
      categories: post.data.tags,
      author: meta.author,
      content: await postHtml(post),
      enclosure: post.data.cover ? await enclosureFor(post.data.cover, meta.site) : undefined,
    })),
  );

  return rss({
    title: meta.title,
    description: meta.description,
    site: meta.site,
    xmlns: { atom: "http://www.w3.org/2005/Atom" },
    customData: channelExtras(meta, selfPath),
    items,
  });
}

/** JSON Feed 1.1 document for a locale. */
export async function buildJsonFeed(
  meta: FeedMeta,
  posts: Post[],
  selfPath: string,
): Promise<Record<string, unknown>> {
  const items = await Promise.all(
    posts.map(async (post) => {
      const url = absoluteUrl(meta.site, postPath(meta.lang, slugOf(post)));
      const item: Record<string, unknown> = {
        id: url,
        url,
        title: post.data.title,
        summary: post.data.description,
        date_published: post.data.date.toISOString(),
        tags: post.data.tags,
        language: FEED_LANG[meta.lang],
        content_html: await postHtml(post),
      };
      if (post.data.cover) {
        const enclosure = await enclosureFor(post.data.cover, meta.site);
        item.image = enclosure.url;
        item.attachments = [
          { url: enclosure.url, mime_type: enclosure.type, size_in_bytes: enclosure.length },
        ];
      }
      return item;
    }),
  );

  return {
    version: "https://jsonfeed.org/version/1.1",
    title: meta.title,
    home_page_url: absoluteUrl(meta.site, homePath(meta.lang)),
    feed_url: absoluteUrl(meta.site, selfPath),
    description: meta.description,
    language: FEED_LANG[meta.lang],
    authors: [{ name: meta.author }],
    items,
  };
}
