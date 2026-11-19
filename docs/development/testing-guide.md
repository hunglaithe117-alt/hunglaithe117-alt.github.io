# Testing Guide

This page inventories what is actually automated, how to run it, and where the boundary between real
and stubbed behaviour sits. It is a how-to with reference tables. The procedures assume a working
build; if you do not have one, finish [`local-setup.md`](local-setup.md) first. Naming and code rules
are owned by the config files indexed in [`coding-rules`](coding-rules/README.md) — this page
describes testing practice and links there rather than restating it.

## 1. What is automated today

| Suite             | Location                      | Runner                                             | What it proves                                                                                                                                                                 |
| ----------------- | ----------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Static journeys   | `e2e/static-journeys.spec.ts` | Playwright, one Chromium project                   | Four tests: `/` redirects to `/vi/`; home, then Pagefind search, then the matching post; the language switch on the home page; the switch on a post with a paired translation. |
| Types and content | `apps/web`                    | `astro check`                                      | `.astro` and `.ts` types plus the content-collection schema declared in `apps/web/src/content.config.ts`.                                                                      |
| Lint and format   | repository root               | Turbo `lint`, Prettier, markdownlint, Vale, Lychee | ESLint where a package declares it; formatting, prose, and broken-link gates in CI and locally.                                                                                |

Two things this table does not show, and both matter:

- `apps/web`, `apps/edge`, `packages/ui`, and `packages/content` declare their `lint` and `test`
  scripts as `echo` stubs. `pnpm check` runs them and they pass by printing a message: that is not
  coverage, and a green `pnpm check` says nothing about those packages beyond their types.
- `packages/*` has no unit tests at all. `packages/config` is configuration, and the remaining
  packages only echo.

The only suite that exercises rendered behaviour is therefore Playwright, with `astro check` covering
type and content validity. Playwright is not run in CI (§5).

## 2. Running the suites

Run the whole set before opening a pull request; run the layer you are changing while you iterate.

```bash
# Web build first — the e2e suite tests the built output, not the dev server
pnpm --filter @blog/web build

# First run only: install the browser Playwright drives
pnpm exec playwright install chromium

# End-to-end, from the repository root
pnpm test:e2e

# One spec file, while iterating
pnpm exec playwright test e2e/static-journeys.spec.ts

# Type and content validation
pnpm --filter @blog/web check

# Every workspace task: lint, typecheck, test
pnpm check

# Formatting and prose gates
pnpm format:check
pnpm lint:md
```

`playwright.config.ts` reuses an existing server on `4321` unless `CI` is set. A running `pnpm dev`
therefore wins, and the suite asserts against the Astro dev server instead of `apps/web/dist`; stop
`pnpm dev`, or run `E2E_PORT=4322 pnpm test:e2e` to keep both and still test the built output.

Three limits of that command list are worth knowing before you trust a green run:

- `pnpm check` does not lint or test `apps/web`, `apps/edge`, `packages/ui`, or `packages/content`
  today: their `lint`, `typecheck`, and `test` scripts are `echo` stubs, so the task passes by
  printing.
- `pnpm check` does not run Playwright. `pnpm test:e2e` is separate and needs the build above.
- `pnpm check` does not run the content-quality gate. `pnpm format:check`, `pnpm lint:md`, and
  `pnpm --filter @blog/web check` are separate; `pnpm check:content` chains them.

The Playwright config serves `apps/web/dist` through `e2e/serve-dist.mjs` on `127.0.0.1:4321`, starting
it as a `webServer` unless `E2E_BASE_URL` points somewhere else. `E2E_PORT` moves the port. Because
the server is a single foreground process, Playwright can start and stop it deterministically —
`astro preview` was rejected because it detaches when stdout is not a terminal.

A stale build is the usual cause of a surprising failure: edit a post, forget to rebuild, and the
suite keeps asserting yesterday's output.

## 3. The end-to-end suite

| File                          | Role                                                                                                                      |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `e2e/fixtures.ts`             | Re-exports Playwright's `test` and `expect`; the suite makes no network calls outside the served origin.                  |
| `e2e/serve-dist.mjs`          | Dependency-free static server for `apps/web/dist`: directory indexes, clean URLs, `404.html`, path-traversal containment. |
| `e2e/static-journeys.spec.ts` | Four reading journeys against the built site: root redirect, search-and-open, and the two language switches.              |

Configuration lives in `playwright.config.ts`: one Chromium desktop project, `trace: "on-first-retry"`,
screenshots only on failure, video off, a 30-second test timeout, and an HTML report under
`e2e/.artifacts/report`. When `CI` is set, the run adds one retry, drops to a single worker, and sets
`forbidOnly` so a committed `test.only` fails the build.

Expected result: four passing tests in one spec, with no skipped test. The suite is fully offline;
pages, assets, islands, and the Pagefind index are the real built output.

## 4. What each layer must assert

| Layer                      | Must assert                                                                        | Must not                                                           |
| -------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **Static journey**         | That one critical reading path completes against the built site.                   | Every post, every locale permutation of the same path.             |
| **Type and content check** | That `.astro`/`.ts` types resolve and every entry satisfies the collection schema. | Runtime behaviour of a page.                                       |
| **Lint and format**        | That the tree matches the committed style, prose, and link rules.                  | Logic or rendering; a passing gate is not a test of behaviour.     |
| **Unit (absent)**          | Nothing yet — no unit test holds a new invariant.                                  | Assume `pnpm check` covers a function you just added; it does not. |

A test earns its place only if it fails when the behaviour it protects is wrong. Naming and structure
are indexed in [`coding-rules`](coding-rules/README.md); the shape in use is visible in the spec
beside the one you are writing.

## 5. Continuous integration

`.github/workflows/ci.yml` runs on every pull request and on pushes to `main`, with two jobs:

- **ci** — Prettier `format:check`, markdownlint over every `.md` and `.mdx`, Vale at error level,
  `astro check`, then an affected-only Turborepo `lint test build` filtered to packages changed since
  the base commit. It then runs an explicit `turbo run build --filter=@blog/web` to guarantee
  `apps/web/dist` exists, and finishes with an offline link check over that output. No browser suite
  runs.
- **security** — a full-history gitleaks scan and `pnpm security:audit` at high severity.

The Playwright suite is not part of CI: the workflow installs no browser and never invokes it, so the
build it produces is only for the link check. Treat `pnpm test:e2e` as a local gate, and run it before
a change that touches a page, an island, or the content schema.

`.github/workflows/deploy-edge.yml` adds a credential-free `cf deploy --prebuilt --mode production
--dry-run` on pull requests, after building the web app and the edge artefact in that same mode. The
dry-run proves packaging and the mode pair; it cannot prove the production origin, because a pull request
from a fork has no repository variables.

The deployed site is verified by `scripts/smoke-static.sh <origin>` — pages, feeds, sitemap, Pagefind, 404
handling, headers, and the canonical origin. Run it against `cf dev` locally and against each deployed
origin; see [`../operations/ci-cd-pipeline.md`](../operations/ci-cd-pipeline.md) §5.

## 6. References

- Related docs: [`local-setup.md`](local-setup.md), [`coding-rules/README.md`](coding-rules/README.md)
- Suite configuration: [`playwright.config.ts`](../../playwright.config.ts), [`e2e/serve-dist.mjs`](../../e2e/serve-dist.mjs)
- Static journeys: [`e2e/static-journeys.spec.ts`](../../e2e/static-journeys.spec.ts)
- Root scripts: [`package.json`](../../package.json)
- Pipelines: [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml), [`.github/workflows/deploy-edge.yml`](../../.github/workflows/deploy-edge.yml)
- Conventions: [`CONVENTIONS.md`](../../templates/CONVENTIONS.md) §11 (section shape); §12 (one authority per rule).
