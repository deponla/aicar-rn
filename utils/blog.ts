import dayjs from "dayjs";
import "dayjs/locale/tr";

const BLOG_API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

function normalizeBaseUrl(url: string): string {
  if (!url) return "";
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

export function extractTags(tags?: string[]) {
  const categories = (tags || [])
    .filter((tag) => tag.startsWith("category:"))
    .map((tag) => tag.replace("category:", ""));
  const topics = (tags || [])
    .filter((tag) => tag.startsWith("topic:"))
    .map((tag) => tag.replace("topic:", ""));

  return { categories, topics };
}

export function formatBlogDate(dateValue?: string): string | null {
  if (!dateValue) return null;
  const d = dayjs(dateValue);
  if (!d.isValid()) return null;
  return d.locale("tr").format("D MMMM YYYY");
}

export function estimateReadingTime(text: string): number {
  if (!text) return 1;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function isHtml(text: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(text);
}

export function resolveBlogAssetUrl(rawUrl?: string | null): string | null {
  if (!rawUrl) return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("//")
  ) {
    return trimmed;
  }

  const baseUrl = normalizeBaseUrl(BLOG_API_BASE_URL);
  if (!baseUrl) return trimmed;

  return trimmed.startsWith("/")
    ? `${baseUrl}${trimmed}`
    : `${baseUrl}/${trimmed}`;
}

export function normalizeBlogHtmlImages(html: string): string {
  if (!html) return html;

  return html.replace(
    /(<img\b[^>]*\bsrc=)(["']?)([^"'>\s]+)(\2)/gi,
    (_match, prefix, quote, src, suffix) => {
      const resolved = resolveBlogAssetUrl(src) ?? src;
      return `${prefix}${quote}${resolved}${suffix}`;
    },
  );
}
