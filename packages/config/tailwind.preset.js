// Tailwind v4 pushes theming into CSS (`@theme`), so there is no JS preset to export here.
// The design tokens from phases/DESIGN-SYSTEM.md live in the Astro app's entry stylesheet:
//   apps/web/src/styles/global.css  (imported by BaseLayout.astro)
// Tailwind v4 is wired there via the `@tailwindcss/vite` plugin (D-035), NOT `@astrojs/tailwind`.
// This module stays as the shared bridge referenced by `@blog/config` consumers.
export default {
  theme: {
    extend: {},
  },
};
