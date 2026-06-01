import type { SafeCourseSummary } from "@/types/course";

import { CourseCard } from "./course-card";

type CoursesSectionProps = {
  title: string;
  description?: string;
  courses: SafeCourseSummary[];
  emptyMessage: string;
};

export function CoursesSection({
  title,
  description,
  courses,
  emptyMessage,
}: CoursesSectionProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {description}
          </p>
        ) : null}
      </div>
      {courses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
          {emptyMessage}
        </div>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <li key={course.id} className="h-full">
              <CourseCard course={course} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
