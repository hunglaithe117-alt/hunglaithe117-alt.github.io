/**
 * Build-time indexing switch.
 *
 * When `PUBLIC_NOINDEX` is set to `1`/`true` the build marks the whole site uncrawlable —
 * used for a mirror deployment that must not compete with the canonical origin (the
 * Worker mirror vs the GitHub Pages site). Default is indexable, so a plain local or
 * production build needs no extra variable.
 */

/** `PUBLIC_NOINDEX` resolved once per build; reads the inlined public env var. */
export const NOINDEX: boolean = /^(1|true)$/i.test((import.meta.env.PUBLIC_NOINDEX ?? "").trim());
