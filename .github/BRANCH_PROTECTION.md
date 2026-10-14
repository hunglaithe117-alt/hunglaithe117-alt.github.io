# Branch protection & secret hygiene (`main`)

The repository is **public**, so a single committed key is a permanent leak. These
settings live in GitHub (not in the repo) and must be applied by an admin. They are
the enforceable half of T2.3; the `.gitignore` / gitleaks / environment contract is
the other half.

## Required protection on `main`

| Setting                                            | Value                                                  |
| -------------------------------------------------- | ------------------------------------------------------ |
| Require a pull request before merging              | on                                                     |
| Required approvals                                 | ≥ 1                                                    |
| Dismiss stale approvals on new commits             | on                                                     |
| Require review from Code Owners                    | on (see `.github/CODEOWNERS` if added)                 |
| Require status checks to pass                      | on                                                     |
| — Required checks                                  | `ci`, `security`, `validate (dry-run, no credentials)` |
| Require branches to be up to date before merging   | on                                                     |
| Require conversation resolution                    | on                                                     |
| Require linear history                             | on                                                     |
| Restrict who can push                              | admins only (no direct pushes to `main`)               |
| Do not allow bypassing the above (admins included) | on                                                     |

Required checks map to the workflows in this directory:

- `ci` and `security` — `.github/workflows/ci.yml`.
- `validate (dry-run, no credentials)` — `.github/workflows/deploy-edge.yml`.

## Secret scanning

| Setting               | Value                                           |
| --------------------- | ----------------------------------------------- |
| Secret scanning       | on                                              |
| Push protection       | on (blocks a push containing a detected secret) |
| Validity checks       | on                                              |
| Non-provider patterns | on                                              |

CI additionally runs `gitleaks detect` (full history, `--redact`) in the `security`
job and `pnpm security:audit` / `pnpm security:govulncheck` for dependency CVEs.

## Deploy environment

`.github/workflows/deploy-edge.yml` gates production behind the **`production-edge`**
GitHub Environment:

- **Required reviewers**: ≥ 1 (deploy waits for manual approval).
- **Deployment branches**: `main` only.
- **Environment secrets**: `CLOUDFLARE_API_TOKEN`, `SESSION_SECRET`.
- **Environment variables**: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_D1_DATABASE_ID`,
  `SEND_EMAIL_FROM`, `TURBO_TEAM`.
- **Repository secret**: `TURBO_TOKEN` (remote cache; optional, fork-safe).

Pull requests run only `cf deploy --prebuilt --mode production --dry-run` with **no
credentials** and make no API calls.

## Cloudflare token scope

Use a **scoped API token**, never a Global API Key:

- Permissions: Workers Scripts (edit), D1 (edit), Email Routing / Email Sending
  (edit) — nothing else.
- Resources: the single account only.
- Rotate on any suspected exposure.

## Rotating a leaked key

1. **Assume it is compromised** the moment it is pushed — deleting the commit/file
   is not enough.
2. **Revoke** the credential at the provider (Cloudflare → My Profile → API Tokens →
   Roll/Delete; GitHub → Settings → Secrets → delete/regenerate).
3. **Issue a replacement** with the least-privilege scope above and store it as a
   GitHub Environment/repository secret (never a file).
4. **Purge history if required**: `git filter-repo` / BFG, then force-push and ask
   collaborators to re-clone. Prefer rotation over history surgery.
5. **Verify**: `pnpm dlx gitleaks detect --redact` (or the CI `security` job) is
   clean, and confirm the old token no longer authenticates.

## Local placeholders

`.env.example` and `.dev.vars.example` contain placeholders only (`REPLACE_ME`
style) and stay tracked. Real `.env*` / `.dev.vars*` files, `secrets.env`,
`secrets.json`, `*.pem`, `*.key`, and `.cloudflare/` are git-ignored (`.gitignore`).
The deploy workflow writes `secrets.env` with `umask 077` and deletes it in an
`if: always()` step.
