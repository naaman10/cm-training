import Link from "next/link";

import { lessonProgressPercent, lessonStatusLabel } from "@/lib/courses/lesson-utils";
import type { SafeCourseLesson } from "@/types/course";

type CourseLessonRowProps = {
  lesson: SafeCourseLesson;
  locked: boolean;
  href?: string | null;
  previewImageUrl?: string | null;
};

function formatLessonLabel(lesson: SafeCourseLesson): string {
  const name = lesson.lessonName?.trim();
  const order = String(lesson.order).padStart(2, "0");
  return name ? `${order} - ${name}` : `Lesson ${order}`;
}

export function CourseLessonRow({
  lesson,
  locked,
  href,
  previewImageUrl,
}: CourseLessonRowProps) {
  const progress = lessonProgressPercent(lesson.lessonStatus);
  const interactive = !locked && href;

  const content = (
    <>
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-violet-200 via-fuchsia-100 to-amber-100 dark:from-violet-950 dark:via-fuchsia-950 dark:to-amber-950 lg:h-20 lg:w-20">
        {previewImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- lesson preview fallback
          <img
            src={previewImageUrl}
            alt=""
            className="h-full w-full object-cover opacity-90"
          />
        ) : null}
        <div className="absolute inset-0 flex items-center justify-center bg-black/10">
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-full ${
              locked
                ? "bg-white/70 text-zinc-500"
                : "bg-white/90 text-violet-700 shadow-sm"
            }`}
            aria-hidden
          >
            {locked ? (
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path
                  fillRule="evenodd"
                  d="M10 2a3 3 0 00-3 3v2H6a2 2 0 00-2 2v7a2 2 0 002 2h8a2 2 0 002-2V9a2 2 0 00-2-2h-1V5a3 3 0 00-3-3zm-1 5V5a1 1 0 112 0v2h-2z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg viewBox="0 0 20 20" fill="currentColor" className="ml-0.5 h-4 w-4">
                <path d="M7 5.5v9l7-4.5-7-4.5z" />
              </svg>
            )}
          </span>
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          Lesson {lesson.order}
          {!locked ? (
            <span className="text-zinc-500 dark:text-zinc-400">
              {" "}
              · {lessonStatusLabel(lesson.lessonStatus)}
            </span>
          ) : null}
        </p>
        <p
          className={`truncate font-semibold ${
            locked
              ? "text-zinc-500 dark:text-zinc-400"
              : "text-zinc-900 dark:text-zinc-50"
          }`}
        >
          {formatLessonLabel(lesson)}
        </p>
        {!locked ? (
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-violet-100 dark:bg-violet-950/60">
            <div
              className="h-full rounded-full bg-violet-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        ) : null}
      </div>

      {locked ? (
        <span className="shrink-0 text-zinc-400 dark:text-zinc-500" aria-hidden>
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
            <path
              fillRule="evenodd"
              d="M10 2a3 3 0 00-3 3v2H6a2 2 0 00-2 2v7a2 2 0 002 2h8a2 2 0 002-2V9a2 2 0 00-2-2h-1V5a3 3 0 00-3-3zm-1 5V5a1 1 0 112 0v2h-2z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      ) : null}
    </>
  );

  if (interactive) {
    return (
      <li>
        <Link
          href={href}
          className="flex items-center gap-3 border-b border-zinc-100 py-4 transition hover:bg-zinc-50 last:border-b-0 dark:border-zinc-800 dark:hover:bg-zinc-800/50 lg:gap-4 lg:py-5"
        >
          {content}
        </Link>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-3 border-b border-zinc-100 py-4 last:border-b-0 dark:border-zinc-800 lg:gap-4 lg:py-5">
      {content}
    </li>
  );
}
