# Monitoring and Alerts

> **When to use:** you are defining what a running system reports about itself, which of those signals is allowed to wake someone, and who owns the response.
>
> **What it answers:** the signals and thresholds that page, the dashboards that must exist, how an alert is routed and escalated, how symptoms differ from causes, the SLOs, and what may appear in a log line.
>
> Delete this blockquote when filled.

This page is the observability contract: what the system reports, which signal may page a human, and who acts. The error-code catalogue is deliberately not reproduced here — every code, its status, and its meaning has one home in [`error-codes`](../api/error-codes.md), and §2 and §7 link there instead. A failure whose only record is a log line nobody queries is not monitored.

## 1. The observability contract

- The system is observable when every user-visible symptom has a signal and every signal has an owner.
- An alert is a promise that someone is paged and acts. An alert with no owner, no runbook, or no possible action is deleted rather than documented.
- Alert on the symptom a user feels; a cause-based signal (CPU, memory, disk, replica lag) belongs on a dashboard, not on a pager, unless it is the last safeguard before user impact (§5).
- The thresholds in §2 state the intent; the exact numbers live in the alert-rule configuration committed with the code. A threshold change lands in both, in the same change.
- Threshold placeholders read as \<e.g. above target for 10 continuous minutes>: a single spike is not an alert condition.
- Instrumentation and this document ship in the same change, and a signal that cannot be tested in \<e.g. staging> is not yet a signal.

## 2. Signals and thresholds

| Signal                                            | Type                      | Source                                                                            | Threshold                                                                  | Alert severity | Owner            |
| ------------------------------------------------- | ------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | -------------- | ---------------- |
| \<Availability — successful requests over total>  | Ratio from counters       | \<edge or gateway metrics>                                                        | \<e.g. below the SLO for 10 continuous minutes>                            | \<critical>    | \<owner team>    |
| \<Latency — response time distribution>           | Histogram                 | \<application or gateway metrics>                                                 | \<e.g. p95 above \<N> ms for 5 consecutive minutes>                        | \<high>        | \<owner team>    |
| \<Error rate by error code>                       | Counter, labelled by code | \<application metrics; labels defined in [error-codes.md](../api/error-codes.md)> | \<e.g. any single code above its baseline for 5 minutes>                   | \<high>        | \<owner team>    |
| \<Saturation — CPU, memory, thread pool>          | Gauge                     | \<container or host metrics>                                                      | \<e.g. above 85% sustained for 15 minutes>                                 | \<warning>     | \<platform team> |
| \<Datastore connection pool in use>               | Gauge                     | \<database or pool metrics>                                                       | \<e.g. above 90% of the pool for 5 minutes>                                | \<critical>    | \<platform team> |
| \<Queue or consumer lag>                          | Gauge                     | \<broker metrics per topic and group>                                             | \<e.g. growing for 10 minutes, or above \<N> messages>                     | \<high>        | \<owner team>    |
| \<Dependency availability>                        | Probe or synthetic        | \<synthetic check against each dependency>                                        | \<e.g. two consecutive failures>                                           | \<high>        | \<owner team>    |
| \<Disk, certificate, and credential expiry>       | Gauge with time remaining | \<node and secret-store exporters>                                                | \<e.g. less than 14 days remaining>                                        | \<warning>     | \<platform team> |
| \<Backup and replication freshness>               | Timestamp age             | \<backup and replication jobs>                                                    | \<e.g. newest successful backup older than the schedule plus one interval> | \<critical>    | \<data owner>    |
| \<Business KPI — completed core journey per hour> | Counter or ratio          | \<domain events>                                                                  | \<e.g. a sustained drop below \<N>% of the same weekday baseline>          | \<high>        | \<product owner> |

- Severity vocabulary is fixed: `critical` and `high` page (§4), `warning` opens a ticket within the working day, `info` only annotates a dashboard.
- Correlated signals are grouped into one page: one alert per user-visible symptom, with inhibition rules or a parent alert suppressing the rest.
- A signal that has not fired in \<e.g. 90 days>, or that fires without triggering an action, is removed at the review rather than carried.

## 3. Dashboards

| Dashboard                     | Audience                  | Answers                                                | Refresh           |
| ----------------------------- | ------------------------- | ------------------------------------------------------ | ----------------- |
| Service overview              | On-call, first response   | Is the service healthy now, and what is degrading?     | Real time         |
| Dependency and infrastructure | SRE, platform             | Which upstream, store, broker, or host is limiting it? | Real time         |
| Release and change            | Release engineer, on-call | What changed, and did the change move a signal?        | Per deploy        |
| Business KPI                  | Product owner, on-call    | Is the core journey still completing?                  | \<e.g. 5 minutes> |
| Capacity and cost             | Platform owner            | What breaks first under growth, and what does it cost? | \<e.g. hourly>    |

- A dashboard's title is the question it answers; a panel that answers no question is deleted.
- The first dashboard an on-call engineer opens is the one linked from the alert that paged them, so the link lives in the alert definition rather than in a wiki index.
- Every panel names the metric behind it, so a stale or renamed metric is detectable rather than silently empty.
- Each dashboard has an owner in the table above; an unowned dashboard rots.

## 4. Alert routing and escalation

| Severity | Definition                                      | Route                | Acknowledge within       | Escalates to                           | Escalation delay   |
| -------- | ----------------------------------------------- | -------------------- | ------------------------ | -------------------------------------- | ------------------ |
| Critical | \<User-visible outage or data loss in progress> | Page the on-call now | \<e.g. 5 minutes>        | \<primary → secondary → service owner> | \<e.g. 10 minutes> |
| High     | \<Severe degradation with a workaround>         | Page the on-call     | \<e.g. 15 minutes>       | \<primary → service owner>             | \<e.g. 30 minutes> |
| Warning  | \<Single instance, trend, or capacity problem>  | Ticket plus channel  | \<e.g. next working day> | \<service owner, next business day>    | —                  |
| Info     | \<Change annotation or capacity note>           | Channel only         | Not required             | —                                      | —                  |

The escalation path for this system: \<primary on-call → secondary on-call → service owner → engineering lead>.

- An unacknowledged alert escalates on a timer, not on a human noticing it later.
- A page names the symptom, the environment, the affected service, and the runbook link; a page without a runbook is an incident with no procedure — write the runbook and link it.
- Every alert has exactly one owning team; a shared mailbox owns nothing.
- A silence records who set it, why, and when it expires; a permanent silence is an alert deletion.
- The paging route is tested \<e.g. quarterly> with a synthetic page, and the result is recorded in the same review as the alert set.

## 5. Symptoms and causes

An alert fires on the symptom — what a user experiences. The cause is a hypothesis, and hypotheses belong in triage, not in the alert's name: `checkout-latency-high` pages, while `cpu-high` explains it.

| Observed symptom                   | Common causes                                               | Entry point                                                 |
| ---------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------- |
| \<Requests failing for users>      | \<Dependency down, bad deploy, exhausted pool>              | The runbook named for this symptom, `runbooks/<symptom>.md` |
| \<Requests slow but succeeding>    | \<Saturation, lock contention, cold cache, noisy neighbour> | The runbook named for this symptom, `runbooks/<symptom>.md` |
| \<Work accepted but not completed> | \<Consumer stalled, queue full, downstream backoff>         | The runbook named for this symptom, `runbooks/<symptom>.md` |
| \<Data missing or wrong>           | \<Failed write path, partial migration, replay gap>         | The runbook named for this symptom, `runbooks/<symptom>.md` |

- Every alert in §2 links to exactly one runbook, and that runbook follows the mandated structure in [`runbooks`](runbooks/README.md).
- A cause-based signal pages only when it is the earliest reliable predictor of a symptom, and then it is named as the symptom it predicts.
- The symptom table is the routing index: a responder starts from the symptom they can observe, not from the signal they suspect.

## 6. Service-level objectives and error budget

| Service    | SLI                                          | SLO target                  | Window          | Error budget                                   | Breach action                                            |
| ---------- | -------------------------------------------- | --------------------------- | --------------- | ---------------------------------------------- | -------------------------------------------------------- |
| \<Service> | \<e.g. proportion of successful requests>    | \<e.g. 99.9%>               | \<e.g. 30 days> | \<e.g. about 43 minutes of failure per window> | \<e.g. freeze feature deploys until the budget recovers> |
| \<Service> | \<e.g. proportion of requests under \<N> ms> | \<e.g. 99%>                 | \<e.g. 30 days> | \<e.g. 1% of requests>                         | \<e.g. reliability work precedes feature work>           |
| \<Service> | \<e.g. freshness of the core data set>       | \<e.g. within \<N> minutes> | \<e.g. 30 days> | \<e.g. \<N> minutes per window>                | \<e.g. escalate to the data owner>                       |

- An SLO is a target agreed with the product owner, not a team aspiration, and it is measured from the same signals as §2.
- The error budget is the action trigger: while budget remains, change proceeds at normal speed; once it is spent, reliability work takes precedence until the budget recovers.
- An SLO breach does not page by itself — the symptom alerts of §2 page, and the breach is reviewed against this table.
- A paging SLO alert uses burn rate over a fast and a slow window rather than a raw threshold, so a slow drift is caught without a single spike paging.

## 7. Logs and redaction

| Expectation | Rule                                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------------------- |
| Format      | One structured record per line, parseable without a per-message regular expression                                        |
| Fields      | Timestamp, level, service, environment, correlation identifier, message, and the stable error code where one exists       |
| Levels      | `error` for a failure a human must see, `warn` for a handled anomaly, `info` for state changes, `debug` off in production |
| Correlation | Every request and background job carries an identifier propagated across services and present on every downstream record  |
| Retention   | \<e.g. 30 days hot, 1 year archived>, and never below the contractual or legal minimum                                    |
| Access      | Production log read access is limited to \<role> and the access is audited                                                |
| Redaction   | Credentials, tokens, session identifiers, full card or account numbers, and personal data never reach a log line          |
| Boundary    | Redaction is enforced by an allow-list at the logging boundary, so a newly added field is dropped rather than leaked      |

Error codes recorded in logs and metrics come from the catalogue in [`error-codes`](../api/error-codes.md); this page names the field, not the codes.

```json
{
  "ts": "2026-01-01T00:00:00Z",
  "level": "error",
  "service": "<service name>",
  "environment": "production",
  "correlation_id": "<request or job identifier>",
  "error_code": "<code from ../api/error-codes.md>",
  "message": "<what happened, with no secret and no personal data>"
}
```

## 8. References

- Error-code catalogue: [`error-codes`](../api/error-codes.md) — the single authority for every code; this page links to it and does not reprint it.
- Runbooks: [`runbooks`](runbooks/README.md) and [`TEMPLATE-runbook`](runbooks/TEMPLATE-runbook.md) — the procedure behind each alert.
- Deploy verification and the change feed: [`ci-cd-pipeline.md`](ci-cd-pipeline.md).
- Backup and replication freshness signal: [`disaster-recovery.md`](disaster-recovery.md).
- Logging and observability as a crosscutting concept: [`08-crosscutting-concepts`](../architecture/08-crosscutting-concepts.md).
- Conventions: [`CONVENTIONS`](../CONVENTIONS.md).
