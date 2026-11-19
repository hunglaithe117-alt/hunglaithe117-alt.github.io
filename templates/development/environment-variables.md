# Environment Variables

> **When to use:** a component needs a value that varies by environment, or start-up fails because a required value is missing or empty.
>
> **What it answers:** which variables exist, what each one controls, which are required, what they default to, where each is read, and where a secret may live.
>
> Delete this blockquote when filled.

This page specifies the configuration: the variable names, which values are required, their defaults, and where each is read. The settings module — `<path/to/settings module>` — implements it. Setup steps that load this configuration are in [`local-setup.md`](local-setup.md).

## 1. How configuration is loaded

Settings are read from process environment variables through a typed settings object. The reader resolves, validates, and casts each value once, at start-up, and fails closed on a missing or empty required value rather than continuing with an unsafe default. Nothing is discovered from a file that is not explicitly loaded, so a command that runs the application must have the environment present before it starts.

| Concern          | Rule                                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------------- |
| Source           | Process environment only; no implicit file discovery.                                             |
| Validation       | Every value is parsed and typed by the settings module; the process fails closed on a bad value.  |
| Scope            | A component reads only the settings group it needs; groups are not merged into one global object. |
| Change of record | A change lands here and in the settings module in the same change, so the two never drift.        |

## 2. The variable catalogue

One row per variable. The table is exhaustive: a variable the process reads but this table omits is a gap, and a row whose variable no longer exists is a defect.

Delete this note when filled. \<List only the variables this project defines; delete the example rows and the group boundaries that do not apply, and keep the rows grouped by the plane or component that owns them.>

| Variable          | Purpose                                           | Required? | Default                | Where it is read            |
| ----------------- | ------------------------------------------------- | --------- | ---------------------- | --------------------------- |
| `<VARIABLE_NAME>` | \<what it controls>                               | Yes       | \<none>                | \<settings group and field> |
| `<VARIABLE_NAME>` | \<what it controls>                               | No        | \<e.g. localhost>      | \<settings group and field> |
| `<DATABASE_URL>`  | \<the connection string for the system of record> | Yes       | \<none>                | \<settings group and field> |
| `<CACHE_URL>`     | \<the connection string for the cache>            | No        | \<e.g. localhost:6379> | \<settings group and field> |
| `<SECRET_KEY>`    | \<the signing secret for issued credentials>      | Yes       | \<none>                | \<settings group and field> |
| `<LOG_LEVEL>`     | \<the minimum level the logger emits>             | No        | \<e.g. info>           | \<settings group and field> |

## 3. Where secrets may and may not live

A secret is a value whose disclosure grants access: credentials, signing keys, connection strings that embed a password, and tokens.

| A secret may live in                                                 | A secret must never live in                                |
| -------------------------------------------------------------------- | ---------------------------------------------------------- |
| A secret manager, injected into the process environment at run time. | The repository, in any commit — not even a deleted one.    |
| The process environment of the running container or host.            | A committed example or template file.                      |
| Developer-local, uncommitted files excluded from version control.    | A log line, an error message, or a stack trace.            |
| The deployment platform's encrypted secret store.                    | A test fixture that runs against anything but a throwaway. |

An example file carries the variable **name** and a non-secret placeholder, never a usable value. A leaked secret is rotated, not merely removed from the working tree — the history already holds it.

## 4. Per-environment differences

The same code runs in each environment; only the supplied values differ. Record what changes and how it is supplied, never the value itself.

| Environment | What differs                                                   | How configuration is supplied                     |
| ----------- | -------------------------------------------------------------- | ------------------------------------------------- |
| Local       | \<Non-production hosts and defaults; verbose logging.>         | \<A developer-owned file, loaded explicitly.>     |
| CI          | \<Ephemeral stores spun up per run; no external dependencies.> | \<Injected by the pipeline; secrets are masked.>  |
| Staging     | \<Production-like shape at reduced scale.>                     | \<The platform's secret store.>                   |
| Production  | \<Real endpoints; strict validation; no debug surface.>        | \<The platform's secret store, injected at boot.> |

## 5. References

- Related docs: [`local-setup.md`](local-setup.md), [`testing-guide.md`](testing-guide.md)
- Conventions: [`CONVENTIONS.md`](../CONVENTIONS.md) §11 (section shape); §12 (one authority per rule).
- Crosscutting concepts: [`08-crosscutting-concepts`](../architecture/08-crosscutting-concepts.md) — configuration as a crosscutting concern.
