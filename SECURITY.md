# Security review — Phase 6 (T6.2)

Infrastructure security review before the public launch (`phases/phase-6-e2e-security-launch`).
Every finding below is either **Fixed**, **Pass** (verified correct), **Accepted** (risk owned and
retained, with a reason) or **Follow-up** (cannot be completed from the repository alone — needs
account/admin access or a parallel workstream).

- **Date:** 2026-10-14
- **Scope:** `apps/api/**`, `apps/edge/**`, `.github/**`, repository hygiene.
- **Out of scope (other owners):** `apps/web/**` (T6.4), `e2e/**` (T6.1).
- **Non-goal:** no external penetration test was performed.

## Findings

| ID   | Area           | Finding                                                                                            | Severity | Status    |
| ---- | -------------- | -------------------------------------------------------------------------------------------------- | -------- | --------- |
| F-01 | Secrets        | `gitleaks` full-history scan is clean.                                                             | High     | Pass      |
| F-02 | Secrets        | `.gitignore` covers `.cloudflare/`, `secrets.env`, `secrets.json`, `.dev.vars*`, `*.pem`, `*.key`. | High     | Pass      |
| F-03 | Secrets        | No secret values found in build output (`.cloudflare/`) or caches (`.turbo/`).                     | High     | Pass      |
| F-04 | Secrets (CI)   | Deploy writes `secrets.env` with `umask 077` and deletes it in an `if: always()` step.             | Medium   | Pass      |
| F-05 | Secrets        | Only placeholder `*.example` env files are tracked; no real env file is committed.                 | Medium   | Pass      |
| F-06 | CORS           | Wildcard origin `*` is rejected at config load; no wildcard anywhere.                              | High     | Pass      |
| F-07 | CORS           | Container never received `ALLOWED_ORIGINS`, so production silently used the localhost default.     | Medium   | Fixed     |
| F-08 | Headers (API)  | API responses lacked `Strict-Transport-Security`.                                                  | Low      | Fixed     |
| F-09 | Headers (edge) | Worker responses (site assets + `/api/*`) carried no security headers.                             | Medium   | Fixed     |
| F-10 | Errors (API)   | Errors render as uniform JSON; no stack traces, DSNs or SQL leak to clients.                       | Medium   | Pass      |
| F-11 | Errors (API)   | 4xx bodies echo the internal sentinel prefix (`service: …`) and validation bounds.                 | Low      | Accepted  |
| F-12 | Abuse guards   | 16 KiB body cap, per-field length limits, 1/min/IP rate limit, IPs hashed before storage.          | High     | Pass      |
| F-13 | Data access    | D1 access uses positional `?` parameters; no string-interpolated SQL.                              | High     | Pass      |
| F-14 | CORS           | `AllowCredentials: false`, methods/headers limited to what the API serves.                         | Low      | Pass      |
| F-15 | Dependencies   | `pnpm audit --audit-level=high`: no known vulnerabilities.                                         | High     | Pass      |
| F-16 | Dependencies   | `govulncheck ./...`: 8 stdlib advisories fixed in Go 1.27.2; container build now pinned to 1.27.2. | High     | Fixed     |
| F-17 | Observability  | Worker `observability` enabled with sampling, query-string redaction and invocation logs.          | Medium   | Fixed     |
| F-18 | Observability  | Uptime monitor + alert channel are account-level; documented, not provisioned (needs credentials). | Medium   | Follow-up |
| F-19 | Observability  | Web Analytics beacon lives in `apps/web` (T6.4 / parallel lane).                                   | Low      | Follow-up |
| F-20 | GitHub         | Branch protection, required checks, env reviewers, secret scanning + push protection (admin only). | High     | Follow-up |
| F-21 | Availability   | Added a public `/api/healthz` so the API can be monitored through the edge.                        | Low      | Fixed     |

## Reproduce

```sh
# Secret scan (full history). `npx gitleaks` is not an npm package; run the Go binary.
go run github.com/zricethezav/gitleaks/v8@v8.30.1 detect --redact --no-banner
#   -> "7 commits scanned ... no leaks found"

# JS dependency audit.
pnpm audit --audit-level=high          # -> "No known vulnerabilities found"

# Go dependency audit (run inside apps/api).
cd apps/api && go run golang.org/x/vuln/cmd/govulncheck@latest ./...
```

## Details

### F-01 / F-02 / F-03 / F-05 — secrets hygiene

- `gitleaks detect --redact` scanned all 7 commits: **no leaks found**.
- `.gitignore:6-15` ignores `.env*` (except `.env.example`), `.dev.vars*` (except
  `.dev.vars.example`), `secrets.env`, `secrets.json`, `*.pem` and `*.key`; `.gitignore:23` ignores
  `.cloudflare/`. `git check-ignore` confirms each path resolves to the expected rule.
- `git ls-files` shows only `*.example` placeholder files under version control; the dry-run
  config keeps `accountId` / D1 id as `<PLACEHOLDER>` literals (`apps/edge/cloudflare.config.ts:42,67`),
  never secrets.
- Grepping `.cloudflare/` build output and `.turbo/` caches for `D1_API_TOKEN`, `SESSION_SECRET`,
  `CLOUDFLARE_API_TOKEN`, `IP_HASH_SALT` and secret-shaped values returns nothing.

### F-04 — CI secret lifecycle

`.github/workflows/deploy-edge.yml:132-143` writes `secrets.env` under `umask 077` and never echoes
values; `:165-168` deletes it in an `if: always()` step so it is removed even on failure.

### F-06 / F-14 — CORS allowlist

`apps/api/internal/config/config.go:78-82` fails startup on a `*` origin
(`TestLoadRejectsWildcardOrigin` pins this). `apps/api/internal/handler/router.go:61-68` builds a
non-credentialed allowlist with `GET,POST,OPTIONS` and `Content-Type` only. No `Access-Control-`
header is emitted for a disallowed origin (`router_test.go` `TestCORSDisallowedOriginGetsNoACAO`).

### F-07 — CORS allowlist was not reaching the container (fixed)

The container gets its env only from `Cloudflare.config.ts` → `api-container.ts` `envVars`, which
forwarded just the three D1 values. `ALLOWED_ORIGINS` was therefore absent in production and the
API fell back to `http://localhost:4321,http://localhost:8787`
(`apps/api/internal/config/config.go:21`). Same-origin traffic was unaffected, so this was a latent
misconfiguration (broken cross-origin previews), not an open door — but it is now fixed:

- `apps/edge/cloudflare.config.ts:81` — adds an `ALLOWED_ORIGINS` text var (`https://example.com`
  in prod, the preview worker URL otherwise). Never `*`.
- `apps/edge/src/api-container.ts:27,50` — forwards it into the container env.

The Worker reads this through the container's typed env (`ApiContainerEnv`); the hand-maintained
`EdgeBindings` in `packages/types` is outside this review's scope and does not need the field, since
the generated `.cloudflare/types` are authoritative.

### F-08 / F-09 — security headers

- **API** (`apps/api/internal/handler/router.go:72-82`): `X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`, `Cross-Origin-Resource-Policy`, and now `Strict-Transport-Security`. An `HSTS`
  assertion was added to `TestSecurityHeaders`.
- **Edge** (`apps/edge/src/index.ts:36-60,72`): every response now gets HSTS, `nosniff`,
  `X-Frame-Options`, `Referrer-Policy` and `Permissions-Policy`. Headers are **additive** — a value
  already set by the API or by the Astro `_headers` file wins, so a stricter CSP added in T6.4 is not
  clobbered. A `Content-Security-Policy` is intentionally deferred to T6.4, which can tune it against
  the real Astro output; adding a wrong CSP here could break the site.

### F-10 / F-11 — error responses

`apps/api/internal/handler/errors.go:26-47` maps every error to `{"error": "..."}` with no stack
trace, no DSN and no SQL. 5xx collapse to a constant `"internal error"` (`errors.go:80`).

**Accepted (F-11):** `ErrInvalidInput` / `ErrRateLimited` bodies return the wrapped sentinel text,
e.g. `service: invalid input: name must be 1-100 characters` (`errors.go:73-79`). This exposes only a
fixed, compile-time message and the public field bounds; it carries no PII, no infrastructure detail,
and the bounds are useful to API clients. Retained deliberately.

### F-12 / F-13 — input handling and data access

Body cap `BodyLimit: r.cfg.MaxBodyBytes` (`router.go:33`, default 16 KiB `config.go:18`); contact
fields bounded and CR/LF-rejected (`apps/api/internal/service/contact.go:97-113`); IPs peppered-hashed
before storage (`contact.go:119-122`); D1 queries use positional parameters only
(`apps/api/internal/repository/d1.go:49-56`).

### F-15 / F-16 — dependency audits

- `pnpm audit --audit-level=high` → **no known vulnerabilities**.
- `govulncheck ./...` originally reported **8 standard-library advisories** reachable from this code
  (`net/http`, `net/textproto`, `crypto/tls` / `net/http/internal/http2`), all **"Fixed in
  go1.27.2"**. The container build stage is now pinned to `golang:1.27.2`
  (`apps/api/Dockerfile:10`) and CI pins `go-version: "1.27.2"` (`.github/workflows/ci.yml`), so the
  shipped artifact and the CI gate are clean.
- **Follow-up:** the local developer toolchain in this environment is `go1.27.1`, so a local
  `govulncheck` still reports the 8 advisories. Upgrade local Go to ≥ 1.27.2.

### F-17 — observability

`apps/edge/cloudflare.config.ts:114-119` enables Workers observability: `enabled: true`,
`headSamplingRate: 1`, `redactQueryString: true`, and invocation logs. Structured API logs carry a
request id and no PII. See `docs/runbook.md`.

### F-18 / F-19 / F-20 — account-level items (follow-up)

These require Cloudflare/GitHub console or admin access and were **not** performed (no credentials
used, per task constraints):

- **Uptime + alerting:** configure a Cloudflare Health Check (or external pinger) on
  `https://example.com/` and `https://example.com/api/healthz`, with an email/webhook alert. Runbook:
  `docs/runbook.md`.
- **Cloudflare Web Analytics:** enable the account-level beacon; if a script tag is needed it belongs
  in `apps/web` (owned by the parallel lane / T6.4) — **not edited here**.
- **GitHub protections:** the required configuration is specified in
  `.github/BRANCH_PROTECTION.md` (branch protection, required checks `ci` / `security` /
  `validate`, `production-edge` environment reviewers, secret scanning + push protection). Verifying
  the live settings needs repository-admin access.

### Cloudflare token scopes (documented)

`.github/BRANCH_PROTECTION.md:56-63` mandates a **scoped API token, never a Global API Key**, with
only: Workers Scripts (edit), D1 (edit), Email Routing / Email Sending (edit), restricted to the
single account, rotated on any suspected exposure. The deploy workflow receives it solely through the
`production-edge` environment (`.github/workflows/deploy-edge.yml`).

### F-21 — public health endpoint

The edge Worker forwards only `/api` + `/api/*` to the container, so the container's `/healthz` was
unreachable for an external uptime check. `apps/api/internal/handler/router.go:53` now also serves
`GET /api/healthz` (same handler, `{"status":"ok"}`), covered by `TestHealthzPublicAlias`.

## Accepted risks

| Risk                                             | Why accepted                                                                               |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| 4xx bodies echo the sentinel text / field bounds | Fixed compile-time strings, no PII or internals; bounds are useful to clients (F-11).      |
| No `Content-Security-Policy` at the edge         | Must be tuned against the real Astro output; owned by T6.4 via `apps/web/public/_headers`. |
| No external penetration test                     | Out of scope for this review.                                                              |
| Local Go toolchain is 1.27.1                     | Production artifact and CI build on 1.27.2; local-only, tracked as a follow-up (F-16).     |

## Content & link quality gate (D-027)

The D-027 gate (`markdownlint-cli2`, `vale`, `lychee --offline`) is part of the T6.2 task but was
**not run here** — it requires a built `apps/web/dist` and was outside the assigned validation
scope. It remains covered by the `ci` workflow's content-quality job.
