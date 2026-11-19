---
phase: 2
name: retire-backend
domain: mixed
depth: L2
status: awaiting_human_review
depends_on: [phase-1-remove-contact-feature]
plan_review: approved
plan_revision_approved: 3
approved_by: "repository owner (chat: approve revision 3)"
approved_at: "2026-11-19"
exit_criteria_met: false
---

# Phase 2 — Retire the backend and the view counter

## 1. Goal

Delete every runtime piece the blog no longer needs: the Go API, the container, D1 bindings and
migrations, the shared API types, the view-counter island, and the Go tooling. The edge Worker remains,
but serves only static assets and headers.

## 2. Shape

```text
BEFORE                                        AFTER
Astro dist ─┐                                 Astro dist
Worker ── /api/* ──> container ──> D1          Worker ──> ASSETS (all paths)
        └── assets ──> dist                    headers on every response
```

## 3. Tasks

| ID   | Task                                         | Blocking      | Owner domain | Touches                                          |
| ---- | -------------------------------------------- | ------------- | ------------ | ------------------------------------------------ |
| T2.1 | Delete the API, D1 wiring, and Go tooling    | YES           | backend      | `apps/api/**`, `go.work*`, root scripts, CI      |
| T2.2 | Remove the view counter and its e2e contract | YES           | web-fe       | `packages/ui/**`, `apps/web/**`, `e2e/**`        |
| T2.3 | Make the Worker serve assets only            | YES           | devops       | `apps/edge/**`                                   |
| T2.4 | Delete the shared API types                  | NO — parallel | backend      | `packages/types/**`, package manifests, lockfile |
| T2.5 | Rewrite docs and ADRs for a static site      | NO — parallel | backend      | `docs/**`, `README.md`, `SECURITY.md`            |

T2.1 and T2.2 must land in one release: the page must not call a route that no longer exists.

## 4. Exit criteria

- `apps/api`, `go.work`, `go.work.sum`, and `packages/types` are gone; no `@blog/types` dependency remains.
- No `D1`, `Container`, `durableObject`, `send_email`, or `/api` reference remains in `apps`, `packages`,
  `.github`, `turbo.json`, or root scripts.
- No `ViewCounter` mount, import, type, or e2e stub remains.
- `apps/edge` build succeeds **without Docker** and produces an assets-only artefact.
- `pnpm build`, `pnpm --filter @blog/web check`, `go`-free CI config, and `pnpm test:e2e` pass.
- Docs describe a static site; the API family, view-counter feature, and data architecture chapters are
  removed or rewritten.

## 5. Verification budget

| Claim                             | Check                                                                                 | Cap    |
| --------------------------------- | ------------------------------------------------------------------------------------- | ------ |
| No backend code or wiring remains | repo-wide `rg` for `apps/api`, `go.work`, `D1`, `Container`, `durableObject`, `/api/` | 45 min |
| The site still builds and behaves | web build, astro check, e2e static journeys                                           | 45 min |
| The edge artefact is assets-only  | `cd apps/edge && pnpm exec cf build --mode production` (no Docker needed now)         | 30 min |
| Docs match                        | markdownlint, links, OpenAPI family removed                                           | 45 min |

## 6. Risks and rollback

- Deleting `apps/api` is irreversible in the working tree but recoverable from git. Tag the phase commit.
- If a real D1 was provisioned, do not delete cloud resources; export first (Q6). This phase deletes
  local code only.
- A missed root/Turbo/CI reference fails the build; the repo-wide grep is the check.
- Rollback: revert the phase commit; no data or cloud resource is touched.

## 7. Review questions

1. Confirm Q6: no production D1 exists, so migrations can be deleted with the API.
2. Confirm Q7: `/api/*` returns 404 afterwards.
3. Keep `apps/edge` at all (recommended) or deploy assets with no Worker?

## 8. References

- Plan: [`../README.md`](../README.md). Decisions: [`../DECISIONS.md`](../DECISIONS.md).
- Accepted removal: [`../../docs/adr/0011-remove-contact-feature.md`](../../docs/adr/0011-remove-contact-feature.md).
