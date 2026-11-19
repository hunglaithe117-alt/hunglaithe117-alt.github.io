# ADR-0002: Monorepo with pnpm workspaces and Turborepo

- **Status:** Accepted
- **Date:** 2026-10-14
- **Deciders:** Repository maintainers
- **Consulted:** —
- **Informed:** —

## 1. Context and Problem Statement

This record was reconstructed on 2026-11-19 from the implementation and commit history, because the original plan documents (`SOLUTION.md`, `TOOLCHAIN-VERIFIED.md`) are not in the repository. The rationale below is inferred from the code; it invents no meeting, no participant, and no alternative that the shipped configuration does not exclude.

One deploy ships two runtimes that must be built in order: the Astro static build in `apps/web/dist` and the Go container image from `apps/api`. The Worker config consumes the web build by path (`assetsDirectory: "../web/dist"` in `apps/edge/wrangler.config.ts`), and the API contract in `packages/types` is imported by both the web client and the Worker.

- Current behaviour: `pnpm-workspace.yaml` globs `apps/*` and `packages/*`; `turbo.json` defines `build`, `lint`, `typecheck`, `test`, `dev`, `deploy:edge` and `db:migrate` over those packages; `go.work` binds the single Go module at `./apps/api`; Turborepo is pinned at `2.11.7` and pnpm at `12.11.2` through `packageManager`.
- Problem or risk: a change to the content schema (`apps/web/src/content.config.ts`) also changes what the Worker packages as assets and what the web islands send to `/api/*`. Across separate repositories that change needs coordinated release tags and a version matrix before the client and the API can be tested together.

## 2. Decision Drivers

- One change must be able to touch the content schema, the web client, the Worker config and the Go API atomically.
- One lockfile, so the dependency graph CI resolves is the graph a developer resolved.
- Only the workspaces a diff touches should be built, linted and tested — the affected-only CI in [ADR-0009](0009-affected-ci-and-content-quality-gate.md) is built on this.
- A shared TypeScript contract must be importable without publishing it to a registry.
- The Go module must stay an ordinary Go module, buildable with the Go toolchain alone.

## 3. Considered Options

- **Option 1:** One repository; pnpm workspaces for JavaScript, a root `go.work` for Go, Turborepo as the task runner across both.
- **Option 2:** One repository per deployable (`web`, `edge`, `api`) with its own pipeline and version tags.
- **Option 3:** One repository with npm or yarn workspaces and hand-written `make` targets instead of Turborepo.
- **Option 4:** A single-package repository with no workspaces, importing the Worker config and the shared components by relative path.

## 4. Decision and Rationale

**Chosen option: Option 1**, because:

1. The task graph and the package graph are the same object, so "what does this diff affect" is answered by the workspace graph rather than by a hand-maintained list of paths.
2. `workspace:*` gives `@blog/types`, `@blog/ui` and `@blog/config` a real import specifier with no publish step, so the API contract has exactly one definition.
3. `go.work` keeps `apps/api` an idiomatic Go module — `go build ./cmd/server` and `go test ./...` work from that directory — while `go.work` makes the Go module a hashed input of the JavaScript graph.

The build is made honest about its inputs rather than optimistic:

- `envMode: "strict"` — a task may read only the environment it declares, so an undeclared variable can never silently enter a cache key and poison a cache entry that another environment then reuses.
- `globalEnv` hashes `NODE_VERSION` and `CLOUDFLARE_ACCOUNT_ID` because both change the output identity; `globalPassThroughEnv` passes `GITHUB_TOKEN` through without hashing it.
- `globalDependencies` hash `go.work` and `pnpm-lock.yaml`, the two root files that rebind every task.
- `@blog/edge#build` declares `dependsOn: ["^build", "@blog/web#build"]`, so `cf build` never packages a stale or absent `apps/web/dist` (this ordering is `D-036`).
- `build.inputs` exclude `.cloudflare/**`, `dist/**`, `bin/**`, `.turbo/**`, `.astro/**`, `secrets.env` and `.dev.vars*`, so build output and secrets never become inputs; `build.outputs` name `bin/**`, the Astro `dist/` and the `cf` output.

Go participates through the scripts in `apps/api/package.json` (`build`, `test`, `lint`, `typecheck`), not through a native Go task. `pnpm-lock.yaml` also carries two maintenance lists — `allowBuilds` for `esbuild` and `workerd`, and `minimumReleaseAgeExclude` for the pinned pre-release packages — because pnpm blocks install scripts by default and gates pre-releases on age.

## 5. Consequences

### Positive

- A contract change is one commit: edit `packages/types/index.ts`, and the web typecheck and the Worker build both follow in the same run.
- `pnpm check` (`turbo run lint typecheck test`) is the whole quality surface, and the same command with `--filter` is the whole affected surface.
- The Go module is unaffected by Node tooling; a Go-only contributor needs `go` and nothing else, minus the `turbo` runner.

### Negative

- Turborepo sees Go only through shell scripts, so `apps/api`'s `lint` shells out to `golangci-lint`, which no `pnpm install` provides and no workflow step installs. A runner without that binary fails the `lint` task; the toolchain requirement lives in prose, not in the lockfile.
- Hashing `go.work` at the root means any change to that file invalidates every task in the graph, including tasks with no Go involvement.
- `envMode: "strict"` converts an undeclared variable from a subtle cache bug into a runtime absence: the build succeeds and the value arrives empty, as `ALLOWED_ORIGINS` once did (see [ADR-0006](0006-go-fiber-api-on-cloudflare-containers.md)).
- The workspace has four packages whose `build`/`lint`/`test` scripts are `echo` stubs (`@blog/content`, `@blog/ui`) or absent (`@blog/config`, `@blog/types` has no `build`), so `turbo run build` reports success for work that has not happened. The real check for those packages is `astro check` inside `apps/web`, which CI runs separately.
- `db:migrate` is declared in `turbo.json` but no workspace defines the script; migrations are applied by the deploy workflow directly (`cf d1 migrations apply`), so the task is dead configuration (see [ADR-0007](0007-d1-as-system-of-record.md)).
- Two toolchains are required locally — Node 24.21.0 (`.nvmrc`) and Go 1.27 — and CI pins `24.21.0` and `1.27.2`.

### Neutral

- The root is not a package; `package.json` is private, `UNLICENSED`, and exists to hold the runner, the scripts and `lint-staged`.
- Husky plus `lint-staged` runs ESLint and Prettier on changed files before commit, duplicating part of what CI checks, as a fast local signal.

## 6. Links

- Related: [ADR-0005](0005-cloudflare-worker-owns-assets-and-api.md) (the Worker consumes the web build), [ADR-0009](0009-affected-ci-and-content-quality-gate.md) (affected filtering).
- Decision IDs: `D-027` (affected CI), `D-036` (the edge build waits for the web build).
- Code: `pnpm-workspace.yaml`, `turbo.json`, `go.work`, `package.json`, `apps/api/package.json`.
- Introduced by: `7c728a2` (`chore: bootstrap monorepo skeleton`).
