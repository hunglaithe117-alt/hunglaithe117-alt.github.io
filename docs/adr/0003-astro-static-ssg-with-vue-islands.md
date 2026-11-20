# ADR-0003: Astro static SSG with Vue islands

- **Status:** Partially superseded by ADR-0011 and ADR-0012 — the contact form and the view counter are gone; the island model stands.
- **Date:** 2026-10-14
- **Deciders:** Repository maintainers
- **Consulted:** —
- **Informed:** —

## 1. Context and Problem Statement

This record was reconstructed on 2026-11-19 from the implementation and commit history, because the original plan documents (`SOLUTION.md`, `TOOLCHAIN-VERIFIED.md`) are not in the repository. The rationale below is inferred from the code; the rejected options are the ones the shipped configuration excludes.

The site is a personal blog: posts, tags, about, contact and a search page. Its content is known at build time and changes only when a post is committed. Three things nonetheless need a browser: search, the mobile navigation drawer, the contact form and the view counter.

- Current behaviour: `apps/web/astro.config.mjs` declares no `adapter`, so `astro build` emits a static `dist/`; `apps/web/package.json` runs `astro build && pagefind --site dist`; Vue components hydrate only where a `client:*` directive names them.
- Problem or risk: the naive alternatives buy capability the content does not need and pay for it on every request. An SSR build would put page rendering on the Worker or the container, adding a compute path, a cache policy and a failure mode to pages that are immutable between deploys.

## 2. Decision Drivers

- Pages must be servable from Workers Static Assets with no compute per request ([ADR-0005](0005-cloudflare-worker-owns-assets-and-api.md)).
- Content must be validated as data: invalid frontmatter should fail the build, not render an empty page.
- Only genuinely interactive components may ship JavaScript.
- The visual system must be expressible as tokens with no second source of truth in a JavaScript config.
- Search must work without a hosted search service.

## 3. Considered Options

- **Option 1:** Astro static output, no adapter, Vue islands via `@astrojs/vue`, Tailwind v4 through the Vite plugin, Pagefind as a post-build index.
- **Option 2:** Astro with the `@astrojs/cloudflare` SSR adapter, rendering pages on the Worker.
- **Option 3:** A client-rendered Vue SPA built with Vite, with the API supplying content.
- **Option 4:** A non-Astro static generator (Hugo, Eleventy) plus hand-written Vue mounting.

## 4. Decision and Rationale

**Chosen option: Option 1**, because:

1. The content is static by nature, so rendering it once at deploy time removes a compute path entirely; the Worker becomes an asset server for every non-`/api` request.
2. Astro's content collections turn frontmatter into a schema (`apps/web/src/content.config.ts`), so a post missing `title` fails the build rather than shipping — the schema is the blog's data contract.
3. Islands keep the JavaScript proportional to the interaction, which a SPA cannot: an SPA ships the router and the whole view layer to read one post.
4. Pagefind indexes the built HTML, so search needs no service, no key and no index build outside the normal build.

The concrete configuration this decides:

- **Versions** (`D-035`): Astro `7.3.8`, Vue `3.5.44`, `@astrojs/vue` `7.0.3`, `@astrojs/mdx` `8.0.3`, `@astrojs/sitemap` `3.7.4`, Pagefind `1.5.2`. Astro 7's Rust compiler fails the build on unclosed HTML tags, and `compressHTML: "jsx"` is kept explicit because it also drops whitespace between inline elements — templates that need the space write `{" "}`.
- **Styling** (`D-035`): Tailwind v4 arrives through `@tailwindcss/vite`, with `@import "tailwindcss"`, `@source` for the linked `@blog/ui` package, `@custom-variant` definitions and the whole token set in `@theme` inside `apps/web/src/styles/global.css`. There is no `tailwind.config.js`; the CSS file is the only token authority.
- **Islands**: `SearchBox` is `client:load` (the header trigger, so a click is instant), `NavDrawer` is `client:visible`, `ContactForm` is `client:visible`, `ViewCounter` is `client:idle`. `SearchBox` declares `pagefind-*` as custom elements so Vue leaves the Pagefind web components alone.
- **Hydration smoke** (`D-010`): the original proof that only islands hydrate was `SmokeIsland.vue`. `BaseLayout.astro` no longer renders it; the component survives in `packages/ui` as an example in the two sample posts and is otherwise unused.
- **Build** (`D-013`): Astro is built by Turborepo and never by `cf`; `@blog/ui` is a source-only workspace package, so `vite.ssr.noExternal` keeps its raw `.vue`/`.astro` out of SSR externalisation.

## 5. Consequences

### Positive

- A page request costs a static-asset read; there is no rendering path to be slow, cold or unavailable.
- Broken content fails CI: `astro check` plus the collection schema reject a post that is missing a field or a translation, before it can be published.
- The JavaScript payload is the four islands, not the site.
- Search, tags, feeds and the sitemap are all build artifacts, so they version with the commit that produced them.

### Negative

- No SSR at all: there is no per-request HTML, no server-set cookie, no personalised page and no request-time redirect outside the platform's own rules. The `/` → `/vi/` redirect is emitted as a static meta-refresh page (`redirects` in `astro.config.mjs`), which is a weaker contract than a 301.
- Search is unavailable until `pagefind` has indexed `dist/`. In `astro dev` there is no index, which is why `SearchBox` has an "unavailable in this build" state; the index is also regenerated on every build, so a content-only change reindexes the whole site.
- The view counter is post-hydration only: `ViewCounter` renders nothing until a valid count arrives, so a reader without JavaScript never sees a count and every reader gets a late layout insert. Counting on `GET` also means prefetchers can inflate it (see [ADR-0007](0007-d1-as-system-of-record.md)).
- Tailwind v4's CSS-first configuration means tokens are CSS custom properties, not a typed object; a component that needs a token value in script must read it from CSS or duplicate it.
- `compressHTML: "jsx"` makes whitespace between inline elements significant in a way authors must remember, and a missing `{" "}` is invisible in review.
- `astro build && pagefind --site dist` makes Pagefind a hard build dependency with a platform-specific binary; a Pagefind failure fails the deploy.
- The content-only pages still need a full rebuild per post, so publish latency is a CI run rather than a database write.

### Neutral

- Content lives outside the app, in `packages/content/posts`, so the collection's glob base is `../../packages/content/posts` and entry ids carry the locale folder as a prefix ([ADR-0004](0004-bilingual-content-folder-per-locale.md)).
- MDX is enabled, so a post may import components — which is how `SmokeIsland` still appears in the sample posts.

## 6. Links

- Related: [ADR-0004](0004-bilingual-content-folder-per-locale.md) (locale routing and feeds), [ADR-0005](0005-cloudflare-worker-owns-assets-and-api.md) (the Worker serves `dist/`), [ADR-0002](0002-monorepo-with-pnpm-and-turborepo.md) (the build graph).
- Decision IDs: `D-010` (islands-only hydration smoke), `D-013` (Astro is built by Turborepo, not `cf`), `D-035` (Astro 7 and Tailwind v4).
- Code: `apps/web/astro.config.mjs`, `apps/web/package.json`, `apps/web/src/content.config.ts`, `apps/web/src/styles/global.css`, `apps/web/src/layouts/BaseLayout.astro`, `packages/ui/src/SmokeIsland.vue`.
- Introduced by: `dc311a2` (`feat(web): Phase 3 — Astro 7 frontend, bilingual content, feeds, Pagefind, pages & polish`).
