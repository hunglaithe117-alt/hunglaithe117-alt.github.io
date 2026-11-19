---
phase: 3
name: static-deploy
domain: devops
depth: L2
status: awaiting_human_review
depends_on: [phase-2-retire-backend]
plan_review: approved
plan_revision_approved: 3
approved_by: "repository owner (chat: continue with phase 3 and 4)"
approved_at: "2026-11-19"
exit_criteria_met: true
---

# Phase 3 — One static build, one deploy

## 1. Goal

A workflow that builds `apps/web/dist` with the real site URL, packages it through the thin Worker with the
same mode it deploys, and contains no migration, secret, container, or D1 step.

## 2. Target pipeline

```text
install -> build web (PUBLIC_SITE_URL) -> cf build --mode production
        -> cf deploy --prebuilt --mode production -> assets + Worker (headers)
```

## 3. Tasks

| ID   | Task                                                      | Blocking | Touches                                       |
| ---- | --------------------------------------------------------- | -------- | --------------------------------------------- |
| T3.1 | Rewrite the deploy workflow for static assets             | YES      | `.github/workflows/deploy-edge.yml`           |
| T3.2 | Replace placeholders, scope the domain, prove the dry-run | YES      | `apps/edge/cloudflare.config.ts`, environment |

## 4. Exit criteria

- Both jobs build with `--mode production` and deploy the same mode; no mode-less artifact.
- `PUBLIC_SITE_URL` reaches the web build, so canonical URLs and feeds use the real origin.
- The workflow has no `d1 migrations`, `secrets.env`, `--secrets-file`, or container rollout step.
- The `changes` filter covers `apps/web`, `apps/edge`, `packages/`, the lockfile, and `turbo.json`.
- `cf deploy --prebuilt --mode production --dry-run` exits 0 locally.
- No placeholder survives in the config.

## 5. Verification budget

| Claim                             | Check                                                                                | Cap    |
| --------------------------------- | ------------------------------------------------------------------------------------ | ------ |
| Build and deploy modes match      | `cf build --mode production` then `cf deploy --prebuilt --mode production --dry-run` | 30 min |
| The build carries the real origin | `rg` the built HTML/feed for the domain and for `example.com`                        | 20 min |
| No dead deploy step               | `rg` the workflow for `d1`, `secrets`, `containers-rollout`                          | 10 min |
| Trigger covers the sources        | path grep test with an `apps/web` and an `apps/edge` path                            | 10 min |

## 6. Risks and rollback

- The deploy is static and reversible: a bad version is replaced by rebuilding an earlier commit.
- A missing `PUBLIC_SITE_URL` fails silently into `example.com`; assert on the built output, not on the
  workflow exit code.
- No secrets are involved, so no credential rotation is needed.

## 7. Review questions

1. Use the production domain for the preview build too, or a `workers.dev` origin? Recommended: preview
   uses `workers.dev`. — **Answered: `workers.dev`.** A non-production mode claims no custom domain, so
   the preview origin is the Worker's own `workers.dev` URL.
2. Keep the `edge` workflow name, or rename it `deploy`? — **Answered: keep `deploy-edge`.** The name is
   referenced by branch protection and by the Phase 4 dispatch command.

## 8. Result

| Task | Status    | Evidence                                                                                |
| ---- | --------- | --------------------------------------------------------------------------------------- |
| T3.1 | completed | [`../task-memory/T3.1.md`](../task-memory/T3.1.md) — mode pair, dry-run exit 0          |
| T3.2 | completed | [`../task-memory/T3.2.md`](../task-memory/T3.2.md) — no placeholder, domain mode-scoped |
| T3.3 | completed | [`../task-memory/T3.3.md`](../task-memory/T3.3.md) — docs quote the workflow            |

Exit criteria, all met locally:

- Both jobs build `--mode production` and deploy the same mode; a mismatch exits 1 with the CLI's own
  message.
- `PUBLIC_SITE_URL` reaches the web build: the built HTML and feed carry the supplied origin, and no
  `example.com` remains in the output.
- No `d1 migrations`, `secrets.env`, `--secrets-file`, or container rollout step exists in the workflow.
- The `changes` filter still matches `apps/(edge|web)/`, `packages/`, the lockfile, and `turbo.json`.
- `cf deploy --prebuilt --mode production --dry-run` exits 0 without Docker and without credentials.
- No placeholder survives in `apps/edge/cloudflare.config.ts`.

Not proven here: a real Cloudflare deploy. The owner deferred the account id, domain, and token (Q9), so
Phase 4 is blocked rather than done.

## 9. References

- Plan: [`../README.md`](../README.md). Open questions: [`../OPEN_QUESTIONS.md`](../OPEN_QUESTIONS.md).
