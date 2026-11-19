# ADR-0006: Go Fiber API on Cloudflare Containers

- **Status:** Superseded by ADR-0012
- **Date:** 2026-10-14
- **Deciders:** Repository maintainers
- **Consulted:** —
- **Informed:** —

## 1. Context and Problem Statement

This record was reconstructed on 2026-11-19 from the implementation and commit history, because the original plan documents (`SOLUTION.md`, `TOOLCHAIN-VERIFIED.md`) are not in the repository. The rationale below is inferred from the code; the rejected options are the ones the shipped configuration excludes.

The API surface is two routes: `GET /api/views/:slug` and `POST /api/contact`, plus a health alias. Both touch D1 ([ADR-0007](0007-d1-as-system-of-record.md)). The language and runtime were a separate decision from the data store: the same two routes could have been written in TypeScript inside the Worker.

- Current behaviour: a Go 1.27 module (`github.com/gofiber/fiber/v2 v2.52.15`) with a multi-stage Dockerfile producing a distroless static image listening on `:8080`; `apps/edge/cloudflare.config.ts` defines a `blog-api` container and the `Api` Durable Object that exposes it; the Worker forwards every `/api/*` request to one named instance, `primary`.
- Problem or risk: the Worker's CPU and memory limits are the wrong envelope for a process that must hash, validate, query and shape JSON, and a Worker cannot be run as a standalone binary in a test or on a laptop. Conversely, a publicly hosted API reintroduces a second origin and a second credential surface ([ADR-0005](0005-cloudflare-worker-owns-assets-and-api.md)).

## 2. Decision Drivers

- The API must be runnable and testable without Cloudflare emulation.
- Process isolation from the Worker: a crash or memory spike in the API must not take the static site with it.
- The Cloudflare bindings must stay in the Worker; the container must not need a platform SDK.
- Cost must scale with traffic: a personal blog is idle most of the day.
- CORS policy must be enforced by the application, from configuration, with no wildcard.

## 3. Considered Options

- **Option 1:** A Go Fiber binary packaged as a container image, exposed through a container-backed Durable Object in the same Worker.
- **Option 2:** A Worker-native TypeScript API (for example Hono) using the D1 binding directly — no container.
- **Option 3:** A container or serverless deployment on a separate platform with its own public hostname.
- **Option 4:** One serverless function per route on the same account, still outside the Worker.

## 4. Decision and Rationale

**Chosen option: Option 1**, because:

1. The Go module is the deployable and the test target: `go test ./...`, `go vet ./...` and `go run ./cmd/server` work with no platform tooling, which Option 2 cannot offer — a Worker route is only testable through the Workers runtime.
2. The container gets its own memory and CPU envelope, so a slow query or a large body cannot exhaust the Worker that is also serving every static request.
3. The bindings stay where they must: D1 and `send_email` are Worker bindings, and the container reaches storage over the REST API instead of holding a binding ([ADR-0007](0007-d1-as-system-of-record.md)).
4. Option 3 would put the API on a second origin, which is exactly what [ADR-0005](0005-cloudflare-worker-owns-assets-and-api.md) rejected.

The runtime shape this decides:

- **Image**: two stages, `golang:1.27.2` builder to `gcr.io/distroless/static-debian12:nonroot`, `CGO_ENABLED=0`, `-trimpath -ldflags="-s -w"`, no shell and no package manager in the final layer — a smaller image and a smaller attack surface, at the cost of having no shell to debug inside.
- **Port**: `EXPOSE 8080`, which is also `Container.defaultPort` in `apps/edge/src/api-container.ts` and `config.PORT`'s default.
- **Sizing**: `instanceType: "lite"`, `maxInstances: 3`, and one stable instance name (`primary`) so all API traffic lands on one warm instance.
- **CORS**: delegated to Fiber. The allowlist arrives as `ALLOWED_ORIGINS`, is split on commas, and a `*` entry aborts startup — the decision is enforced in `apps/api/internal/config/config.go`, not in the Worker.
- **Abuse guards**: a 16 KiB body cap at the router, per-field bounds with CR/LF rejection in the service, and a one-per-minute-per-hashed-IP limit on contact.
- **Lifecycle**: `SIGINT`/`SIGTERM` trigger `ShutdownWithContext` with a 10-second deadline, so a container stop drains rather than drops.
- **Health**: `/healthz` inside the container and `/api/healthz` through the edge, because the Worker only routes `/api` and `/api/*`.

## 5. Consequences

### Positive

- The API has a normal process lifecycle: one binary, one port, structured logs on stdout, graceful shutdown, no runtime-specific primitives in the business code.
- A container failure is contained; the static site keeps serving from the assets binding.
- The CORS and validation rules are unit- and integration-testable in Go, and a wildcard is a startup failure rather than a code review finding.
- Cost is bounded by `instanceType: "lite"` and a low instance ceiling.

### Negative

- One named instance (`primary`) makes `maxInstances: 3` unreachable: there is no horizontal scale, and a container that is restarting makes every `/api/*` route unavailable while the pages stay up. The site is therefore partially available during every container rollout.
- Containers sleep. The first request after an idle period pays a cold start, which the static pages never do, and the `ViewCounter` fetch is exactly the kind of low-frequency request that hits it.
- The env pass-through is hand-maintained and incomplete. `apps/edge/src/api-container.ts` forwards four values; `IP_HASH_SALT` is not among them, so the contact rate-limit key falls back to `SESSION_SECRET` and then to the literal `dev-only-salt` unless the operator sets it. The same gap previously dropped `ALLOWED_ORIGINS`, which silently reverted production to the localhost default (SECURITY.md F-07).
- Every API change needs a new image and a container rollout, which is slower and more failure-prone than uploading a Worker script.
- `/api/views/:slug` and `/api/contact` are unauthenticated. The only guards are the body cap, the field bounds, the hop heuristic on the user agent and the per-IP rate limit, so the API is open to anyone who can reach the origin.
- The container duplicates work the Worker could do in-process: a request crosses Worker → Durable Object → container → D1 REST, and the Worker parses the contact body a second time for the notification ([ADR-0008](0008-store-only-contact-messages.md)).
- The local Go toolchain floors are not enforced: the image and CI pin `1.27.2` because `govulncheck` reports eight stdlib advisories fixed there, but a developer on `1.27.1` sees a failing scan and a passing build (SECURITY.md F-16).
- The distroless runtime means no shell, no `curl` and no package manager inside a running container; diagnosis depends entirely on logs.

### Neutral

- Fiber is configured with a request logger and a uniform error mapper, so every API response is JSON and an unexpected failure collapses to the constant `internal error`.
- The Durable Object uses SQLite-backed storage, but the API keeps no Durable Object state; the class exists only to own the container.

## 6. Links

- Related: [ADR-0005](0005-cloudflare-worker-owns-assets-and-api.md) (the single origin), [ADR-0007](0007-d1-as-system-of-record.md) (how the container reaches D1), [ADR-0008](0008-store-only-contact-messages.md) (who sends the contact email), [ADR-0010](0010-observability-with-workers-logs-and-slog.md) (the API's logs).
- Decision IDs: `D-012` (container-backed API behind the Worker).
- Code: `apps/api/Dockerfile`, `apps/api/go.mod`, `apps/api/cmd/server/main.go`, `apps/api/internal/config/config.go`, `apps/api/internal/handler/router.go`, `apps/edge/src/api-container.ts`, `apps/edge/cloudflare.config.ts`.
- Introduced by: `5849861` (`feat(api): Phase 5 — Go Fiber API, D1 views/contact, container runtime, CORS`) and `17634dc` (`feat(edge): container-backed Api Durable Object`).
