import { defineWranglerConfig } from "wrangler/experimental-config";

/**
 * Static-asset directory for `cf dev/build/deploy` (D-036).
 * `cf` reads this sibling file in addition to `cloudflare.config.ts`; it does NOT
 * read `wrangler.jsonc`/`wrangler.toml`. There is no `--assets` flag.
 */
export default defineWranglerConfig({ assetsDirectory: "../web/dist" });
