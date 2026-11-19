# Disaster Recovery

> **When to use:** the system holds data that cannot be regenerated, and the team must state what is backed up, how long recovery may take, what is lost in the worst case, and who decides when a disaster is declared.
>
> **What it answers:** the backup inventory, the recovery objectives per asset, the restore procedure, the drill that proves the procedure works, and the log of declared disasters.
>
> Delete this blockquote when filled.

An asset is backed up only when a restore from its backup has been performed and recorded; a copy nobody has restored is a hope, not a backup. Recovery objectives are stated per asset, because assets fail differently and a single number hides that.

## 1. The recovery rule

- **An untested restore is not a backup.** An asset counts as protected only after a restore from its backup completed in a drill (§5) and the result was recorded.
- Every asset in §2 has an owner, a stated RTO and RPO (§3), and a restore procedure that someone other than its author has executed.
- The plan is only as current as its last drill: a drill older than \<e.g. 90 days> leaves the plan unverified, and the asset effectively unbacked.
- Recovery is a decision made by a named person and recorded in §6, not an improvised action under pressure.
- A derived store is rebuilt from its source, and the rebuild path is what is tested; snapshotting a derived store only shortens the rebuild.

## 2. Backup inventory

| Asset                          | Method                                                                                              | Frequency                   | Retention                                                    | Encryption                                                          |
| ------------------------------ | --------------------------------------------------------------------------------------------------- | --------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------- |
| Primary datastore              | \<e.g. continuous write-ahead archiving plus a periodic full snapshot>                              | \<continuous; full nightly> | \<e.g. 35 days point-in-time recovery>                       | \<Encrypted at rest and in transit; key owned by \<role>>           |
| Object storage and uploads     | \<e.g. bucket versioning plus cross-region replication>                                             | \<continuous>               | \<e.g. 90 days of versions>                                  | \<Server-side encryption with \<key source>>                        |
| Message broker                 | \<Topology and configuration in infrastructure-as-code; retained messages where the topic persists> | \<per change for config>    | \<Full history in the repository; \<e.g. 7 days of messages> | \<Transport encryption; payloads encrypted by the producer>         |
| Container images and artefacts | \<Registry with immutable tags and digests>                                                         | \<Per release>              | \<e.g. 1 year of releases>                                   | \<Signed; registry storage encrypted at rest>                       |
| Secrets and configuration      | \<Secret store with versioning enabled>                                                             | \<On every change>          | \<Every version retained>                                    | \<Managed by the secret store; never copied into a backup snapshot> |
| Infrastructure as code         | \<Repository history>                                                                               | \<Per change>               | \<Full history>                                              | \<Not applicable — the repository holds no secret values>           |
| Search or index store          | \<Rebuilt from the primary datastore; a snapshot exists only to shorten the rebuild>                | \<e.g. daily snapshot>      | \<e.g. 7 days of snapshots>                                  | \<Encrypted at rest>                                                |
| Logs and audit trail           | \<Shipped to a store separate from the application>                                                 | \<Continuous>               | \<e.g. 1 year, or the contractual minimum>                   | \<Encrypted at rest; access audited>                                |

- A backup that shares a failure domain with its source is not a backup of that failure: state where the copy lives, not only that it exists.
- Every row names the restoring role, so a restore never depends on one person's workstation.
- Retention is the shortest period the RPO and the contractual minimum jointly allow; longer is not automatically safer, because it widens what a breach exposes.

## 3. Recovery objectives

| Asset class                  | RTO                | RPO               | Basis                                                                 | Last measured              |
| ---------------------------- | ------------------ | ----------------- | --------------------------------------------------------------------- | -------------------------- |
| \<Transactional datastore>   | \<e.g. 1 hour>     | \<e.g. 5 minutes> | \<Agreed with the business owner for \<journey>>                      | \<YYYY-MM-DD, \<measured>> |
| \<Object storage>            | \<e.g. 4 hours>    | \<e.g. 1 hour>    | \<RPO set by the replication lag already tolerated>                   | \<YYYY-MM-DD, \<measured>> |
| \<Derived index or cache>    | \<e.g. 24 hours>   | \<Full rebuild>   | \<Rebuildable from the source; the rebuild time is the recovery time> | \<YYYY-MM-DD, \<measured>> |
| \<Configuration and secrets> | \<e.g. 30 minutes> | \<Last commit>    | \<Version history is the source of truth>                             | \<YYYY-MM-DD, \<measured>> |

- RTO and RPO are agreed with the business owner, not chosen by the team: a lower number costs money and must be justified by the impact it prevents.
- They are per asset class; a target that has not been measured in a drill is a target, not a capability, and §5 records the measured value beside it.
- A change in business process, such as a new critical journey, reopens this table rather than inheriting the old numbers.

## 4. Restore procedure

1. Declare the incident, record the start time, and name the single person running the restore; the clock runs against the RTO in §3.

1. Stop every writer to the asset so nothing is being written while it is restored.

   ```bash
   kubectl -n "$NAMESPACE" scale "deployment/$APP" --replicas=0
   ```

   Expected: no writer is connected to the asset; confirm with the connection count rather than trusting the command.

1. Choose the recovery point: the latest point consistent with the RPO, and record its timestamp before restoring.

1. Restore into a scratch instance first, and verify there, when the asset is large enough that a second attempt is expensive.

   ```bash
   pg_restore --clean --if-exists --dbname "$SCRATCH_DB" "$BACKUP_FILE"
   pg_restore --list "$BACKUP_FILE" | tail -1
   ```

   Expected: the restore exits zero, and the archive listing shows the expected terminal record.

1. Restore the production asset, or promote the verified scratch instance into production.

   ```bash
   pg_restore --clean --if-exists --dbname "$PRODUCTION_DB" "$BACKUP_FILE"
   ```

   Expected: exit code zero and no error output; a warning about already-existing objects means the clean step did not run.

1. Apply the schema migrations committed up to the running revision, so the restored data matches the code about to serve it.

   ```bash
   uv run alembic upgrade head
   ```

   Expected: the current revision equals the revision the release expects.

1. Re-enable the writers, one deployment at a time, and watch the signals in [`monitoring-and-alerts.md`](monitoring-and-alerts.md) as they come back.

1. Verify the recovery against the checks in §5, then record the recovery point actually used, the elapsed time, and the measured values in §6.

Blast radius: steps 4 to 6 overwrite data. Name the target instance and the backup file in the incident channel before running step 5; restoring into the wrong instance destroys the wrong data.

## 5. Restore drills and verification

| Drill                    | Scope                                                   | Frequency             | Evidence                                 | Owner    |
| ------------------------ | ------------------------------------------------------- | --------------------- | ---------------------------------------- | -------- |
| Single-asset restore     | One asset restored into an isolated instance            | \<e.g. monthly>       | Drill entry in §6                        | \<owner> |
| Full recovery rehearsal  | The whole system recovered in a scratch environment     | \<e.g. semi-annually> | Timed run sheet and measured RTO         | \<owner> |
| Restore-point spot check | One recent backup restored and compared with its source | \<e.g. weekly>        | Check output attached to the drill entry | \<owner> |

1. Pick one row of §2 and its procedure in §4, and pick a restorer who did not write the procedure.
1. Restore into an isolated environment; never into the production instance.
1. Run every check below and record pass or fail for each.
1. Compare the measured elapsed time with the RTO and RPO in §3, and update the measurement column.
1. File the follow-ups: a failed check becomes an issue, and a repeated failure reopens the procedure rather than being noted and forgotten.

| Check                     | How                                                                            | Pass criterion                                            |
| ------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------- |
| Row counts and checksums  | Compare restored counts and checksums with the source at the chosen point      | Equal within the expected churn for the window            |
| Referential integrity     | Run the application's integrity queries against the restore                    | No orphan or missing reference                            |
| Application smoke test    | Point a scratch deployment at the restored asset and run the critical journeys | Critical journeys complete                                |
| Point-in-time correctness | Confirm the newest record matches the chosen recovery point                    | The record's timestamp equals the chosen point or earlier |
| Secrets and configuration | Rebuild the environment from the secret store and infrastructure-as-code       | The restored service starts with no manual step           |
| Recovery time against RTO | Time the whole exercise from declaration to verified service                   | Measured time is within the RTO in §3                     |

## 6. Declared-disaster decision log

| Date          | Incident              | Declared by | Scope                       | Recovery point used              | Data lost                 | Follow-ups                               |
| ------------- | --------------------- | ----------- | --------------------------- | -------------------------------- | ------------------------- | ---------------------------------------- |
| \<YYYY-MM-DD> | \<incident reference> | \<role>     | \<asset or system affected> | \<timestamp and backup identity> | \<what was lost, or none> | \<issue, runbook, or drill that changed> |

- Only \<role> may declare a disaster, which switches the team onto the procedures in this document.
- The chosen recovery point is recorded with its timestamp and the reason it was chosen over a later or an earlier point.
- The log is append-only; a correction is a new entry that names the entry it corrects.
- Every declared disaster closes with a review in this log naming the runbook, alert, or drill the event changed.

## 7. References

- Incident procedures: [`runbooks`](runbooks/README.md) — the symptom-level pages that call into this document.
- Freshness and replication signals: [`monitoring-and-alerts.md`](monitoring-and-alerts.md).
- Artefact history and rollback: [`ci-cd-pipeline.md`](ci-cd-pipeline.md).
- Data model, retention, and derived stores: [`06-data-architecture`](../architecture/06-data-architecture.md).
- Conventions: [`CONVENTIONS`](../CONVENTIONS.md).
