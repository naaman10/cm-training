import Link from "next/link";

import type { SafeCourseLesson } from "@/types/course";
import { richTextToPlainText } from "@/lib/courses/rich-text";

type LessonHubProps = {
  courseHref: string;
  courseTitle: string;
  outlineLesson: SafeCourseLesson;
  answeredCount: number;
  questionCount: number;
  lessonStarted: boolean;
  starting: boolean;
  onStart: () => void;
  onContinue: () => void;
};

export function LessonHub({
  courseHref,
  courseTitle,
  outlineLesson,
  answeredCount,
  questionCount,
  lessonStarted,
  starting,
  onStart,
  onContinue,
}: LessonHubProps) {
  const intro = richTextToPlainText(outlineLesson.lessonDescription);
  const hasAnswers = answeredCount > 0;
  const allAnswered = questionCount > 0 && answeredCount >= questionCount;
  const showContinue = lessonStarted && hasAnswers && !allAnswered;
  const showStart =
    !showContinue && (!lessonStarted || (lessonStarted && answeredCount === 0));

  return (
    <div className="mx-auto min-h-screen w-full max-w-lg bg-zinc-100 px-4 py-8 dark:bg-zinc-950 lg:max-w-3xl lg:px-8">
      <Link
        href={courseHref}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <span aria-hidden>←</span>
        {courseTitle}
      </Link>

      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-xs font-medium uppercase tracking-wide text-violet-600 dark:text-violet-400">
          Lesson {outlineLesson.order}
        </p>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          {outlineLesson.lessonName?.trim() || "Lesson"}
        </h1>

        {intro ? (
          <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {intro}
          </p>
        ) : null}

        {questionCount > 0 ? (
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
            {answeredCount} of {questionCount} question
            {questionCount === 1 ? "" : "s"} answered
          </p>
        ) : null}

        {allAnswered ? (
          <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
            You have answered every question in this lesson. Progress is saved;
            lesson completion is not recorded yet.
          </p>
        ) : null}

        <div className="mt-6 flex flex-col gap-2">
          {showStart ? (
            <button
              type="button"
              onClick={onStart}
              disabled={starting || questionCount === 0}
              className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-violet-600 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-60"
            >
              {starting
                ? "Starting…"
                : lessonStarted
                  ? "Start questions"
                  : "Start lesson"}
            </button>
          ) : null}

          {showContinue ? (
            <button
              type="button"
              onClick={onContinue}
              className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-violet-600 text-sm font-semibold text-white hover:bg-violet-500"
            >
              Continue lesson
            </button>
          ) : null}

          {questionCount === 0 ? (
            <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
              No questions are published for this lesson yet.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
