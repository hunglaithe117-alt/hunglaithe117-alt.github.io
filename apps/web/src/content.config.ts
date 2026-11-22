/**
 * `posts` content collection.
 *
 * Posts are authored per locale (`packages/content/posts/{vi,en}/<slug>.mdx`),
 * so entry ids carry the locale prefix and `postSlug` extracts the route slug.
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
    /** Optional cover image path under public/ (per-post Open Graph image). */
    cover: z.string().optional(),
    /** Drafts are excluded from the built site. */
    draft: z.boolean().default(false),
    /** Content language; must match the containing folder. */
    lang: z.enum(LOCALES),
    /**
     * Optional key shared by a post's language variants. A monolingual post omits
     * it and is then its own only variant: no switcher, no `hreflang` alternate.
     */
    translationKey: z.string().min(1).optional(),
    /** Set `false` in frontmatter to hide the discussion section on a post. */
    comments: z.boolean().default(true),
  }),
});

export const collections = { posts };
