# Personal Blog

Static blog built with **Astro 7**, **Vue 3** islands, **Tailwind CSS v4**, and **Pagefind**.

## Prerequisites

- **Node.js**: `>= 22.23.4`
- **pnpm**: `12.x`
- **Playwright Chromium** _(for E2E tests only)_: `pnpm exec playwright install chromium`

## Local Development

1. **Install dependencies**:

   ```bash
   pnpm install
   ```

2. **Set `PUBLIC_SITE_URL`** _(required by `apps/web/astro.config.mjs`)_:

   ```bash
   export PUBLIC_SITE_URL="http://localhost:4321"
   ```

3. **Run the dev server**:

   ```bash
   pnpm --filter @blog/web dev
   ```

4. **Build the static site & Pagefind search index**:

   ```bash
   pnpm --filter @blog/web build
   ```

5. **Preview locally with Cloudflare Worker** _(optional)_:

   ```bash
   pnpm --filter @blog/edge dev
   ```

## Checks & Tests

```bash
# Astro typecheck & content schema validation
PUBLIC_SITE_URL="http://localhost:4321" pnpm --filter @blog/web check

# Formatting & markdown lint
pnpm format:check
pnpm lint:md

# Dependency security audit (high/critical)
pnpm security:audit

# End-to-end Playwright tests against apps/web/dist
pnpm test:e2e
```
