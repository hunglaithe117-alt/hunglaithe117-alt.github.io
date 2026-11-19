# ADR-0008: Store-only contact messages

- **Status:** Superseded by ADR-0011
- **Date:** 2026-10-14
- **Deciders:** Repository maintainers
- **Consulted:** —
- **Informed:** —

## 1. Context and Problem Statement

This record was reconstructed on 2026-11-19 from the implementation and commit history, because the original plan documents (`SOLUTION.md`, `TOOLCHAIN-VERIFIED.md`) are not in the repository. The rationale below is inferred from the code; the rejected options are the ones the shipped handlers exclude.

The contact form is the only writer of user-supplied data. Its failure modes are asymmetric: losing a message a reader took time to write is worse than a delayed notification, and a visitor who sees an error will resubmit, duplicating the message.

- Current behaviour: `POST /api/contact` validates the payload and inserts a row into `contact_messages` ([ADR-0007](0007-d1-as-system-of-record.md)); it sends nothing. The Worker parses a clone of the same request and, only after a 2xx response, sends a notification through the `send_email` binding. A failed send is swallowed and logged with email addresses masked.
- Problem or risk: if the request's success depends on the mail provider, a provider outage becomes a visible failure, a retry storm and duplicate rows — for a message that was in fact saved.

## 2. Decision Drivers

- A stored message must outlive a delivery failure.
- The API must not hold mail credentials; the Worker already owns every binding.
- Logs must stay free of personal data, including on the failure path.
- The request must be cheap to defend: bounded body, bounded fields, bounded rate.
- A duplicate submission is worse than a late notification.

## 3. Considered Options

- **Option 1:** Store in D1 first; the Worker sends the notification after a successful response — the store is the record, the email is a convenience.
- **Option 2:** The Worker generates and sends the email directly, with no storage.
- **Option 3:** The container calls an email provider's HTTP API itself, and the request fails if the send fails.
- **Option 4:** No form — a `mailto:` link or a hosted form service.

## 4. Decision and Rationale

**Chosen option: Option 1**, because:

1. The success of the request is decoupled from the mail provider: the row is committed, the response is 2xx, and the visitor is not asked to retry something that worked.
2. Option 2 makes the inbox the only record. A send that fails silently leaves nothing, and a send that succeeds leaves nothing queryable; there is no way to answer "did anyone write last week?" without the mailbox.
3. Option 3 requires a mail token inside the container and makes the API's availability the provider's availability. The container's config is explicit that email is absent by design: `IPHashSalt` is there, mail is not.
4. Option 4 discards the abuse guards the form gives — the honeypot, the body cap and the per-IP rate limit.

The contract this decides (`D-040`, `Q-12`):

- **Request**: `ContactRequest { name, email, body }` in `packages/types`; the API rejects a body over 16 KiB, bounds each field, and rejects CR/LF so a header cannot be injected through a field.
- **Abuse guards**: a honeypot field in the island, a one-per-minute-per-hashed-IP limit backed by the `(ip_hash, created_at)` index, and a SHA-256 hash of the IP in place of the IP itself.
- **Write ordering**: the row is inserted before anything leaves the process; the `id` is generated per request and returned as `{ id, ok }`.
- **Notification**: the Worker reads the contact fields from `request.clone()` — parsing a clone leaves the body stream it forwards to the container untouched — and calls `env.EMAIL.send({ from, to, replyTo: contact.email, subject, text })`. A parse failure is non-fatal; the container still validates.
- **Failure policy**: the send is attempted only when `response.ok`; a thrown error is caught, the stored row is kept, the success response still returns, and one structured event (`contact_notification_failed`) is logged with any email-shaped text replaced by `[redacted-email]`. If `EMAIL` is unbound, the notification is skipped silently.

## 5. Consequences

### Positive

- A mail outage costs a notification, not a message: the row is durable and the visitor sees success.
- No mail credential ever enters the container, so the container's secret set stays at the three D1 REST values.
- The D1 row is an audit trail that answers "how many, from where, when" without opening a mailbox.
- The failure path is observable without being a PII leak: the event name is stable and the payload carries no contact fields and no recipient.

### Negative

- There is no retry and no outbox. A notification lost between the successful response and the send is lost; recovering it means querying `contact_messages` for rows newer than the last one seen, by hand.
- Nothing records delivery state. The table has no `notified_at` column, so "stored but never emailed" and "stored and emailed" are indistinguishable from the data.
- A notification can arrive for a message the visitor then considers unsent, and conversely a message can be stored while the notification is dropped — the two sides have no shared acknowledgement.
- The Worker parses the same body the container parses, duplicating validation at a second layer; a body that passes the Worker's trim check but fails the container's bounds yields a stored-nothing, emailed-nothing request with only the container's 4xx to explain it.
- Spam defence is a honeypot, a body cap and one request per minute per hashed IP. There is no content scoring, no proof-of-work and no captcha, so a determined sender with many IPs can still fill the table.
- The row holds name, email and body indefinitely. No retention window, deletion path or export exists in the repository, so the personal data at rest outlives the stated purpose ("your email is used only to reply") with nothing enforcing it.
- `IP_HASH_SALT` is not forwarded into the container ([ADR-0006](0006-go-fiber-api-on-cloudflare-containers.md)), so the rate-limit key falls back to `SESSION_SECRET` and then to a literal default — the hash that protects stored addresses is only as secret as that fallback.
- If `EMAIL` is unbound, the skip is silent: no event, no warning, so a misconfigured deploy looks healthy and simply never notifies.

### Neutral

- `Q-12` is answered by construction — the Worker sends, not the container — but the recipient address in `apps/edge/src/index.ts` and the binding's placeholder recipient must be kept in step by hand.
- The email is plain text built from the stored fields; there is no template, so the body is exactly what the visitor typed plus a signature line.

## 6. Links

- Related: [ADR-0007](0007-d1-as-system-of-record.md) (the table and its index), [ADR-0006](0006-go-fiber-api-on-cloudflare-containers.md) (why the container is store-only), [ADR-0005](0005-cloudflare-worker-owns-assets-and-api.md) (the Worker that holds `send_email`), [ADR-0010](0010-observability-with-workers-logs-and-slog.md) (the PII-free failure event).
- Decision IDs: `D-040` (store-only contact handling with the Worker sending the notification), `Q-12` (who sends the email).
- Code: `apps/edge/src/index.ts`, `apps/edge/cloudflare.config.ts`, `apps/api/internal/service/contact.go`, `apps/api/internal/handler/contact.go`, `packages/types/index.ts`, `packages/ui/src/ContactForm.vue`, `apps/api/migrations/0002_contact.sql`.
- Introduced by: `96aa889` (`feat(api/edge): contact email sent by Worker via send_email binding (D-040/Q-12)`).
