# Local Setup

This guide takes a new machine to a running site and is read top to bottom the first time. A
workstation is done when §4 passes, not when the last command exits. The values the steps load are
catalogued in [`environment-variables.md`](environment-variables.md).

## 1. Prerequisites

Install every tool below at or above the stated version. The site is a static build, so the only local
server besides Astro is the assets-only Worker. The Cloudflare CLI is a workspace dependency of
`apps/edge`, so it needs no global install.

| Tool                | Version                                                     | Why it is needed                                            |
| ------------------- | ----------------------------------------------------------- | ----------------------------------------------------------- |
| Node.js             | 24.21.0 (`.nvmrc`; the `engines` floor is `>=22.18.0`)      | Runs Astro, Pagefind, Playwright, and the workspace tooling |
| pnpm                | 12.11.2 (pinned by `packageManager`, activated by Corepack) | Installs the workspace and runs every script in this guide  |
| Git                 | Any recent release                                          | Clones the repository and drives the pre-commit hook        |
| Playwright Chromium | Installed per `@playwright/test` version (first e2e run)    | The end-to-end suite launches exactly one Chromium project  |

A Cloudflare account is needed only to deploy, not to build or preview the site.

## 2. Install the toolchain

Run the blocks in order. Each block is complete: it needs no values from elsewhere on this page.

1. Verify the runtimes are on the path.

   ```bash
   node -v    # v24.21.0
   pnpm -v    # 12.11.2 — Corepack supplies this from `packageManager`
   ```

1. Clone the repository and enter it.

   ```bash
   git clone git@github.com:hunglaithe117-alt/my-blog.git
   cd my-blog
   ```

1. Install the workspace dependencies. This also installs the pinned `cf` and `wrangler` used by
   `@blog/edge`.

   ```bash
   pnpm install
   ```

1. Optionally set the canonical site URL. Astro reads `process.env.PUBLIC_SITE_URL` while the config
   is evaluated, before Vite's `.env` handling runs, so the value must be exported into the shell that
   starts the build.

   ```bash
   cp .env.example .env
   set -a; . ./.env; set +a
   ```

   `PUBLIC_SITE_URL` decides the canonical links, sitemap, and feed URLs. Without it the build falls
   back to `https://example.com`; the committed example supplies `http://localhost:4321` for local
   work. An export lives in one shell, so load it in each shell that starts a build.

No other local configuration file is required. The Worker declares no runtime variables — its only
binding is the asset fetcher — so `cf dev` needs no value file to serve the built site.

Site identity and contact links live in `apps/web/src/lib/site.ts`: `name`, `email`, `github`,
`linkedin`. An empty value renders nothing, so the site ships without dead links; filling one adds it
to the header, the about page and the footer at the next build.

## 3. Run, build, and preview

Start with the web app. It needs no credentials and no other service, so a fresh clone can prove
itself before anything is configured. The edge follows only after a web build.

1. Web development server.

   ```bash
   pnpm --filter @blog/web dev
   ```

   Astro serves on `4321`; `/` is a meta-refresh page pointing at the default locale `/vi/`.

1. Production build. This emits `apps/web/dist` and then writes the Pagefind index over it.

   ```bash
   pnpm --filter @blog/web build
   ```

1. Preview the built output.

   ```bash
   pnpm --filter @blog/web preview
   ```

   `astro preview` serves `apps/web/dist` on `4321`; it does not build, so run the build first.

1. Edge — after a web build.

   ```bash
   pnpm --filter @blog/edge dev
   ```

   `cf dev` serves on `8787`, but only what `apps/web/dist` already contains. On a fresh clone that
   directory does not exist, so build first or every page route answers `404`.

| Workspace    | Command                           | Port   | Serves                                                           |
| ------------ | --------------------------------- | ------ | ---------------------------------------------------------------- |
| `@blog/web`  | `pnpm --filter @blog/web dev`     | `4321` | Astro dev server; `/` redirects to the default locale `/vi/`     |
| `@blog/web`  | `pnpm --filter @blog/web preview` | `4321` | The built `apps/web/dist`                                        |
| `@blog/edge` | `pnpm --filter @blog/edge dev`    | `8787` | `cf dev`: the Worker, its asset binding, and the headers it adds |

`pnpm dev` runs every workspace's `dev` task through Turborepo; persistent tasks run concurrently, so
the web dev server and the edge come up together. The edge still serves only a pre-existing
`apps/web/dist`.

Two rules govern the edge Worker, and both are consequences of how `cloudflare.config.ts` is loaded:

- Run `cf` commands from the package directory. `apps/edge` holds two files that `cf` reads together:
  `cloudflare.config.ts` for runtime, bindings, and routing, and `wrangler.config.ts` for the
  static-asset directory `../web/dist` (D-036). `cf` walks upward to the nearest config, so running it
  from the repository root finds neither.
- `cf` never builds the web app (D-013). It serves whatever `apps/web/dist` already contains, which is
  why step 2 above builds Astro first.

Turborepo does order the build correctly: `@blog/edge#build` depends on `@blog/web#build`, so
`pnpm build` always produces the assets before `cf build` packages them. The edge build carries
`--mode production`; a preview artefact is built explicitly with `cf build --mode staging`.

The two deploy identifiers are process environment values, not config literals. Export them in the shell
that runs `cf` when you want the production shape locally:

```bash
export CLOUDFLARE_ACCOUNT_ID=<account-id>
export SITE_DOMAIN=<domain>
```

Without them the build records no account id and claims no custom domain — the dry-run still passes.

## 4. Verify the system is up

A running process is not a working system. Confirm each check before declaring setup done.

| Check                         | Command                                                                | Expected result                                                                                                             |
| ----------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Web renders                   | `curl -sI http://localhost:4321/vi/`                                   | `200`. `/` is a meta-refresh page pointing at `/vi/`, not an HTTP 3xx.                                                      |
| Preview serves the build      | `curl -sI http://localhost:4321/en/`                                   | `200`, after `apps/web/dist` exists.                                                                                        |
| Edge serves built assets      | `curl -sI http://localhost:8787/en/`                                   | `200`, and the response carries `X-Content-Type-Options: nosniff`.                                                          |
| Edge passes the smoke set     | `scripts/smoke-static.sh http://localhost:8787 https://<build-origin>` | Every route, feed, header, and canonical check passes; pass the build's `PUBLIC_SITE_URL` as the second argument.           |
| Astro types and content       | `pnpm --filter @blog/web check`                                        | Exits `0`; this is `astro check` over types and content collections.                                                        |
| Workspace lint/typecheck/test | `pnpm check`                                                           | Exits `0`, but it does not lint or test `apps/web`, `apps/edge`, `packages/ui`, or `packages/content` (their scripts echo). |
| End-to-end journeys           | `pnpm build` then `pnpm test:e2e`                                      | Four static journeys pass against the pre-built `apps/web/dist`.                                                            |

Formatting and prose gates are separate from the runtime checks: `pnpm format:check` and
`pnpm lint:md`.

## 5. Common setup failures and fixes

| Symptom                                                  | Likely cause                                                                                            | Fix                                                                                                 |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `cf` reports no config, or reads an unexpected one       | The command ran from the repository root.                                                               | Run it from `apps/edge`; `cf` uses the nearest config, not the root.                                |
| The Worker returns `404` for pages that exist in source  | `apps/web/dist` is missing or stale; `cf` never builds the web app (D-013).                             | `pnpm --filter @blog/web build`, then restart `cf dev`.                                             |
| `astro preview` shows an older site                      | The build was not re-run after the last edit.                                                           | `pnpm --filter @blog/web build`, then preview again.                                                |
| Playwright exits with `build output not found`           | `apps/web/dist` is absent, and `e2e/serve-dist.mjs` refuses to serve nothing.                           | Build the web app first; the suite does not build it for you.                                       |
| Playwright cannot launch a browser                       | Chromium was never installed for this `@playwright/test` version.                                       | `pnpm exec playwright install chromium`.                                                            |
| A port is already in use (`4321`, `8787`)                | A previous run or another service still holds it.                                                       | Stop the holder; both servers change port only with their own flags.                                |
| pnpm reports a version mismatch or an unsupported engine | Corepack is disabled, or a global pnpm shadows the pinned one.                                          | `corepack enable`, then rerun `pnpm install`.                                                       |
| Playwright passes against dev output, not the built site | A dev server already holds `4321`; `playwright.config.ts` reuses an existing server unless `CI` is set. | Stop `pnpm dev`, or run `E2E_PORT=4322 pnpm test:e2e` so the built `dist` is served on a free port. |
| `astro check` fails on a post                            | The entry's frontmatter does not satisfy the collection schema.                                         | Fix the entry; the schema is declared in `apps/web/src/content.config.ts`.                          |

## 6. References

- Related docs: [`environment-variables.md`](environment-variables.md), [`testing-guide.md`](testing-guide.md), [`README.md`](README.md)
- Toolchain pins: [`.nvmrc`](../../.nvmrc), [`package.json`](../../package.json)
- Task graph: [`turbo.json`](../../turbo.json)
- Edge configuration: [`apps/edge/cloudflare.config.ts`](../../apps/edge/cloudflare.config.ts), [`apps/edge/wrangler.config.ts`](../../apps/edge/wrangler.config.ts)
- Continuous integration: [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)
- Decision that retired the backend: [`../adr/0012-static-site-with-assets-only-worker.md`](../adr/0012-static-site-with-assets-only-worker.md)
- Conventions: [`CONVENTIONS.md`](../../templates/CONVENTIONS.md) §11 (section shape); §12 (one authority per rule).
