import { lessonDetailPath } from "@/lib/courses/lesson-path";
import type { EnrollmentStatus, SafeCourseDetail } from "@/types/course";
import type { LessonStatus } from "@/types/lesson";

export function isLessonAccessible(enrollmentStatus: EnrollmentStatus): boolean {
  return enrollmentStatus === "enrolled" || enrollmentStatus === "completed";
}

export function lessonProgressPercent(lessonStatus: LessonStatus): number {
  if (lessonStatus === "completed") return 100;
  if (lessonStatus === "started") return 45;
  return 0;
}

export function lessonStatusLabel(lessonStatus: LessonStatus): string {
  if (lessonStatus === "completed") return "Completed";
  if (lessonStatus === "started") return "In progress";
  return "Not started";
}

export function continueLearningHref(course: SafeCourseDetail): string | null {
  if (!isLessonAccessible(course.enrollmentStatus) || course.lessons.length === 0) {
    return null;
  }

  const target =
    course.lessons.find((lesson) => lesson.lessonStatus === "started") ??
    course.lessons.find((lesson) => lesson.lessonStatus === "not_started") ??
    course.lessons[0];

  return target ? lessonDetailPath(course, target.id) : null;
}
