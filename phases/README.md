---
source_locator: "/Volumes/Storage/practice/my-blog — docs/status.md and chat brief 2026-11-19"
source_revision: "7eeb87765ebb36e8f4b66b7f644ce8a191e84166 (main)"
plan_revision: 3
depth: L2
domain: mixed
status: plan_approved
plan_review: approved
approved_by: "repository owner (chat: approve revision 3)"
approved_at: "2026-11-19"
---

# Plan: a fully static blog on Cloudflare Workers assets

## 1. Goal

Remove the view counter and retire the backend. The site becomes a build artefact plus a thin asset
Worker: no Go API, no container, no D1, no runtime secret, no migration.

Three outcomes, in order:

1. Delete the remaining dynamic surface (view counter) and the backend that served it.
2. Deploy `apps/web/dist` through the existing `cf` Worker as an assets-only site.
3. Prove the static deploy on `workers.dev`, then on the real domain.

## 2. Why this is the right shape

Everything the blog actually needs is already build-time: Astro renders pages, feeds, sitemap and
canonical metadata; Pagefind writes a static index; the Vue islands are non-API UI. The only runtime
reasons for `apps/api`, the container and D1 were the view counter and the contact form. Both are being
removed by choice, so the backend has no remaining caller.

Consequences:

- Deployment needs no database migration, no D1 token, no container image, and no Docker.
- The failure surface shrinks to: static build correctness, asset routing, headers, DNS.
- The dry-run becomes verifiable on this machine, which the API deploy never was.

## 3. Scope

### Removed

- `packages/ui/src/ViewCounter.vue`, its post-page mount, its e2e contract and fixtures.
- `apps/api` (Go module, Dockerfile, handlers, services, repository, migrations, tests).
- `apps/edge` container definition, Durable Object export, `API` namespace, D1 bindings, and the
  `/api/*` forwarding branch.
- `packages/types` (API wire contract only), `go.work` / `go.work.sum`, Go CI steps and scripts.
- The API documentation family and the architecture chapters that describe containers and D1.

### Kept

- Astro site, content collections, bilingual routing, feeds, sitemap, Pagefind, SearchBox, NavDrawer.
- `apps/edge` as a **thin asset Worker**: static assets plus the security headers already defined.
- `cf` as the deploy tool, with the mode-matched build fixed.

### Not in scope

- A newsletter, contact channel, comments, analytics beacon, or CMS.
- Redesign; only the removal of the counter and its UI hooks.
- Dropping any cloud database: if a real D1 was ever provisioned, it is exported first (Q6).

## 4. State when the plan was written

| Fact            | Value                                                                                             |
| --------------- | ------------------------------------------------------------------------------------------------- |
| Contact feature | Removed (Phase 1, ADR-0011)                                                                       |
| View counter    | Live: `ViewCounter.vue`, `GET /api/views/:slug`, `views` table                                    |
| Backend         | Go API in a Cloudflare Container, D1 over REST, Docker image                                      |
| Deploy          | Builds mode-less, deploys `--prebuilt --mode production`; migrations point at a missing directory |
| Edge            | Worker with assets, container proxy, security headers, D1/DO bindings                             |

## 5. Target state

```text
Author -> git push -> CI: build apps/web/dist (PUBLIC_SITE_URL) -> cf build --mode production
                    -> cf deploy -> Worker blog-edge-production
Reader -> HTTPS -> Cloudflare assets: HTML, feeds, sitemap, Pagefind, JS islands
No /api. No container. No D1. No runtime secret.
```

## 6. Phases

| Phase | Name                             | Goal                                                                                 | Depends on | Effort                           |
| ----- | -------------------------------- | ------------------------------------------------------------------------------------ | ---------- | -------------------------------- |
| 1     | `phase-1-remove-contact-feature` | Contact removed (accepted)                                                           | —          | done                             |
| 2     | `phase-2-retire-backend`         | Delete the view counter, API, container, D1, Go tooling; make the Worker assets-only | 1          | done                             |
| 3     | `phase-3-static-deploy`          | One mode-matched build; assets-only deploy; no migrations/secrets                    | 2          | done — awaiting human gate       |
| 4     | `phase-4-launch`                 | Preview smoke, production deploy, rollback drill                                     | 3          | **blocked on Q9** (owner config) |

Critical path: 2 → 3 → 4. Inside Phase 2, deleting the API (T2.1) and the counter UI (T2.2) share a
release: the page must not call a route that no longer exists.

## 7. Rollout and rollback

```text
Phase 4: build -> deploy preview (workers.dev) -> pages/feeds/sitemap/search/headers
         -> deploy production domain -> same checks -> watch 30 min -> close
Decision at each step: any failed check stops the rollout.
```

| Field            | Value                                                                                                     |
| ---------------- | --------------------------------------------------------------------------------------------------------- |
| Rollback trigger | A failed page/feed/sitemap check, or a broken asset after deploy                                          |
| Rollback command | Re-deploy the previous known-good commit (`cf deploy --prebuilt` from that build, or re-run the workflow) |
| Rollback time    | ≤ 10 minutes; static assets have no data to restore                                                       |
| Data             | None at runtime. The only data question is the dormant D1, handled by export before deletion (Q6)         |
| Owner            | Repository owner                                                                                          |

Rollback is easy and reversible; it is still drilled in Phase 4 before the production step.

## 8. Data and security

- **No runtime PII.** Removing the counter leaves the site with no write path and no collected data.
- **Dormant D1.** If a database was provisioned, it holds `contact_messages` (possibly PII) and `views`.
  It is exported and then left undeleted until the owner confirms (Q6); nothing in the app reads it.
- **Secrets.** After retirement the deploy needs `CLOUDFLARE_API_TOKEN` and the account id only. The D1
  token, session secret, IP salt and email sender are gone.
- **Headers.** The Worker keeps HSTS, `nosniff`, frame deny, referrer policy and permissions policy.
  CSP remains a known gap (P1-7).

## 9. Pre-mortem

1. The assets-only Worker is configured such that no Worker runs, silently dropping the security headers.
2. `cf build --mode production` still records a mode the deploy rejects because the web build and the
   edge build disagree about the working directory.
3. The counter removal misses a mount or an e2e stub, leaving a runtime `fetch` to a dead route.
4. `PUBLIC_SITE_URL` is unset in the build, so canonical URLs and feeds point at `example.com`.
5. Deleting `apps/api` breaks a root script, Turbo dependency, or CI step that still references it.

Mitigations are explicit tasks: T2.3 verifies header behaviour, T3.1 the mode pair, T2.2 a repo-wide
grep, T3.2 the build input, T2.4 the docs and scripts.

## 10. Decisions requested

1. **Q6 — dormant D1.** Answered 2026-11-19: no database was provisioned; nothing is exported and no
   cloud resource is touched.
2. **Q7 — old API paths.** Answered 2026-11-19: `/api/*` 404 is accepted.
3. **Q8 — Worker vs pure assets.** Answered 2026-11-19: keep the thin Worker for headers.
4. **Q9 — account id and domain.** Deferred by the owner: supplied later as environment values. Phase 3
   does not need them; Phase 4 does, and stops there until they exist.

`plan_revision: 3` is the revision to approve. Any scope change bumps it.

## 11. References

- Accepted removal: [`../docs/adr/0011-remove-contact-feature.md`](../docs/adr/0011-remove-contact-feature.md).
- Current defects: [`../docs/status.md`](../docs/status.md).
- Deploy mechanics: [`../docs/operations/ci-cd-pipeline.md`](../docs/operations/ci-cd-pipeline.md).
