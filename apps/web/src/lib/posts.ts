/** Content-collection access helpers for `posts`. */
import { getCollection, render, type CollectionEntry } from "astro:content";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import mdxRenderer from "@astrojs/mdx/server.js";
import { DEFAULT_LOCALE, isLang, LOCALES, postSlug, type Lang } from "./i18n";
import { readingTimeFor } from "./reading-time";

export type Post = CollectionEntry<"posts">;

// A single container instance renders every entry to an HTML string for full-content feeds.
// MDX `Content` is an `astro:jsx` component, so its server renderer must be registered.
type Container = Awaited<ReturnType<typeof AstroContainer.create>>;
let containerPromise: Promise<Container> | null = null;
function getContainer(): Promise<Container> {
  return (containerPromise ??= AstroContainer.create().then((container) => {
    container.addServerRenderer({ renderer: mdxRenderer });
    return container;
  }));
}

/** Full rendered HTML for a post (RSS `content:encoded` / JSON Feed `content_html`). */
export async function postHtml(post: Post): Promise<string> {
  const container = await getContainer();
  const { Content } = await render(post);
  return container.renderToString(Content);
}

/**
 * Rejects a collection whose authoring invariants are broken: a post filed under a
 * different locale than it declares, two variants of one `translationKey` inside the
 * same locale, or paired variants whose tag lists disagree. Each would silently produce
 * a duplicate listing row, a switcher pointing at the wrong article, or a tag link with
 * no page behind it, so they stop the build with the offending ids.
 */
function assertPostIntegrity(posts: Post[]): void {
  const seen = new Map<string, Post>();
  const variants = new Map<string, Post[]>();
  for (const post of posts) {
    const folder = post.id.split("/")[0];
    if (!isLang(folder) || folder !== post.data.lang) {
      throw new Error(
        `Post "${post.id}" declares lang "${post.data.lang}" but is not filed under ` +
          `packages/content/posts/${post.data.lang}/. Move the file or fix the frontmatter.`,
      );
    }
    const key = post.data.translationKey;
    if (!key) continue;
    const slot = `${post.data.lang}:${key}`;
    const duplicate = seen.get(slot);
    if (duplicate) {
      throw new Error(
        `Posts "${duplicate.id}" and "${post.id}" are both "${post.data.lang}" and share ` +
          `translationKey "${key}". One locale holds one variant per key; remove the key ` +
          `from one of them.`,
      );
    }
    seen.set(slot, post);
    variants.set(key, [...(variants.get(key) ?? []), post]);
  }

  // Tag pages and feeds are built from the listing, which shows one variant per key, so
  // a tag that only one variant declares would link to a page that does not exist.
  for (const [key, group] of variants) {
    const [first, ...rest] = group;
    if (!first) continue;
    const expected = [...first.data.tags].sort().join("\u0000");
    for (const other of rest) {
      if ([...other.data.tags].sort().join("\u0000") === expected) continue;
      throw new Error(
        `Posts "${first.id}" and "${other.id}" share translationKey "${key}" but declare ` +
          `different tags (${describeTags(first.data.tags)} vs ${describeTags(other.data.tags)}). ` +
          `Paired variants must carry the same tags so one tag page covers both.`,
      );
    }
  }
}

/** Tag list for an integrity message; `none` keeps the sentence readable. */
function describeTags(tags: string[]): string {
  return tags.length > 0 ? tags.join(", ") : "none";
}

/** Newest first, with the id as tie-breaker so equal dates order identically everywhere. */
function byNewest(a: Post, b: Post): number {
  return b.data.date.getTime() - a.data.date.getTime() || a.id.localeCompare(b.id);
}

/** Published posts only (`draft: true` is excluded from build output), newest first. */
export async function getPublishedPosts(): Promise<Post[]> {
  const posts = await getCollection("posts", ({ data }) => data.draft !== true);
  assertPostIntegrity(posts);
  return posts.sort(byNewest);
}

/**
 * The one list every site-level page and feed renders: newest first, one row per
 * article. Variants sharing a `translationKey` collapse into the `preferredLang`
 * copy (falling back to `LOCALES` order); a post without a key always stands alone.
 */
export async function getListingPosts(preferredLang: Lang = DEFAULT_LOCALE): Promise<Post[]> {
  const posts = await getPublishedPosts();
  const preference = [preferredLang, ...LOCALES.filter((lang) => lang !== preferredLang)];
  const byKey = new Map<string, Post>();
  const standalone: Post[] = [];

  for (const post of posts) {
    const key = post.data.translationKey;
    if (!key) {
      standalone.push(post);
      continue;
    }
    const current = byKey.get(key);
    if (!current || preference.indexOf(post.data.lang) < preference.indexOf(current.data.lang)) {
      byKey.set(key, post);
    }
  }

  return [...byKey.values(), ...standalone].sort(byNewest);
}

export function slugOf(post: Post): string {
  return postSlug(post.id);
}

export function readingTimeOf(post: Post): number {
  return readingTimeFor(post.body);
}

/** All published variants of a post, in `LOCALES` order; a key-less post is its own only variant. */
export async function getTranslations(post: Post): Promise<Post[]> {
  const key = post.data.translationKey;
  if (!key) return [post];
  const posts = await getPublishedPosts();
  return LOCALES.map((lang) =>
    posts.find((entry) => entry.data.translationKey === key && entry.data.lang === lang),
  ).filter((entry): entry is Post => Boolean(entry));
}

/** Unique tags across the given posts, sorted. */
export function collectTags(posts: Post[]): string[] {
  return [...new Set(posts.flatMap((post) => post.data.tags))].sort((a, b) => a.localeCompare(b));
}
