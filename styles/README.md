# Vale styles (`StylesPath` for `.vale.ini`)

This directory is Vale's `StylesPath`. It currently contains no third-party style
packages, so the content-quality gate (D-027) runs Vale's **built-in** `Vale` style
only — which keeps it offline and fork-safe.

## Adding a style

1. Declare the package in `.vale.ini`:

   ```ini
   Packages = Google, write-good
   ```

2. Sync (downloads into `styles/`, writes `styles/.vale-config`):

   ```sh
   pnpm dlx vale sync
   ```

3. Reference it in the section that should use it:

   ```ini
   [*.{md,mdx}]
   BasedOnStyles = Vale, Google
   ```

Keep new rules at `error` level only if they must block the PR; otherwise Vale
reports them at their native level and `minAlertLevel = error` ignores them.
