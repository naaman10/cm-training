"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { getOrderedChoices } from "@/lib/courses/quiz-choices";
import type { SafeLessonDetail, SafeQuestion } from "@/types/lesson";

type LessonQuestionPageProps = {
  lesson: SafeLessonDetail;
  question: SafeQuestion;
  questionIndex: number;
  questionCount: number;
  courseHref: string;
  courseTitle: string;
  hubHref: string;
  initialSelectedId: string | null;
  saving?: boolean;
  onNext: (selectedAnswerId: string) => void;
};

export function LessonQuestionPage({
  lesson,
  question,
  questionIndex,
  questionCount,
  courseHref,
  courseTitle,
  hubHref,
  initialSelectedId,
  saving = false,
  onNext,
}: LessonQuestionPageProps) {
  const choices = useMemo(() => getOrderedChoices(question), [question]);
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId);
  const isLast = questionIndex >= questionCount - 1;

  return (
    <div className="mx-auto min-h-screen w-full max-w-lg bg-zinc-100 px-4 py-6 dark:bg-zinc-950 lg:max-w-3xl lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <Link
          href={hubHref}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <span aria-hidden>←</span>
          {lesson.lessonName?.trim() || "Lesson"}
        </Link>
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {questionIndex + 1} / {questionCount}
        </span>
      </div>

      <article className="mt-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-xs font-medium uppercase tracking-wide text-violet-600 dark:text-violet-400">
          Question {questionIndex + 1}
        </p>
        <h1 className="mt-2 text-xl font-bold leading-snug text-zinc-900 dark:text-zinc-50">
          {question.question?.trim() || "Untitled question"}
        </h1>
        {question.questionSummary ? (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {question.questionSummary}
          </p>
        ) : null}

        <ul className="mt-6 space-y-2">
          {choices.map((choice) => {
            const isSelected = selectedId === choice.id;
            return (
              <li key={choice.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(choice.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left text-sm transition ${
                    isSelected
                      ? "border-violet-500 bg-violet-50 dark:bg-violet-950/40"
                      : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
                  }`}
                >
                  {choice.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={choice.imageUrl}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-lg object-cover"
                    />
                  ) : null}
                  <span className="text-zinc-900 dark:text-zinc-100">
                    {choice.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          disabled={!selectedId || saving}
          onClick={() => {
            if (selectedId) onNext(selectedId);
          }}
          className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-violet-600 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
        >
          {saving ? "Saving…" : isLast ? "Finish" : "Next question"}
        </button>
      </article>

      <Link
        href={courseHref}
        className="mt-4 inline-block text-xs text-zinc-500 underline hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        Back to {courseTitle}
      </Link>
    </div>
  );
}
