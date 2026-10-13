<script setup lang="ts">
/**
 * Mobile navigation drawer (phone + tablet) — the only JS-dependent nav path
 * (DESIGN-SYSTEM §6.2). Uses a native <dialog> so modal semantics — focus trap,
 * Esc to close, inert background, focus restore — come from the platform (§5/§6.4).
 * The Astro side renders a <details> fallback under <noscript>.
 */
import { onBeforeUnmount, ref, watch } from "vue";

interface NavLink {
  href: string;
  label: string;
}

defineProps<{
  links: NavLink[];
  labels: { menu: string; open: string; close: string; language: string };
  switchHref: string;
  switchLabel: string;
}>();

const dialog = ref<HTMLDialogElement | null>(null);
const trigger = ref<HTMLButtonElement | null>(null);
const open = ref(false);

// Lock page scroll while the modal drawer is open.
watch(open, (isOpen) => {
  if (typeof document === "undefined") return;
  document.body.style.overflow = isOpen ? "hidden" : "";
});

function show(): void {
  open.value = true;
  dialog.value?.showModal();
}

function hide(): void {
  dialog.value?.close();
}

function onClose(): void {
  open.value = false;
  // §6.4: return focus to the toggle on close so keyboard users are not dropped.
  trigger.value?.focus();
}

// Clicking the <dialog> element itself (the backdrop area) dismisses it.
function onDialogClick(event: MouseEvent): void {
  if (event.target === dialog.value) hide();
}

onBeforeUnmount(() => {
  if (typeof document !== "undefined") document.body.style.overflow = "";
});
</script>

<template>
  <button
    ref="trigger"
    type="button"
    class="icon-btn inline-flex h-11 w-11 items-center justify-center rounded-md border border-border-strong text-text transition-colors duration-fast ease-standard hover:bg-surface desktop:hidden"
    :aria-label="labels.open"
    aria-haspopup="dialog"
    @click="show"
  >
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
    >
      <line x1="3" y1="6" x2="17" y2="6" />
      <line x1="3" y1="10" x2="17" y2="10" />
      <line x1="3" y1="14" x2="17" y2="14" />
    </svg>
  </button>

  <dialog
    ref="dialog"
    class="blog-nav-drawer"
    :aria-label="labels.menu"
    @close="onClose"
    @cancel="onClose"
    @click="onDialogClick"
  >
    <div class="flex h-full flex-col gap-2 p-4">
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-text-muted">{{ labels.menu }}</span>
        <button
          type="button"
          class="inline-flex h-11 w-11 items-center justify-center rounded-md border border-border-strong text-text"
          :aria-label="labels.close"
          @click="hide"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          >
            <line x1="4" y1="4" x2="14" y2="14" />
            <line x1="14" y1="4" x2="4" y2="14" />
          </svg>
        </button>
      </div>

      <nav class="mt-2" aria-label="Primary">
        <ul class="flex flex-col">
          <li v-for="link in links" :key="link.href">
            <a
              :href="link.href"
              class="flex min-h-12 items-center rounded-sm px-3 text-lg transition-colors duration-fast ease-standard hover:bg-surface-raised"
              @click="hide"
              >{{ link.label }}</a
            >
          </li>
        </ul>
      </nav>

      <hr class="my-2 border-border" />

      <a
        :href="switchHref"
        class="flex min-h-12 items-center gap-2 rounded-sm px-3 transition-colors duration-fast ease-standard hover:bg-surface-raised"
        @click="hide"
      >
        <span class="text-sm text-text-muted">{{ labels.language }}:</span>
        <span>{{ switchLabel }}</span>
      </a>
    </div>
  </dialog>
</template>

<style>
/* Unscoped: styles the native <dialog> + ::backdrop, which scoped selectors can't reach. */
.blog-nav-drawer {
  margin: 0 0 0 auto; /* right drawer (§6.2) */
  block-size: 100dvh;
  max-block-size: 100dvh;
  inline-size: min(20rem, 85vw);
  padding: 0;
  border: none;
  background-color: var(--color-surface);
  color: var(--color-text);
  box-shadow: var(--shadow-overlay);
  padding-inline-end: max(1rem, env(safe-area-inset-right));
}
.blog-nav-drawer::backdrop {
  background-color: color-mix(in oklch, var(--color-text) 40%, transparent);
}
</style>
