# Security review

Reviewed **2026-11-19** against the running system: a static Astro build served by a thin Cloudflare
Worker.

Every finding is **Pass** (verified correct), **Fixed**, **Accepted** (risk owned and retained), or
**Follow-up** (needs account or admin access, so it cannot be closed from the repository).

- **Scope:** `apps/edge/**`, `apps/web` build output and headers, `.github/**`, repository hygiene.
- **Out of scope:** content prose and the Playwright suite.
- **Non-goal:** no external penetration test was performed.

## 1. Current surface

| ID   | Area          | Finding                                                                                     | Severity | Status    |
| ---- | ------------- | ------------------------------------------------------------------------------------------- | -------- | --------- |
| F-01 | Secrets       | `gitleaks` full-history scan is clean.                                                      | High     | Pass      |
| F-02 | Secrets       | `.gitignore` covers `.env*`, `.dev.vars*`, `secrets.env`, `secrets.json`, `*.pem`, `*.key`. | High     | Pass      |
| F-03 | Secrets       | No secret value appears in `.cloudflare/` build output or `.turbo/` caches.                 | High     | Pass      |
| F-05 | Secrets       | Only `*.example` placeholder files are tracked; no real env file is committed.              | Medium   | Pass      |
| F-09 | Headers       | Every asset response carries HSTS, `nosniff`, frame deny, referrer and permissions policy.  | Medium   | Fixed     |
| F-15 | Dependencies  | `pnpm audit --audit-level=high`: no known vulnerabilities.                                  | High     | Pass      |
| F-17 | Observability | Worker `observability` is on with 100% sampling, query-string redaction, invocation logs.   | Medium   | Fixed     |
| F-18 | Observability | Uptime monitor and alert channel are account-level; documented, not provisioned.            | Medium   | Follow-up |
| F-19 | Observability | Web Analytics beacon lives in `apps/web` and is not installed.                              | Low      | Follow-up |
| F-20 | GitHub        | Branch protection, required checks, env reviewers, push protection (admin only).            | High     | Follow-up |
| F-22 | Headers       | No `Content-Security-Policy` is sent.                                                       | Medium   | Accepted  |
| F-23 | Data          | No request body, no database, no runtime secret exists to compromise.                       | High     | Pass      |

## 2. Reproduce

```sh
# Secret scan (full history). `npx gitleaks` is not an npm package; run the Go binary.
go run github.com/zricethezav/gitleaks/v8@v8.30.1 detect --redact --no-banner

# Dependency audit.
pnpm audit --audit-level=high

# Served headers and 404 handling.
scripts/smoke-static.sh <origin>
```

## 3. Details

### F-01 / F-02 / F-03 / F-05 — secrets hygiene

- `gitleaks detect --redact` scans the full history: **no leaks found**.
- `.gitignore` ignores `.env*` (except `.env.example`), `.dev.vars*` (except `.dev.vars.example`),
  `secrets.env`, `secrets.json`, `*.pem`, `*.key`, and `.cloudflare/`; `git check-ignore` resolves each
  path to the expected rule.
- `git ls-files` shows only `*.example` files under version control. The edge config holds no account id
  or hostname: both are read from the environment (`docs/development/environment-variables.md` §2.2).
- The build needs one credential-shaped value, `CLOUDFLARE_API_TOKEN`, and only the `deploy` job receives
  it, through the `production-edge` environment.

### F-09 / F-22 — security headers

`apps/edge/src/index.ts` adds HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and
`Permissions-Policy` to every response it forwards from the asset binding. Headers are **additive**: a
value already set by an Astro `_headers` file wins, so a CSP added later is not clobbered.

`scripts/smoke-static.sh` asserts the three most load-bearing headers on a live origin, so a Worker that
stops running — and silently drops them — fails the check instead of passing unnoticed.

**Accepted (F-22):** no `Content-Security-Policy` yet. A wrong CSP breaks a static site silently, and the
policy has to be tuned against the real Astro output; it belongs with `apps/web/public/_headers`, which
does not exist. Tracked as P1-3 in `docs/status.md`. When it lands, the analytics beacon needs
`script-src https://static.cloudflareinsights.com/beacon.min.js` and
`connect-src https://cloudflareinsights.com`.

### F-15 — dependencies

`pnpm audit --audit-level=high` reports no known vulnerabilities. `pnpm` is the only package manager in
the build, so it is the only audit surface.

### F-17 — observability

`apps/edge/cloudflare.config.ts` enables Workers observability: `enabled: true`, `headSamplingRate: 1`,
`redactQueryString: true`, and invocation logs. The Worker writes no log line of its own, so the
invocation record is the whole telemetry surface. See `docs/operations/monitoring-and-alerts.md`.

### F-18 / F-19 / F-20 — account-level items

These need Cloudflare or GitHub console access and are **not** configured from this repository:

- **Uptime + alerting:** a Health Check (or external pinger) on `https://<domain>/vi/` and
  `https://<domain>/vi/rss.xml`, with a named alert destination. No channel is chosen yet (Q-4).
- **Cloudflare Web Analytics:** account-level beacon; the script tag would belong in `apps/web`.
- **GitHub protections:** specified in `.github/BRANCH_PROTECTION.md` — required checks `ci`, `security`,
  and `validate`; `production-edge` reviewers; secret scanning and push protection. Verifying the live
  settings needs repository-admin access.

### Cloudflare token scope

`.github/BRANCH_PROTECTION.md` mandates a **scoped API token, never a Global API Key**, limited to
Workers Scripts (edit) and Workers Routes (edit) for the custom domain, on the single account, rotated on
any suspected exposure. The deploy job receives it only through the `production-edge` environment.

## 4. Accepted risks

| Risk                                     | Why accepted                                                                      |
| ---------------------------------------- | --------------------------------------------------------------------------------- |
| No `Content-Security-Policy` at the edge | Must be tuned against the real Astro output; tracked as P1-3 (F-22).              |
| No uptime check or alert channel         | Account-level action; recorded as a gap rather than assumed to exist (F-18, Q-4). |
| No external penetration test             | Out of scope for this review.                                                     |

## 6. Content & link quality gate (D-027)

The D-027 gate (`markdownlint-cli2`, `vale`, `lychee --offline`) runs in the `ci` workflow, which builds
`apps/web/dist` before the link check. It is not a security control; it is listed here because the gate
was part of the original review task.
