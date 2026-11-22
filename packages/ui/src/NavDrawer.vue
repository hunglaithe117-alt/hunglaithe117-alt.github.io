<script setup lang="ts">
/**
 * Mobile navigation drawer (phone + tablet) — the only JS-dependent nav path.
 * Uses a native <dialog> so modal semantics — focus trap, Esc to close, inert
 * background, focus restore — come from the platform. The Astro side renders a
 * <details> fallback under <noscript>.
 */
import { onBeforeUnmount, ref, watch } from "vue";

interface NavLink {
  href: string;
  label: string;
}

defineProps<{
  links: NavLink[];
  /** Owner-supplied contact links; empty when nothing is configured. */
  contacts: NavLink[];
  labels: { menu: string; open: string; close: string };
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
  // Return focus to the toggle on close for keyboard accessibility.
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
    class="icon-btn inline-flex h-11 min-w-11 items-center justify-center text-sm text-text-muted hover:text-text desktop:hidden"
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
          class="inline-flex h-11 w-11 items-center justify-center text-text-muted hover:text-text"
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
              class="flex min-h-12 items-center px-3 text-lg hover:text-link"
              @click="hide"
              >{{ link.label }}</a
            >
          </li>
        </ul>
      </nav>

      <hr class="my-2 border-border" />

      <ul v-if="contacts.length > 0" class="flex flex-col">
        <li v-for="link in contacts" :key="link.href">
          <a
            :href="link.href"
            rel="me noopener"
            class="flex min-h-12 items-center px-3 text-sm text-text-muted hover:text-link"
            @click="hide"
            >{{ link.label }}</a
          >
        </li>
      </ul>
    </div>
  </dialog>
</template>

<style>
/* Unscoped: styles the native <dialog> + ::backdrop, which scoped selectors can't reach. */
.blog-nav-drawer {
  margin: 0 0 0 auto; /* right drawer */
  block-size: 100dvh;
  max-block-size: 100dvh;
  inline-size: min(20rem, 85vw);
  padding: 0;
  border: none;
  border-inline-start: 1px solid var(--color-border);
  background-color: var(--color-surface);
  color: var(--color-text);
  padding-inline-end: max(1rem, env(safe-area-inset-right));
  opacity: 0;
  transform: translateX(100%);
  transition:
    opacity 200ms cubic-bezier(0.2, 0, 0, 1),
    transform 240ms cubic-bezier(0.22, 1, 0.36, 1),
    display 240ms allow-discrete,
    overlay 240ms allow-discrete;
}
.blog-nav-drawer[open] {
  opacity: 1;
  transform: translateX(0);
}
@starting-style {
  .blog-nav-drawer[open] {
    opacity: 0;
    transform: translateX(100%);
  }
}
.blog-nav-drawer::backdrop {
  background-color: color-mix(in oklch, var(--color-text) 0%, transparent);
  backdrop-filter: blur(0px);
  transition:
    background-color 220ms cubic-bezier(0.2, 0, 0, 1),
    backdrop-filter 220ms cubic-bezier(0.2, 0, 0, 1),
    display 220ms allow-discrete,
    overlay 220ms allow-discrete;
}
.blog-nav-drawer[open]::backdrop {
  background-color: color-mix(in oklch, var(--color-text) 40%, transparent);
  backdrop-filter: blur(2px);
}
@starting-style {
  .blog-nav-drawer[open]::backdrop {
    background-color: color-mix(in oklch, var(--color-text) 0%, transparent);
    backdrop-filter: blur(0px);
  }
}
</style>
