# Runbooks

A runbook is the procedure for one symptom, followed under pressure. The mandated structure and naming are
owned by [`templates/operations/runbooks/README.md`](../../../templates/operations/runbooks/README.md) and
[`templates/CONVENTIONS.md`](../../../templates/CONVENTIONS.md) §2; this page only lists what exists.

## Runbooks

| File                                           | Symptom                                                                                    |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------ |
| [`edge-deploy-fails.md`](edge-deploy-fails.md) | The deploy job fails, or it reports success while the site still serves the previous build |

## What is not covered

There is no runbook for a TLS/DNS failure or a Cloudflare platform outage: both are platform-owned. They
are listed as gaps in the [operations index](../README.md) rather than written as unverified procedures.

## Filling a stub

Copy [`TEMPLATE-runbook.md`](../../../templates/operations/runbooks/TEMPLATE-runbook.md), rename it after
the symptom, and follow the "Filling the stub" list in the template family README.

## References

- Operations index: [`../README.md`](../README.md).
- Deploy pipeline: [`../ci-cd-pipeline.md`](../ci-cd-pipeline.md).
