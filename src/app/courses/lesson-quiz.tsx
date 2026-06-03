"use client";

import { useMemo, useState } from "react";

import type { SafeLessonDetail, SafeQuestion } from "@/types/lesson";

type LessonQuizProps = {
  lesson: SafeLessonDetail;
};

type ShuffledQuestion = {
  question: SafeQuestion;
  choices: { id: string; label: string; imageUrl: string | null; isCorrect: boolean }[];
};

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildChoices(question: SafeQuestion) {
  const choices: ShuffledQuestion["choices"] = [];
  if (question.correctAnswer) {
    choices.push({
      id: question.correctAnswer.id,
      label: question.correctAnswer.answerText?.trim() || "Correct answer",
      imageUrl: question.correctAnswer.answerImage?.url ?? null,
      isCorrect: true,
    });
  }
  for (const answer of question.incorrectAnswers) {
    choices.push({
      id: answer.id,
      label: answer.answerText?.trim() || "Answer",
      imageUrl: answer.answerImage?.url ?? null,
      isCorrect: false,
    });
  }
  return shuffle(choices);
}

export function LessonQuiz({ lesson }: LessonQuizProps) {
  const questions = useMemo(
    () =>
      lesson.questions.map((question) => ({
        question,
        choices: buildChoices(question),
      })),
    [lesson.questions],
  );

  const [selectedByQuestion, setSelectedByQuestion] = useState<
    Record<string, string>
  >({});
  const [submitted, setSubmitted] = useState(false);

  if (questions.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        No quiz questions for this lesson yet.
      </p>
    );
  }

  const answeredCount = questions.filter((item) => selectedByQuestion[item.question.id])
    .length;
  const correctCount = questions.filter((item) => {
    const selectedId = selectedByQuestion[item.question.id];
    if (!selectedId) return false;
    return item.choices.find((choice) => choice.id === selectedId)?.isCorrect;
  }).length;
  const scorePercent =
    questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
  const passThreshold = lesson.completionCriteria ?? 80;
  const passed = submitted && scorePercent >= passThreshold;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Quiz
        </h2>
        {lesson.completionCriteria != null ? (
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Pass {lesson.completionCriteria}% (local check only)
          </span>
        ) : null}
      </div>

      <ol className="space-y-6">
        {questions.map((item, index) => {
          const selectedId = selectedByQuestion[item.question.id];
          return (
            <li
              key={item.question.id}
              className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/50"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Question {index + 1}
              </p>
              <p className="mt-1 font-medium text-zinc-900 dark:text-zinc-50">
                {item.question.question?.trim() || "Untitled question"}
              </p>
              {item.question.questionSummary ? (
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {item.question.questionSummary}
                </p>
              ) : null}

              <ul className="mt-4 space-y-2">
                {item.choices.map((choice) => {
                  const isSelected = selectedId === choice.id;
                  let resultClass = "border-zinc-200 dark:border-zinc-700";
                  if (submitted && isSelected) {
                    resultClass = choice.isCorrect
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                      : "border-red-400 bg-red-50 dark:bg-red-950/30";
                  } else if (isSelected) {
                    resultClass = "border-violet-500 bg-violet-50 dark:bg-violet-950/40";
                  }

                  return (
                    <li key={choice.id}>
                      <button
                        type="button"
                        disabled={submitted}
                        onClick={() =>
                          setSelectedByQuestion((prev) => ({
                            ...prev,
                            [item.question.id]: choice.id,
                          }))
                        }
                        className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition ${resultClass} disabled:cursor-default`}
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
            </li>
          );
        })}
      </ol>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {submitted
            ? `Score: ${correctCount}/${questions.length} (${scorePercent}%)`
            : `${answeredCount}/${questions.length} answered`}
        </p>
        {!submitted ? (
          <button
            type="button"
            disabled={answeredCount < questions.length}
            onClick={() => setSubmitted(true)}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-violet-600 px-5 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
          >
            Check answers
          </button>
        ) : (
          <p
            className={`text-sm font-medium ${
              passed
                ? "text-emerald-700 dark:text-emerald-300"
                : "text-amber-700 dark:text-amber-300"
            }`}
          >
            {passed
              ? "You reached the pass threshold for this lesson."
              : "Keep practising — lesson completion is not saved yet."}
          </p>
        )}
      </div>
    </div>
  );
}
