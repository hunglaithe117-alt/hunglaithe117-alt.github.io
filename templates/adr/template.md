# ADR-\<NNNN>: \<Short Title of Architectural Decision>

> **When to use:** a decision is architecturally significant (hard to reverse, spanning more than one module, or contested) and its rationale must outlive the change that made it.
>
> **What it answers:** the problem that forced a choice, the options weighed, what was chosen and why, what it costs, and what it links to.
>
> Delete this blockquote when filled.

- **Status:** \<Proposed | Accepted | Rejected | Deprecated | Superseded by ADR-NNNN>
- **Date:** \<YYYY-MM-DD>
- **Deciders:** \<the people who made the decision>
- **Consulted:** \<people whose expertise was sought before deciding>
- **Informed:** \<people kept up to date after the decision>

The supersession rule sits with the status: an `Accepted` ADR is never edited in its body. A changed decision gets a new ADR, and the only edit allowed to the old record is its status line, which becomes `Superseded by ADR-NNNN`. The new ADR is `Accepted` and its body names `Supersedes ADR-NNNN`.

## 1. Context and Problem Statement

Delete this section when filled. State the situation that forced a choice: the current behaviour, the forces acting on it, and the problem or risk that made the status quo untenable.

\<Describe the current architecture state and the forces at play.>

- Current behaviour: `<what the system does today>`
- Problem or risk: `<why that is a problem, citing a concrete code path or an operational symptom>`

## 2. Decision Drivers

Delete this section when filled. List the forces the chosen option must satisfy — the criteria the decision is judged against.

- \<Driver: the force and the constraint it imposes>
- \<Driver: the force and the constraint it imposes>
- \<Driver: the force and the constraint it imposes>

## 3. Considered Options

Delete this section when filled. Name every option that was seriously weighed, including the status quo when it was one.

- **Option 1:** \<short title>
- **Option 2:** \<short title>
- **Option 3:** \<short title>

## 4. Decision and Rationale

Delete this section when filled. State the chosen option and why it wins over the alternatives, then the concrete consequences for the code.

**Chosen option: Option \<N>**, because:

1. \<reason the option satisfies the drivers>
1. \<reason it beats the other options>

## 5. Consequences

Delete this section when filled. Record what the decision costs, not only what it buys.

### Positive

- \<benefit the decision delivers>

### Negative

- \<drawback accepted, and how it is mitigated>

### Neutral

- \<effect that is neither a benefit nor a cost>

## 6. Links

Delete this section when filled. Link the records this decision touches; do not restate them.

- Supersedes: `ADR-NNNN` (its file is `NNNN-short-title.md`)
- Superseded by: `ADR-NNNN` (its file is `NNNN-short-title.md`)
- Related: \<spec, pull request, or issue this decision derives from>
