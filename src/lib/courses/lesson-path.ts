import { courseDetailPath } from "@/lib/courses/course-slug";

export function lessonDetailPath(
  course: { courseSlug: string | null; id: string },
  lessonId: string,
): string {
  return `${courseDetailPath(course)}/lessons/${encodeURIComponent(lessonId)}`;
}
