# ADR-0009: Affected CI with a content-quality gate

- **Status:** Accepted
- **Date:** 2026-10-14
- **Deciders:** Repository maintainers
- **Consulted:** —
- **Informed:** —

## 1. Context and Problem Statement

This record was reconstructed on 2026-11-19 from the implementation and commit history, because the original plan documents (`SOLUTION.md`, `TOOLCHAIN-VERIFIED.md`) are not in the repository. The rationale below is inferred from the code; the rejected options are the ones the shipped workflows exclude.

The repository is a polyglot monorepo whose main output is prose plus a static site ([ADR-0002](0002-monorepo-with-pnpm-and-turborepo.md), [ADR-0003](0003-astro-static-ssg-with-vue-islands.md)). Most changes touch one package, and many changes are posts. Two constraints collide with a naive pipeline: pull requests from forks never receive secrets, and a build that needs a credential cannot be the merge gate.

- Current behaviour: `.github/workflows/ci.yml` runs a `ci` job and a `security` job, both credential-free; `.github/workflows/deploy-edge.yml` runs a credential-free dry-run on pull requests and a gated deploy on `main`.
- Problem or risk: a full build of every workspace on every push wastes the only scarce resource (reviewer patience) and still says nothing about prose, formatting or dead links — the defects a content-heavy repository actually ships.

## 2. Decision Drivers

- Every required check must pass on a fork pull request, where no secret exists.
- The pipeline must scale with the diff, not the repository (affected-only).
- Documentation is a first-class artifact, so prose, Markdown structure and links must be gated like code.
- A production deploy must be a separate, manually gated step, never a side effect of a merge.
- The checks must be reproducible locally with the same commands.

## 3. Considered Options

- **Option 1:** Affected-only Turborepo run plus a credential-free content gate and a separate security job; deploy gated by an environment with required reviewers.
- **Option 2:** Build, lint and test every workspace on every push.
- **Option 3:** A hosted CI service (Vercel, Netlify, Cloudflare Pages builds) as the primary pipeline.
- **Option 4:** No gate until launch; run the checks by hand before each deploy.

## 4. Decision and Rationale

**Chosen option: Option 1**, because:

1. Affected filtering is a property of the task graph, so the pipeline stays correct as packages are added — no path list to maintain.
2. The credential-free constraint is met by construction: the workflows take `permissions: contents: read`, and the only optional credential (`TURBO_TOKEN`) resolving to empty disables remote-cache upload and falls back to the local cache, so a fork run is slower, not broken.
3. Option 3 would put the gate outside the repository and outside the lockfile, and would still not check prose.
4. Option 4 concentrates every defect in the one run that must not fail: the deploy.

The pipeline this decides (`D-027`):

- **Affected base** (`T2.1`): full history (`fetch-depth: 0`), then `--filter=...[<base>]` — the changed packages _and their dependents_, so a change to `packages/types` rebuilds `apps/web` and `apps/edge`. A first push or force-push falls back to `HEAD^1`; if neither resolves, the run is unfiltered.
- **Toolchain**: pnpm from `packageManager`, Node `24.21.0` (floor `22.18`, which `cf`'s config loader needs), Go `1.27.2`. `apps/api/go.sum` is `touch`ed when absent so `setup-go`'s cache has a key.
- **Content gate**: Prettier `--check`, `markdownlint-cli2` over `**/*.md` and `**/*.mdx`, Vale at `--minAlertLevel=error` with the `local` reporter (no PR-comment write, so fork-safe), `astro check` for the content schema and the island types, and Lychee `--offline --root-dir apps/web/dist` over the built HTML. The `ci` job builds `@blog/web` explicitly first so `dist/` exists for the link check.
- **Security job**: `gitleaks` over full history, `pnpm audit --audit-level=high`, and `govulncheck ./...` for the Go module.
- **Deploy gate**: on a pull request, `cf deploy --prebuilt --mode production --dry-run`, which validates the Build Output with no API call; on `main`, a path-based change detection over `apps/(edge|web)/`, `packages/`, `pnpm-lock.yaml`, `turbo.json` and `go.work`, then a `production-edge` environment job with required reviewers. That job writes `secrets.env` under `umask 077`, applies migrations, deploys with `--containers-rollout gradual`, and removes the file in an `if: always()` step. The `ci` workflow cancels superseded runs; the deploy serializes and never cancels.

## 5. Consequences

### Positive

- A fork pull request runs the full gate, because nothing in it needs a credential; the only difference is a cold local cache.
- Affected CI skips unrelated workspaces, and a change to the shared contract pulls its dependents in automatically. The production deploy filter is broader than the CI filter: it matches `packages/`, so a content-only change redeploys the Worker and its container rather than being ignored.
- Prose, Markdown structure, links and Astro's content schema fail the build, so a broken link or a mistyped frontmatter field cannot reach `main`.
- Two independent jobs (`ci`, `security`) mean a dependency advisory does not mask a broken link, and branch protection can require both.
- Deploy is human-gated and serialized, and the secrets file is removed on every path.

### Negative

- Coverage is incomplete in ways that matter at launch: no CodeQL or other SAST, no SBOM, no container-image scan, and no Playwright run. The `e2e/` suite and `playwright.config.ts` exist, but no workflow invokes `test:e2e`, so the browser-level contracts are verified only when a developer runs them.
- The Lighthouse baseline produced in `fef41fb` is not enforced; performance can regress without a failing check.
- Affected filtering can under-run. A change that only touches root files, or a package whose dependents are not expressed in the graph, may select nothing; the fallback to `HEAD^1` on a multi-commit push can also miss an earlier break.
- `apps/api`'s `lint` script shells out to `golangci-lint`, which the workflow never installs, so the Go lint result depends on the runner image rather than on the repository.
- The content gate is credential-free by design, which is why Vale uses the `local` reporter and therefore produces no inline PR annotations — a reviewer reads the job log to find the offending sentence.
- The deploy workflow's migration step points at a directory that does not exist (`apps/edge/migrations`; see [ADR-0007](0007-d1-as-system-of-record.md)), so a schema change can deploy against the old schema and still look green.
- `cf` can exit `0` after aborting a destructive command, so the deploy job's success is not evidence of a deploy; the runbook asks the operator to read the output.
- The remote cache is optional and empty on forks, so the fastest pipeline and the required pipeline are not the same pipeline.
- CI pins Go `1.27.2` because `govulncheck` flags stdlib advisories fixed there, while the developer floor is unenforced; a local `1.27.1` fails the same scan CI passes (SECURITY.md F-16).

### Neutral

- Every check is a `pnpm` script or an action with a repository-local equivalent (`pnpm check:content`, `pnpm security:audit`, `pnpm security:govulncheck`), so the pipeline can be reproduced without CI.
- Concurrency groups differ by intent: `ci` cancels superseded runs; `deploy-edge` never cancels an in-flight production deploy.

## 6. Links

- Related: [ADR-0002](0002-monorepo-with-pnpm-and-turborepo.md) (the task graph being filtered), [ADR-0005](0005-cloudflare-worker-owns-assets-and-api.md) (what the deploy ships), [ADR-0003](0003-astro-static-ssg-with-vue-islands.md) (the build the link check reads), [ADR-0007](0007-d1-as-system-of-record.md) (the migration step defect).
- Decision IDs: `D-027` (affected CI and the content-quality gate), `D-024` (the optional remote cache).
- Code: `.github/workflows/ci.yml`, `.github/workflows/deploy-edge.yml`, `package.json` (`check:content`, `security:*`), `.markdownlint-cli2.yaml`, `.vale.ini`, `.lycheeignore`, `playwright.config.ts`, `e2e/`.
- Introduced by: `364fae4` (`feat(ci): Phase 2 — affected CI, fork-safe cache, DevSecOps, content-quality gate (D-027)`).
