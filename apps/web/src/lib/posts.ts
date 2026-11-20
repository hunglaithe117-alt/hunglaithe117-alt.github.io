/** Content-collection access helpers for `posts`. */
import { getCollection, render, type CollectionEntry } from "astro:content";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import mdxRenderer from "@astrojs/mdx/server.js";
import { getLangFromId, LOCALES, postSlug, type Lang } from "./i18n";
import { readingTimeFor } from "./reading-time";

export type Post = CollectionEntry<"posts">;

// A single container instance renders every entry to an HTML string for full-content feeds.
// MDX `Content` is an `astro:jsx` component, so its server renderer must be registered.
type Container = Awaited<ReturnType<typeof AstroContainer.create>>;
let containerPromise: Promise<Container> | null = null;
function getContainer(): Promise<Container> {
  containerPromise ??= AstroContainer.create().then((container) => {
    container.addServerRenderer({ renderer: mdxRenderer });
    return container;
  });
  return containerPromise;
}

/** Full rendered HTML for a post (RSS `content:encoded` / JSON Feed `content_html`). */
export async function postHtml(post: Post): Promise<string> {
  const container = await getContainer();
  const { Content } = await render(post);
  return container.renderToString(Content);
}

/** Published posts only (`draft: true` is excluded from build output). */
export async function getPublishedPosts(): Promise<Post[]> {
  const posts = await getCollection("posts", ({ data }) => data.draft !== true);
  return posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/** Published posts for one locale, newest first. */
export async function getPostsByLang(lang: Lang): Promise<Post[]> {
  const posts = await getPublishedPosts();
  return posts.filter((post) => post.data.lang === lang);
}

export function slugOf(post: Post): string {
  return postSlug(post.id);
}

export function readingTimeOf(post: Post): number {
  return readingTimeFor(post.body);
}

/** Locale embedded in an entry id. */
export function langOf(post: Post): Lang {
  return post.data.lang ?? getLangFromId(post.id);
}

/** All published translation variants for a translationKey, in locale order. */
export async function getTranslations(translationKey: string): Promise<Post[]> {
  const posts = await getPublishedPosts();
  return LOCALES.map((lang) =>
    posts.find((post) => post.data.translationKey === translationKey && post.data.lang === lang),
  ).filter((post): post is Post => Boolean(post));
}

/** Unique tags across the given posts, sorted. */
export function collectTags(posts: Post[]): string[] {
  return [...new Set(posts.flatMap((post) => post.data.tags))].sort((a, b) => a.localeCompare(b));
}

/** True when a published post with the same translationKey exists in another locale. */
export async function hasTranslation(post: Post, lang: Lang): Promise<boolean> {
  const translations = await getTranslations(post.data.translationKey);
  return translations.some((translation) => translation.data.lang === lang);
}
