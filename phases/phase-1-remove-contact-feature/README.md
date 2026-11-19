---
phase: 1
name: remove-contact-feature
domain: mixed
depth: L3
status: human_approved
depends_on: []
plan_review: approved
plan_revision_approved: 2
approved_by: "repository owner (chat: implement phase one)"
approved_at: "2026-11-19"
exit_criteria_met: true
---

# Phase 1 — Remove the contact feature

## 1. Goal

Delete the contact surface end to end: the page and form, `POST /api/contact`, its service, its
storage methods, the shared types, the rate limiter, the IP hash, the Worker email binding, and the
tests and docs that describe them. After this phase the site has one dynamic surface: the view counter.

## 2. Why one phase, not two

The form and the route must disappear in the **same release**: a UI phase that ships first would post to
a live route that is about to be deleted, and an API phase that ships first would 404 the form. The
cross-domain "interface" here is being removed, so there is no contract artifact to stage — the phase
owns both domains and lands atomically.

## 3. Current surface

| Layer      | Artifact                                                                                                         |
| ---------- | ---------------------------------------------------------------------------------------------------------------- |
| Page       | `apps/web/src/pages/[lang]/contact.astro`                                                                        |
| Navigation | `contactPath()` and `contact` labels in `apps/web/src/lib/i18n.ts`, links in `Nav.astro` / `Footer.astro`        |
| Copy       | `CONTACT` block in `apps/web/src/lib/pages-content.ts`, contact strings in both locale dictionaries              |
| Island     | `packages/ui/src/ContactForm.vue`                                                                                |
| API        | `apps/api/internal/handler/contact.go`, `POST /api/contact` in `router.go`                                       |
| Domain     | `apps/api/internal/service/contact.go` (+ test), `InsertContact` / `CountContactsSince` in `repository/views.go` |
| Config     | `RATE_LIMIT_PER_MINUTE`, `IP_HASH_SALT` (used only by contact)                                                   |
| Contract   | `ContactRequest` / `ContactResponse` / `ApiRoutes` entry in `packages/types/index.ts`                            |
| Worker     | `EMAIL` binding, send path (already identified in the prior draft)                                               |
| Tests      | `e2e/contact-form.spec.ts`, contact cases in `router_test.go`, `contact_test.go`, fixtures                       |
| Docs       | contact feature doc, OpenAPI path/schemas, error-code rows, architecture flow and diagrams                       |

## 4. What is deliberately kept

- The `contact_messages` **table and migration 0002**. Applied migrations are never edited, and dropping
  the table is a destructive DDL with no rollback. It becomes dormant; existing rows remain until the
  owner decides to export or purge them (separate decision, see `../OPEN_QUESTIONS.md` Q1b).
- `MAX_BODY_BYTES` as a general request guard; it is not contact-specific.

## 5. Tasks

| ID   | Task                                                               | Blocking                           | Owner domain | Touches                                   |
| ---- | ------------------------------------------------------------------ | ---------------------------------- | ------------ | ----------------------------------------- |
| T1.1 | Remove the API surface, service, storage methods, and shared types | YES                                | backend      | `apps/api/**`, `packages/types/index.ts`  |
| T1.2 | Remove the page, nav entry, copy, island, and contact e2e test     | NO — runs with T1.1 in one release | web-fe       | `apps/web/**`, `packages/ui/**`, `e2e/**` |
| T1.3 | Update docs, contract, and ADR-0011                                | NO — parallel                      | backend      | `docs/**`, `README.md`                    |

## 6. Exit criteria

- `rg -i "contact" apps packages e2e --glob '!**/migrations/**'` returns only the dormant migration and
  historical comments that name it.
- `/vi/contact/` and `/en/contact/` are absent from the built `dist`; navigation has no dead link.
- `POST /api/contact` returns 404; `GET /api/views/:slug` still works.
- `ContactRequest`, `ContactResponse`, `RATE_LIMIT_PER_MINUTE`, `IP_HASH_SALT`, and the `EMAIL` binding
  are gone from code and config.
- OpenAPI, error codes, feature docs, architecture diagrams, and `docs/status.md` describe only the
  remaining surface.
- `pnpm --filter @blog/web build`, `pnpm --filter @blog/edge build`, `go test ./...`, and `pnpm test:e2e`
  pass.

## 7. Verification budget

| Claim                              | Check                                                                                   | Cap    |
| ---------------------------------- | --------------------------------------------------------------------------------------- | ------ |
| No contact code remains            | `rg` command above + review of the router table                                         | 30 min |
| The build has no dead page or link | web build, then `rg -i contact apps/web/dist` and the e2e static journeys               | 30 min |
| The API lost one route, not two    | `go test ./...`, then `curl -X POST .../api/contact` → 404 and `GET /api/views/x` → 200 | 30 min |
| Docs match                         | `pnpm lint:md`, link check, OpenAPI parse                                               | 30 min |

## 8. Risks and rollback

- Deleting the table would be destructive and is **not** in scope. The migration stays; only writes stop.
- A missed nav or copy reference leaves a dead link that the build cannot see; the e2e static journey and a
  `dist` grep are the checks.
- Rollback: revert the phase commit. The table was never dropped, so stored messages survive a revert.

## 9. Review questions

1. Confirm the table stays dormant (recommended) rather than being dropped now.
2. Is the contact page's content (the "what to expect" copy) worth moving to the About page, or is it
   deleted with the page? Recommended: deleted; About already covers the introduction.

## 10. References

- Plan packet: [`../README.md`](../README.md).
- Open questions: [`../OPEN_QUESTIONS.md`](../OPEN_QUESTIONS.md), [`../DECISIONS.md`](../DECISIONS.md).
- Removal decision: [`../../docs/adr/0011-remove-contact-feature.md`](../../docs/adr/0011-remove-contact-feature.md).
