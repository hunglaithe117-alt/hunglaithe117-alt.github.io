# End-to-end tests (Playwright)

Browser suite covering the critical static journeys of the built site:

- home -> search (Pagefind) -> open a post -> language switch

## How it runs

The suite targets the **pre-built static site** (`apps/web/dist`), served by a
tiny dependency-free node server (`serve-dist.mjs`). It runs **offline**: only
pages, assets and the Pagefind index are exercised, so no backend is required.

```sh
pnpm --filter @blog/web build   # produce apps/web/dist (once, or after edits)
pnpm exec playwright install chromium   # first time only
pnpm exec playwright test       # or: pnpm test:e2e
```

## Scope

| Part                                         | Status              |
| -------------------------------------------- | ------------------- |
| Pages, assets, Vue islands, Pagefind index   | Real (built `dist`) |
| Home, post, search, language-switch journeys | Real                |

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
- `e2e/fixtures.ts` — shared `test`/`expect` re-export for the specs.
- `e2e/serve-dist.mjs` — dependency-free static server for `apps/web/dist`.
- `e2e/*.spec.ts` — static journeys.
- `e2e/.artifacts/` — generated reports/traces (git-ignored).
