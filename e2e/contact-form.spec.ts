/**
 * Contact form client behaviour (T6.1) — REAL island, STUBBED `/api/contact`.
 *
 * The `ContactForm` Vue island in `packages/ui/src/ContactForm.vue` is the real
 * shipped code. Its outbound request is intercepted (`page.route`) so the tests
 * assert the exact wire contract and the UI's reaction to canned responses,
 * without a deployed API or email service.
 */
import { expect, test } from "./fixtures";

async function openContactForm(page: import("@playwright/test").Page): Promise<void> {
  await page.goto("/en/contact/");
  // The island is `client:visible`; bring it into the viewport to hydrate.
  await page.locator("#contact-name").scrollIntoViewIfNeeded();
  await expect(page.locator("#contact-name")).toBeVisible();
}

const VALID = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  body: "Hello there, this is a long enough message.",
};

test.describe("contact form (real island, stubbed API)", () => {
  test("test_contact_valid_submission_posts_contract_and_confirms", async ({ page, api }) => {
    await openContactForm(page);

    await page.fill("#contact-name", VALID.name);
    await page.fill("#contact-email", VALID.email);
    await page.fill("#contact-message", VALID.body);
    await page.getByRole("button", { name: "Send message" }).click();

    // Exactly one request, POSTed to /api/contact with the ContactRequest shape.
    await expect.poll(() => api.contact.length).toBe(1);
    const sent = api.contact[0]!;
    expect(sent.method).toBe("POST");
    expect(new URL(sent.url).pathname).toBe("/api/contact");
    expect(sent.body).toEqual({ name: VALID.name, email: VALID.email, body: VALID.body });

    // A 2xx response is handled as success.
    await expect(page.getByText("Got it — thanks for writing!")).toBeVisible();
  });

  test("test_contact_invalid_email_blocks_request_and_shows_error", async ({ page, api }) => {
    await openContactForm(page);

    await page.fill("#contact-name", VALID.name);
    await page.fill("#contact-email", "not-an-email");
    await page.fill("#contact-message", VALID.body);
    await page.getByRole("button", { name: "Send message" }).click();

    // Client-side validation stops the request before it leaves the browser.
    await expect(page.getByText("That email doesn't look right.")).toBeVisible();
    await expect(page.locator("#contact-email")).toHaveAttribute("aria-invalid", "true");
    expect(api.contact).toHaveLength(0);
  });

  test("test_contact_server_error_surfaces_failure_not_success", async ({ page, api }) => {
    api.contactStatus = 500;
    await openContactForm(page);

    await page.fill("#contact-name", VALID.name);
    await page.fill("#contact-email", VALID.email);
    await page.fill("#contact-message", VALID.body);
    await page.getByRole("button", { name: "Send message" }).click();

    // The request still goes out; the non-2xx response must not read as success.
    await expect.poll(() => api.contact.length).toBe(1);
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page.getByText("Got it — thanks for writing!")).toHaveCount(0);
  });
});
