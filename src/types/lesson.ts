import type { CourseThumbnail } from "@/types/course";

export type LessonStatus = "not_started" | "started" | "completed";

export type LessonProgress = {
  lessonStatus: LessonStatus;
  startedAt: string | null;
  startedAtUk: string | null;
  completedAt: string | null;
  completedAtUk: string | null;
};

export type SafeAnswer = {
  id: string;
  answerText: string | null;
  answerImage: CourseThumbnail | null;
};

export type SafeQuestion = {
  id: string;
  question: string | null;
  questionSummary: string | null;
  correctAnswer: SafeAnswer | null;
  incorrectAnswers: SafeAnswer[];
};

export type SafeLessonDetail = {
  id: string;
  lessonName: string | null;
  lessonDescription: unknown;
  completionCriteria: number | null;
  questions: SafeQuestion[];
};

export type LessonSession = {
  lesson: SafeLessonDetail;
  progress: LessonProgress;
};
