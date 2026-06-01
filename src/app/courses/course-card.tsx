import Link from "next/link";

import { courseDisplayTitle } from "@/lib/courses/course-utils";
import type { SafeCourseSummary } from "@/types/course";

import { CourseThumbnailImage } from "./course-thumbnail";

type CourseCardProps = {
  course: SafeCourseSummary;
};

export function CourseCard({ course }: CourseCardProps) {
  const title = courseDisplayTitle(course);
  const detailHref = `/courses/${encodeURIComponent(course.id)}`;
  const { enrollmentStatus } = course;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700">
      <Link href={detailHref} className="block">
        <CourseThumbnailImage thumbnail={course.thumbnail} title={title} />
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-1 flex-col gap-1">
          <Link href={detailHref}>
            <h2 className="text-base font-semibold leading-snug text-zinc-900 hover:text-violet-700 dark:text-zinc-50 dark:hover:text-violet-400">
              {title}
            </h2>
          </Link>
          {course.lessonCount > 0 ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {course.lessonCount} lesson{course.lessonCount === 1 ? "" : "s"}
            </p>
          ) : null}
        </div>

        {enrollmentStatus === "completed" ? (
          <Link
            href={detailHref}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-100 px-4 text-sm font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
          >
            Completed
          </Link>
        ) : enrollmentStatus === "enrolled" ? (
          <Link
            href={detailHref}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-violet-600 px-4 text-sm font-medium text-white transition hover:bg-violet-500"
          >
            Continue learning
          </Link>
        ) : (
          <Link
            href={detailHref}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-violet-600 px-4 text-sm font-medium text-violet-700 transition hover:bg-violet-50 dark:border-violet-500 dark:text-violet-400 dark:hover:bg-violet-950/40"
          >
            Enroll
          </Link>
        )}
      </div>
    </article>
  );
}
