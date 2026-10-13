/**
 * Static image registry for `astro:assets` (T3.3).
 *
 * Frontmatter stores a *public* cover path (e.g. `/covers/hello-world.png`) so the
 * same string can feed RSS `enclosure`, OG/Twitter tags and JSON-LD (which all need a
 * stable, absolute URL). On-page rendering, however, must go through `astro:assets`
 * so images are hashed, resized and served as AVIF/WebP with intrinsic dimensions
 * (DESIGN-SYSTEM §6.6: no CLS, `sizes` mirrors the grid).
 *
 * This module maps that public path to the imported `ImageMetadata` so the two
 * concerns stay in sync from a single frontmatter field.
 *
 * NOTE (placeholder, CONTENT-INVENTORY.md): the binaries currently live in **both**
 * `public/` (feeds/OG, served verbatim) and `src/assets/` (optimised display). When
 * real assets land, keep the public copy for feed enclosures, or migrate feeds to the
 * hashed asset URL.
 */
import type { ImageMetadata } from "astro";

const coverModules = import.meta.glob<{ default: ImageMetadata }>(
  "../assets/covers/*.{png,jpg,jpeg,webp,avif}",
  { eager: true },
);

const diagramModules = import.meta.glob<{ default: ImageMetadata }>(
  "../assets/images/*.{png,jpg,jpeg,webp,avif}",
  { eager: true },
);

function lookup(
  modules: Record<string, { default: ImageMetadata }>,
  publicPath?: string,
): ImageMetadata | undefined {
  if (!publicPath) return undefined;
  const file = publicPath.split("/").pop();
  if (!file) return undefined;
  for (const [path, mod] of Object.entries(modules)) {
    if (path.endsWith(`/${file}`)) return mod.default;
  }
  return undefined;
}

/** `ImageMetadata` for a frontmatter `cover` path, or `undefined` if it isn't bundled. */
export function coverImage(coverPath?: string): ImageMetadata | undefined {
  return lookup(coverModules, coverPath);
}

/** `ImageMetadata` for a diagram path like `/images/diagram-1.png`. */
export function diagramImage(publicPath?: string): ImageMetadata | undefined {
  return lookup(diagramModules, publicPath);
}
