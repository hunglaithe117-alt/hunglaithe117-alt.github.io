<script setup lang="ts">
/**
 * SearchBox — Pagefind **Component UI** header dropdown island (Pagefind 1.5.2).
 *
 * Uses the 1.5.2 web components (`<pagefind-config>`, `<pagefind-input>`,
 * `<pagefind-summary>`, `<pagefind-results>`). Pagefind assets are injected
 * **client-side and lazily** on first open so the ~170 KB bundle only loads
 * when search is actually engaged.
 *
 * Locale awareness is automatic: Pagefind reads `html[lang]` (vi-VN / en-US).
 */
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";

interface Props {
  lang: "vi" | "en";
  /** Directory holding the Pagefind bundle (default `/pagefind/`). */
  bundlePath?: string;
  placeholder: string;
  triggerLabel: string;
  loadingLabel: string;
  unavailableLabel: string;
  defaultMessage: string;
}

const props = withDefaults(defineProps<Props>(), {
  bundlePath: "/pagefind/",
});

type Status = "idle" | "loading" | "ready" | "error";
const status = ref<Status>("idle");
const isOpen = ref(false);
const hasOpened = ref(false);
const rootRef = ref<HTMLElement | null>(null);
const triggerRef = ref<HTMLButtonElement | null>(null);
const dropdownRef = ref<HTMLElement | null>(null);

/** One shared loader so multiple islands never inject the bundle twice. */
let uiPromise: Promise<void> | null = null;

function loadComponentUi(bundlePath: string): Promise<void> {
  uiPromise ??= new Promise<void>((resolve, reject) => {
    if (document.getElementById("pagefind-ui-js")) {
      resolve();
      return;
    }
    if (!document.getElementById("pagefind-ui-css")) {
      const link = document.createElement("link");
      link.id = "pagefind-ui-css";
      link.rel = "stylesheet";
      link.href = `${bundlePath}pagefind-component-ui.css`;
      document.head.appendChild(link);
    }
    const script = document.createElement("script");
    script.id = "pagefind-ui-js";
    script.type = "module";
    script.src = `${bundlePath}pagefind-component-ui.js`;
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error("Pagefind UI failed to load")), {
      once: true,
    });
    document.head.appendChild(script);
  });
  return uiPromise;
}

async function focusInput(): Promise<void> {
  await nextTick();
  // Wait a microtask/frame for the custom element to upgrade its internal <input>
  requestAnimationFrame(() => {
    const input = dropdownRef.value?.querySelector<HTMLInputElement>("pagefind-input input");
    input?.focus();
  });
}

async function ensure(): Promise<void> {
  if (status.value === "ready") {
    await focusInput();
    return;
  }
  if (status.value === "loading") return;
  status.value = "loading";
  try {
    await loadComponentUi(props.bundlePath);
    status.value = "ready";
    if (isOpen.value) await focusInput();
  } catch {
    status.value = "error";
  }
}

function openDropdown(): void {
  hasOpened.value = true;
  isOpen.value = true;
  void ensure();
}

function closeDropdown(restoreFocus = false): void {
  if (!isOpen.value) return;
  isOpen.value = false;
  if (restoreFocus) triggerRef.value?.focus();
}

function toggleDropdown(): void {
  if (isOpen.value) {
    closeDropdown(false);
  } else {
    openDropdown();
  }
}

function onKeydown(event: KeyboardEvent): void {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    if (isOpen.value) {
      closeDropdown(true);
    } else {
      openDropdown();
    }
    return;
  }
  if (event.key === "Escape" && isOpen.value) {
    event.preventDefault();
    closeDropdown(true);
  }
}

function onPointerDown(event: PointerEvent): void {
  if (!isOpen.value) return;
  const target = event.target as Node | null;
  if (target && rootRef.value && !rootRef.value.contains(target)) {
    closeDropdown(false);
  }
}

watch(status, (next) => {
  if (next === "ready" && isOpen.value) {
    void focusInput();
  }
});

onMounted(() => {
  window.addEventListener("keydown", onKeydown);
  document.addEventListener("pointerdown", onPointerDown);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeydown);
  document.removeEventListener("pointerdown", onPointerDown);
});
</script>

<template>
  <div ref="rootRef" class="relative">
    <button
      ref="triggerRef"
      type="button"
      class="icon-btn inline-flex h-11 min-w-11 items-center justify-center gap-1.5 text-sm text-text-muted hover:text-text"
      :aria-label="triggerLabel"
      :aria-expanded="isOpen"
      aria-controls="header-search-dropdown"
      @click="toggleDropdown"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.6-3.6" />
      </svg>
    </button>

    <Transition name="search-dropdown">
      <div
        v-if="hasOpened"
        v-show="isOpen"
        id="header-search-dropdown"
        ref="dropdownRef"
        role="region"
        :aria-label="triggerLabel"
        class="search-dropdown fixed inset-x-4 top-[calc(var(--header-h)+0.5rem)] z-50 border border-border bg-bg p-3 shadow-lg desktop:absolute desktop:inset-x-auto desktop:end-0 desktop:top-[calc(100%+0.5rem)] desktop:w-[26rem]"
      >
        <p v-if="status === 'loading'" class="py-2 text-sm text-text-muted" role="status">
          {{ loadingLabel }}
        </p>
        <p
          v-else-if="status === 'error'"
          class="border border-border bg-surface p-3 text-sm text-text-muted"
          role="status"
        >
          {{ unavailableLabel }}
        </p>
        <template v-else-if="status === 'ready'">
          <pagefind-config :bundle-path="bundlePath" />
          <pagefind-input :placeholder="placeholder" />
          <pagefind-summary
            :default-message="defaultMessage"
            class="mt-2 block text-xs text-text-muted"
          />
          <pagefind-results class="mt-3 block max-h-[60dvh] overflow-y-auto" />
        </template>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.search-dropdown {
  --pf-input-height: 42px;
}

.search-dropdown-enter-active,
.search-dropdown-leave-active {
  transition:
    opacity 160ms cubic-bezier(0.2, 0, 0, 1),
    transform 160ms cubic-bezier(0.2, 0, 0, 1);
}

.search-dropdown-enter-from,
.search-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
}
</style>
