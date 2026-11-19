# ADR-0001: Record architecture decisions

- **Status:** Accepted
- **Date:** 2026-11-19
- **Deciders:** Repository maintainers
- **Consulted:** —
- **Informed:** —

## 1. Context and Problem Statement

This record was written on 2026-11-19 as the first entry of the log it establishes; the earlier plan documents it would otherwise cite (`SOLUTION.md`, `TOOLCHAIN-VERIFIED.md`) are not in the repository, so the practice is asserted here rather than recovered from them.

The implementation already cites decision identifiers throughout the code — `D-010` in `packages/ui/src/SmokeIsland.vue`, `D-012` in `apps/edge/src/index.ts`, `D-013` and `D-035` in `apps/web/astro.config.mjs`, `D-036` in `turbo.json`, `D-040` in `apps/edge/cloudflare.config.ts`, `D-027` in `.github/workflows/ci.yml`. None of those identifiers is defined anywhere in the repository.

- Current behaviour: a reader who follows `D-036` from `apps/edge/wrangler.config.ts` reaches a comment that explains the two-file config, not a record of why the split was chosen. `apps/api/internal/config/config.go` cites `DECISIONS.md D-008/D-014`; no such file exists.
- Problem or risk: the code records outcomes only. The alternatives that were rejected — an SSR adapter, a single locale, a separate API origin, a Worker-generated email without storage — are invisible, so each is re-proposed and re-argued from scratch, and the cost that was accepted is rediscovered in production.

## 2. Decision Drivers

- A significant decision's rationale must outlive the commit that implemented it.
- The record must live beside the code and ship in the same change — docs-as-code.
- The record must be immutable once accepted, so later edits cannot quietly rewrite why a decision was made.
- A reviewer resolving a `D-NNN` citation in a comment must be able to reach the decision.

## 3. Considered Options

- **Option 1:** One Markdown file per decision under `docs/adr/`, indexed, numbered `NNNN`, following MADR.
- **Option 2:** A single decision registry file (`DECISIONS.md`) with one numbered row per decision — the form the code still cites, and the form that was lost.
- **Option 3:** Decisions recorded only in commit messages and pull-request threads.
- **Option 4:** A "Decisions" chapter inside the architecture documentation.

## 4. Decision and Rationale

**Chosen option: Option 1**, because:

1. One file per decision is independently diffable and linkable; a citation in a comment resolves to a file that can be read without scanning a document.
2. Immutability is enforceable only at file granularity. In Option 2 a row is edited in place, so the original reasoning is overwritten by the revision and the two cannot be compared; here a changed decision is a new file and one status line.
3. The status vocabulary (`Proposed`, `Accepted`, `Rejected`, `Deprecated`, `Superseded`) makes the lifecycle explicit, which a flat table cannot express.

The decision IDs the code already cites keep their numbers. This log does not renumber or reuse them; each ADR names the IDs it covers in its Links section, so `D-036` and `ADR-0005` are two namespaces joined by a pointer rather than one renamed into the other.

## 5. Consequences

### Positive

- Every decision the code cites has a durable home, and the citation in the comment now resolves.
- Superseding a decision is one new file and one status edit, leaving the original text intact.
- The alternatives are written down while the constraints are still visible, so a future proposal to add an SSR adapter or a second origin starts from the recorded reason it was excluded.

### Negative

- Records 0002–0010 are reconstructions: they state what the code does and mark the rationale as inferred, so they are weaker evidence than a record written at decision time. The gap cannot be closed retroactively.
- Maintaining the log adds a write-up per significant decision, and the team must judge significance; trivia would turn the index into noise.
- Two namespaces now coexist — `D-NNN`/`Q-N` in code comments and `ADR-NNNN` in this folder — so a reader must follow the Links section to move between them.

### Neutral

- The log lives in `docs/adr/` and is indexed by [the index](README.md); records are reviewed as Markdown in the same change as the code.

## 6. Links

- [The ADR template](template.md) and the [ADR index](README.md).
- Standard: MADR.
- Records in this log: [ADR-0002](0002-monorepo-with-pnpm-and-turborepo.md), [ADR-0003](0003-astro-static-ssg-with-vue-islands.md), [ADR-0004](0004-bilingual-content-folder-per-locale.md), [ADR-0005](0005-cloudflare-worker-owns-assets-and-api.md), [ADR-0006](0006-go-fiber-api-on-cloudflare-containers.md), [ADR-0007](0007-d1-as-system-of-record.md), [ADR-0008](0008-store-only-contact-messages.md), [ADR-0009](0009-affected-ci-and-content-quality-gate.md), [ADR-0010](0010-observability-with-workers-logs-and-slog.md).
- Decision IDs cited by the code but not defined in the repository: `D-003`, `D-010`, `D-012`, `D-013`, `D-019`, `D-022`, `D-024`, `D-025`, `D-026`, `D-027`, `D-035`, `D-036`, `D-038`, `D-040`, `Q-4`, `Q-12`.
