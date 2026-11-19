# ADR-0004: Bilingual content with folder-per-locale posts

- **Status:** Accepted
- **Date:** 2026-10-14
- **Deciders:** Repository maintainers
- **Consulted:** —
- **Informed:** —

## 1. Context and Problem Statement

This record was reconstructed on 2026-11-19 from the implementation and commit history, because the original plan documents (`SOLUTION.md`, `TOOLCHAIN-VERIFIED.md`) are not in the repository. The rationale below is inferred from the code; the rejected options are the ones the shipped routing and schema exclude.

The site publishes in Vietnamese and English, with Vietnamese as the primary language (`D-019`). Posts are written as MDX, and the same post may exist in both languages. Feed readers, search engines and the language switcher all need a stable answer to "where is the other language of this post".

- Current behaviour: content is authored at `packages/content/posts/vi/<slug>.mdx` and `packages/content/posts/en/<slug>.mdx` (`D-026`); every route, feed and alternate is prefixed — `/vi/...` and `/en/...` — and `/` redirects to `/vi/`; `translationKey` pairs a post's variants.
- Problem or risk: locale-as-a-field-on-a-single-file cannot express two languages of one post without either a duplicate slug or a query parameter, and a locale stored only in frontmatter lets the URL and the content disagree.

## 2. Decision Drivers

- Both locales must be URL-prefixed so routes, feeds and `hreflang` alternates are symmetric (`D-038`).
- A translation must be discoverable from either variant, and the pair must survive a slug change.
- A post's language must be visible in its identity, not inferred from a field that can drift from the URL.
- There must be no CMS and no translation-management service (`D-026`); authoring is a commit.
- UI strings must exist in both locales or fail the type check.

## 3. Considered Options

- **Option 1:** One content collection, one folder per locale, ids carrying the locale (`vi/hello-world`), both locales prefixed in the URL.
- **Option 2:** A single-locale site with the primary language at the root and the second language under a prefix (English at `/`, Vietnamese at `/vi/` or the reverse).
- **Option 3:** One folder per locale but a separate content collection per language (`postsVi`, `postsEn`), with the pairing held in code.
- **Option 4:** A locale field in frontmatter with a flat post directory and a runtime locale from a cookie or header.

## 4. Decision and Rationale

**Chosen option: Option 1**, because:

1. The loader generates ids of the form `vi/hello-world`, so the locale is part of the entry identity and `postSlug()` in `apps/web/src/lib/i18n.ts` strips exactly the first segment. The route takes its locale from `post.data.lang` and its slug from the id, so a `lang` value that disagrees with the folder changes the URL prefix while the id keeps the folder's locale.
2. Prefixing both locales makes the contract uniform: `postPath(lang, slug)` is one function, every feed lives at `/<lang>/…`, and the sitemap's `hreflang` pair is symmetric. Option 2 makes the default locale a special case in every path helper.
3. One collection with one schema keeps a single validator: `lang` is `z.enum(LOCALES)`, `translationKey` is a required string, and the same build fails the same way for both languages.
4. Option 4 would make the rendered locale depend on the request, which a static build cannot do ([ADR-0003](0003-astro-static-ssg-with-vue-islands.md)).

The concrete contract:

- **Routing**: `i18n.defaultLocale: "vi"`, `locales: ["vi", "en"]`, `prefixDefaultLocale: true`, `redirectToDefaultLocale: false`, plus `redirects: { "/": "/vi/" }` — a static meta-refresh page, because nothing runs at request time to issue a 3xx.
- **Authoring**: the collection glob is `**/*.{md,mdx}` under `../../packages/content/posts`; `lang` must be one of `LOCALES` and `translationKey` is required. Drafts are filtered by `getPublishedPosts()`, which also sorts newest first.
- **Pairing**: `getTranslations(translationKey)` intersects the published posts with `LOCALES` in order, so a variant that does not exist is simply absent; `hasTranslation` gates the language switcher.
- **Feeds** (`D-038`): `/<lang>/rss.xml` and `/<lang>/feed.json` per locale, `/<lang>/tags/<tag>/rss.xml` per tag, and root aliases `/rss.xml` and `/feed.json` that serve the `vi` feed.
- **Alternates**: `HTML_LANG` maps `vi` → `vi-VN`, `en` → `en-US` for `html[lang]`, `hreflang` and `og:locale`; `FEED_LANG` maps to the bare ISO codes RSS expects; the sitemap integration takes the same `vi-VN`/`en-US` pair.
- **UI strings**: `UI` is one object per locale typed with `satisfies Record<Lang, …>`, and `UIStrings` is `typeof UI[Lang]` — the union of both dictionaries — so a key referenced in a template must exist in every locale.

## 5. Consequences

### Positive

- `hreflang`, canonical URLs, feeds and the switcher derive from one function per concern, so a new locale is a change to `LOCALES` and a folder, not a sweep of hard-coded paths.
- A translated post is an ordinary second file: no build-time merge, no id collision, no duplicate collection schema.
- Drafts are filtered in one place, so a draft cannot leak through a tag page or a feed that forgot the filter.
- An untranslated post still renders at its own locale's URL; the layout falls back to the other locale's home page when no paired variant exists, rather than hiding the switcher.

### Negative

- There is no root-language convenience URL: `/` is a redirect hop, and every internal link carries the locale prefix.
- Frontmatter carries pairing metadata a single-language blog would not need: `translationKey` is required even for a post that will never be translated, and a typo in it silently unpairs the variants rather than failing the build.
- The folder/id agreement is documented, not enforced. The schema comment says `lang` "must match the containing folder", but nothing compares the two, so a post at `posts/vi/x.mdx` declaring `lang: en` would be routed under `/en/` with an id that still begins `vi/`.
- A post's cover is a path under the shared `public/` tree (`cover` in the schema), so translated variants cannot carry colocated or per-language images; the same file is referenced twice or duplicated into `public/` by hand.
- `UIStrings` being the union of both dictionaries means a key is only checked where it is used; a dictionary entry no template references can exist in one locale and be missing in the other without a type error.
- Per-tag feeds are RSS only; JSON Feed exists per locale but not per tag.
- The root feed aliases are asymmetric — `/rss.xml` is the `vi` feed — so a reader subscriber and a `/vi/rss.xml` subscriber are the same audience arriving by two URLs.

### Neutral

- Region tags are presentation-only: a single `vi-VN`/`en-US` pair is declared for every signal, with no per-post regional variance.
- The language switcher is a plain `<a>` to the counterpart URL, so switching reloads the page and does not preserve scroll position.

## 6. Links

- Related: [ADR-0003](0003-astro-static-ssg-with-vue-islands.md) (static build and the `/` redirect page), [ADR-0009](0009-affected-ci-and-content-quality-gate.md) (the content gate that checks prose and links).
- Decision IDs: `D-019` (Vietnamese primary, English second), `D-026` (folder-per-locale authoring, no CMS or TMS), `D-038` (per-locale RSS and JSON feeds, tag feeds, alternates).
- Code: `apps/web/src/lib/i18n.ts`, `apps/web/src/content.config.ts`, `apps/web/src/lib/posts.ts`, `apps/web/src/pages/[lang]/rss.xml.ts`, `apps/web/src/pages/[lang]/feed.json.ts`, `apps/web/src/pages/rss.xml.ts`, `apps/web/astro.config.mjs`.
- Introduced by: `dc311a2` (`feat(web): Phase 3 — Astro 7 frontend, bilingual content, feeds, Pagefind, pages & polish`).
