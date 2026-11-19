<script setup lang="ts">
/**
 * SearchBox — Pagefind **Component UI** island (T3.3, Pagefind 1.5.2).
 *
 * Uses the 1.5.2 web components (`<pagefind-modal>`, `<pagefind-input>`, …), never the
 * legacy `PagefindUI`. The Pagefind assets are injected **client-side and lazily**:
 * nothing Pagefind-related runs at module scope, so the static build stays static and
 * the ~170 KB Component UI bundle only loads when search is actually engaged
 * (T3.2/T3.3 risk note: "must not run Pagefind at module top-level").
 *
 * Locale awareness is automatic: Pagefind reads the document language from
 * `html[lang]` (vi-VN / en-US) and selects the matching per-locale index + UI strings.
 *
 * Two modes:
 *  - `trigger` (header): a compact button that opens the modal on first activation.
 *  - `page` (the /search/ route): the inline input + summary + results.
 */
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";

interface Props {
  lang: "vi" | "en";
  mode?: "trigger" | "page";
  /** Directory holding the Pagefind bundle (default `/pagefind/`). */
  bundlePath?: string;
  placeholder: string;
  triggerLabel: string;
  loadingLabel: string;
  unavailableLabel: string;
  defaultMessage: string;
  autofocus?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  mode: "trigger",
  bundlePath: "/pagefind/",
  autofocus: false,
});

type Status = "idle" | "loading" | "ready" | "error";
const status = ref<Status>("idle");
const modalRef = ref<HTMLElement | null>(null);

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

async function ensure(openAfter = false): Promise<void> {
  if (status.value === "ready") {
    if (openAfter) await openModal();
    return;
  }
  if (status.value === "loading") return;
  status.value = "loading";
  try {
    await loadComponentUi(props.bundlePath);
    status.value = "ready";
    if (openAfter) await openModal();
  } catch {
    status.value = "error";
  }
}

async function openModal(): Promise<void> {
  await nextTick();
  const modal = modalRef.value as (HTMLElement & { open?: () => void }) | null;
  modal?.open?.();
}

function onTrigger(): void {
  void ensure(true);
}

function onKeydown(event: KeyboardEvent): void {
  if (props.mode !== "trigger") return;
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    void ensure(true);
  }
}

onMounted(() => {
  if (props.mode === "page") void ensure();
  if (props.mode === "trigger") window.addEventListener("keydown", onKeydown);
});

onBeforeUnmount(() => {
  if (props.mode === "trigger") window.removeEventListener("keydown", onKeydown);
});
</script>

<template>
  <!-- Trigger (header): our own button, Pagefind only loads on demand. -->
  <template v-if="mode === 'trigger'">
    <button
      type="button"
      class="icon-btn inline-flex h-11 min-w-11 items-center justify-center gap-1.5 text-sm text-text-muted hover:text-text"
      :aria-label="triggerLabel"
      aria-haspopup="dialog"
      @click="onTrigger"
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
    <pagefind-modal v-if="status === 'ready'" ref="modalRef" />
  </template>

  <!-- Inline (search page): the building-block components. -->
  <div v-else class="search-inline">
    <p v-if="status === 'loading'" class="text-sm text-text-muted" role="status">
      {{ loadingLabel }}
    </p>
    <p
      v-else-if="status === 'error'"
      class="border border-border bg-surface p-4 text-sm text-text-muted"
      role="status"
    >
      {{ unavailableLabel }}
    </p>
    <template v-else-if="status === 'ready'">
      <pagefind-config :bundle-path="bundlePath" />
      <pagefind-input :placeholder="placeholder" v-bind="autofocus ? { autofocus: true } : {}" />
      <pagefind-summary
        :default-message="defaultMessage"
        class="mt-3 block text-sm text-text-muted"
      />
      <pagefind-results class="mt-4 block" />
    </template>
  </div>
</template>
