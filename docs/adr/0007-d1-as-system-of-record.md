# ADR-0007: D1 as the system of record

- **Status:** Superseded by ADR-0012
- **Date:** 2026-10-14
- **Deciders:** Repository maintainers
- **Consulted:** —
- **Informed:** —

## 1. Context and Problem Statement

This record was reconstructed on 2026-11-19 from the implementation and commit history, because the original plan documents (`SOLUTION.md`, `TOOLCHAIN-VERIFIED.md`) are not in the repository. The rationale below is inferred from the code; the rejected options are the ones the shipped configuration excludes.

The data is small and relational enough to want SQL: a view counter keyed by slug and a contact log indexed by hashed IP and time. Both are written by the Go API, which runs in a container and therefore cannot hold a Worker binding.

- Current behaviour: `apps/api/internal/repository/d1.go` calls the Cloudflare D1 REST query API — `POST /accounts/{account_id}/d1/database/{database_id}/query` — with a JSON body of `{sql, params}` and a bearer token. Migrations are two SQL files in `apps/api/migrations`.
- Problem or risk: a container has no binding, so the store must be reachable over the network or the data access must move into the Worker. Moving it there would make the Worker's CPU budget the API's budget and would sit behind the same limit that [ADR-0006](0006-go-fiber-api-on-cloudflare-containers.md) rejected.

## 2. Decision Drivers

- One operational account: no database server to patch, no connection pool to size.
- SQL semantics, including an atomic counter update, rather than read-modify-write.
- The container must reach the store without a platform SDK or binding.
- The contact log must support a per-IP, per-time-window query without a table scan.
- Failure must degrade, not crash: a health endpoint must answer when storage is unconfigured.

## 3. Considered Options

- **Option 1:** D1, accessed from the container over the REST query API with positional parameters.
- **Option 2:** D1, accessed through the `DB` binding inside the Worker, with the Worker owning all data access.
- **Option 3:** A hosted Postgres (Neon, Supabase) reached from the container over its own protocol.
- **Option 4:** KV for the counters and Durable Object storage for the contact log.

## 4. Decision and Rationale

**Chosen option: Option 1**, because:

1. D1 is already in the account that hosts the Worker, the zone and the container; one store means one bill and one credential scope, with no second vendor and no network egress.
2. The REST endpoint accepts `{sql, params}` with positional `?` parameters, so the repository keeps real SQL and real parameter binding — no string interpolation, and the query text is reviewable in the repository.
3. D1 is SQLite and single-writer, which makes `INSERT … ON CONFLICT(slug) DO UPDATE … RETURNING` the whole counter implementation; KV's eventual consistency would make a counter regress (Option 4).
4. Option 2 puts every query inside the Worker, which is the CPU envelope the container was introduced to escape.

The access contract this decides (`D-003`):

- **Client**: one `http.Client` with a 10-second timeout, a bearer token, and a response body read through `io.LimitReader(resp.Body, 1<<20)`.
- **Errors**: a non-2xx response, a `success: false` envelope or a failed inner statement each become a typed error; missing credentials return `ErrNotConfigured`, which the handlers surface as 503 rather than 500, so `/healthz` stays useful in a minimal environment.
- **Views** (`D-025`): counted on `GET /api/views/:slug`; an obvious crawler (user-agent heuristic) is served the current count read-only so bots cannot inflate it. `views` is `(slug PRIMARY KEY, count INTEGER NOT NULL DEFAULT 0, updated_at TEXT)`.
- **Contact**: rows are inserted before any delivery is attempted; `contact_messages` is `(id, name, email, body, ip_hash, created_at)` with `idx_contact_messages_ip_hash_created_at` backing the rate-limit window. Raw IPs are never stored — `ip_hash` is a peppered SHA-256 digest.
- **Migrations**: `apps/api/migrations/0001_init.sql` and `0002_contact.sql`, applied with `cf d1 migrations apply <DATABASE_ID> --dir migrations --table d1_migrations`.

The Worker declares a `DB` binding in `cloudflare.config.ts` and `EdgeBindings`, but no Worker code uses it; the binding exists as an unused second path to the same store.

## 5. Consequences

### Positive

- The counter is one atomic statement, so concurrent increments cannot lose a write.
- No connection pool, no migration server, no database hostname to rotate.
- The rate-limit query is index-backed, so the contact guard stays cheap as the log grows.
- Storage being unconfigured is a 503 on the affected routes, not a boot failure.

### Negative

- Every query is an HTTPS round trip with JSON encoding, so a single request costs at least one extra network hop beyond Worker → container; there are no transactions spanning statements, so a multi-step operation cannot be made atomic.
- Three secrets (`CLOUDFLARE_ACCOUNT_ID`, `D1_DATABASE_ID`, `D1_API_TOKEN`) must be forwarded to the container and rotated; the API also depends on the Cloudflare API's availability and rate limits, so D1 being up does not mean the store is reachable.
- The 1 MiB read cap truncates a large result set silently; the truncation surfaces as a JSON decode error, not as "the result was too large", which makes the failure hard to diagnose.
- The migration path is broken at deploy time: `deploy-edge.yml` runs `cf d1 migrations apply … --dir migrations` from `apps/edge`, but the migrations live in `apps/api/migrations` and there is no `apps/edge/migrations`. The step therefore has nothing to apply, and a schema change ships with a Worker that expects it.
- `turbo.json` declares a `db:migrate` task that no workspace implements, so the documented task and the actual deploy step are different mechanisms.
- The unused `DB` binding is a standing alternative path: two ways to reach one store, one of them typed in `packages/types` and untested.
- Counting on `GET` makes the number a function of every fetch, including link previews and prefetches; the user-agent heuristic is the only filter, and a client that sends no user agent is treated as a bot, so a privacy tool that strips the header is undercounted.
- `updated_at` is written by SQLite's `datetime('now')` while `created_at` is written by Go as RFC3339 text — two timestamp formats in one database.

### Neutral

- There are two tables and no foreign keys; they are independent aggregates that happen to share a store.
- Migrations are plain SQL with `IF NOT EXISTS`, so re-running one is a no-op rather than an error.

## 6. Links

- Related: [ADR-0006](0006-go-fiber-api-on-cloudflare-containers.md) (why the caller is a container), [ADR-0008](0008-store-only-contact-messages.md) (what the contact rows are for), [ADR-0005](0005-cloudflare-worker-owns-assets-and-api.md) (where the unused `DB` binding is declared).
- Decision IDs: `D-003` (D1 as the store), `D-025` (view counting on `GET` with bot filtering).
- Code: `apps/api/internal/repository/d1.go`, `apps/api/internal/repository/views.go`, `apps/api/migrations/0001_init.sql`, `apps/api/migrations/0002_contact.sql`, `apps/api/internal/config/config.go`, `.github/workflows/deploy-edge.yml`.
- Introduced by: `5849861` (`feat(api): Phase 5 — Go Fiber API, D1 views/contact, container runtime, CORS`).
