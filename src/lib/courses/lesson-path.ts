import { courseDetailPath } from "@/lib/courses/course-slug";

export function lessonDetailPath(
  course: { courseSlug: string | null; id: string },
  lessonId: string,
): string {
  return `${courseDetailPath(course)}/lessons/${encodeURIComponent(lessonId)}`;
}

export function lessonQuestionPath(
  course: { courseSlug: string | null; id: string },
  lessonId: string,
  questionIndex: number,
): string {
  return `${lessonDetailPath(course, lessonId)}?q=${questionIndex}`;
}

export function parseLessonQuestionIndex(
  value: string | null | undefined,
): number | null {
  if (value == null || value.trim() === "") return null;
  const index = Number.parseInt(value, 10);
  if (!Number.isFinite(index) || index < 0) return null;
  return index;
}
