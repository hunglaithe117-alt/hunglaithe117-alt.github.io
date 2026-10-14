# GitHub Actions workflows

| Workflow                               | Trigger                          | Purpose                                                                            |
| -------------------------------------- | -------------------------------- | ---------------------------------------------------------------------------------- |
| [`ci.yml`](./ci.yml)                   | `pull_request`, `push` to `main` | Affected-only lint/test/build + content-quality gate; secret & dependency scan     |
| [`deploy-edge.yml`](./deploy-edge.yml) | `pull_request`, `push` to `main` | Credential-free `cf deploy --dry-run` PR gate; environment-gated production deploy |

## `ci.yml`

- **Fork-safe**: PRs from forks get no repository secrets, so the Vercel remote cache
  (`TURBO_TOKEN`/`TURBO_TEAM`) is empty and Turbo uses the local cache. Nothing requires
  a credential.
- **Affected only**: `pnpm turbo run lint test build --filter=...[<base>]` with
  `fetch-depth: 0`; falls back to `...[HEAD^1]`, then a full run on the root commit or a
  zero-hash force-push.
- **Content-quality gate (D-027)**: `prettier --check`, `markdownlint-cli2`, `vale`
  (error level), `astro check`, and `lychee --offline --root-dir apps/web/dist`.
- **`security` job**: `gitleaks` over full history, `pnpm security:audit`,
  `pnpm security:govulncheck`.

## `deploy-edge.yml`

The single deploy workflow (replaces per-app `deploy-web.yml` / `deploy-api.yml`).
`apps/edge` ships assets + `/api/*` container + D1 + `send_email` in one `cf deploy`.

- **PR**: `cf deploy --prebuilt --mode production --dry-run` — no credentials, no API calls.
- **Push to `main`**: `deploy` job, gated by the `production-edge` Environment (required
  reviewers). Only this job receives Cloudflare credentials; `secrets.env` is written
  with `umask 077` and deleted in an `if: always()` step.

Tool version pins and fork-safe patterns: `phases/TOOLCHAIN-VERIFIED.md` §4–§7.
Branch protection / secret hygiene: [`../BRANCH_PROTECTION.md`](../BRANCH_PROTECTION.md).
