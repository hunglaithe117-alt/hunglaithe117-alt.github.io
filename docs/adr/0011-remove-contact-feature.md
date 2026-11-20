# ADR-0011: Remove the contact feature

- **Status:** Accepted
- **Date:** 2026-11-19
- **Deciders:** Repository owner
- **Consulted:** —
- **Informed:** —

## 1. Context and Problem Statement

The site shipped a contact page, a Vue form, `POST /api/contact`, a per-IP rate limiter, a salted IP hash,
and a Worker-side notification email sent through the `send_email` binding after a successful store. The
owner does not want a contact channel, a newsletter, or any email sending, and no subscriber feature
exists in the codebase.

- Current behaviour: the form posts to the API; the container validates, rate-limits, hashes the caller IP,
  and inserts `contact_messages`; the Worker then awaits one notification email before releasing the
  response. A send failure is logged and swallowed.
- Problem or risk: it is the only PII-collecting surface, the only writer of a second table, the only
  consumer of two secrets (`SESSION_SECRET`, `IP_HASH_SALT`), and the only path that leaves the platform.
  It buys a channel the owner does not want.

## 2. Decision Drivers

- No contact channel, newsletter, or email sending is wanted.
- One dynamic surface is easier to operate than two, especially with no alert channel.
- Fewer secrets and less PII is better than a best-effort delivery path with no retry.
- The applied migration is history; a destructive drop must not be taken casually.

## 3. Considered Options

- **Option 1:** Remove the notification email only; keep the form and the stored row.
- **Option 2:** Remove the feature — page, form, route, service, limiter, hash, email — and keep the table
  dormant.
- **Option 3:** Remove the feature and drop `contact_messages` in a new migration.
- **Option 4:** Keep the feature and move the email send into the Go API.

## 4. Decision and Rationale

**Chosen option: Option 2**, because:

1. It matches the stated intent: no contact channel at all, so keeping a form that stores messages would
   still leave the surface the owner rejected.
2. Keeping the table and migration 0002 avoids destructive DDL: applied migrations are immutable, existing
   rows survive a revert, and a later export-then-drop is a separate, reviewable decision.
3. It removes two secrets, one rate-limit policy, one IP hash, and the only third-party data path without
   adding a vendor dependency (Option 4).
4. One release can delete both halves atomically; there is no staging window in which the form posts to a
   removed route.

## 5. Consequences

### Positive

- After the cutover completes, the only inbound PII is no longer collected: no name, email, message body, or IP hash is written. A gradual container rollout can leave an old instance serving `/api/contact` briefly; verify the 404 after the rollout finishes.
- The deploy needs one runtime secret (`D1_API_TOKEN`) instead of three.
- The API surface is two read-only routes plus health; the Worker no longer parses request bodies.
- The contact e2e spec, rate-limit tests, and their fixtures are gone with the code. The removal is atomic in one commit; the deployed cutover is a gradual container rollout, so it is not instantaneous.

### Negative

- The owner loses the only inbound channel; contact now requires an out-of-band address the site does not
  publish.
- Old `/vi/contact/` and `/en/contact/` URLs return 404 unless a redirect is added later.
- Existing `contact_messages` rows remain, unread and unpruned, with no retention policy (P1-8).

### Neutral

- Migration `0002_contact.sql` and the table stay; they are dormant history, not live behaviour.
- `MAX_BODY_BYTES` stays as a general request guard even though no current route sends a body.

## 6. Links

- Supersedes: `ADR-0008` (`0008-store-only-contact-messages.md`).
- Related: `ADR-0007` (the D1 store), `ADR-0005` (the Worker that held the binding), `ADR-0010`
  (observability).
- Feature removed: `docs/features/contact-form.md` (deleted with the code).
- Plan: the phase packet was removed after completion; the change is in the git history.
