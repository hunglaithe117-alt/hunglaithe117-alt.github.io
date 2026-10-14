# T6.1 — End-to-end tests (Playwright)

Browser suite covering the critical static journeys of the built site:

- home -> search (Pagefind) -> open a post -> language switch
- contact form client behaviour (validation + `POST /api/contact`)

## How it runs

The suite targets the **pre-built static site** (`apps/web/dist`), served by a
tiny dependency-free node server (`serve-dist.mjs`). It runs **offline**: the
deployed Cloudflare Worker + Go API are not required because every `/api/*`
request is intercepted with Playwright `page.route`.

```sh
pnpm --filter @blog/web build   # produce apps/web/dist (once, or after edits)
pnpm exec playwright install chromium   # first time only
pnpm exec playwright test       # or: pnpm test:e2e
```

## Real vs stubbed

| Part                                               | Status                   |
| -------------------------------------------------- | ------------------------ |
| Pages, assets, Vue islands, Pagefind index         | Real (built `dist`)      |
| Home, post, search, language-switch journeys       | Real                     |
| `POST /api/contact` outbound request + UI reaction | Client real, API stubbed |
| `GET /api/views/:slug`                             | Stubbed; client absent   |

`POST /api/contact` is real shipped client code; the API answer is a canned
`{ id, ok }` (or a 5xx, to exercise the failure path). `GET /api/views/:slug` is
defined in `packages/types` but `apps/web` currently ships no view-counter
island, so that test self-documents with `test.fixme` until the client wiring
lands.

## Lighthouse (manual baseline)

Not part of the Playwright suite, but run against the same static server to close
the "Lighthouse >= 95 not run" gap. Scores on `/en/` with system Chrome:

| Category       | Score |
| -------------- | ----- |
| Performance    | 98    |
| Accessibility  | 100   |
| Best practices | 100   |
| SEO            | 100   |

Reproduce:

```sh
node e2e/serve-dist.mjs &
CHROME_PATH=/usr/bin/google-chrome pnpm dlx lighthouse@12 \
  http://127.0.0.1:4321/en/ \
  --only-categories=performance,accessibility,seo,best-practices \
  --chrome-flags="--headless=new --no-sandbox" --quiet
```

## Layout

- `playwright.config.ts` — root config (chromium, `webServer`, HTML report).
- `e2e/fixtures.ts` — shared `/api/*` stubs + request recorder.
- `e2e/serve-dist.mjs` — dependency-free static server for `apps/web/dist`.
- `e2e/*.spec.ts` — journeys, contact form, API contract.
- `e2e/.artifacts/` — generated reports/traces (git-ignored).
