/** Contentful entry ids are 22-character alphanumeric strings (no hyphens). */
export function looksLikeContentfulEntryId(ref: string): boolean {
  const value = ref.trim();
  if (!value || value.includes("-")) {
    return false;
  }
  return /^[a-zA-Z0-9]{22}$/.test(value);
}

export function courseSlugMatches(
  courseSlug: string | null | undefined,
  ref: string,
): boolean {
  const slug = courseSlug?.trim();
  const target = ref.trim();
  if (!slug || !target) {
    return false;
  }
  return slug.toLowerCase() === target.toLowerCase();
}

export function courseDetailPath(course: {
  courseSlug: string | null;
  id: string;
}): string {
  const slug = course.courseSlug?.trim();
  if (slug) {
    return `/courses/${encodeURIComponent(slug)}`;
  }
  return `/courses/${encodeURIComponent(course.id)}`;
}
