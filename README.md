# blog_personal

Digital garden & portfolio blog engine — a polyglot monorepo:

- **pnpm workspaces + Turborepo** orchestrate the build.
- **apps/web** — Astro SSG + Vue islands (static `dist/`).
- **apps/edge** — Cloudflare integration Worker (`cf`): static assets + `/api/*` + bindings.
- **apps/api** — Go (Fiber) JSON API on Cloudflare Containers.
- **packages/** — shared `config`, `types`, `content`, `ui`.

> Phase 1 (monorepo foundation) only. The apps are skeletons; real Astro lands in T3.1 and
> real Go in T5.1.

## Local development

Prerequisites:

- **Node 24.21.0** (`.nvmrc`; floor **≥ 22.18** — required to load `cloudflare.config.ts`).
- **pnpm 12.11.2** (pinned via `packageManager` / Corepack).
- **Go 1.27** (for `apps/api`, from Phase 5).

```sh
# 1. Install dependencies (activates pinned pnpm via Corepack)
pnpm install

# 2. Copy env examples (real files are git-ignored; examples contain placeholders only)
cp .env.example .env
cp .dev.vars.example .dev.vars

# 3. Run the whole stack (turbo run dev --parallel)
pnpm dev
```

Per-app: `pnpm --filter @blog/web dev`, `pnpm --filter @blog/edge dev` (`cf dev`),
`pnpm --filter @blog/api dev`.

### Cloudflare config resolution

Run `cf` commands **from the package directory** — `cf` walks upward and uses the **nearest**
config. From `apps/edge`, `cf dev` / `cf build` read **both**:

- `apps/edge/cloudflare.config.ts` — Worker runtime, bindings, `/api/*` routing.
- `apps/edge/wrangler.config.ts` — supplies `assetsDirectory: "../web/dist"` (D-036).

`cf` does **not** read `wrangler.jsonc` / `wrangler.toml`. Astro is built by **Turborepo**
only — `cf` never builds `apps/web` (D-013).

## Common scripts

| Script                                       | What it does                                            |
| -------------------------------------------- | ------------------------------------------------------- |
| `pnpm build`                                 | `turbo run build` — topological build of all workspaces |
| `pnpm dev`                                   | `turbo run dev --parallel` — all dev servers            |
| `pnpm check`                                 | `turbo run lint typecheck test`                         |
| `pnpm lint` / `pnpm typecheck` / `pnpm test` | individual turbo tasks                                  |
| `pnpm format`                                | Prettier over the repo                                  |

## Hygiene

- `.env*` (except `.env.example`) and `.dev.vars*` (except `.dev.vars.example`) are git-ignored.
- `.cloudflare/` (`cf build` output) and `bin/` (Go build output) are git-ignored.
- A `husky` pre-commit hook runs `lint-staged` (ESLint + Prettier on changed files).
- Never commit real secrets — see `SOLUTION.md` §E and `TOOLCHAIN-VERIFIED.md` §7.
