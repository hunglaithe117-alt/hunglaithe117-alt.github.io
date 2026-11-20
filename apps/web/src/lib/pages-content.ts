/** Bilingual copy for the About page. */
import type { Lang } from "./i18n";

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
  intro: string[];
  focus: FocusItem[];
  timeline: TimelineItem[];
  projects: ProjectItem[];
}

export const ABOUT: Record<Lang, AboutContent> = {
  vi: {
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
    ],
  },
  en: {
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
    ],
  },
};
