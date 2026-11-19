# Operations Templates

> **When to use:** you are standing up the run side of a system (its delivery pipeline, its monitoring, its recovery plan, or the playbook for one incident symptom) and need the house shape for each.
>
> **What it answers:** which operating document owns which concern, when a symptom deserves a runbook rather than a how-to, and where a runbook's name is fixed.
>
> Delete this blockquote when filled.

This family holds the operating documents for one system: how a change reaches production, what the system reports about itself, how its data is recovered, and how an on-call engineer handles one specific failure. The audience is DevOps, SRE, and on-call engineers. Links are library-relative; a copy becomes the project-side `docs/operations/README.md`.

## Artefacts

| File                                                   | Answers                                                                                                                               | Used by                                                        |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| [`ci-cd-pipeline.md`](ci-cd-pipeline.md)               | The stages from commit to production — trigger, gate, and output of each — plus promotion, versioning, rollback, and pipeline secrets | Release engineer building or reviewing the pipeline            |
| [`monitoring-and-alerts.md`](monitoring-and-alerts.md) | Which signals exist, which thresholds page, who is paged, which dashboards must exist, and the SLOs                                   | SRE defining observability; on-call reading the signal set     |
| [`disaster-recovery.md`](disaster-recovery.md)         | What is backed up, the RTO and RPO per asset, the restore steps, and the drill that proves them                                       | SRE or data owner planning and testing recovery                |
| [`runbooks`](runbooks/README.md)                       | The runbook contract: mandated structure, naming, and scope of one file                                                               | Anyone writing or reviewing a runbook                          |
| [`TEMPLATE-runbook`](runbooks/TEMPLATE-runbook.md)     | The stub for one symptom, from Alert to Root-cause fix                                                                                | On-call engineer writing a runbook during or after an incident |

## Runbook or how-to?

A runbook is symptom-triggered and followed under pressure; a how-to is a deliberate task on a healthy system. Runbooks live under `runbooks/` and follow [`runbooks`](runbooks/README.md); how-tos live under `docs/development/`. Naming is fixed by [`CONVENTIONS`](../CONVENTIONS.md) §2.

## Conventions

Every template here and every document written from one follows [`CONVENTIONS`](../CONVENTIONS.md). Two of its rules bite hardest in this family: the error-code catalogue has one home in [`error-codes`](../api/error-codes.md), so a monitoring page links to it and never reprints codes; and no page states a secret value — it names the secret-store key instead.
