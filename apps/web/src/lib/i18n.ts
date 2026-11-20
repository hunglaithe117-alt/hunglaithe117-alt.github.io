/**
 * Bilingual (EN default + VI) routing and UI strings.
 *
 * The dictionary is type-enforced (`satisfies`) so missing keys fail `astro check`.
 */

export const LOCALES = ["en", "vi"] as const;
export type Lang = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Lang = "en";

/** BCP-47 tag for `html[lang]`, `hreflang` and OG `og:locale`. */
export const HTML_LANG: Record<Lang, string> = { vi: "vi-VN", en: "en-US" };

/** RSS 2.0 `<language>` uses bare ISO codes. */
export const FEED_LANG: Record<Lang, string> = { vi: "vi", en: "en" };

/** Locale display names for the language switcher. */
export const LOCALE_LABEL: Record<Lang, string> = { vi: "Tiếng Việt", en: "English" };

/** Short locale codes for the compact header switcher. */
export const LOCALE_SHORT: Record<Lang, string> = { vi: "VI", en: "EN" };

/** Type-enforced UI dictionary — one entry per locale, no missing keys. */
export const UI = {
  vi: {
    siteTitle: "Chuquanpho29",
    siteDescription: "Notes on work and everyday life.",
    skipToContent: "Chuyển đến nội dung",
    posts: "Bài viết",
    about: "Giới thiệu",
    tags: "Thẻ",
    search: "Tìm kiếm",
    menu: "Menu",
    openMenu: "Mở menu",
    closeMenu: "Đóng menu",
    languageSwitcher: "Ngôn ngữ",
    changeLanguage: "Đổi ngôn ngữ",
    themeToggle: "Đổi chế độ sáng/tối",
    rssFeed: "RSS",
    contact: "Liên hệ",
    readingTime: (minutes: number) => `${minutes} phút đọc`,
    publishedOn: "Đăng ngày",
    updatedOn: "Cập nhật",
    noPosts: "Chưa có bài viết.",
    notFoundTitle: "Không tìm thấy trang",
    notFoundBody: "Trang bạn tìm không tồn tại hoặc đã được di chuyển.",
    notFoundCta: "Về trang chủ",
    // Post index + archive
    postsTitle: "Bài viết",
    postsLead: "Tất cả ghi chú, bài mới nhất ở trên cùng.",
    allPosts: "Tất cả bài viết",
    browseByTag: "Duyệt theo thẻ",
    // Tags
    tagsTitle: "Thẻ",
    tagsLead: "Lọc ghi chú theo chủ đề.",
    noTags: "Chưa có thẻ nào.",
    tagCount: (n: number) => `${n} bài`,
    postsWithTag: (tag: string) => `Bài viết với thẻ “${tag}”`,
    tagFeedLabel: "Nguồn cấp cho thẻ",
    tagFilters: "Bộ lọc theo thẻ",
    // Article
    tocTitle: "Trong bài này",
    prevPost: "Bài trước",
    nextPost: "Bài tiếp theo",
    backToPosts: "Tất cả bài viết",
    relatedPosts: "Bài cùng chủ đề",
    // Search
    searchTitle: "Tìm kiếm",
    searchLead: "Tìm trong toàn bộ trang.",
    searchPlaceholder: "Nhập từ khoá để tìm…",
    searchDefaultMessage: "Nhập để tìm bài viết.",
    searchLoading: "Đang tải tìm kiếm…",
    searchUnavailable:
      "Tìm kiếm chưa khả dụng trong bản dựng này. Nó xuất hiện sau khi trang được lập chỉ mục.",
    searchNoJs: "Bật JavaScript để dùng tìm kiếm, hoặc ",
    // Feeds
    // About / portfolio
    aboutTitle: "Giới thiệu",
    aboutLead: "",
  },
  en: {
    siteTitle: "Chuquanpho29",
    siteDescription: "Notes on the web, tools and everyday life.",
    skipToContent: "Skip to content",
    posts: "Posts",
    about: "About",
    tags: "Tags",
    search: "Search",
    menu: "Menu",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    languageSwitcher: "Language",
    changeLanguage: "Change language",
    themeToggle: "Toggle light/dark theme",
    rssFeed: "RSS",
    contact: "Contact",
    readingTime: (minutes: number) => `${minutes} min read`,
    publishedOn: "Published",
    updatedOn: "Updated",
    noPosts: "No posts yet.",
    notFoundTitle: "Page not found",
    notFoundBody: "The page you requested does not exist or has moved.",
    notFoundCta: "Back to home",
    // Post index + archive
    postsTitle: "Posts",
    postsLead: "Every note, newest at the top.",
    allPosts: "All posts",
    browseByTag: "Browse by tag",
    // Tags
    tagsTitle: "Tags",
    tagsLead: "Browse notes by topic.",
    noTags: "No tags yet.",
    tagCount: (n: number) => `${n} post${n === 1 ? "" : "s"}`,
    postsWithTag: (tag: string) => `Posts tagged “${tag}”`,
    tagFeedLabel: "Feed for this tag",
    tagFilters: "Filter by tag",
    // Article
    tocTitle: "On this page",
    prevPost: "Previous",
    nextPost: "Next",
    backToPosts: "All posts",
    relatedPosts: "Related posts",
    // Search
    searchTitle: "Search",
    searchLead: "Search across the whole page.",
    searchPlaceholder: "Type to search…",
    searchDefaultMessage: "Start typing to search.",
    searchLoading: "Loading search…",
    searchUnavailable:
      "Search isn't available in this build yet. It appears once the site has been indexed.",
    searchNoJs: "Enable JavaScript to use search, or ",
    // Feeds
    // About / portfolio
    aboutTitle: "About",
    aboutLead: "",
  },
} as const satisfies Record<Lang, Record<string, unknown>>;

export type UIStrings = (typeof UI)[Lang];

/** Returns the UI dictionary for a locale. */
export function useTranslations(lang: Lang): UIStrings {
  return UI[lang];
}

/** Type guard for an arbitrary route segment. */
export function isLang(value: string | undefined): value is Lang {
  return value === "vi" || value === "en";
}

/**
 * Content ids are locale-foldered (`vi/hello-world`). The post route re-exposes
 * the part after the locale prefix as the URL slug.
 */
export function postSlug(id: string): string {
  const [, ...rest] = id.split("/");
  return rest.join("/");
}

export function getLangFromId(id: string): Lang {
  const first = id.split("/")[0];
  return isLang(first) ? first : DEFAULT_LOCALE;
}

/** Canonical path for a post, shared by pages, feeds and hreflang alternates. */
export function postPath(lang: Lang, slug: string): string {
  return `/${lang}/posts/${slug}`;
}

/** Canonical path for the locale home page. */
export function homePath(lang: Lang): string {
  return lang === DEFAULT_LOCALE ? "/" : `/${lang}/`;
}

/** Post index for a locale. */
export function postsPath(lang: Lang): string {
  return `/${lang}/posts/`;
}

/** Tag index for a locale. */
export function tagsPath(lang: Lang): string {
  return `/${lang}/tags/`;
}

/** Per-tag listing for a locale. */
export function tagPath(lang: Lang, tag: string): string {
  return `/${lang}/tags/${encodeURIComponent(tag)}/`;
}

/** Per-tag RSS feed for a locale. */
export function tagFeedPath(lang: Lang, tag: string): string {
  return `/${lang}/tags/${encodeURIComponent(tag)}/rss.xml`;
}

export function aboutPath(lang: Lang): string {
  return `/${lang}/about/`;
}

export function rssPath(lang: Lang): string {
  return `/${lang}/rss.xml`;
}

export function jsonFeedPath(lang: Lang): string {
  return `/${lang}/feed.json`;
}

/** Fully-qualified URL for a root-relative path. */
export function absoluteUrl(site: URL | string, path: string): string {
  const base = new URL(site instanceof URL ? site.href : site);
  return new URL(path, base).href;
}
