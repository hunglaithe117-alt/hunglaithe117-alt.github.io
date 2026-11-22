/** Giscus (GitHub Discussions) config; blank IDs hide the comments section. */

export interface GiscusConfig {
  repo: string;
  repoId: string;
  category: string;
  categoryId: string;
  strict: "0" | "1";
  reactionsEnabled: "0" | "1";
  emitMetadata: "0" | "1";
  inputPosition: "top" | "bottom";
  themes: { light: string; dark: string };
}

export const GISCUS_CONFIG: GiscusConfig = {
  repo: "hunglaithe117-alt/hunglaithe117-alt.github.io",
  repoId: "R_kgDOVImRRw",
  category: "Announcements",
  categoryId: "DIC_kwDOVImRR84DLtFr",
  strict: "1",
  reactionsEnabled: "1",
  emitMetadata: "0",
  inputPosition: "top",
  themes: { light: "noborder_light", dark: "noborder_dark" },
};

export function isCommentsEnabled(config: GiscusConfig = GISCUS_CONFIG): boolean {
  return [config.repo, config.repoId, config.category, config.categoryId].every(
    (value) => value.trim() !== "",
  );
}

export function resolveDiscussionTerm(input: { translationKey?: string; slug: string }): string {
  const key = input.translationKey?.trim();
  return key ? key : input.slug;
}

export function giscusThemeFor(
  theme: "light" | "dark",
  themes: GiscusConfig["themes"] = GISCUS_CONFIG.themes,
): string {
  return theme === "dark" ? themes.dark : themes.light;
}

export function discussionsUrl(repo: string): string {
  return `https://github.com/${repo}/discussions`;
}
