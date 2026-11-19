# ADR-0012: Static site with an assets-only Worker

- **Status:** Accepted
- **Date:** 2026-11-19
- **Deciders:** Repository owner
- **Consulted:** —
- **Informed:** —

## 1. Context and Problem Statement

After the contact feature was removed (ADR-0011), the only remaining runtime behaviour was the view
counter: `ViewCounter.vue` calling `GET /api/views/:slug`, served by a Go API in a Cloudflare Container,
backed by D1 over the REST API. The owner does not want view counts either.

Everything else the blog needs is produced at build time: Astro renders pages, feeds, sitemap and
canonical metadata; Pagefind writes the search index; the remaining Vue islands are local UI.

- Current behaviour: one Worker serves static assets and proxies `/api/*` to a container; the container
  inserts/increments rows in D1; the deploy builds a Docker image, applies migrations, and carries a
  runtime D1 token.
- Problem or risk: a database, a container, a Docker dependency, a runtime secret, a migration step, and
  two CI failure modes exist to serve one optional counter.

## 2. Decision Drivers

- No view counter, contact channel, comments, or other runtime write is wanted.
- A static artefact is cacheable, cheap, and reproducible; deployment should be build + upload.
- Fewer credentials: the deploy should need the Cloudflare API token and account id, nothing else.
- The dry-run must be verifiable without Docker, which the container build prevented.

## 3. Considered Options

- **Option 1:** Delete the counter and the entire backend; keep a thin Worker that serves assets and adds
  the security headers.
- **Option 2:** Delete the counter, keep `apps/api` in the repository but stop deploying it.
- **Option 3:** Delete the counter and the Worker; deploy pure assets and move headers to `_headers`.
- **Option 4:** Keep the counter and finish the API deploy fixes.

## 4. Decision and Rationale

**Chosen option: Option 1**, because:

1. It removes every runtime dependency the blog does not need: no container, no D1, no runtime secret, no
   migration, no Docker in CI.
2. It keeps the security headers in code, where they are already reviewed, instead of introducing an
   untested `_headers` file as part of a deletion.
3. The deploy becomes a static build and an upload, which the pinned CLI can validate with a dry-run on a
   normal machine.
4. Leaving the API dormant (Option 2) keeps dead Go code, a Dockerfile, and CI time with no caller.

## 5. Consequences

### Positive

- Deployment is build → `cf deploy`; no schema, no secret file, no container rollout.
- The attack surface is static files plus a header-adding Worker; no request body, no SQL, no PII.
- CI loses the Go toolchain, `govulncheck`, and the D1 migration step.
- Local verification (`cf build --mode production`, then `--dry-run`) works without Docker.

### Negative

- No view counts and no contact channel; the site has no dynamic surface left.
- The Worker still exists for headers; a pure-assets deploy (Option 3) would remove it but needs a
  `_headers` file first.
- Old `/api/*` URLs return 404.
- The `views` table, if a database was ever provisioned, becomes dormant like `contact_messages`; the
  repository only deletes local code.

### Neutral

- `packages/types`, `go.work`, and the API documentation family are deleted with the code.
- Observability shrinks to Worker logs and uptime checks; the `slog` half of ADR-0010 no longer applies.

## 6. Links

- Supersedes: `ADR-0005` (`0005-cloudflare-worker-owns-assets-and-api.md`), `ADR-0006`
  (`0006-go-fiber-api-on-cloudflare-containers.md`), `ADR-0007` (`0007-d1-as-system-of-record.md`).
- Partially supersedes: `ADR-0010` (the Go `slog` half; Worker logs still apply).
- Related: `ADR-0003` (static Astro + islands), `ADR-0011` (contact removal).
- Plan: `phases/phase-2-retire-backend/`.
