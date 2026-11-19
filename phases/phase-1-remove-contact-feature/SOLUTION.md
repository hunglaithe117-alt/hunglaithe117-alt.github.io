# Phase 1 — Solution

## Option chosen

Delete the contact feature in one release. There is no viable splitting alternative: shipping the UI
removal first leaves a form posting to a live route, and shipping the API removal first turns that form
into a 404 for real users. The cross-domain "contract" is being removed, so there is no interface to stage.

Rejected:

- **Keep the form, drop the email** — rejected by the owner (Q1).
- **Drop the table** — destructive DDL, no rollback; the applied migration is history.
- **Leave the page but disable the form** — keeps a dead surface and its copy.

## Shape of the change

| Layer        | Action                                                                                        |
| ------------ | --------------------------------------------------------------------------------------------- |
| API route    | Delete `POST /api/contact`; router keeps health and views                                     |
| API code     | Delete handler, service, tests; delete `InsertContact` / `CountContactsSince`                 |
| API config   | Delete `IPHashSalt`, `RateLimitPerMinute`; keep `MAX_BODY_BYTES`, `ALLOWED_ORIGINS`           |
| Shared types | Delete `ContactRequest`, `ContactResponse`, the `POST` route entry, `EMAIL`, `SESSION_SECRET` |
| Worker       | Delete `EMAIL`, `SESSION_SECRET`, the body parse, the send, and `CONTACT_*`                   |
| Web          | Delete `contact.astro`, nav/footer link, contact copy and dictionary keys, `contactPath()`    |
| UI package   | Delete `ContactForm.vue`                                                                      |
| E2E          | Delete `contact-form.spec.ts`; remove the contact recorder from fixtures                      |
| Docs         | ADR-0011; OpenAPI/error codes; architecture, feature, development, operations, status, README |

## Names and boundaries

- No new symbols. The only new identifiers are documentation: `ADR-0011` and the dormant-table note.
- `apps/api/internal/repository/views.go` keeps its name even though it now holds only view methods; a
  rename would add churn without a behavioural gain and is deferred.
- `MAX_BODY_BYTES` stays because it is a general guard, not a contact setting.

## Verification

- `go test ./...` in `apps/api`, `go vet ./...`.
- `pnpm --filter @blog/types typecheck`; `pnpm --filter @blog/web build`; `pnpm --filter @blog/edge build`.
- `pnpm test:e2e` for the static journeys and the views contract.
- `curl -X POST /api/contact` → 404; `GET /api/views/:slug` → 200.

## Known limits

- Existing `contact_messages` rows remain, unread and unpruned (P1-8).
- Old `/contact/` URLs 404 unless a redirect is requested (Q5).
- No live deploy is part of this phase; that is Phase 4 onward.
