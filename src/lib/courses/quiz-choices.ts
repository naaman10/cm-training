import type { SafeQuestion } from "@/types/lesson";

export type QuizChoice = {
  id: string;
  label: string;
  imageUrl: string | null;
  isCorrect: boolean;
};

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function buildChoicesForQuestion(question: SafeQuestion): QuizChoice[] {
  const choices: QuizChoice[] = [];
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
  return choices;
}

function choiceOrderKey(questionId: string): string {
  return `cm-training:quiz-choice-order:${questionId}`;
}

export function getOrderedChoices(question: SafeQuestion): QuizChoice[] {
  const built = buildChoicesForQuestion(question);
  if (typeof window === "undefined") {
    return shuffle(built);
  }

  try {
    const cached = window.sessionStorage.getItem(choiceOrderKey(question.id));
    if (cached) {
      const order = JSON.parse(cached) as string[];
      if (Array.isArray(order)) {
        const byId = new Map(built.map((choice) => [choice.id, choice]));
        const ordered = order
          .map((id) => byId.get(id))
          .filter((choice): choice is QuizChoice => choice != null);
        if (ordered.length === built.length) {
          return ordered;
        }
      }
    }
  } catch {
    // Fall through to fresh shuffle.
  }

  const shuffled = shuffle(built);
  try {
    window.sessionStorage.setItem(
      choiceOrderKey(question.id),
      JSON.stringify(shuffled.map((choice) => choice.id)),
    );
  } catch {
    // Ignore storage errors.
  }
  return shuffled;
}
