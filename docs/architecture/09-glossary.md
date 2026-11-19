# Glossary

Terminology for this system. A term is defined once here and linked, never re-explained elsewhere.

## 1. Terms

| Term               | Definition                                                                                                                 |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Post               | One MDX document with frontmatter under `packages/content/posts/<locale>/`; its slug comes from the file path.             |
| Slug               | The URL segment after the locale prefix, derived by removing the locale folder from the content entry id.                  |
| Draft              | A post with `draft: true`; excluded by `getPublishedPosts()` and therefore has no route.                                   |
| Locale             | One of `vi` or `en`. Both are prefixed; `vi` is the default and `/` redirects to `/vi/`.                                   |
| Translation key    | The `translationKey` frontmatter field that pairs a Vietnamese post with its English counterpart.                          |
| Island             | A Vue component hydrated inside otherwise static Astro HTML, mounted with a `client:*` directive.                          |
| Static build       | The `apps/web/dist` output of `astro build`, including the Pagefind index produced afterwards.                             |
| Assets-only Worker | The thin Worker in `apps/edge` that adds security headers and returns files from the asset binding.                        |
| Asset binding      | The platform binding (`ASSETS`) through which the Worker reads the uploaded build output.                                  |
| Pagefind           | The static search indexer run after `astro build`; the browser loads its index with no search backend.                     |
| Feed               | RSS 2.0 at `/<locale>/rss.xml` and JSON Feed 1.1 at `/<locale>/feed.json`, plus per-tag RSS and root aliases for `vi`.     |
| `cf`               | The Cloudflare deployment CLI used here (`cf@1.0.0-beta.14`), which reads `cloudflare.config.ts` and `wrangler.config.ts`. |

## 2. Domain terms requiring translation

| Term           | Original term    | Definition                                                               |
| -------------- | ---------------- | ------------------------------------------------------------------------ |
| Digital garden | _Digital garden_ | The product metaphor: posts are tended notes rather than dated articles. |

## 3. Conventions

Terminology only lives here. Code formatting and test naming are owned by the project's
[`coding-rules`](../development/coding-rules/README.md); architectural rules are owned by
[`08-crosscutting-concepts.md`](08-crosscutting-concepts.md).

## 4. References

- Related chapters: [`08-crosscutting-concepts.md`](08-crosscutting-concepts.md), [`04-runtime-flows.md`](04-runtime-flows.md).
- Conventions: [`../../templates/CONVENTIONS.md`](../../templates/CONVENTIONS.md).
