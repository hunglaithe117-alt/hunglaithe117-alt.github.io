/**
 * `posts` content collection (T3.2 step 1).
 *
 * Authoring is folder-per-locale (D-026): packages/content/posts/{vi,en}/<slug>.mdx.
 * The glob loader generates ids like `vi/hello-world`, so the locale is embedded
 * in the id and the route slug is the remainder (`postSlug` in lib/i18n.ts).
 *
 * The zod schema is the blog's data contract — invalid frontmatter fails the build
 * (T3.2 test: a post missing `title` must fail).
 */
import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";
import { LOCALES } from "./lib/i18n";

const posts = defineCollection({
  // `base` is resolved from the app root: apps/web -> packages/content/posts.
  loader: glob({ pattern: "**/*.{md,mdx}", base: "../../packages/content/posts" }),
  schema: z.object({
    /** Post headline, shown in listings, feeds and OG tags. */
    title: z.string().min(1),
    /** Short summary — RSS/JSON Feed summary + meta description. */
    description: z.string().min(1),
    /** Publication date; drives ordering and feed pubDate. */
    date: z.coerce.date(),
    /** Free-form tags; also rendered as feed categories and per-tag feeds. */
    tags: z.array(z.string()).default([]),
    /** Optional cover image path under public/ (RSS enclosure + card thumb). */
    cover: z.string().optional(),
    /** Drafts are excluded from the built site (CONTENT-INVENTORY). */
    draft: z.boolean().default(false),
    /** Content language; must match the containing folder. */
    lang: z.enum(LOCALES),
    /** Shared across a post's language variants (hreflang pairing). */
    translationKey: z.string().min(1),
  }),
});

export const collections = { posts };
