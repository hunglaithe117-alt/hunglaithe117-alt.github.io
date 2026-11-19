# Error Codes

> **When to use:** defining or consuming the system's failure contract — the stable codes a caller can branch on and the HTTP status each maps to.
>
> **What it answers:** the envelope every error response uses, the meaning of each code, the HTTP status it carries, and what a client should do about it.
>
> Delete this blockquote when filled.

This catalogue is the **single authority** for error codes and their HTTP status, per [`CONVENTIONS`](../CONVENTIONS.md) §12. Every contract in this family ([`openapi.yaml`](openapi.yaml), [`asyncapi.yaml`](asyncapi.yaml), and the gRPC and GraphQL schemas) references a code from here and never restates the table. When two documents disagree about a code, this file wins.

## 1. The problem+json envelope

Every HTTP error response is an RFC 9457 `application/problem+json` object. The five standard members carry the human-facing problem; a `code` extension carries the machine handle a client branches on.

| Member     | Type             | Required | Meaning                                                    |
| ---------- | ---------------- | -------- | ---------------------------------------------------------- |
| `type`     | string (URI ref) | yes      | Stable URI identifying the problem type                    |
| `title`    | string           | yes      | Short, human-readable summary; constant for the code       |
| `status`   | integer          | yes      | The HTTP status code, repeated in the body                 |
| `detail`   | string           | no       | Human-readable explanation for this specific occurrence    |
| `instance` | string (URI ref) | no       | URI identifying this occurrence, for correlation in logs   |
| `code`     | string           | yes      | Catalogue code from §2; the machine-readable discriminator |

```json
{
  "type": "https://errors.example.com/validation-failed",
  "title": "Validation failed",
  "status": 422,
  "detail": "The field 'name' must not be empty.",
  "instance": "/resources/8f1c0d3e-1b2a-4c5d-9e6f-7a8b9c0d1e2f",
  "code": "VALIDATION_FAILED"
}
```

`title` is constant per code; `detail` is free text and must never be parsed by a client. A client branches only on `status` and `code`.

## 2. Catalogue

One row per code. The table is exhaustive: if a surface returns a failure that is not here, add it here first, then reference it. The rows below are the baseline; add or remove rows to match the system, and delete the placeholder row once the catalogue is real.

| Code                 | HTTP status    | Meaning                                                  | When it is returned                                                        | Client remedy                                                       |
| -------------------- | -------------- | -------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `VALIDATION_FAILED`  | 422            | The request violates a field or cross-field constraint.  | A required field is missing, malformed, or outside its permitted range.    | Fix the payload from `detail`; do not retry unchanged.              |
| `UNAUTHENTICATED`    | 401            | The caller did not present a valid credential.           | The bearer token is absent, expired, or fails signature verification.      | Obtain a fresh token and retry once.                                |
| `FORBIDDEN`          | 403            | The caller is authenticated but not permitted.           | The principal lacks the scope or role the operation requires.              | Do not retry; request the missing permission out of band.           |
| `RESOURCE_NOT_FOUND` | 404            | The addressed resource does not exist.                   | The identifier resolves to no resource, or is outside the caller's tenant. | Verify the identifier; treat as terminal for this request.          |
| `STATE_CONFLICT`     | 409            | The request conflicts with the resource's current state. | An idempotency key or unique constraint is already satisfied differently.  | Re-read the resource, then reconcile and retry if still applicable. |
| `RATE_LIMITED`       | 429            | The caller exceeded its request quota.                   | The per-caller allowance for the window is exhausted.                      | Back off per `Retry-After`; retry after the indicated delay.        |
| `INTERNAL_ERROR`     | 500            | An unexpected server-side failure occurred.              | A fault the server could not attribute to the request.                     | Retry with backoff; escalate with `instance` if it persists.        |
| `<CODE>`             | \<HTTP status> | \<what the code means>                                   | \<the condition that produces it>                                          | \<what the caller should do next>                                   |

## 3. Code naming and stability

- A code is `UPPER_SNAKE_CASE`, stable forever, and never reused for a different meaning.
- A code is not the HTTP status: several codes may share a status, and a code's status may only ever change as a deliberate, announced break.
- Removing a code or changing its status is a breaking change and needs an [ADR](../adr/README.md) before it lands.

## 4. References

- [`CONVENTIONS`](../CONVENTIONS.md) §12 — one authority per rule.
- [`openapi.yaml`](openapi.yaml) — the `Problem` schema that carries a `code`.
- [RFC 9457 — Problem Details for HTTP APIs](https://www.rfc-editor.org/rfc/rfc9457).
