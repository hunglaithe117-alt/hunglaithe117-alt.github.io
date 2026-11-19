# Environment Variables

This page is the reference for the configuration: the variable names, which values are required,
their defaults, where each is read, and where a secret may live. Two planes carry configuration — the
Astro build and the edge Worker — plus the CI workflow that supplies the deploy. Setup steps that
load these values are in [`local-setup.md`](local-setup.md).

The catalogue is small because the runtime surface is small: a static build and a Worker that serves it.

## 1. How configuration is loaded

No plane reads a file on its own. Each row below names the reader and the path a value takes to
reach it.

| Plane         | Reader                                                                         | How a value reaches it                                                                                                                                                        | Rule                                                                                                                                          |
| ------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Web build     | `apps/web/astro.config.mjs` reads `process.env` while the config is evaluated. | Shell export: `set -a; . ./.env; set +a` before `dev` or `build`. Vite's `.env` handling runs after that read, so it does not populate `process.env` in time.                 | `PUBLIC_*` values are declared in `turbo.json` task `env`, so they are hashed and a change rebuilds the site rather than reusing a cache hit. |
| Edge (dev)    | `apps/edge/cloudflare.config.ts`, read by `cf dev`.                            | Process environment of the shell that runs `cf`. The Worker declares one binding, the asset fetcher; there are no runtime text bindings, so no `.dev.vars` value is consumed. | Bindings are declared per `--mode`; environment blocks do not merge.                                                                          |
| Edge (build)  | The same config, evaluated by `cf build` and baked into the Build Output.      | Process environment only: `CLOUDFLARE_ACCOUNT_ID` and `SITE_DOMAIN`. A `.env` file in `apps/edge` is read by `cf` but does **not** reach the config.                          | The mode and the account id are recorded in the artefact; the deploy must match both.                                                         |
| Edge (deploy) | The Build Output uploaded by `cf deploy --prebuilt`.                           | Nothing new is read from the config: the deploy resolves the account from `CLOUDFLARE_ACCOUNT_ID` and must equal the one the build recorded.                                  | A deploy receives no local value file; every value comes from the process environment.                                                        |
| CI            | `.github/workflows/ci.yml` and `.github/workflows/deploy-edge.yml`.            | Repository variables and secrets mapped into the workflow's `env`; `cf` and Turbo then read them from the process environment.                                                | Secrets stay empty on fork pull requests, so no job may require one; the remote cache degrades to local cache instead of failing.             |

Two behaviours are deliberate and easy to misread:

- `cf` reads a complete config per mode; environment blocks do not merge. A value absent from the
  production block is absent, not inherited from a preview block.
- The build uses no runtime environment. Everything the site needs from configuration is baked into
  the HTML at build time, so a worker setting cannot change a canonical URL after the fact.

## 2. The variable catalogue

One row per variable. A variable the code reads but this table omits is a gap; a row whose variable
no longer exists is a defect.

### 2.1 Web build

| Variable          | Purpose                                                            | Required?                   | Default                                                                                                                                                                         | Where it is read                                                |
| ----------------- | ------------------------------------------------------------------ | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `PUBLIC_SITE_URL` | Canonical site URL behind canonical links, the sitemap, and feeds. | Yes for a production deploy | `https://example.com`, the fallback in `apps/web/astro.config.mjs`; `.env.example` carries `http://localhost:4321`, which reaches the config only when exported into the shell. | `site` in `apps/web/astro.config.mjs`; hashed as a Turbo input. |

The deploy workflow supplies it from the `PUBLIC_SITE_URL` repository variable. An empty value silently
falls back to `example.com`, so the build is verified by reading the built HTML, not by the workflow's exit
code ([`../operations/ci-cd-pipeline.md`](../operations/ci-cd-pipeline.md) §5).

### 2.2 Edge Worker configuration

These are values the config reads while `cf build` evaluates it; the two identifiers come from the process
environment and the rest are literals in `apps/edge/cloudflare.config.ts`.

| Value                     | Purpose                                                               | Where it is set                                                             | Effect when absent                                                                          |
| ------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `CLOUDFLARE_ACCOUNT_ID`   | The Cloudflare account that owns the Worker.                          | Environment; CI maps it from a repository variable, locally it is exported. | The build records no account id; `cf` resolves one at deploy time or fails when unattended. |
| `SITE_DOMAIN`             | The production hostname the Worker claims.                            | Environment; CI maps it from a repository variable.                         | No custom domain is claimed; the Worker stays on its `workers.dev` origin.                  |
| `--mode`                  | Selects the config block and names the Worker `blog-edge-<mode>`.     | The `cf` command; the workflow passes `production`.                         | A mode-less build is a different artefact and the deploy rejects the mismatch.              |
| `wrangler.config.ts` path | Supplies `assetsDirectory: "../web/dist"` to `cf build` and `cf dev`. | `apps/edge/wrangler.config.ts`, a sibling of the runtime config.            | `cf` has no asset directory and each page route answers 404.                                |
| `bindings.ASSETS`         | The asset fetcher the Worker uses to serve every request.             | `apps/edge/cloudflare.config.ts`.                                           | The Worker has nothing to serve; every request fails.                                       |

The production domain is claimed only when `mode === "production"` **and** `SITE_DOMAIN` is set, so a preview
or a mode-less build cannot take the production hostname (D-004). The Worker declares one binding, the asset
fetcher.

### 2.3 Continuous integration

| Name                    | Kind                 | Purpose                                                                                |
| ----------------------- | -------------------- | -------------------------------------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | Environment secret   | Authenticates `cf deploy`.                                                             |
| `CLOUDFLARE_ACCOUNT_ID` | Environment variable | Account for `cf build` and `cf deploy`; `turbo.json` also hashes it as a global input. |
| `SITE_DOMAIN`           | Environment variable | Custom domain claimed by the production config; hashed as an edge-build input.         |
| `PUBLIC_SITE_URL`       | Build variable       | Canonical origin for the production build; must be `https://` plus `SITE_DOMAIN`.      |
| `TURBO_TOKEN`           | Repository secret    | Optional Vercel Remote Cache token; empty disables uploads.                            |
| `TURBO_TEAM`            | Repository variable  | Remote-cache team scope; empty disables the cache.                                     |

## 3. Values the owner supplies before the first deploy

None of these is committed, and no placeholder remains in the config. Until they are set, the dry-run passes
and the deploy has nothing to target.

| Value                                 | Set with                                                      | Must agree with            |
| ------------------------------------- | ------------------------------------------------------------- | -------------------------- |
| `CLOUDFLARE_ACCOUNT_ID` (environment) | `gh variable set CLOUDFLARE_ACCOUNT_ID --env production-edge` | The token's account        |
| `SITE_DOMAIN` (environment)           | `gh variable set SITE_DOMAIN --env production-edge`           | The zone on that account   |
| `PUBLIC_SITE_URL` (environment)       | `gh variable set PUBLIC_SITE_URL --env production-edge`       | `https://` + `SITE_DOMAIN` |
| `CLOUDFLARE_API_TOKEN` (environment)  | `gh secret set CLOUDFLARE_API_TOKEN --env production-edge`    | Workers Scripts edit       |

Locally, export the same names into the shell that runs `cf build`; a `.env` file is not read by the config.

## 4. Where secrets may and may not live

A secret is a value whose disclosure grants access: credentials, signing keys, connection strings
that embed a password, and tokens.

| A secret may live in                                                 | A secret must never live in                                |
| -------------------------------------------------------------------- | ---------------------------------------------------------- |
| A secret manager, injected into the process environment at run time. | The repository, in any commit — not even a deleted one.    |
| The process environment of the running Worker or deploy job.         | A committed example or template file.                      |
| A developer-local, uncommitted file excluded from version control.   | A log line, an error message, or a stack trace.            |
| The deployment platform's encrypted secret store.                    | A test fixture that runs against anything but a throwaway. |

In this repository:

- The ignored paths are `.env*` (except `.env.example`), `.dev.vars*` (except `.dev.vars.example`), `secrets.env`, `secrets.json`, and key material (`*.pem`, `*.key`).
- The committed examples carry placeholder values only: `.env.example` and `.dev.vars.example`.
- The only runtime secret the system needs is the deploy token; the site itself has no runtime
  credential to leak.
- A leaked secret is rotated, not merely deleted — the history already holds it.

## 5. Per-environment differences

The build and the Worker are the same everywhere; only the supplied values differ, and the mechanism
that supplies them differs with them.

| Environment | What differs                                                                | How configuration is supplied                                                                                                   |
| ----------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Local       | The site URL is optional; ports `4321` and `8787`; no credentials.          | `.env` exported into the shell when a non-default origin is wanted; `cf dev` reads the same process environment.                |
| CI          | No runtime backend; fork pull requests carry no secrets at all.             | Workflow `env` plus repository secrets and variables; empty values degrade to the local cache.                                  |
| Production  | The real account, the real domain, and a build origin matching that domain. | The `production-edge` environment's secrets and variables, plus `cf build --mode production` and `cf deploy --mode production`. |

A preview deployment differs from production by name and origin only: a non-production mode yields a
`blog-edge-preview-<mode>` Worker name on a `workers.dev` origin, and the production block that claims
the custom domain is not selected.

## 6. References

- Related docs: [`local-setup.md`](local-setup.md), [`testing-guide.md`](testing-guide.md)
- Committed examples: [`.env.example`](../../.env.example), [`.dev.vars.example`](../../.dev.vars.example)
- Edge configuration: [`apps/edge/cloudflare.config.ts`](../../apps/edge/cloudflare.config.ts), [`apps/edge/wrangler.config.ts`](../../apps/edge/wrangler.config.ts)
- Web build input: [`apps/web/astro.config.mjs`](../../apps/web/astro.config.mjs)
- CI secrets and variables: [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml), [`.github/workflows/deploy-edge.yml`](../../.github/workflows/deploy-edge.yml)
- Conventions: [`CONVENTIONS.md`](../../templates/CONVENTIONS.md) §11 (section shape); §12 (one authority per rule).
