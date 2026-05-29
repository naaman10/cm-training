import type { CourseThumbnail } from "@/types/course";

/**
 * Normalizes API thumbnail payloads (null, partial, or protocol-relative URLs).
 */
export function normalizeCourseThumbnail(
  raw: unknown,
): CourseThumbnail | null {
  if (raw == null) return null;
  if (typeof raw !== "object") return null;

  const value = raw as Record<string, unknown>;
  const urlRaw = typeof value.url === "string" ? value.url.trim() : "";
  if (!urlRaw) return null;

  const url = urlRaw.startsWith("//") ? `https:${urlRaw}` : urlRaw;
  if (!/^https?:\/\//i.test(url)) return null;

  const title =
    typeof value.title === "string" && value.title.trim()
      ? value.title.trim()
      : undefined;

  const width =
    typeof value.width === "number" &&
    Number.isFinite(value.width) &&
    value.width > 0
      ? Math.round(value.width)
      : undefined;

  const height =
    typeof value.height === "number" &&
    Number.isFinite(value.height) &&
    value.height > 0
      ? Math.round(value.height)
      : undefined;

  return { url, title, width, height };
}

export function thumbnailAspectRatio(
  thumbnail: CourseThumbnail | null | undefined,
): string {
  if (
    thumbnail?.width &&
    thumbnail?.height &&
    thumbnail.width > 0 &&
    thumbnail.height > 0
  ) {
    return `${thumbnail.width} / ${thumbnail.height}`;
  }
  return "16 / 9";
}
