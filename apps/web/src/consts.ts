/**
 * Site-wide constants shared by pages, feeds and metadata.
 * The identity lives in `lib/site.ts`; this file only re-exports it for older callers.
 */
import { SITE } from "./lib/site";

export const SITE_AUTHOR = SITE.name;
