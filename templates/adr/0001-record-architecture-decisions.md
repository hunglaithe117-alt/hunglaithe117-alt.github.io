# ADR-0001: Record architecture decisions

- **Status:** Accepted
- **Date:** \<YYYY-MM-DD>
- **Deciders:** Backend team
- **Consulted:** Platform team
- **Informed:** All engineers

## 1. Context and Problem Statement

The project makes architectural decisions (which store, which protocol, which service boundary) in pull-request threads, chat, and meetings. The reasoning lives in those threads and decays with them: a reader of the code sees the decision but not the alternatives it beat or the cost that was accepted. When the decision is revisited, the team re-argues it from scratch because the original constraints are gone.

## 2. Decision Drivers

- The rationale of a significant decision must outlive the change and the people who made it.
- A reviewer must be able to see what was decided, why, and what it cost, without archaeology.
- The record must live beside the code and ship in the same change as it — docs-as-code.

## 3. Considered Options

- **Option 1:** Architecture Decision Records — one small Markdown file per decision, in the repository.
- **Option 2:** A single "Decisions" section inside the architecture document.
- **Option 3:** Record decisions only in pull-request descriptions and chat threads.

## 4. Decision and Rationale

**Chosen option: Option 1**, because:

1. One file per decision keeps each record short, diffable, and independent of its neighbours, so a decision is superseded without rewriting the others.
1. The records live beside the code they constrain and are reviewed as Markdown, which is what docs-as-code requires.
1. The status vocabulary (`Proposed`, `Accepted`, `Rejected`, `Deprecated`, `Superseded`) makes the lifecycle of a decision explicit, which a single growing document cannot.

## 5. Consequences

### Positive

- Every significant decision has a durable, linkable rationale that a new contributor can read.
- Superseding a decision is a new file and one status change on the old record, not an edit to history.

### Negative

- Each decision costs a short write-up, and the team must judge significance: too many trivial records turn the log into noise.

### Neutral

- The records live in `docs/adr/` and are indexed by [`README.md`](README.md).

## 6. Links

- [The ADR template](template.md) and the [ADR index](README.md).
- Standard: MADR.
