# GitHub Actions workflows

| Workflow                               | Trigger                                               | Purpose                                                                            |
| -------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------- |
| [`ci.yml`](./ci.yml)                   | `pull_request`, `push` to `main`                      | Affected-only lint/test/build + content-quality gate; secret & dependency scan     |
| [`deploy-edge.yml`](./deploy-edge.yml) | `pull_request`, `push` to `main`, `workflow_dispatch` | Credential-free `cf deploy --dry-run` PR gate; environment-gated production deploy |

## `ci.yml`

- **Fork-safe**: PRs from forks get no repository secrets, so the Vercel remote cache
  (`TURBO_TOKEN`/`TURBO_TEAM`) is empty and Turbo uses the local cache. Nothing requires
  a credential.
- **Affected only**: `pnpm turbo run lint test build --filter=...[<base>]` with
  `fetch-depth: 0`; falls back to `...[HEAD^1]`, then a full run on the root commit or a
  zero-hash force-push.
- **Content-quality gate (D-027)**: `prettier --check`, `markdownlint-cli2`, `vale`
  (error level), `astro check`, and `lychee --offline --root-dir apps/web/dist`.
- **`security` job**: `gitleaks` over full history and `pnpm security:audit`.

## `deploy-edge.yml`

The single deploy workflow.
`apps/edge` ships the Astro build as Workers Static Assets; the Worker attaches the
security headers before delegating to the asset binding.

- **PR**: `cf deploy --prebuilt --mode production --dry-run` — no credentials, no network calls.
- **Push to `main`**: `deploy` job, gated by the `production-edge` Environment (required
  reviewers). Only this job receives Cloudflare credentials.
- **Manual**: `gh workflow run deploy-edge.yml --ref main` re-runs the same gated job; rolling
  back is the same command on the previous known-good commit.
- **Build pair**: `pnpm turbo run build --filter=@blog/web` with `PUBLIC_SITE_URL`, then
  `cf build --mode production` from `apps/edge`. The deploy passes the same mode; `cf` rejects
  a mismatch. `SITE_DOMAIN` and `CLOUDFLARE_ACCOUNT_ID` come from the environment.

Tool version pins and fork-safe patterns: `phases/TOOLCHAIN-VERIFIED.md` §4–§7.
Branch protection / secret hygiene: [`../BRANCH_PROTECTION.md`](../BRANCH_PROTECTION.md).
