import { lessonDetailPath } from "@/lib/courses/lesson-path";
import type { EnrollmentStatus, SafeCourseDetail, SafeCourseLesson } from "@/types/course";
import type { LessonStatus } from "@/types/lesson";

export function isLessonAccessible(enrollmentStatus: EnrollmentStatus): boolean {
  return enrollmentStatus === "enrolled" || enrollmentStatus === "completed";
}

export function lessonProgressPercent(
  lesson: Pick<SafeCourseLesson, "lessonStatus" | "questionCount" | "answeredCount">,
): number {
  if (lesson.lessonStatus === "completed") return 100;
  if (lesson.questionCount > 0) {
    return Math.round((lesson.answeredCount / lesson.questionCount) * 100);
  }
  if (lesson.lessonStatus === "started") return 10;
  return 0;
}

export function lessonStatusLabel(lessonStatus: LessonStatus): string {
  if (lessonStatus === "completed") return "Completed";
  if (lessonStatus === "started") return "In progress";
  return "Not started";
}

function lessonHasIncompleteQuestions(lesson: SafeCourseLesson): boolean {
  return (
    lesson.questionCount > 0 && lesson.answeredCount < lesson.questionCount
  );
}

export function continueLearningHref(course: SafeCourseDetail): string | null {
  if (!isLessonAccessible(course.enrollmentStatus) || course.lessons.length === 0) {
    return null;
  }

  const inProgress = course.lessons.find(
    (lesson) =>
      lesson.lessonStatus === "started" && lessonHasIncompleteQuestions(lesson),
  );
  if (inProgress) {
    return lessonDetailPath(course, inProgress.id);
  }

  const started = course.lessons.find((lesson) => lesson.lessonStatus === "started");
  if (started) {
    return lessonDetailPath(course, started.id);
  }

  const notStarted = course.lessons.find(
    (lesson) => lesson.lessonStatus === "not_started",
  );
  if (notStarted) {
    return lessonDetailPath(course, notStarted.id);
  }

  return lessonDetailPath(course, course.lessons[0].id);
}
