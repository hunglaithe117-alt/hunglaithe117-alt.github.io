# CI/CD Pipeline

## 1. Pipeline model

```text
pull request -> ci (lint, content gate, affected tests, build) + security (scans) + deploy dry-run
merge to main -> changes filter -> deploy job -> production-edge gate -> cf deploy
manual        -> workflow_dispatch -> deploy job -> production-edge gate -> cf deploy
```

Three rules hold throughout: the artefact that is deployed is the one built in the same run, the build and
the deploy use the same `--mode`, and no credential is available to a pull request from a fork.

## 2. Continuous integration (`ci.yml`)

| Job        | Display name                     | What it does                                                                                                                                                                                                      |
| ---------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ci`       | `lint / test / build (affected)` | Checkout with full history, pnpm and Node 24.21.0, `pnpm install --frozen-lockfile`, content gate, affected `turbo run lint test build`, explicit `turbo run build --filter=@blog/web`, offline Lychee link check |
| `security` | `secret & dependency scan`       | gitleaks over full history and `pnpm audit --audit-level=high`                                                                                                                                                    |

The content gate is `pnpm format:check`, markdownlint over `**/*.md` and `**/*.mdx`, Vale at `error`, and
`pnpm --filter @blog/web check` (Astro types and the content schema).

**Affected selection.** The base ref is `pull_request.base.sha` for a PR, `github.event.before` for a push,
falling back to `HEAD^1` and then an unfiltered run. A zero `before` (first push) runs everything.

**No Go job remains.** CI has no Go toolchain and no container build.

## 3. Edge deployment (`deploy-edge.yml`)

Two build steps are shared by every job that deploys; only their environment differs:

```bash
pnpm turbo run build --filter=@blog/web        # PUBLIC_SITE_URL -> canonical URLs, feeds, sitemap
cd apps/edge && pnpm exec cf build --mode production
```

`cf build` packages `apps/web/dist` as Workers Static Assets and records the mode in the Build Output. A
deploy must pass the same mode; `cf` rejects the mismatch with `The Build Output was created with mode "…",
but this command requested mode "…"`. `apps/edge`'s own `build` script carries `--mode production`, so the
Turbo graph and the workflow produce the same artefact.

### 3.1 `validate` — pull request

| Field       | Value                                                                           |
| ----------- | ------------------------------------------------------------------------------- |
| Job         | `validate (dry-run, no credentials)`                                            |
| Condition   | `github.event_name == 'pull_request'`                                           |
| Credentials | None; `TURBO_TOKEN` and `TURBO_TEAM` are deliberately absent                    |
| Gate        | Blocking when branch protection lists it — required setup, not workflow content |

```bash
pnpm turbo run build --filter=@blog/web
cd apps/edge && pnpm exec cf build --mode production
pnpm exec cf deploy --prebuilt --mode production --dry-run
```

The dry-run validates the Build Output and makes no network call; it needs no account id. On a
pull request from a fork the repository variables resolve to empty, so the build falls back to
`https://example.com` — the gate proves packaging, not the production origin.

### 3.2 `changes` — push to `main`

```bash
git diff --name-only "$BEFORE" "$GITHUB_SHA" \
  | grep -qE '^(apps/(edge|web)/|packages/|pnpm-lock\.yaml|turbo\.json)'
```

A match sets `edge=true`; a zero `before` (first push or force-push) is treated as a change.

### 3.3 `deploy` — production

| Field       | Value                                                                      |
| ----------- | -------------------------------------------------------------------------- |
| Job         | `deploy (production-edge)`                                                 |
| Depends on  | `changes` with `edge == 'true'`, or `workflow_dispatch`                    |
| Environment | `production-edge` — required reviewers, `main` only (environment settings) |
| Credentials | `CLOUDFLARE_API_TOKEN` (secret), `CLOUDFLARE_ACCOUNT_ID` (variable)        |

```bash
pnpm turbo run build --filter=@blog/web
cd apps/edge && pnpm exec cf build --mode production
pnpm exec cf deploy --prebuilt --mode production
```

`CLOUDFLARE_ACCOUNT_ID` is passed to both the build and the deploy: the build records it in the Build
Output and `cf deploy --prebuilt` must resolve the same account. `SITE_DOMAIN` is a build input only — it
decides whether the production config claims the custom domain.

The deploy uploads the Astro build as Workers Static Assets and the Worker that adds security headers. No
runtime secret is read, so no secrets file is written.

`cf` is a beta CLI and its destructive commands can abort with exit code `0`. Read the output; do not trust
the exit code alone.

### 3.4 `workflow_dispatch` — re-deploy and rollback drill

The workflow accepts a manual run on any branch:

```bash
gh workflow run deploy-edge.yml --ref main
gh run watch "$(gh run list --workflow deploy-edge.yml --limit 1 --json databaseId -q '.[0].databaseId')"
```

It runs the same gated `deploy` job, so a re-deploy still needs the `production-edge` approval. Rolling back
is this command on the previous known-good commit:

```bash
git checkout <previous-good-commit>
gh workflow run deploy-edge.yml --ref <previous-good-commit>
```

Rebuild the whole artefact; do not swap only the Worker version, which would pair new assets with an old
script.

## 4. Configuration and credentials

Every value below is supplied by the repository owner; none is committed.

| Name                    | Kind                 | Consumer                       | Purpose                                                       |
| ----------------------- | -------------------- | ------------------------------ | ------------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | Environment secret   | `cf deploy`                    | Workers Scripts edit on one account                           |
| `CLOUDFLARE_ACCOUNT_ID` | Environment variable | `cf build`, `cf deploy`, Turbo | The account that owns the Worker; also a Turbo identity input |
| `SITE_DOMAIN`           | Environment variable | `cf build`                     | Production hostname claimed as the custom domain              |
| `PUBLIC_SITE_URL`       | Build variable       | the web build                  | Canonical origin; must match `SITE_DOMAIN`                    |
| `TURBO_TOKEN`           | Repository secret    | remote cache                   | Optional; empty disables uploads without failing              |
| `TURBO_TEAM`            | Repository variable  | remote cache                   | Team scope for the cache                                      |

Rules that hold today: no secret value appears in the repository, and the deploy uses a scoped API token
rather than a Global API Key. Rotation and leak response live in `.github/BRANCH_PROTECTION.md`; the full
variable reference is [`../development/environment-variables.md`](../development/environment-variables.md).

Set the three values once, in the `production-edge` environment:

```bash
gh variable set CLOUDFLARE_ACCOUNT_ID --env production-edge --body "<account-id>"
gh variable set SITE_DOMAIN          --env production-edge --body "<domain>"
gh variable set PUBLIC_SITE_URL      --env production-edge --body "https://<domain>"
gh secret   set CLOUDFLARE_API_TOKEN --env production-edge
```

`PUBLIC_SITE_URL` must be `https://` plus `SITE_DOMAIN`; a mismatch bakes one origin into the HTML and
claims another as the Worker's hostname.

## 5. Post-deploy verification

A green pipeline is not evidence; the served response is. Run the smoke set against the origin:

```bash
scripts/smoke-static.sh https://<domain>
```

It asserts every route class (`/vi/`, `/en/`, posts, tags, about, search), both feeds, the sitemap, the
Pagefind index, `robots.txt`, 404 behaviour, the three security headers, and the canonical origin. Any
failure exits
non-zero.

First launch, in order:

1. Set the four values in §4.
2. `cf deploy --prebuilt --mode staging` and run the smoke set against the `workers.dev` origin, with the
   build's own origin as the second argument when it differs.
3. Deploy production through the workflow (§3.3), then run the smoke set against the domain.
4. Drill the rollback (§3.4) and time it; the budget is 10 minutes.
5. Watch for 30 minutes: `cd apps/edge && pnpm exec wrangler tail blog-edge-production --format json`, then
   one manual page load.

## 6. Known defects and gaps

| #   | Item                                                                   | Effect                                                                 |
| --- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 1   | The owner-supplied values in §4 are not set yet (Q9)                   | The first deploy has no account, domain, origin, or token              |
| 2   | Playwright is not run by any workflow                                  | The static journeys are verified only locally                          |
| 3   | Branch protection lists check names that may differ from display names | A required check can block merges or fail to gate them                 |
| 4   | No CSP header (P1-3)                                                   | Script injection has no second line of defence beyond the static build |

## 7. References

- Monitoring: [`monitoring-and-alerts.md`](monitoring-and-alerts.md); recovery: [`disaster-recovery.md`](disaster-recovery.md).
- Smoke script: [`../../scripts/smoke-static.sh`](../../scripts/smoke-static.sh).
- Retirement context: [`../adr/0012-static-site-with-assets-only-worker.md`](../adr/0012-static-site-with-assets-only-worker.md).
