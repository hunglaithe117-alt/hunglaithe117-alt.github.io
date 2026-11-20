import { defineWranglerConfig } from "wrangler/experimental-config";

/** Static-asset directory for `cf dev/build/deploy`. */
export default defineWranglerConfig({ assetsDirectory: "../web/dist" });
