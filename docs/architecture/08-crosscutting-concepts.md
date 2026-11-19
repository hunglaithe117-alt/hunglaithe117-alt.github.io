# Crosscutting Concepts

These decisions constrain several parts of a static site at once. Each row states a rule a reviewer can
check, not just what the code happens to do.

## 1. Concepts

| Concept                               | What it is                                                                                         | Where it lives                                     | The rule                                                                                                                         |
| ------------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Static delivery and caching           | Every response is a pre-built file; the edge caches it                                             | `apps/web/dist`; Cloudflare edge                   | Nothing is rendered per request; a new file set is a new Worker version                                                          |
| Security headers                      | HSTS, nosniff, frame deny, referrer and permissions policy on every Worker response                | `apps/edge/src/index.ts`                           | Headers are additive and never removed by an asset response; a header already present wins                                       |
| 404 handling                          | One built 404 page for unknown paths                                                               | `apps/web/src/pages/404.astro`; `notFoundHandling` | An unknown path returns status 404 with the page, never a 200 fallback                                                           |
| Logging and observability             | Worker invocation logs and uptime checks; no application logs                                      | `apps/edge/cloudflare.config.ts`                   | Query strings are redacted; no request body or PII can be logged because none is accepted                                        |
| Configuration                         | Mode decides the Worker name and whether a custom domain is claimed; the build decides origins     | `cloudflare.config.ts`; `PUBLIC_SITE_URL`          | Build and deploy use one mode; a non-production mode claims no production domain                                                 |
| Localisation and internationalisation | Two locales, `vi` default and `en`, both prefixed; content folder-per-locale; one typed dictionary | `apps/web/src/lib/i18n.ts`; `content.config.ts`    | No user-visible string is hard-coded outside the dictionary; a translation pair is joined by `translationKey`, never by filename |
| Content validation                    | Frontmatter is validated at build time; drafts never reach a route                                 | `apps/web/src/content.config.ts`; `lib/posts.ts`   | Publishing is a build, not a database write; invalid content fails the build, and `draft: true` is filtered at read time         |
| Asset integrity                       | The Worker version and its assets are uploaded together                                            | `cf deploy --prebuilt`                             | A deploy ships one artefact set; there is no partial asset upload to repair                                                      |

## 2. Security posture in one paragraph

The site is a public read-only surface whose defence is its shape: a static file server that accepts only a
URL. The Worker adds five hardening headers to every response it handles. The remaining gaps are explicit:
no CSP, no robots.txt, and no alert channel. `SECURITY.md` is the review of record. A feature that needs
runtime state is a new ADR, not a configuration change.

## 3. Configuration rules that are easy to get wrong

| Rule                                                        | Why                                                                    |
| ----------------------------------------------------------- | ---------------------------------------------------------------------- |
| `PUBLIC_SITE_URL` is a build input, not a Worker setting    | Canonical URLs, feeds, and the sitemap are baked into the HTML         |
| A preview build uses the preview origin                     | Otherwise preview pages advertise the production domain                |
| `domains` is production-only                                | A staging deploy must not claim the live hostname                      |
| The build mode and the deploy mode must be the same literal | The pinned CLI rejects a prebuilt artifact whose recorded mode differs |

## 4. References

- Related chapters: [`02-container-view.md`](02-container-view.md), [`04-runtime-flows.md`](04-runtime-flows.md), [`05-deployment-view.md`](05-deployment-view.md), [`09-glossary.md`](09-glossary.md).
- Authorities: [`../development/environment-variables.md`](../development/environment-variables.md), `SECURITY.md`.
- Decisions: [`../adr/0012-static-site-with-assets-only-worker.md`](../adr/0012-static-site-with-assets-only-worker.md).
