# Decisions

Append-only. Newest last.

| ID    | Date       | Decision                                                                       | Status                              | Rationale                                                                       |
| ----- | ---------- | ------------------------------------------------------------------------------ | ----------------------------------- | ------------------------------------------------------------------------------- |
| D-001 | 2026-11-19 | Remove only the contact-notification email; keep the form and the D1 audit row | Superseded by D-006                 | The owner did not want the contact channel                                      |
| D-002 | 2026-11-19 | Keep `contact_messages` unchanged                                              | Superseded by D-010                 | The backend is being retired; the table has no reader                           |
| D-003 | 2026-11-19 | Keep migrations in `apps/api`; point the workflow at `../api/migrations`       | Superseded by D-010                 | No migrations remain once the backend is deleted                                |
| D-004 | 2026-11-19 | Make `domains` and `triggers.fetch` production-only                            | Accepted — still applies            | Staging/preview must not claim the production hostname                          |
| D-005 | 2026-11-19 | Remove `SESSION_SECRET` and `IP_HASH_SALT` with the contact feature            | Accepted — implemented              | Both existed only for contact                                                   |
| D-006 | 2026-11-19 | Remove the contact feature entirely; keep the table dormant                    | Accepted — implemented              | No contact channel, newsletter, or email is wanted                              |
| D-007 | 2026-11-19 | Remove the view counter and retire the backend                                 | Accepted 2026-11-19 (Q2)            | The blog has no runtime need; a static site is simpler and verifiable           |
| D-008 | 2026-11-19 | Keep a thin Worker for static assets and security headers                      | Accepted 2026-11-19 (Q3)            | Preserves headers in code; no container or Durable Object remains               |
| D-009 | 2026-11-19 | Delete `apps/api`, `packages/types`, `go.work`, and Go CI                      | Accepted 2026-11-19 (follows D-007) | Dead code and tooling after retirement                                          |
| D-010 | 2026-11-19 | No D1 usage; export only if a real database was provisioned                    | Accepted 2026-11-19 (Q6: none)      | Never deployed from this repo; local migrations deleted with the API            |
| D-011 | 2026-11-19 | Account id and domain are read from the environment, never committed           | Accepted 2026-11-19 (Q8/Q9)         | The owner fills config later; a placeholder in a bound value blocks the dry-run |
| D-012 | 2026-11-19 | Phase 4 stops at "blocked on owner config" rather than simulating a launch     | Accepted 2026-11-19                 | A launch record without an observation would make `docs/status.md` lie          |
