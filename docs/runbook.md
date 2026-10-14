# Observability runbook (T6.3)

How to tell whether the site is up, what it is doing, and what to do when it is not — using the
Cloudflare platform's built-in telemetry only. **No third-party trackers and no cookies.**

## 1. Worker logs (Workers Observability)

Enabled in `apps/edge/cloudflare.config.ts`:

```ts
observability: {
  enabled: true,
  headSamplingRate: 1,
  redactQueryString: true,
  logs: { enabled: true, invocationLogs: true, headSamplingRate: 1 },
},
```

- `headSamplingRate: 1` — 100% head sampling. The site is low-traffic, so full fidelity is cheap.
- `redactQueryString: true` — query strings are never persisted, so tracking params or an email
  forwarded in a URL do not land in the log store.
- `logs.invocationLogs: true` — one record per invocation (method, path, status, duration).

View them in **Cloudflare dashboard → Workers & Pages → blog-edge → Logs**, or stream live:

```sh
cd apps/edge
pnpm exec cf tail blog-edge-prod --format json
```

### API request logs (Go container)

`apps/api/cmd/server/main.go:25-28` builds a `slog` JSON handler and installs it as the default
logger, so every line — including the request logger and the error handler — is structured JSON.

`apps/api/internal/handler/router.go:45` logs one line per request:

```text
<time> <status> <latency> <method> <path> rid=<uuid>
```

`apps/api/internal/handler/errors.go:56-68` adds a structured line per **failed** request (5xx at
`error`, 4xx at `debug`) with `status`, `method`, `path`, `request_id` and the internal `error`.

**PII policy:** bodies, headers, query strings and client IPs are never logged. Contact submit
bodies and email addresses are excluded by design; a failed contact notification is logged as a
structured, email-redacted event (`apps/edge/src/index.ts:140-156`). Request ids correlate a client
`X-Request-ID` (set by `requestid.New()`) with both the Worker and container logs.

When a user reports an error, ask for the `X-Request-ID` response header and grep the logs for it:

```sh
pnpm exec cf tail blog-edge-prod --format json | grep "<request-id>"
```

## 2. Analytics (Cloudflare Web Analytics)

Decision: D-022 / Q-4 — **Cloudflare Web Analytics, no third-party comments, no heavy trackers**.

- Privacy-friendly and cookie-free; page views and Core Web Vitals only.
- Enable per site in **Cloudflare dashboard → Analytics → Web Analytics** (account-level config; not
  provisioned from this repo because it needs credentials).
- **Follow-up (parallel lane):** if a beacon `<script>` is required, it belongs in `apps/web`
  (e.g. the base layout), which is owned by the web workstream / T6.4. It was **not** added here.
- The beacon is `defer`red and must not block first paint.

## 3. Uptime checks

Configure a **Cloudflare Health Check** (or an external pinger such as UptimeRobot) against:

| Target                            | Expect | Notes                                                                                          |
| --------------------------------- | ------ | ---------------------------------------------------------------------------------------------- |
| `https://example.com/`            | 200    | Site document (static assets).                                                                 |
| `https://example.com/api/healthz` | 200    | Public API health alias (`apps/api/internal/handler/router.go:53`); returns `{"status":"ok"}`. |

The container's internal `/healthz` is **not** routed through the edge (only `/api` + `/api/*` are
forwarded), which is why the public alias above exists. Poll every 1 minute from at least two
regions.

## 4. Alerts

- **Downtime:** Health Check alert → email (and/or a webhook). Recommended threshold: 2 consecutive
  failures.
- **Error rate:** a Workers Observability alert on 5xx responses for `blog-edge-prod`; the API logs
  5xx at `error` level so they are alertable without parsing.
- The alert channel choice was left open by Q-4; email is the default until a webhook target exists.

## 5. Triage playbook

1. **Site down?** Check the Health Check history; if only `/api/healthz` fails, the edge is up and the
   container is the suspect.
2. **5xx spike?** Filter Worker logs by `status >= 500`, take a `request_id`, then grep the container
   logs for the same id.
3. **Contact form complaints?** The store-only design (`D-040`) means a failed notification still
   stores the D1 row; look for the `contact_notification_failed` event (email-redacted) and confirm
   the row exists in D1.
4. **Deploy regression?** `cf` is beta and destructive commands can abort with exit **0** — always
   read the output, never trust the exit code alone.

## 6. Verification

- Staging: force an API error (e.g. a request with an oversized body) and confirm a structured 5xx
  line with a request id appears in `cf tail`, and that the alert rule fires.
- Analytics: confirm a page view appears in the Web Analytics dashboard within a few minutes of a
  visit.

## Known limitations

- Alert destination is not finalised (Q-4 left the channel open) — email is the interim default.
- Sampling is 100%; if traffic grows, lower `headSamplingRate` to control cost.
- No logs-based SLOs yet; this is a pre-launch baseline.
