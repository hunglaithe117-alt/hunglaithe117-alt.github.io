# ADR-0010: Observability with Workers Logs and `slog`

- **Status:** Accepted
- **Date:** 2026-10-14
- **Deciders:** Repository maintainers
- **Consulted:** —
- **Informed:** —

## 1. Context and Problem Statement

This record was reconstructed on 2026-11-19 from the implementation and commit history, because the original plan documents (`SOLUTION.md`, `TOOLCHAIN-VERIFIED.md`) are not in the repository. The rationale below is inferred from the code; the rejected options are the ones the shipped configuration excludes.

The system has three places a failure can surface — the Worker, the Go container, and the store behind it — and no operator watching any of them. A visitor reports a broken page or a contact form that "did nothing"; the repository holds no telemetry that would answer which of the three failed.

- Current behaviour: `apps/edge/cloudflare.config.ts` enables Workers Observability with full head sampling, query-string redaction and invocation logs; `apps/api/cmd/server/main.go` installs a JSON `slog` handler as the default logger; `docs/operations/monitoring-and-alerts.md` documents how to read both and what to check first.
- Problem or risk: without a correlation id, a Worker log line and a container log line for the same request cannot be joined, so a 5xx in the API is a dead end. Without a PII policy, the same logs become a liability the moment a contact body is logged.

## 2. Decision Drivers

- The operator must be able to tell whether the site and the API are up, and which failed.
- A user report must be traceable to a request without reproducing it.
- Logs must be structured and queryable, not free text.
- No third-party tracker, no cookie banner, no consent flow.
- Personal data must never be persisted, including on failure paths.

## 3. Considered Options

- **Option 1:** Platform-native telemetry — Workers Observability (logs and invocation records) for the Worker, JSON `slog` to stdout for the container, Cloudflare Web Analytics for page views, and account-level Health Checks for uptime.
- **Option 2:** A third-party APM or error tracker (Sentry, Datadog) with SDKs in both runtimes.
- **Option 3:** An OpenTelemetry pipeline exporting to a vendor collector.
- **Option 4:** No telemetry; diagnose from reproduction and Cloudflare's dashboard on demand.

## 4. Decision and Rationale

**Chosen option: Option 1**, because:

1. The platform already sees every request; enabling its logs costs a configuration block rather than an SDK, a dependency and a data-processing agreement.
2. Option 2 and Option 3 both require a client-side script or an outbound exporter, and both move personal data to a third party — which the no-tracker, no-cookie position (`D-022`) rules out.
3. `slog` with a JSON handler is standard library, so the container's logs are structured with no logging dependency, and every line goes to stdout where the platform collects it.
4. Option 4 is what the repository had, and it is why the runbook has to begin with "check the Health Check history".

The telemetry this decides:

- **Worker** (`T6.3`): `observability.enabled`, `headSamplingRate: 1`, `redactQueryString: true`, `logs.enabled` and `logs.invocationLogs` at 100%. Full fidelity because the site is low-traffic; a query string is never persisted, so a tracking parameter or a forwarded address cannot land in the log store.
- **API**: one JSON line per request — time, status, latency, method, path and `rid` — from Fiber's logger with an explicit format string; failed requests get a second structured line (`status`, `method`, `path`, `request_id`, `error`), 5xx at `error` so they are alertable and 4xx at `debug` so they are not noise. The request id comes from `requestid.New()` and is returned in the `X-Request-ID` response header.
- **PII policy**: bodies, headers, query strings and client IPs are never logged. The contact failure event is `contact_notification_failed` with email-shaped text replaced by `[redacted-email]` and no contact fields and no recipient ([ADR-0008](0008-store-only-contact-messages.md)).
- **Analytics** (`D-022`): Cloudflare Web Analytics — cookie-free, page views and Core Web Vitals only. It is account-level configuration; the repository documents it and does not provision it, and any beacon script would belong in `apps/web`.
- **Uptime**: two targets, `https://example.com/` and `https://example.com/api/healthz`, polled from at least two regions. The API alias exists because the Worker forwards only `/api` and `/api/*`, so the container's internal `/healthz` is unreachable from outside.
- **Alerts**: a Health Check alert at two consecutive failures and a Workers Observability alert on 5xx for the production Worker. The channel is open (`Q-4`); email is the interim default until a webhook target exists.

## 5. Consequences

### Positive

- Every request has a structured record on both sides of the Worker boundary, and a 5xx is separable from a 4xx by log level alone.
- A user report resolves to a request: ask for `X-Request-ID`, then grep the Worker stream and the container stream for it.
- No cookie, no consent banner and no client script from a third party, so the site's privacy claim matches its behaviour.
- The runbook is executable as written: each symptom names the artifact to inspect and the command to inspect it with.

### Negative

- The alert channel is undecided (`Q-4`). Until someone configures a destination, the "alertable" 5xx lines alert nobody, and the uptime checks are a manual dashboard read.
- Uptime checks and Web Analytics are console-only. A new account, or a rebuilt account, has no monitoring until a human repeats the steps in `docs/operations/monitoring-and-alerts.md`; nothing in the repository detects the omission (SECURITY.md F-18/F-19).
- The request id originates in the container. The Worker neither mints nor forwards one, so correlating a Worker log line with a container line depends on the client sharing the `X-Request-ID` it received — a request that fails before reaching the API has no container line at all.
- Two log streams must be searched separately; there is no join, no trace and no span, so a slow request is diagnosed by reading two timelines by hand.
- 100% head sampling is a cost that grows with traffic, and lowering it later contradicts the documented fidelity; there is no sampling policy beyond "the site is small".
- The PII guarantee is discipline, not a schema: a future log line that prints `c.Body()` or an error containing a query string would pass review, and the email redaction is a regex over the provider's message, not a guarantee that the message contained no other personal data.
- There are no metrics and no SLOs — no error rate series, no latency percentile, no saturation signal — only per-invocation records that must be aggregated after the fact.
- Log retention is the platform's, so the window in which a report can be investigated is fixed by the plan, not by the repository.

### Neutral

- Logging is one line per request at `info`, so a quiet site produces almost no volume and a spike is immediately visible in the stream.
- The health endpoint is intentionally trivial — it reports that the process is alive and, by its 200, that the Worker can reach the container; it does not check D1.

## 6. Links

- Related: [ADR-0005](0005-cloudflare-worker-owns-assets-and-api.md) (the Worker being observed), [ADR-0006](0006-go-fiber-api-on-cloudflare-containers.md) (the container's logger and health alias), [ADR-0008](0008-store-only-contact-messages.md) (the failure event this observes), [ADR-0009](0009-affected-ci-and-content-quality-gate.md) (the checks that gate a release).
- Decision IDs: `D-022` (Cloudflare Web Analytics, no third-party trackers), `Q-4` (the alert channel, left open).
- Code: `apps/edge/cloudflare.config.ts`, `apps/api/cmd/server/main.go`, `apps/api/internal/handler/router.go`, `apps/api/internal/handler/errors.go`, `apps/edge/src/index.ts`, `docs/operations/monitoring-and-alerts.md`.
- Introduced by: `d4d70ce` (`feat(security): Phase 6 T6.2 hardening + T6.3 observability (SECURITY.md, runbook)`).
