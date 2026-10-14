<script setup lang="ts">
/**
 * ViewCounter — post-page Vue island (Phase 3/5 gap): the real client for
 * `GET /api/views/:slug` (contract in `packages/types` → `ViewResponse { slug, count }`).
 *
 * Exactly **one** request, fired from `onMounted` — never at module scope, so the
 * static build stays static and nothing touches `/api/*` during SSR/SSG. The post
 * page hydrates it with `client:visible`, so the fetch only happens once the island
 * is actually on screen and can never block the static render.
 *
 * Graceful degradation: the island renders **nothing** until a valid count arrives.
 * If the API isn't deployed yet (network/4xx/parse failure) it stays empty — no
 * error, no message, and nothing added to the layout, so there is no shift.
 *
 * Styling uses DESIGN-SYSTEM tokens only (`text-sm`, `text-text-muted`) so the count
 * sits quietly in the post meta line and stays correct in both light and dark themes.
 * The eye glyph is `aria-hidden`; the visible text carries the meaning for assistive
 * tech, so the count is never conveyed by the icon alone.
 */
import { onMounted, ref } from "vue";

interface Props {
  /** Post slug as sent on the wire (URL-encoded before use). */
  slug: string;
  /** Localised unit word, e.g. "lượt xem" / "views". */
  label: string;
  /** API base; defaults to the same-origin `/api` proxy. */
  apiBase?: string;
}

const props = withDefaults(defineProps<Props>(), { apiBase: "/api" });

/** `null` until a valid count arrives — the island renders nothing before then. */
const count = ref<number | null>(null);

onMounted(async () => {
  try {
    const res = await fetch(`${props.apiBase}/views/${encodeURIComponent(props.slug)}`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return;
    const data = (await res.json()) as { slug?: unknown; count?: unknown };
    if (typeof data.count === "number" && Number.isFinite(data.count)) {
      count.value = data.count;
    }
  } catch {
    /* API not deployed yet — degrade silently to nothing. */
  }
});
</script>

<template>
  <span
    v-if="count !== null"
    class="inline-flex items-center gap-1.5 text-sm text-text-muted"
    data-reveal
    data-pagefind-ignore
  >
    <span aria-hidden="true">·</span>
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
    <span>{{ count.toLocaleString() }}</span>
    <span>{{ label }}</span>
  </span>
</template>
