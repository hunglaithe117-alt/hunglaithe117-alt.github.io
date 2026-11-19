# Architecture Decision Records

> **When to use:** you are about to make a decision that is hard to reverse, spans more than one module, or the team contests, and the reasoning must survive the people who made it.
>
> **What it answers:** which decisions the project has recorded, what each one decided, its current status, and what superseded what.
>
> Delete this blockquote when filled.

An Architecture Decision Record captures one decision and its rationale: the context that forced it, the option chosen, and the consequences accepted. This folder is the durable record — a decision not written here is not recoverable from the code alone, because the code shows the outcome and never the alternatives it beat. The format follows MADR.

## Index

Every ADR gets a row, kept sorted by ID and updated in the same change that adds the record.

| ID      | Title    | Status    | Date          | Supersedes / Superseded by |
| ------- | -------- | --------- | ------------- | -------------------------- |
| \<NNNN> | \<Title> | \<Status> | \<YYYY-MM-DD> | \<ADR-NNNN, or —>          |

## Rules

### Naming

An ADR is named `NNNN-short-title.md`: four digits, zero-padded, and a short kebab-case title that names the decision — `0001-record-architecture-decisions.md`, `0007-adopt-nats-jetstream.md`. An ID is never renumbered and never reused, even after the record is superseded or rejected.

### Immutability

Once an ADR is `Accepted`, its body is never edited. A changed decision gets a new ADR that supersedes the old one; the only edit allowed to the old record is its status line, which becomes `Superseded by ADR-NNNN`. The new ADR is `Accepted` and its body names `Supersedes ADR-NNNN`.

### Status lifecycle

| Status     | Meaning                                           |
| ---------- | ------------------------------------------------- |
| Proposed   | Under discussion; not yet binding                 |
| Accepted   | In force; immutable — supersede it, never edit it |
| Rejected   | Considered and not taken                          |
| Deprecated | No longer recommended                             |
| Superseded | Replaced by a later ADR; link to the replacement  |

### When to write one

- The decision is hard to reverse — a data store, a protocol, a public contract, a service boundary.
- It crosses more than one module, so the reasoning has no single home in the code.
- It was contested, and the losing options need to be remembered.

### When not to

- A reversible local choice (a helper's shape, a private function's name) belongs in the code and its review.
- Design detail of a single component belongs in [`architecture`](../architecture/README.md).
- Meeting notes, or an options analysis with no decision: an ADR states a decision.

## Adding an ADR

1. Copy [`template.md`](template.md) to `NNNN-short-title.md`, taking the next free number.
1. Fill every section; delete the guidance lines and any section that does not apply.
1. Add a row to the [index](#index) with the record's ID, title, status, date, and supersession link (`Supersedes ADR-NNNN`, or a dash if none).
1. Ship the ADR in the same change as the code it describes.

## One authority per decision

An ADR is the single authority for the decision it records. Every other document links to the ADR and never restates the decision — a restated decision drifts out of sync, and the reader cannot tell which copy wins. This is [`CONVENTIONS.md`](../CONVENTIONS.md) §12 applied to decisions.
