import type { SafeCourseSummary } from "@/types/course";

import { CourseThumbnailImage } from "./course-thumbnail";

function courseTitle(course: SafeCourseSummary): string {
  return (
    course.courseName?.trim() ||
    course.internalName?.trim() ||
    "Untitled course"
  );
}

type CourseCardProps = {
  course: SafeCourseSummary;
};

export function CourseCard({ course }: CourseCardProps) {
  const title = courseTitle(course);

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700">
      <CourseThumbnailImage thumbnail={course.thumbnail} title={title} />
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h2 className="text-base font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
          {title}
        </h2>
        {course.lessonCount > 0 ? (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {course.lessonCount} lesson{course.lessonCount === 1 ? "" : "s"}
          </p>
        ) : null}
      </div>
    </article>
  );
}
