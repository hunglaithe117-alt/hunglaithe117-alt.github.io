<script setup lang="ts">
/**
 * Smoke Vue island (T3.1). Rendered with `client:visible` from BaseLayout to prove
 * islands-only hydration (D-010). Contains no Pagefind/network access (T3.3 risk note).
 */
import { ref } from "vue";

const count = ref(0);
const label = ref("");
</script>

<template>
  <div
    class="inline-flex flex-wrap items-center gap-3 rounded-md border border-border-strong bg-surface px-3 py-2 text-xs text-text-muted"
    role="group"
    aria-label="Vue hydration smoke test"
  >
    <span class="font-medium text-text">Vue island</span>
    <button
      type="button"
      class="inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm bg-primary px-3 font-semibold text-on-primary transition-transform duration-instant ease-standard active:scale-[0.98]"
      @click="count++"
    >
      +1
    </button>
    <output aria-live="polite">clicked {{ count }}×</output>
    <input
      v-model="label"
      type="text"
      placeholder="type…"
      class="min-h-11 rounded-sm border border-border-strong bg-surface-raised px-2 text-text"
      aria-label="Hydration input test"
    />
    <span v-if="label" class="text-text">echo: {{ label }}</span>
  </div>
</template>
