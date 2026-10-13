<script setup lang="ts">
/**
 * ContactForm — the contact page's Vue island (T3.3). The sending backend arrives in
 * Phase 5, so this build validates client-side and then either POSTs to `endpoint`
 * (when one is configured) or stores the payload locally (a conscious no-op).
 *
 * Design/UX rules applied: single column, labels above inputs, required/optional
 * marked, helper text above, errors below and wired with `aria-describedby`, no
 * placeholder-as-label, ≥44 px targets, visible focus (DESIGN-SYSTEM §5, skill
 * `effective-ui-design` §Forms).
 */
import { computed, reactive, ref } from "vue";

interface Labels {
  name: string;
  email: string;
  subject: string;
  message: string;
  required: string;
  optional: string;
  send: string;
  sending: string;
  nameRequired: string;
  emailRequired: string;
  emailInvalid: string;
  messageRequired: string;
  messageShort: string;
  honeypot: string;
  privacy: string;
  received: string;
  noBackend: string;
}

interface Props {
  lang: "vi" | "en";
  labels: Labels;
  /** Phase 5 endpoint (e.g. `/api/contact`). Omit to run in no-op mode. */
  endpoint?: string;
}

const props = defineProps<Props>();

const form = reactive({
  name: "",
  email: "",
  subject: "",
  message: "",
  website: "", // honeypot — real users never see or fill this
});

type Errors = Partial<Record<"name" | "email" | "message", string>>;
const errors = reactive<Errors>({});
const touched = reactive({ name: false, email: false, message: false });
const status = ref<"idle" | "sending" | "sent" | "noop" | "error">("idle");

const nameEl = ref<HTMLInputElement | null>(null);
const emailEl = ref<HTMLInputElement | null>(null);
const messageEl = ref<HTMLTextAreaElement | null>(null);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateField(field: "name" | "email" | "message"): string | undefined {
  const l = props.labels;
  if (field === "name") return form.name.trim() ? undefined : l.nameRequired;
  if (field === "email") {
    if (!form.email.trim()) return l.emailRequired;
    return EMAIL_RE.test(form.email.trim()) ? undefined : l.emailInvalid;
  }
  if (!form.message.trim()) return l.messageRequired;
  return form.message.trim().length >= 10 ? undefined : l.messageShort;
}

function revalidate(field: "name" | "email" | "message"): void {
  if (!touched[field]) return;
  const message = validateField(field);
  if (message) errors[field] = message;
  else delete errors[field];
}

const isValid = computed(
  () => !validateField("name") && !validateField("email") && !validateField("message"),
);

function focusFirstError(): void {
  if (errors.name) nameEl.value?.focus();
  else if (errors.email) emailEl.value?.focus();
  else if (errors.message) messageEl.value?.focus();
}

async function onSubmit(): Promise<void> {
  touched.name = touched.email = touched.message = true;
  errors.name = validateField("name");
  errors.email = validateField("email");
  errors.message = validateField("message");
  if (errors.name || errors.email || errors.message) {
    focusFirstError();
    return;
  }
  // Honeypot: silently accept and drop.
  if (form.website) {
    status.value = "noop";
    return;
  }

  const payload = {
    name: form.name.trim(),
    email: form.email.trim(),
    subject: form.subject.trim(),
    message: form.message.trim(),
    lang: props.lang,
  };

  if (props.endpoint) {
    status.value = "sending";
    try {
      const res = await fetch(props.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      status.value = res.ok ? "sent" : "error";
    } catch {
      status.value = "error";
    }
    if (status.value === "sent") reset();
    return;
  }

  // No backend yet (Phase 5). Keep the payload locally rather than pretend it sent.
  try {
    const key = "contact-outbox";
    const existing = JSON.parse(localStorage.getItem(key) ?? "[]") as unknown[];
    existing.push({ ...payload, at: new Date().toISOString() });
    localStorage.setItem(key, JSON.stringify(existing));
  } catch {
    /* storage unavailable (private mode) — still acknowledge below */
  }
  status.value = "noop";
  reset();
}

function reset(): void {
  form.name = form.email = form.subject = form.message = form.website = "";
  touched.name = touched.email = touched.message = false;
  errors.name = errors.email = errors.message = undefined;
}

const errorFor = (field: "name" | "email" | "message"): string | undefined =>
  touched[field] ? errors[field] : undefined;

const inputClass =
  "min-h-11 w-full rounded-sm border border-border-strong bg-surface-raised px-3 py-2 text-base text-text transition-colors duration-fast ease-standard aria-[invalid=true]:border-danger";
const labelClass = "block text-sm font-medium text-text";
</script>

<template>
  <form class="measure" novalidate @submit.prevent="onSubmit">
    <!-- Name -->
    <div class="mb-6">
      <label :class="labelClass" for="contact-name">
        {{ labels.name }}
        <span class="text-xs font-normal text-text-muted">({{ labels.required }})</span>
      </label>
      <input
        id="contact-name"
        ref="nameEl"
        v-model="form.name"
        type="text"
        name="name"
        autocomplete="name"
        required
        :class="`mt-2 ${inputClass}`"
        :aria-invalid="Boolean(errorFor('name'))"
        :aria-describedby="errorFor('name') ? 'contact-name-error' : undefined"
        @blur="((touched.name = true), revalidate('name'))"
      />
      <p v-if="errorFor('name')" id="contact-name-error" class="mt-1.5 text-sm text-danger">
        {{ errorFor("name") }}
      </p>
    </div>

    <!-- Email -->
    <div class="mb-6">
      <label :class="labelClass" for="contact-email">
        {{ labels.email }}
        <span class="text-xs font-normal text-text-muted">({{ labels.required }})</span>
      </label>
      <input
        id="contact-email"
        ref="emailEl"
        v-model="form.email"
        type="email"
        name="email"
        autocomplete="email"
        inputmode="email"
        required
        :class="`mt-2 ${inputClass}`"
        :aria-invalid="Boolean(errorFor('email'))"
        :aria-describedby="errorFor('email') ? 'contact-email-error' : undefined"
        @blur="((touched.email = true), revalidate('email'))"
      />
      <p v-if="errorFor('email')" id="contact-email-error" class="mt-1.5 text-sm text-danger">
        {{ errorFor("email") }}
      </p>
    </div>

    <!-- Subject (optional) -->
    <div class="mb-6">
      <label :class="labelClass" for="contact-subject">
        {{ labels.subject }}
        <span class="text-xs font-normal text-text-muted">({{ labels.optional }})</span>
      </label>
      <input
        id="contact-subject"
        v-model="form.subject"
        type="text"
        name="subject"
        :class="`mt-2 ${inputClass}`"
      />
    </div>

    <!-- Message -->
    <div class="mb-6">
      <label :class="labelClass" for="contact-message">
        {{ labels.message }}
        <span class="text-xs font-normal text-text-muted">({{ labels.required }})</span>
      </label>
      <textarea
        id="contact-message"
        ref="messageEl"
        v-model="form.message"
        name="message"
        rows="6"
        required
        :class="`mt-2 ${inputClass}`"
        :aria-invalid="Boolean(errorFor('message'))"
        :aria-describedby="errorFor('message') ? 'contact-message-error' : undefined"
        @blur="((touched.message = true), revalidate('message'))"
      ></textarea>
      <p v-if="errorFor('message')" id="contact-message-error" class="mt-1.5 text-sm text-danger">
        {{ errorFor("message") }}
      </p>
    </div>

    <!-- Honeypot: visually hidden, removed from the a11y tree and tab order -->
    <div class="sr-only" aria-hidden="true">
      <label for="contact-website">{{ labels.honeypot }}</label>
      <input
        id="contact-website"
        v-model="form.website"
        type="text"
        name="website"
        tabindex="-1"
        autocomplete="off"
      />
    </div>

    <p class="mb-4 text-sm text-text-muted">{{ labels.privacy }}</p>

    <button
      type="submit"
      class="on-fill inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-primary px-5 text-base font-semibold text-on-primary no-underline transition-transform duration-instant ease-standard hover:opacity-95 active:scale-[0.98] disabled:opacity-60"
      :disabled="status === 'sending'"
    >
      <svg
        v-if="status === 'sending'"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
      >
        <path d="M21 12a9 9 0 1 1-6.2-8.6" />
      </svg>
      {{ status === "sending" ? labels.sending : labels.send }}
    </button>

    <!-- Status region -->
    <p
      v-if="status === 'sent'"
      class="mt-4 flex items-start gap-2 text-sm text-success"
      role="status"
      aria-live="polite"
    >
      {{ labels.received }}
    </p>
    <p
      v-else-if="status === 'noop'"
      class="mt-4 rounded-md border border-border bg-surface p-3 text-sm text-text-muted"
      role="status"
      aria-live="polite"
    >
      {{ labels.noBackend }}
    </p>
    <p v-else-if="status === 'error'" class="mt-4 text-sm text-danger" role="alert">
      {{ labels.noBackend }}
    </p>
  </form>
</template>
