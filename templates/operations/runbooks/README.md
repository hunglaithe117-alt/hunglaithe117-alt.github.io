# Runbooks

> **When to use:** you are writing the playbook for one specific failure, or reviewing a runbook someone else wrote, and need the shape every runbook in this family must have.
>
> **What it answers:** what a runbook covers and what it does not, the mandated section structure, where a runbook's name is fixed, and how to keep one file to one symptom.
>
> Delete this blockquote when filled.

A runbook is the procedure an on-call engineer follows when a specific alert fires or a specific symptom is observed, written to be usable by someone who has never seen the system. The structure follows this stub and the library conventions:

**Alert → Severity → Triage → Mitigation → Root-cause fix**

## What a runbook is, and is not

| A runbook is                                                                    | A runbook is not                                                   |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| The procedure for one symptom, followed under pressure                          | A general guide to the service                                     |
| Ordered, copy-pasteable steps, each with its expected result                    | A list of things worth looking at                                  |
| Explicit about severity, escalation, and the blast radius of a destructive step | A design, architecture, or onboarding document                     |
| Owned by a team and reviewed after every incident that used it                  | A one-off note only its author can follow                          |
| A link to the owning signal, error code, and fix                                | A copy of the metric definitions, the error catalogue, or the code |

## The mandated structure

| Section        | What it holds                                                                                            |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| Alert          | The symptom as observed — the alert name, the metric and threshold, or the exact error text              |
| Severity       | The impact and urgency, and who is paged                                                                 |
| Triage         | The fast checks that confirm or discard each hypothesis, each with its exact command and expected output |
| Mitigation     | What stops the bleeding now; it may be temporary, and it may lose data — say so                          |
| Root-cause fix | The durable fix, and the follow-up it needs: an issue, an ADR, a test, or a runbook change               |

The order is the procedure: a responder reads from the top and stops at the first section that resolves the page. A section that cannot be answered is a decision the team has not made, not an optional part.

## Naming

A runbook's filename is fixed by [`CONVENTIONS`](../../CONVENTIONS.md) §2 (the single authority) and is not restated here; the rule for one symptom per file is in §"Scope" below.

## Scope: one symptom per file

| Situation                                                                 | What to write                                                                                                     |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Two alerts always fire together as one user-visible failure               | One runbook named for the user-visible symptom; the second alert links to it                                      |
| One alert has two unrelated causes                                        | One runbook whose Triage separates them; if Triage cannot separate them, the runbook is not finished              |
| Each environment needs different steps for the same symptom               | One runbook with a per-environment note inside the steps                                                          |
| A procedure is run by choice on a healthy system, with no alert behind it | A how-to, not a runbook — see [`README`](../README.md) and the how-to stub in [`development`](../../development/) |

## Filling the stub

- Copy [`TEMPLATE-runbook.md`](TEMPLATE-runbook.md) into `docs/operations/runbooks/`, rename the copy after the symptom, and leave the template in place.
- The stub keeps its deliberate `TEMPLATE-` prefix, defined in [`CONVENTIONS`](../../CONVENTIONS.md#2-file-naming), so a copied, symptom-named file is never confused with it.
- Replace every placeholder; a published runbook carries no fill-me-in slot.
- State the blast radius of a destructive step before the step, not after it.
- Keep every command copy-pasteable and every expected result explicit, so a responder can tell a healthy output from a broken one.
- Review the runbook after any incident that used it, and update its "last reviewed" field.

## Conventions

Every template here and every document written from one follows [`CONVENTIONS`](../../CONVENTIONS.md). In this family the error-code catalogue stays in [`error-codes`](../../api/error-codes.md): a runbook links to a code, it does not restate what the code means.
