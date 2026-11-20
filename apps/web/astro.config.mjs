// Astro 7 configuration for @blog/web.
import { readFileSync, readdirSync } from "node:fs";
import { defineConfig } from "astro/config";
import vue from "@astrojs/vue";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// `site` is an identity input for canonical URLs / feeds / sitemap — hashed via turbo `PUBLIC_*`.
const site = process.env.PUBLIC_SITE_URL?.trim();
if (!site) {
  throw new Error("PUBLIC_SITE_URL environment variable is required.");
}

/**
 * Route -> publication date, read from the post frontmatter so the sitemap can carry
 * `lastmod`. The collection API is not available while the config is evaluated, and the
 * schema guarantees a `date:` line, so a narrow read is enough here.
 */
function postDates() {
  const root = new URL("../../packages/content/posts/", import.meta.url);
  const dates = new Map();
  for (const lang of ["vi", "en"]) {
    let files;
    try {
      files = readdirSync(new URL(`${lang}/`, root));
    } catch {
      continue;
    }
    for (const file of files) {
      const match = /\.mdx?$/.exec(file);
      if (!match) continue;
      const source = readFileSync(new URL(`${lang}/${file}`, root), "utf8");
      const date = /^date:\s*["']?(\d{4}-\d{2}-\d{2})/m.exec(source);
      if (date) dates.set(`/${lang}/posts/${file.slice(0, match.index)}/`, date[1]);
    }
  }
  return dates;
}

const dates = postDates();

export default defineConfig({
  site,
  // Both locales use URL prefixes (`/en/...`, `/vi/...`) for symmetric routes and feeds.
  i18n: {
    defaultLocale: "en",
    locales: ["en", "vi"],
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: false,
    },
  },
  // Code blocks carry both palettes as custom properties; global.css picks one per theme.
  markdown: {
    shikiConfig: {
      themes: { light: "github-light", dark: "github-dark" },
      defaultColor: false,
    },
  },
  integrations: [
    // `pagefind-*` tags are Pagefind Component UI web components rendered inside Vue
    // islands (SearchBox.vue) — mark them as custom elements so Vue leaves them alone.
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith("pagefind-"),
        },
      },
    }),
    mdx(),
    // Sitemap with hreflang alternates per locale, plus `lastmod` for post pages.
    sitemap({
      i18n: {
        defaultLocale: "en",
        locales: { en: "en-US", vi: "vi-VN" },
      },
      serialize(item) {
        const lastmod = dates.get(new URL(item.url).pathname);
        return lastmod ? { ...item, lastmod } : item;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    // Linked workspace package ships raw .vue/.astro source — keep it out of SSR externalisation.
    ssr: { noExternal: ["@blog/ui"] },
  },
  // Keep explicit `{" "}` between inline elements since `compressHTML: "jsx"` drops whitespace.
  compressHTML: "jsx",
});
