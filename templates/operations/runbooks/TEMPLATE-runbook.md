# Runbook: \<Symptom as observed>

> **When to use:** an alert has fired or a symptom is observed, and the responder needs the procedure for this one failure rather than a general guide to the service.
>
> **What it answers:** how to confirm the symptom, how bad it is and who to page, what to check to separate the candidate causes, how to stop the bleeding, and what the durable fix is.
>
> Delete this blockquote when filled.

| Field           | Value                                                      |
| --------------- | ---------------------------------------------------------- |
| Service         | \<the service or component this symptom belongs to>        |
| Owner           | \<the team or role that owns this runbook, never a person> |
| Last reviewed   | \<YYYY-MM-DD>                                              |
| Escalation path | \<primary on-call → secondary on-call → service owner>     |

Keep the header current: a runbook whose owner has moved teams is an unowned runbook, and an on-call engineer who cannot escalate has no procedure at all.

## 1. Alert

Delete this note when filled. Quote the alert exactly as it arrives, so a responder recognises it without translating.

| Field                | Value                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------ |
| Alert name           | \<the rule or monitor name that fires>                                                                       |
| Metric and threshold | \<the signal and the condition that fires it>                                                                |
| Appears in           | \<environment and dashboards where it shows, linking [`monitoring-and-alerts`](../monitoring-and-alerts.md)> |
| Typical error text   | `<the exact message a responder sees, including its error code>`                                             |
| User-visible effect  | \<what a user experiences while this is firing>                                                              |
| First seen           | \<when this symptom was added to the runbook set, and by which incident>                                     |

## 2. Severity

Delete this note when filled. Classify by user impact first and urgency second, then state who is paged; a severity that does not change the routing is decoration.

| Impact                                        | Urgency            | Severity    | Who is paged          |
| --------------------------------------------- | ------------------ | ----------- | --------------------- |
| \<e.g. requests failing for every user>       | Immediate          | \<critical> | \<paging route>       |
| \<e.g. one tenant, region, or shard affected> | \<Within the hour> | \<high>     | \<paging route>       |
| \<e.g. degraded with no user-visible failure> | Next working day   | \<warning>  | \<ticket and channel> |

- Escalate when \<the condition that makes this a larger incident, e.g. no working mitigation within 15 minutes>.
- Do not \<the tempting action that destroys evidence or widens the blast radius, e.g. restart the consumer before dumping its offsets>.
- Declare a major incident when \<the second condition that changes who is in charge>.

## 3. Triage

Delete this note when filled. Order the checks so each one confirms or discards a hypothesis, and so the most destructive candidate is tested before anyone changes state; a responder stops at the first row whose result is abnormal.

| Check                                   | Command                    | Expected when healthy                        | If it differs                        |
| --------------------------------------- | -------------------------- | -------------------------------------------- | ------------------------------------ |
| \<What this check establishes>          | `<copy-pasteable command>` | \<the healthy output, exactly as it appears> | \<the next check, or straight to §4> |
| \<Rule out the destructive cause first> | `<copy-pasteable command>` | \<the healthy output>                        | \<the next check, or §4>             |
| \<Confirm the leading hypothesis>       | `<copy-pasteable command>` | \<the healthy output>                        | \<the next check, or §4>             |
| \<Confirm the second hypothesis>        | `<copy-pasteable command>` | \<the healthy output>                        | \<the next check, or §4>             |
| \<Establish scope: one instance or all> | `<copy-pasteable command>` | \<the healthy output>                        | \<whether §4 is safe to run at all>  |

- Capture what you see, with timestamps, before changing anything: a restarted process destroys the evidence the root-cause fix needs.
- If triage cannot tell two causes apart, this runbook is not finished; separate them here or the responder guesses under pressure.
- Error codes named in the output are catalogued in [`error-codes`](../../api/error-codes.md); link the specific code rather than restating its meaning.

## 4. Mitigation

Delete this note when filled. Mitigation is temporary, may lose data, and is allowed to be ugly — but never silent about what it costs.

**Blast radius:** \<what the following steps affect (every user, one tenant, one replica, or nothing but a queue) and what is lost if they are wrong>.

1. \<first action, with its exact command>.

   ```bash
   <copy-pasteable command>
   ```

   Expected: \<the observable result that says it worked>.

1. \<second action, with its exact command>.

   ```bash
   <copy-pasteable command>
   ```

   Expected: \<the observable result that says it worked>.

1. Confirm the symptom has cleared on the signal from §1, not only on the command's exit code.

- If mitigation does not hold within \<e.g. 15 minutes>, escalate per §2 and consider \<the degradation path, e.g. shedding load or failing over>.
- Record every command run and its output in the incident channel; the root-cause fix starts from that record.
- Restore the temporary change once the durable fix lands, and say in the incident channel that the mitigation is withdrawn.

## 5. Root-cause fix

Delete this note when filled. The durable fix removes the cause; a permanent mitigation that never becomes a fix is technical debt with a pager attached.

| Question                  | Answer                                                                                            |
| ------------------------- | ------------------------------------------------------------------------------------------------- |
| Root cause                | \<the defect, stated as a defect and not as the symptom>                                          |
| Durable fix               | \<the change that removes the cause>                                                              |
| Tracked in                | \<issue, pull request, or ADR reference>                                                          |
| Test that would catch it  | \<the regression test to add, naming the layer it belongs to>                                     |
| Alert or threshold change | \<the signal in [`monitoring-and-alerts`](../monitoring-and-alerts.md) to add, retune, or remove> |
| Follow-up                 | \<this runbook's own change, plus the owner and date of the review>                               |
| Related code              | `<path/to/file>` — \<why that path is involved>                                                   |

## 6. References

Delete this section when filled. Link the records this runbook touches; do not restate them.

- Alert, threshold, and routing: [`monitoring-and-alerts`](../monitoring-and-alerts.md).
- Error-code catalogue: [`error-codes`](../../api/error-codes.md) — the single authority for every code.
- Pipeline stages and rollback: [`ci-cd-pipeline`](../ci-cd-pipeline.md).
- Restore and recovery: [`disaster-recovery`](../disaster-recovery.md).
- Runbook contract and naming: [`README.md`](README.md).
- Conventions: [`CONVENTIONS`](../../CONVENTIONS.md).
