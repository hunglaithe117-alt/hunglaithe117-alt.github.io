<script setup lang="ts">
/** Smoke Vue island rendered with `client:visible` to verify selective hydration. */
import { ref } from "vue";

const count = ref(0);
const label = ref("");
</script>

<template>
  <div
    class="inline-flex flex-wrap items-center gap-3 border border-border bg-surface px-3 py-2 text-xs text-text-muted"
    role="group"
    aria-label="Vue hydration smoke test"
  >
    <span class="font-medium text-text">Vue island</span>
    <button
      type="button"
      class="inline-flex min-h-11 min-w-11 items-center justify-center bg-text px-3 font-semibold text-bg"
      @click="count++"
    >
      +1
    </button>
    <output aria-live="polite">clicked {{ count }}×</output>
    <input
      v-model="label"
      type="text"
      placeholder="type…"
      class="min-h-11 border border-border bg-bg px-2 text-text"
      aria-label="Hydration input test"
    />
    <span v-if="label" class="text-text">echo: {{ label }}</span>
  </div>
</template>
