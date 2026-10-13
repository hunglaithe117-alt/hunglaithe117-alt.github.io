/**
 * Bilingual copy for the About and Contact pages (T3.3).
 *
 * The `posts` collection covers articles only; About/Contact are static page copy
 * (CONTENT-INVENTORY.md left this open, and no `pages` collection exists yet). Copy
 * lives here, typed per locale, so both languages stay in lock-step.
 *
 * PLACEHOLDER POLICY (CONTENT-INVENTORY.md — "the author has no real content yet"):
 * every value that would be a personal claim (name, history, links) is a grounded
 * stand-in, tagged with `placeholder: true` / an inline comment. Nothing here asserts
 * a fact about the author; the timeline describes *this site's* build, which is real.
 * Real copy replaces these before go-live.
 */
import type { Lang } from "./i18n";
import { SITE_AUTHOR } from "../consts";

export interface FocusItem {
  title: string;
  body: string;
}

export interface TimelineItem {
  /** Short label shown on the rail (year or range). */
  period: string;
  title: string;
  body: string;
}

export interface ProjectItem {
  name: string;
  summary: string;
  tags: string[];
  /** Internal or external link; omitted when there is nothing truthful to link to. */
  href?: string;
}

export interface AboutContent {
  /** Display name — PLACEHOLDER until the author supplies the real one. */
  name: string;
  role: string;
  intro: string[];
  focus: FocusItem[];
  timeline: TimelineItem[];
  projects: ProjectItem[];
}

export interface ContactContent {
  intro: string[];
  expect: string[];
  /** Contact address — PLACEHOLDER (no real inbox yet). */
  email: string;
  emailNote: string;
}

export const ABOUT: Record<Lang, AboutContent> = {
  vi: {
    // PLACEHOLDER: tên thật sẽ do tác giả cung cấp (CONTENT-INVENTORY.md).
    name: SITE_AUTHOR,
    role: "Người viết",
    intro: [
      "Chào bạn, đây là vườn chữ cá nhân của tôi. Tôi viết để ghi lại những gì học được về web, công cụ lập trình và đời sống thường ngày — phần lớn là ghi chú, đôi khi là một bài dài hơn khi có gì đáng kể.",
      "Mục tiêu của trang này rất đơn giản: chữ dễ đọc, tải nhanh, và bền. Mọi thứ đều là trang tĩnh, không có máy chủ nào chạy lúc bạn truy cập.",
    ],
    focus: [
      {
        title: "Web và giao diện",
        body: "Cách dựng trang tĩnh, giữ cho giao diện dễ đọc và dễ tiếp cận, và những đánh đổi phía sau.",
      },
      {
        title: "Công cụ lập trình",
        body: "Ghi chú về những công cụ tôi dùng hằng ngày, cách chúng ăn khớp với nhau và khi nào thì nên tránh.",
      },
      {
        title: "Đời sống thường ngày",
        body: "Vài quan sát nhỏ, ít tính kỹ thuật hơn — những thứ đáng để viết ra rồi đọc lại sau này.",
      },
    ],
    timeline: [
      {
        period: "2026",
        title: "Bắt đầu khu vườn",
        body: "Dựng trang tĩnh song ngữ: Astro cho phần nội dung, Vue cho vài đảo tương tác, và một hệ thống thiết kế lấy việc đọc làm trung tâm.",
      },
      {
        period: "2026",
        title: "Chuyển sang song ngữ",
        body: "Mỗi bài có hai bản, tiếng Việt và tiếng Anh, nối với nhau bằng một khoá chung để chuyển qua lại giữa hai ngôn ngữ.",
      },
      {
        period: "hiện tại",
        title: "Viết và chỉnh dần",
        body: "Không có mốc kết thúc. Các bài cũ được xem lại và cập nhật khi có gì cần sửa.",
      },
    ],
    projects: [
      {
        name: "Khu vườn này",
        summary:
          "Trang bạn đang xem: một blog tĩnh song ngữ, dựng bằng Astro và Vue, chạy hoàn toàn trên các tệp tĩnh.",
        tags: ["Astro", "Vue", "trang tĩnh"],
        href: "/vi/posts/",
      },
      {
        // PLACEHOLDER: dự án thật sẽ được bổ sung.
        name: "Dự án tiếp theo",
        summary: "Chỗ dành cho một dự án sắp tới. Sẽ được cập nhật khi có nội dung thật.",
        tags: ["sắp có"],
      },
    ],
  },
  en: {
    // PLACEHOLDER: real author name pending (CONTENT-INVENTORY.md).
    name: SITE_AUTHOR,
    role: "Writer",
    intro: [
      "Hello — this is my personal garden of notes. I write to keep track of what I learn about the web, developer tooling and everyday life: mostly short notes, sometimes a longer piece when something is worth it.",
      "The goal here is simple: readable type, fast pages, and durability. Everything is static; nothing runs on a server when you visit.",
    ],
    focus: [
      {
        title: "Web and interface",
        body: "Building static pages, keeping interfaces readable and accessible, and the trade-offs behind those choices.",
      },
      {
        title: "Developer tooling",
        body: "Notes on the tools I use daily, how they fit together, and when to stay away from them.",
      },
      {
        title: "Everyday life",
        body: "Smaller, less technical observations — the kind worth writing down and re-reading later.",
      },
    ],
    timeline: [
      {
        period: "2026",
        title: "The garden starts",
        body: "Built a bilingual static site: Astro for content, Vue for a few interactive islands, and a design system centred on reading.",
      },
      {
        period: "2026",
        title: "Going bilingual",
        body: "Every post exists in Vietnamese and English, paired by a shared key so the two versions can point at each other.",
      },
      {
        period: "now",
        title: "Write and revise",
        body: "There is no finish line. Older notes get revisited and updated as things change.",
      },
    ],
    projects: [
      {
        name: "This garden",
        summary:
          "The site you are reading: a bilingual static blog built with Astro and Vue, served entirely as static files.",
        tags: ["Astro", "Vue", "static"],
        href: "/en/posts/",
      },
      {
        // PLACEHOLDER: a real project will replace this.
        name: "Next project",
        summary:
          "A slot reserved for an upcoming project. It will be filled in when there is something real to show.",
        tags: ["coming soon"],
      },
    ],
  },
};

export const CONTACT: Record<Lang, ContactContent> = {
  vi: {
    intro: [
      "Nếu bạn muốn góp ý về một bài viết, phát hiện lỗi, hay chỉ để chào một câu, hãy dùng biểu mẫu bên dưới.",
    ],
    expect: [
      "Tôi đọc mọi tin nhắn, nhưng có thể trả lời hơi chậm.",
      "Thư điện tử của bạn chỉ dùng để trả lời, không dùng cho việc khác.",
      "Nếu cần gấp, hãy ghi rõ trong tiêu đề.",
    ],
    // PLACEHOLDER: chưa có hộp thư thật; thay khi có địa chỉ.
    email: "hello@example.com",
    emailNote: "Địa chỉ tạm — sẽ thay bằng hộp thư thật trước khi ra mắt.",
  },
  en: {
    intro: [
      "If you would like to comment on a post, report a mistake, or just say hello, use the form below.",
    ],
    expect: [
      "I read every message, but replies can be slow.",
      "Your email is used only to reply, nothing else.",
      "If it is urgent, say so in the subject line.",
    ],
    // PLACEHOLDER: no real inbox yet; replace when available.
    email: "hello@example.com",
    emailNote: "Placeholder address — replaced with a real inbox before launch.",
  },
};
