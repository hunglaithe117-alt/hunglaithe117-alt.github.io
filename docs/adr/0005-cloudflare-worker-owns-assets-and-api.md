# ADR-0005: Cloudflare Worker owns static assets and the API

- **Status:** Superseded by ADR-0012
- **Date:** 2026-10-14
- **Deciders:** Repository maintainers
- **Consulted:** —
- **Informed:** —

## 1. Context and Problem Statement

This record was reconstructed on 2026-11-19 from the implementation and commit history, because the original plan documents (`SOLUTION.md`, `TOOLCHAIN-VERIFIED.md`) are not in the repository. The rationale below is inferred from the code; the rejected options are the ones the shipped configuration excludes.

The site needs one public origin. The islands call `/api/views/:slug` and `/api/contact` with same-origin relative URLs, so the API must answer on the same host as the pages, or every call becomes a cross-origin request with a preflight and an allowlist entry.

- Current behaviour: `apps/edge` is a single Worker. `apps/edge/cloudflare.config.ts` carries the runtime, the bindings, the container and the route policy; `apps/edge/wrangler.config.ts` supplies only the asset directory. One `cf deploy` ships the static site, the API route, the D1 binding and the custom domain.
- Problem or risk: two origins would put the API on a separate hostname, forcing `CORS` on the default path, splitting the deploy into two steps that can disagree, and giving the browser two credentials surfaces for one product.

## 2. Decision Drivers

- One origin, so the client's relative `/api/*` calls need no CORS in the normal case.
- One deploy must ship pages and API together, because the pages are built against the API contract.
- Bindings (D1, `send_email`) belong to a Worker; a container cannot receive them ([ADR-0007](0007-d1-as-system-of-record.md)).
- Static asset serving must not require a compute instance ([ADR-0003](0003-astro-static-ssg-with-vue-islands.md)).
- The routing policy must be declarative and reviewable in the repository, not configured in a dashboard.

## 3. Considered Options

- **Option 1:** One Worker that serves Workers Static Assets for everything except `/api` and `/api/*`, which it forwards to a container-backed Durable Object.
- **Option 2:** Two origins — Cloudflare Pages (or a dedicated assets Worker) for the site, a separate hostname for the API.
- **Option 3:** A Worker that proxies `/api/*` to a publicly reachable API URL over the internet.
- **Option 4:** A Worker that owns only the API, with the site hosted elsewhere entirely.

## 4. Decision and Rationale

**Chosen option: Option 1**, because:

1. The client stays same-origin, so the default path needs no preflight and the CORS allowlist exists only for previews and staging.
2. `runWorkerFirst: ["/api", "/api/*"]` is a declaration, not code: the platform routes those paths to the Worker entrypoint and every other path to the assets binding, so a new page needs no routing change.
3. One deploy command ships the asset build, the container configuration and the secret set together, so there is one version to reason about. The container rolls out gradually, so a new Worker can serve while an old container instance is still draining; brief version overlap is possible and is not atomic.
4. The Worker still holds the bindings, so secrets never enter the container except the three D1 REST values it needs.

The configuration this decides:

- **Two files** (`D-036`): `cloudflare.config.ts` owns runtime, bindings and asset routing; `wrangler.config.ts` carries `assetsDirectory: "../web/dist"` and nothing else. `cf` reads both; it does not read `wrangler.jsonc`/`wrangler.toml`, and there is no `--assets` flag. Runtime-only asset options (`runWorkerFirst`, `notFoundHandling: "404-page"`) cannot live with the directory and the directory cannot live with the runtime options.
- **`cf` never builds Astro** (`D-013`): `apps/web` is built by Turborepo, and `@blog/edge#build` waits for `@blog/web#build`. `cf build` only packages the result.
- **Failure handling**: a missing path returns the Astro 404 page (`notFoundHandling: "404-page"`); unmatched `/api/*` paths still reach the container, which answers with the uniform `{"error": …}` shape.
- **Headers**: the Worker adds HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` and `Permissions-Policy` to every response it handles, additively. Assets served directly by Cloudflare's asset layer do not traverse the Worker and therefore do not get them — a header the container already set wins (a future `_headers` file at the web layer would take the same precedence), and null-body statuses keep a null body. No CSP is set here; it is deferred to the web layer, where it can be tuned against the real output.
- **Config resolution**: `cf` walks upward and uses the nearest config, so commands run from `apps/edge`; from the repository root it would resolve the wrong package.
- **Secrets**: none are committed — `accountId` and the D1 id are literals to be replaced at deploy, and `SESSION_SECRET` and `D1_API_TOKEN` arrive through `--secrets-file`. Environment blocks do not merge, so each `--mode` returns one complete config.

## 5. Consequences

### Positive

- Same-origin `/api` means the browser sends no preflight for the four island calls, and no allowlist entry is needed for production.
- A new static page, tag or feed is deployed by building `apps/web`; the routing policy does not change.
- Security headers are applied once, for assets and API alike, so a route added later inherits them.
- The route policy, the bindings and the container definition are reviewable in one diff.

### Negative

- Two config files for one Worker is a split brain by construction: a reader who edits only `cloudflare.config.ts` will not find the asset directory, and `cf`'s resolution depends on the working directory. Getting it wrong is silent — the build packages whatever directory it finds, or fails late.
- `cf` is a beta toolchain (`cf@1.0.0-beta.14`), and its destructive commands can abort with exit code `0`. The deploy step therefore cannot be trusted on its exit code alone; `docs/operations/runbooks/` and `deploy-edge.yml` both tell the operator to read the output, which is an operational tax on every release.
- Every static request is a Worker invocation: the site has no path that bypasses the Worker, so a Worker-level fault or a bad header change takes the pages and the API down together.
- The Worker is on the critical path for assets and has its own CPU and request limits, so serving large files through `env.ASSETS.fetch(request)` is not free the way a pure asset host would be.
- `domains: ["example.com"]`, `accountId` and both D1 ids are placeholders in the committed config; a deploy without replacing them fails or targets the wrong account, and there is no validation that the substitution happened.
- `/api` (without a trailing path) is routed to the container, which has no route for it; the exact path is in `runWorkerFirst` for completeness, not because it serves anything.
- No `Content-Security-Policy` is emitted at the edge, so the strongest header in the set is the one not present.

### Neutral

- The asset binding is also exposed as `ASSETS` in the Worker environment, so the entrypoint can fall through to assets programmatically even though the platform already routes non-`/api` requests there.
- `compatibilityDate` is pinned (`2026-10-02`) with `nodejs_compat`, which makes platform behaviour a reviewable input rather than whatever the deploy date implies.

## 6. Links

- Related: [ADR-0003](0003-astro-static-ssg-with-vue-islands.md) (the static build being served), [ADR-0006](0006-go-fiber-api-on-cloudflare-containers.md) (what `/api/*` forwards to), [ADR-0007](0007-d1-as-system-of-record.md) (the D1 binding), [ADR-0008](0008-store-only-contact-messages.md) (the `send_email` binding).
- Decision IDs: `D-012` (container-backed API behind the Worker), `D-013` (Astro built by Turborepo only), `D-036` (the asset directory lives in `wrangler.config.ts`).
- Code: `apps/edge/cloudflare.config.ts`, `apps/edge/wrangler.config.ts`, `apps/edge/src/index.ts`, `apps/edge/package.json`, `turbo.json`, `README.md` (config resolution).
- Introduced by: `17634dc` (`feat(edge): container-backed Api Durable Object`) and `5849861` (`feat(api): Phase 5 — Go Fiber API, D1 views/contact, container runtime, CORS`).
