import type { LessonProgress } from "@/types/lesson";

export function answersByQuestionId(
  progress: Pick<LessonProgress, "answers">,
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const answer of progress.answers) {
    map[answer.questionId] = answer.answerId;
  }
  return map;
}

export function emptyLessonProgressFields(): Pick<
  LessonProgress,
  | "questionCount"
  | "answeredCount"
  | "nextQuestionIndex"
  | "answeredQuestionIds"
  | "answers"
> {
  return {
    questionCount: 0,
    answeredCount: 0,
    nextQuestionIndex: 0,
    answeredQuestionIds: [],
    answers: [],
  };
}
