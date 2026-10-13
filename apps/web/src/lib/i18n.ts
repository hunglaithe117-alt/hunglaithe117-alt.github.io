/**
 * Bilingual (VI primary + EN) routing + UI strings (D-019/D-026).
 *
 * Both locales are URL-prefixed (`/vi/...`, `/en/...`) so routes, feeds and
 * hreflang alternates are symmetric (D-038). Locale is chosen via a plain `<a>`
 * language switcher — no server CMS/TMS (D-026).
 *
 * The dictionary is type-enforced (`satisfies`) so a missing key in either locale
 * fails `astro check` rather than shipping an untranslated fallback.
 */

export const LOCALES = ["vi", "en"] as const;
export type Lang = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Lang = "vi";

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
    siteTitle: "Ghi chú của tôi",
    siteDescription: "Vườn chữ cá nhân: ghi chú về web, công cụ và đời sống thường ngày.",
    skipToContent: "Chuyển đến nội dung",
    home: "Trang chủ",
    posts: "Bài viết",
    about: "Giới thiệu",
    contact: "Liên hệ",
    tags: "Thẻ",
    search: "Tìm kiếm",
    menu: "Menu",
    openMenu: "Mở menu",
    closeMenu: "Đóng menu",
    languageSwitcher: "Ngôn ngữ",
    changeLanguage: "Đổi ngôn ngữ",
    themeToggle: "Đổi chế độ sáng/tối",
    rssFeed: "RSS",
    jsonFeed: "JSON Feed",
    readingTime: (minutes: number) => `${minutes} phút đọc`,
    publishedOn: "Đăng ngày",
    updatedOn: "Cập nhật",
    latestPosts: "Bài mới nhất",
    noPosts: "Chưa có bài viết.",
    notFoundTitle: "Không tìm thấy trang",
    notFoundBody: "Trang bạn tìm không tồn tại hoặc đã được di chuyển.",
    notFoundCta: "Về trang chủ",
    // Post index + archive
    postsTitle: "Bài viết",
    postsLead: "Tất cả ghi chú, bài mới nhất ở trên cùng.",
    allPosts: "Tất cả bài viết",
    viewAllPosts: "Xem tất cả bài viết",
    browseByTag: "Duyệt theo thẻ",
    readMore: "Đọc tiếp",
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
    searchLead: "Tìm trong toàn bộ khu vườn. Kết quả hiện ngay khi bạn gõ.",
    searchPlaceholder: "Nhập từ khoá để tìm…",
    searchOpen: "Mở tìm kiếm",
    searchDefaultMessage: "Nhập để tìm bài viết.",
    searchLoading: "Đang tải tìm kiếm…",
    searchUnavailable:
      "Tìm kiếm chưa khả dụng trong bản dựng này. Nó xuất hiện sau khi trang được lập chỉ mục.",
    searchNoJs: "Bật JavaScript để dùng tìm kiếm, hoặc ",
    // Feeds
    feedsTitle: "Nguồn cấp",
    feedsLead: "Theo dõi khu vườn qua trình đọc tin.",
    // About / portfolio
    aboutTitle: "Giới thiệu",
    aboutLead: "Một khu vườn chữ nhỏ, giữ đơn giản để đọc lâu dài.",
    focusTitle: "Tôi viết về",
    timelineTitle: "Dấu mốc",
    projectsTitle: "Dự án",
    present: "hiện tại",
    // Contact
    contactTitle: "Liên hệ",
    contactLead: "Có điều gì muốn trao đổi? Gửi cho tôi một tin nhắn.",
    contactExpectTitle: "Bạn có thể mong đợi",
    emailLabel: "Thư điện tử",
    // Contact form
    formName: "Tên",
    formEmail: "Thư điện tử",
    formSubject: "Tiêu đề",
    formMessage: "Nội dung",
    formRequired: "bắt buộc",
    formOptional: "không bắt buộc",
    formSend: "Gửi tin nhắn",
    formSending: "Đang gửi…",
    formNameRequired: "Vui lòng cho biết tên của bạn.",
    formEmailRequired: "Vui lòng nhập thư điện tử.",
    formEmailInvalid: "Thư điện tử này chưa hợp lệ.",
    formMessageRequired: "Vui lòng nhập nội dung.",
    formMessageShort: "Nội dung hơi ngắn — thêm vài chữ nhé.",
    formHoneypot: "Đừng điền vào ô này",
    formPrivacy: "Thư điện tử chỉ dùng để trả lời bạn, không dùng cho việc khác.",
    formReceived: "Đã nhận nội dung. Cảm ơn bạn đã viết!",
    formNoBackend:
      "Biểu mẫu chưa nối với dịch vụ gửi thư — phần này sẽ có ở giai đoạn sau. Nội dung của bạn chỉ được giữ tạm trên trình duyệt.",
    formDevNote: "Bản dựng hiện tại chưa gửi thư đi.",
  },
  en: {
    siteTitle: "Field notes",
    siteDescription: "A personal garden of notes on the web, tools and everyday life.",
    skipToContent: "Skip to content",
    home: "Home",
    posts: "Posts",
    about: "About",
    contact: "Contact",
    tags: "Tags",
    search: "Search",
    menu: "Menu",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    languageSwitcher: "Language",
    changeLanguage: "Change language",
    themeToggle: "Toggle light/dark theme",
    rssFeed: "RSS",
    jsonFeed: "JSON Feed",
    readingTime: (minutes: number) => `${minutes} min read`,
    publishedOn: "Published",
    updatedOn: "Updated",
    latestPosts: "Latest posts",
    noPosts: "No posts yet.",
    notFoundTitle: "Page not found",
    notFoundBody: "The page you requested does not exist or has moved.",
    notFoundCta: "Back to home",
    // Post index + archive
    postsTitle: "Posts",
    postsLead: "Every note, newest at the top.",
    allPosts: "All posts",
    viewAllPosts: "View all posts",
    browseByTag: "Browse by tag",
    readMore: "Read more",
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
    searchLead: "Search across the whole garden. Results appear as you type.",
    searchPlaceholder: "Type to search…",
    searchOpen: "Open search",
    searchDefaultMessage: "Start typing to search.",
    searchLoading: "Loading search…",
    searchUnavailable:
      "Search isn't available in this build yet. It appears once the site has been indexed.",
    searchNoJs: "Enable JavaScript to use search, or ",
    // Feeds
    feedsTitle: "Feeds",
    feedsLead: "Follow the garden in your reader.",
    // About / portfolio
    aboutTitle: "About",
    aboutLead: "A small garden of notes, kept simple so it reads well over time.",
    focusTitle: "What I write about",
    timelineTitle: "Milestones",
    projectsTitle: "Projects",
    present: "now",
    // Contact
    contactTitle: "Contact",
    contactLead: "Something to talk about? Send me a note.",
    contactExpectTitle: "What to expect",
    emailLabel: "Email",
    // Contact form
    formName: "Name",
    formEmail: "Email",
    formSubject: "Subject",
    formMessage: "Message",
    formRequired: "required",
    formOptional: "optional",
    formSend: "Send message",
    formSending: "Sending…",
    formNameRequired: "Please tell me your name.",
    formEmailRequired: "Please enter your email.",
    formEmailInvalid: "That email doesn't look right.",
    formMessageRequired: "Please write a message.",
    formMessageShort: "A little more detail, please.",
    formHoneypot: "Leave this field empty",
    formPrivacy: "Your email is used only to reply, nothing else.",
    formReceived: "Got it — thanks for writing!",
    formNoBackend:
      "This form isn't connected to a sending service yet — that arrives in a later phase. Your message is only kept locally in your browser for now.",
    formDevNote: "This build doesn't send email yet.",
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
  return `/${lang}/`;
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

export function contactPath(lang: Lang): string {
  return `/${lang}/contact/`;
}

export function searchPath(lang: Lang): string {
  return `/${lang}/search/`;
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
