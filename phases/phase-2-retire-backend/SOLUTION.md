# Phase 2 — Solution

## Option chosen

Delete the backend and the view counter; keep a thin asset Worker. There is no design alternative worth
staging: the code has no caller after the counter is removed, and splitting the deletion would leave a page
fetching a dead route or a Worker declaring a missing container.

Rejected:

- **Keep `apps/api` dormant** — dead module, Docker build, Go CI, and D1 bindings for no runtime gain.
- **Keep the thin Worker but retain the container config** — fails the build once the image is gone.
- **Pure-assets deploy with no Worker** — loses the security headers that live in `src/index.ts` unless
  `_headers` is added first.

## Shape

| Layer                    | Action                                                                                                                     |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `apps/api`               | delete module, Dockerfile, migrations, tests                                                                               |
| `go.work`, `go.work.sum` | delete                                                                                                                     |
| `packages/types`         | delete; remove `@blog/types` from manifests                                                                                |
| `apps/edge`              | delete `api-container.ts`; config keeps assets, domain (prod-only), observability; Worker becomes `ASSETS.fetch` + headers |
| `packages/ui`            | delete `ViewCounter.vue`                                                                                                   |
| `apps/web`               | remove the counter mount, label, and `@blog/types` dependency                                                              |
| `e2e`                    | delete `api-contract.spec.ts`; fixtures lose the API recorder                                                              |
| root/CI                  | remove Go setup, govulncheck, `db:migrate`, `go.work` cache key, `bin/**` output                                           |
| docs                     | ADR-0012; delete the API family, component/data chapters, view-counter feature; rewrite status/ops                         |

## Sequencing

T2.1 (API), T2.2 (counter), T2.3 (Worker) land in **one release**; T2.4 (types) and T2.5 (docs) follow in
the same PR. The lockfile is regenerated once, after all manifests change.

## Verification

- `pnpm install` with the reduced workspace; `pnpm build`.
- `pnpm --filter @blog/web check`; `pnpm test:e2e` (static journeys only).
- `cd apps/edge && pnpm exec cf build --mode production` — no Docker required.
- Repo-wide `rg` for `apps/api`, `go.work`, `D1`, `Container`, `durableObject`, `/api/`.
- Docs: markdownlint, link check, ADR index vs files.

## Known limits

- The headers-on-every-path claim depends on the assets `runWorkerFirst` value; T2.3 must verify it with the
  pinned CLI, or record the pure-assets fallback.
- No live deploy in this phase.
- If a real D1 exists, it is not touched; local migrations are deleted with the API.
