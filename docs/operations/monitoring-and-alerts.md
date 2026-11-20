# Monitoring and Alerts

What `blog_personal` reports about itself while it runs, what an operator can read today, and which
alerts are still a proposal rather than a configuration. The stack is deliberately thin: the site is
a static build served by an assets-only Worker, so Cloudflare's built-in Workers observability is the
whole telemetry surface.

This page has no status catalogue to quote: a failing asset request is a 404 or a 5xx from the Worker, and
there is no error envelope to interpret.

## 1. The observability contract

| Property               | State                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------------------ |
| Request telemetry      | Exists. One invocation record per Worker request — method, path, status, duration — at 100% sampling   |
| Log retention          | Not configured. The platform default applies; no retention period is stated anywhere in the repository |
| Metrics and dashboards | None of the repository's own. The Cloudflare dashboard is the only UI                                  |
| Paging                 | None. No pager integration exists; the alert channel was left open (Q-4)                               |
| Uptime checks          | Documented targets, not provisioned — the check is an account-level action                             |
| SLOs and error budget  | Not defined                                                                                            |
| Analytics              | Cloudflare Web Analytics is the chosen, cookie-free product (D-022); the beacon is not installed       |
| Ownership              | No signal has a named owner yet; see §9                                                                |

The rule this page holds itself to: a signal is listed only if it exists in the code or in the
platform configuration committed to this repository. Everything else is marked as proposed, in §9.

## 2. Signals that exist

| Signal                                              | Source                                                                  | How to read it                                                                                  | Fires an alert today                            |
| --------------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Worker invocations — method, path, status, duration | `observability.logs.invocationLogs` in `apps/edge/cloudflare.config.ts` | Cloudflare dashboard → Workers & Pages → `blog-edge-production` → Logs; or `wrangler tail` (§3) | No                                              |
| Worker 5xx rate                                     | Same invocation records                                                 | Same                                                                                            | Proposed: a 5xx alert on `blog-edge-production` |
| Asset 404 rate                                      | Same invocation records, filtered on status 404                         | Same                                                                                            | No                                              |
| Site document availability                          | `https://<domain>/vi/` served from Worker static assets                 | `curl`, or the uptime check in §5                                                               | Proposed: two consecutive failures              |
| Feed availability                                   | `https://<domain>/vi/rss.xml`                                           | `curl`, or the uptime check in §5                                                               | Proposed: two consecutive failures              |
| Deployed version                                    | The Worker version timestamp in the Cloudflare dashboard                | Compare with the newest `deploy-edge` run for the merge commit                                  | No                                              |
| Page views and Core Web Vitals                      | Cloudflare Web Analytics (account level)                                | Cloudflare dashboard → Analytics → Web Analytics                                                | No — beacon not installed                       |

Configuration behind the first row, quoted from `apps/edge/cloudflare.config.ts`:

```ts
observability: {
  enabled: true,
  headSamplingRate: 1,
  redactQueryString: true,
  logs: { enabled: true, invocationLogs: true, headSamplingRate: 1 },
},
```

100% head sampling is affordable because the site is low-traffic. `redactQueryString` keeps tracking
parameters and any address carried in a URL out of the log store. If traffic grows, lowering
`headSamplingRate` is the cost lever — and the first thing that weakens the 5xx signal.

## 3. Reading the signals

Tail the Worker in production. The deployed name is derived from the mode the deploy ran with:
`apps/edge/cloudflare.config.ts` computes `blog-edge-${mode ?? "default"}`, and the workflow passes
`--mode production`:

```bash
cd apps/edge && pnpm exec wrangler tail blog-edge-production --format json
```

`wrangler tail` streams Worker invocation records. The same records are in the dashboard under
Workers & Pages → `blog-edge-production` → Logs. There is no second log stream: the Worker has no
application logger, so nothing else is emitted for a request.

Read a record by its URL: the path decides whether a 404 is an expected miss or a broken link. A 404 on a
page that the build should contain means the asset was never uploaded or the request used the wrong host.

Filter for one route after a report by reading the record's URL field; the platform names the request
by URL, not by an application route name. A client error has no companion line — the invocation record's
status is the whole record of it.

### 3.1 Post-deploy check

Every deploy is verified against the origin it was meant to serve, not against the previous one:

```bash
scripts/smoke-static.sh https://<domain>
```

The script asserts each route class, both feeds, the sitemap, the Pagefind index, 404 handling, the three
security headers, and the canonical origin. It exits non-zero on any failure, so a green run is the release
record. A page that loads is not the check; the header and canonical assertions are.

## 4. Dashboards

| Dashboard                                              | Exists                 | Audience       | Answers                                       |
| ------------------------------------------------------ | ---------------------- | -------------- | --------------------------------------------- |
| Cloudflare Workers overview for `blog-edge-production` | Yes, platform-provided | Anyone on call | Requests, errors, and CPU time for the Worker |
| Cloudflare Web Analytics                               | Not installed          | Site owner     | Page views and Core Web Vitals                |
| Service overview, dependency, release, capacity        | **Not yet defined**    | —              | —                                             |

No bespoke dashboard is defined, and no alert links to one. Until a dashboard exists, the
alert-to-dashboard link the runbooks would carry points at the Worker overview page in the Cloudflare
dashboard.

## 5. Alert routing

| Aspect              | State                                                                                                                                                            |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Channel             | **Not yet defined (Q-4)**. Email is the interim default; no webhook target exists                                                                                |
| Pager               | None. There is no on-call rotation, so no page can be delivered or escalated                                                                                     |
| Uptime check        | Proposed: Cloudflare Health Check (or an external pinger) against `https://<domain>/vi/` and `https://<domain>/vi/rss.xml`, polled every minute from two regions |
| Downtime threshold  | Proposed: alert after two consecutive failures                                                                                                                   |
| Error-rate alert    | Proposed: a Workers Observability alert on 5xx responses for `blog-edge-production`                                                                              |
| Severity vocabulary | **Not yet defined.** With one operator and no pager there is no routing for a severity to change                                                                 |
| Escalation path     | **Not yet defined**                                                                                                                                              |
| Silence policy      | **Not yet defined**                                                                                                                                              |

Both targets return 200 when healthy. They cover the two different paths through the Worker: a page
from the asset store and a generated feed document:

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://<domain>/vi/
curl -s -o /dev/null -w '%{http_code}\n' https://<domain>/vi/rss.xml
```

An alert with no channel is not an alert. Until Q-4 is decided, detection depends on someone visiting
the site or reading the Actions log — say so in an incident review rather than assuming a page was
missed.

To check that the 5xx signal can still be seen before trusting it, request a path that fails and
confirm the invocation record appears in `wrangler tail`. Do this against a preview deployment rather
than production; there is no staging environment today, so run `cf dev` locally and tail it instead.

## 6. Symptoms and runbooks

| Observed symptom                                                             | Likely cause                                                                  | Runbook                                                                   |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `deploy (production-edge)` fails, or exits green while the site is unchanged | Stale workflow step, missing environment value, beta CLI exit-0               | [`runbooks/edge-deploy-fails.md`](runbooks/edge-deploy-fails.md)          |
| The site serves yesterday's pages                                            | The deploy never uploaded, or the build was not re-run after the change       | [`runbooks/edge-deploy-fails.md`](runbooks/edge-deploy-fails.md)          |
| A page that exists in source returns 404                                     | `apps/web/dist` is missing or the asset upload was incomplete                 | [`runbooks/edge-deploy-fails.md`](runbooks/edge-deploy-fails.md)          |
| The custom domain fails or serves another site                               | `SITE_DOMAIN` is unset or names another zone, so no custom domain was claimed | [`runbooks/edge-deploy-fails.md`](runbooks/edge-deploy-fails.md)          |
| Search returns nothing                                                       | The Pagefind postbuild step did not run, so `/pagefind/` is missing           | [`../features/content-pipeline.md`](../features/content-pipeline.md) §3.4 |

## 7. Service-level objectives and error budget

**Not yet defined.** No SLI is computed, no SLO target is agreed, no error budget exists, and no
burn-rate alert is configured. The uptime targets in §5 are health-check settings, not objectives:
they say what to poll, not what proportion of successful requests the system promises over a window.

A first SLO needs three decisions the repository cannot make on its own: the window, the target, and
the owner who accepts the consequence of breaching it. Record them in this section when they are
agreed, and derive the measurement from the invocation records in §2 rather than adding a parallel
metric.

## 8. Logs and redaction

| Expectation | State                                                                                                                                   |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Format      | JSON invocation records from the platform; the Worker writes no log line of its own                                                     |
| Fields      | Method, URL, status, duration, and the platform's request identifiers                                                                   |
| Redaction   | `redactQueryString` strips query strings at the Worker; no request body exists to log, and the Worker adds no header or client-IP field |
| Retention   | Not configured — platform default                                                                                                       |
| Access      | Cloudflare account members; no per-role read policy is documented                                                                       |

Two consequences worth knowing before an incident: the record carries no application message, so a
status and a URL are all triage starts from; and there is no second stream to cross-check, so a quiet
tail is the only evidence there is.

## 9. Known limits and gaps

| #   | Limit                                 | Consequence                                                                                                                           |
| --- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | No alert channel and no pager (Q-4)   | Every alert in §5 is a proposal; nothing pages anyone                                                                                 |
| 2   | No dashboards of the repository's own | Triage starts in the Cloudflare dashboard, with no shared view of what "normal" looks like                                            |
| 3   | No SLO and no logs-based error budget | "Is this worse than usual?" is answered by reading logs, not by a number                                                              |
| 4   | 100% sampling                         | Full fidelity now; the sampling rate must drop as traffic grows, which weakens every uptime and error-rate threshold in §5            |
| 5   | No uptime check provisioned           | The two targets in §5 have never been polled from outside                                                                             |
| 6   | Analytics beacon not installed        | No page-view or Core Web Vitals data exists yet. D-022 chose the product; the tag itself belongs in `apps/web` and has not been added |
| 7   | Edge-only visibility                  | A reader-side failure — an old cached asset, a local DNS fault — leaves no record here                                                |
| 8   | No retention or access policy         | Log history is whatever the platform keeps by default                                                                                 |
| 9   | No uptime check, so no baseline       | The first deploy is verified by hand (`scripts/smoke-static.sh`); nothing polls it afterwards                                         |

## 10. References

- Runbook contract and the deploy procedure: [`runbooks`](runbooks/README.md).
- Deploy gates and the post-deploy watch: [`ci-cd-pipeline.md`](ci-cd-pipeline.md).
- Recovering a bad deploy: [`disaster-recovery.md`](disaster-recovery.md).
- Site shape: [`architecture/02-container-view.md`](../architecture/02-container-view.md), [`architecture/08-crosscutting-concepts.md`](../architecture/08-crosscutting-concepts.md).
- Backend retirement: [`../adr/0012-static-site-with-assets-only-worker.md`](../adr/0012-static-site-with-assets-only-worker.md).
- Conventions: [`CONVENTIONS`](../../templates/CONVENTIONS.md).
