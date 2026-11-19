# blog_personal

A bilingual personal blog and digital garden (`vi` default, `en` secondary), built as a pnpm + Turborepo
monorepo, rendered to static HTML, and served by a thin Cloudflare Worker.

- **apps/web** — Astro 7 static site with Vue islands, MDX content, feeds, sitemap, and a Pagefind search index.
- **apps/edge** — thin Cloudflare Worker: serves the static build and adds security headers.
- **packages/** — shared `config`, `content` (MDX posts), and `ui` (Vue islands).

There is no container, database, or runtime write.

Status: the site builds and all static journeys pass. The deploy pipeline is correct — one mode for build
and deploy, `PUBLIC_SITE_URL` supplied, no placeholder in the config — and the first deploy waits on the
owner-supplied account, domain, and token. See [`docs/status.md`](docs/status.md) §4–§5.

## Quick start

Prerequisites: Node **24.21.0** (`.nvmrc`; floor `>=22.18.0`) and pnpm **12.11.2** via Corepack.

```bash
pnpm install
pnpm --filter @blog/web dev      # http://localhost:4321/vi/
```

Build and preview the static output:

```bash
pnpm --filter @blog/web build    # writes apps/web/dist, then the Pagefind index
pnpm --filter @blog/web preview
```

The edge Worker is optional locally, and only after a web build:

```bash
pnpm --filter @blog/web build
pnpm --filter @blog/edge dev     # cf dev, http://localhost:8787/
```

`cf` commands run from `apps/edge`; it reads `cloudflare.config.ts` for runtime and assets and
`wrangler.config.ts` for the asset directory (`../web/dist`). See
[`docs/development/local-setup.md`](docs/development/local-setup.md) for the full sequence.

## Common commands

| Command               | What it does                                       |
| --------------------- | -------------------------------------------------- |
| `pnpm build`          | Topological build of every workspace               |
| `pnpm dev`            | All dev servers in parallel                        |
| `pnpm check`          | `turbo run lint typecheck test`                    |
| `pnpm test:e2e`       | Playwright static journeys against `apps/web/dist` |
| `pnpm format:check`   | Prettier check                                     |
| `pnpm lint:md`        | markdownlint over the repository                   |
| `pnpm security:audit` | `pnpm audit --audit-level=high`                    |

`apps/edge`, `packages/ui`, and `packages/content` still have `echo` stubs for lint/test; `pnpm check` does
not cover them, and Playwright is not run in CI. See [`docs/status.md`](docs/status.md) §4.

## Documentation

| Start here                                                   | For                                                       |
| ------------------------------------------------------------ | --------------------------------------------------------- |
| [`docs/status.md`](docs/status.md)                           | Current delivery state, defects, next steps               |
| [`docs/architecture/README.md`](docs/architecture/README.md) | Context, containers, flows, deployment, quality, glossary |
| [`docs/development/README.md`](docs/development/README.md)   | Setup, environment variables, tests                       |
| [`docs/operations/README.md`](docs/operations/README.md)     | CI/CD, monitoring, recovery, runbooks                     |
| [`docs/adr/README.md`](docs/adr/README.md)                   | Recorded decisions and their consequences                 |
| [`docs/features/README.md`](docs/features/README.md)         | Content pipeline                                          |

## Deployment

Production is a static build plus one Worker: `pnpm turbo run build --filter=@blog/web`, then
`cd apps/edge && pnpm exec cf build --mode production`, then `cf deploy --prebuilt --mode production`.
The GitHub Actions workflow gates production behind the `production-edge` environment; pull requests only
run a credential-free dry-run. After a deploy, `scripts/smoke-static.sh https://<domain>` proves the served
site; setup of the four environment values is in
[`docs/operations/ci-cd-pipeline.md`](docs/operations/ci-cd-pipeline.md) §4.

The build is portable to any static host; [`docs/architecture/05-deployment-view.md`](docs/architecture/05-deployment-view.md) §7
explains the VPS equivalent.

## Repository layout

```text
apps/web        Astro site — pages, layouts, content schema, feeds, styles
apps/edge       Cloudflare Worker — assets-only config, security headers
packages/config ESLint flat config and strict TS base
packages/content MDX posts under posts/{vi,en}
packages/ui     Vue islands (SearchBox, NavDrawer)
e2e             Playwright static journeys and the static-server harness
docs            This documentation set
phases          Delivery plan and phase records
templates       Documentation template library (untracked)
```

## Hygiene

- `.env*` and `.dev.vars*` are ignored except the examples, which carry placeholders only.
- `.cloudflare/` (build output) is ignored.
- A Husky pre-commit hook runs `lint-staged` (ESLint + Prettier on changed files).
- Never commit real secrets. A leaked secret is rotated, not just deleted. See `SECURITY.md` and
  `.github/BRANCH_PROTECTION.md`.

## License

UNLICENSED. Private project; no license is granted.
