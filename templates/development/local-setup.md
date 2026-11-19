# Local Setup

> **When to use:** a workstation must go from nothing to a running \<Project Name>, or an existing setup has stopped working.
>
> **What it answers:** the tools and versions to install, the steps to bring up the local stack, how to prove it is up, and how to fix the failures that recur.
>
> Delete this blockquote when filled.

This guide takes a new machine to a running system and is read top to bottom the first time. Values this project substitutes for a placeholder are specific to \<Project Name>; the placeholder forms are defined in [`CONVENTIONS.md`](../CONVENTIONS.md) §1, and the configuration the steps load is catalogued in [`environment-variables.md`](environment-variables.md). A workstation is "done" when the verification in §4 passes, not when the last command exits.

## 1. Prerequisites

Install every tool that appears in the steps below, at or above the stated version. A missing or older tool is the most common cause of a setup that fails partway through.

| Tool                      | Version               | Why it is needed                                              |
| ------------------------- | --------------------- | ------------------------------------------------------------- |
| \<Runtime>                | \<e.g. 3.11 or newer> | Runs the application and the test suite.                      |
| \<Package manager>        | \<e.g. latest stable> | Resolves and installs dependencies into the project venv.     |
| \<Container runtime>      | \<e.g. 24 or newer>   | Runs the local \<database>, \<cache>, and \<broker> services. |
| \<Database server>        | \<e.g. 16 or newer>   | The system of record for development data.                    |
| \<Cache / broker>         | \<e.g. 7 or newer>    | \<Backs caching and asynchronous work locally.>               |
| \<Migration tool>         | \<e.g. tool version>  | Applies schema migrations.                                    |
| \<Version control client> | \<e.g. 2.40 or newer> | Clones the repository and drives the commit workflow.         |

Delete this note when filled. \<Keep only the tools this project actually pins; delete the rows it does not use, and record the reason for any version floor in a comment beside it.>

## 2. Install the toolchain

Run the blocks in order. Each block is complete: it needs no values from elsewhere in this page.

1. Verify the runtime and package manager are on the path.

   ```bash
   <runtime> --version
   <package-manager> --version
   ```

1. Clone the repository and enter it.

   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

1. Install the dependencies into the project environment.

   ```bash
   <package-manager> install <e.g. --all-packages --all-extras>
   ```

1. Create the local configuration from the committed example.

   ```bash
   cp <.env.example> <.env>
   ```

1. Fill the required values in `<.env>`. The catalogue in [`environment-variables.md`](environment-variables.md) says which are required and what they default to.

## 3. Start the local stack

The stack has two tiers. Bring up the infrastructure first — the application will not start if it cannot reach its data stores.

1. Start the infrastructure services.

   ```bash
   <container-tool> compose up -d <database> <cache>
   ```

1. Prepare the schema. Apply migrations as a separate step, never as an application-startup side effect.

   ```bash
   <package-manager> run <migration-tool> upgrade head
   ```

1. Start the application.

   ```bash
   <package-manager> run <start-command>
   ```

   The application listens on `<host>:<port>`; its API documentation is served at `</docs>` in non-production environments.

## 4. Verify the system is up

A running process is not a working system. Confirm each check before declaring setup done.

| Check             | Command                                              | Expected result                          |
| ----------------- | ---------------------------------------------------- | ---------------------------------------- |
| Infrastructure    | `<container-tool> compose ps`                        | Every service is `running` or `healthy`. |
| Liveness          | `<health-check-command>`                             | `200` with a healthy body.               |
| Schema is current | `<package-manager> run <migration-tool> current`     | The head revision, not an earlier one.   |
| Test smoke        | `<package-manager> run <test-runner> <smoke-target>` | Passes.                                  |

## 5. Common setup failures and fixes

| Symptom                                         | Likely cause                                               | Fix                                                                                     |
| ----------------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Application exits on start with a missing value | A required variable is absent from `<.env>`.               | Add it; the required list is in [`environment-variables.md`](environment-variables.md). |
| Connection refused to \<database>               | Infrastructure containers are not up or not healthy.       | Run \<container-tool> compose up -d, then repeat §4.                                    |
| Port already in use                             | A previous run, or another service, holds the port.        | Stop the holder, or change the port in `<.env>`.                                        |
| Schema error on the first request               | Migrations were never applied, or are behind head.         | Run `upgrade head` from §3.                                                             |
| Dependency resolution fails                     | The package manager version is below the floor.            | Upgrade to the version in §1.                                                           |
| Tests cannot reach their datasource             | The test stack has no isolated instance, or it is stopped. | Start the test services; see [`testing-guide.md`](testing-guide.md).                    |

## 6. References

- Related docs: [`environment-variables.md`](environment-variables.md), [`testing-guide.md`](testing-guide.md)
- Conventions: [`CONVENTIONS.md`](../CONVENTIONS.md) §1 (placeholder syntax); §2 (file naming).
