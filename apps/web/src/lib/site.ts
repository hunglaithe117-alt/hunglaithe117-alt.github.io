/**
 * Identity and contact links — the one file to edit when the owner supplies details.
 *
 * Empty values are omitted from the UI rather than rendered as dead links, so the
 * site ships honestly and a filled value appears everywhere at once (header, about,
 * footer). Order is fixed: GitHub, LinkedIn, Email.
 */

export interface ContactLink {
  /** Platform key used to pick an icon when needed. */
  kind: "github" | "linkedin" | "email";
  /** Visible label. */
  label: string;
  /** Absolute URL, or a `mailto:` URI for email. */
  href: string;
}

export const SITE: {
  /** Shown in the header, the home heading, feeds and the page title. */
  name: string;
  /** e.g. `you@example.com`. Empty hides the email link. */
  email: string;
  /** e.g. `https://github.com/your-handle`. Empty hides the GitHub link. */
  github: string;
  /** e.g. `https://www.linkedin.com/in/your-handle`. Empty hides the LinkedIn link. */
  linkedin: string;
} = {
  name: "Chuquanpho29",
  email: "hunglaithe117@gmail.com",
  github: "https://github.com/hunglaithe117-alt",
  linkedin: "",
};

/** Contact links that have a value, in display order. */
export function contactLinks(): ContactLink[] {
  const links: ContactLink[] = [];
  if (SITE.github) links.push({ kind: "github", label: "GitHub", href: SITE.github });
  if (SITE.linkedin) links.push({ kind: "linkedin", label: "LinkedIn", href: SITE.linkedin });
  if (SITE.email) links.push({ kind: "email", label: SITE.email, href: `mailto:${SITE.email}` });
  return links;
}
