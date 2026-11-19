# ADR-\<NNNN>: \<Short Title of Architectural Decision>

- **Status:** \<Proposed | Accepted | Rejected | Deprecated | Superseded by ADR-NNNN>
- **Date:** \<YYYY-MM-DD>
- **Deciders:** \<the people who made the decision>
- **Consulted:** \<people whose expertise was sought before deciding>
- **Informed:** \<people kept up to date after the decision>

The supersession rule sits with the status: an `Accepted` ADR is never edited in its body. A changed decision gets a new ADR, and the only edit allowed to the old record is its status line, which becomes `Superseded by ADR-NNNN`. The new ADR is `Accepted` and its body names `Supersedes ADR-NNNN`.

## 1. Context and Problem Statement

\<Describe the current architecture state and the forces at play.>

- Current behaviour: `<what the system does today>`
- Problem or risk: `<why that is a problem, citing a concrete code path or an operational symptom>`

## 2. Decision Drivers

- \<Driver: the force and the constraint it imposes>
- \<Driver: the force and the constraint it imposes>
- \<Driver: the force and the constraint it imposes>

## 3. Considered Options

- **Option 1:** \<short title>
- **Option 2:** \<short title>
- **Option 3:** \<short title>

## 4. Decision and Rationale

**Chosen option: Option \<N>**, because:

1. \<reason the option satisfies the drivers>
1. \<reason it beats the other options>

## 5. Consequences

### Positive

- \<benefit the decision delivers>

### Negative

- \<drawback accepted, and how it is mitigated>

### Neutral

- \<effect that is neither a benefit nor a cost>

## 6. Links

- Supersedes: `ADR-NNNN` (its file is `NNNN-short-title.md`)
- Superseded by: `ADR-NNNN` (its file is `NNNN-short-title.md`)
- Related: \<spec, pull request, or issue this decision derives from>
