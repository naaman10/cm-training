import { fetchCmTrainingApiWithBearer } from "@/lib/api/client";
import { emptyLessonProgressFields } from "@/lib/courses/lesson-progress";
import { normalizeCourseThumbnail } from "@/lib/courses/normalize-thumbnail";
import type {
  LessonProgress,
  LessonQuestionAnswer,
  LessonStatus,
  SafeAnswer,
  LessonSession,
  SafeLessonDetail,
  SafeQuestion,
} from "@/types/lesson";
import type {
  LessonClientResponse,
  SaveLessonAnswerClientResponse,
  StartLessonClientResponse,
} from "@/types/lessons";

type LessonApiCode = Exclude<LessonClientResponse["code"], "ok">;

function codeForStatus(status: number): LessonApiCode {
  if (status === 400) return "bad_request";
  if (status === 401) return "unauthenticated";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 503) return "configuration_error";
  return "unknown";
}

function readMessage(json: unknown): string | undefined {
  if (!json || typeof json !== "object") return undefined;
  const obj = json as Record<string, unknown>;
  if (typeof obj.message === "string" && obj.message.trim()) return obj.message;
  if (typeof obj.error === "string" && obj.error.trim()) return obj.error;
  return undefined;
}

function readDetail(json: unknown): string | undefined {
  if (!json || typeof json !== "object") return undefined;
  const obj = json as Record<string, unknown>;
  if (typeof obj.detail === "string" && obj.detail.trim()) return obj.detail;
  return undefined;
}

function normalizeLessonStatus(raw: unknown): LessonStatus {
  if (raw === "started" || raw === "completed" || raw === "not_started") {
    return raw;
  }
  return "not_started";
}

function normalizeNullableString(raw: unknown): string | null {
  return typeof raw === "string" && raw.trim() ? raw : null;
}

function normalizeLessonQuestionAnswer(raw: unknown): LessonQuestionAnswer | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as LessonQuestionAnswer;
  if (typeof row.questionId !== "string" || !row.questionId.trim()) return null;
  if (typeof row.answerId !== "string" || !row.answerId.trim()) return null;
  return {
    questionId: row.questionId,
    answerId: row.answerId,
    answeredAt: normalizeNullableString(row.answeredAt),
    answeredAtUk: normalizeNullableString(row.answeredAtUk),
  };
}

export function normalizeLessonProgress(raw: unknown): LessonProgress {
  const defaults = {
    lessonStatus: "not_started" as const,
    startedAt: null,
    startedAtUk: null,
    completedAt: null,
    completedAtUk: null,
    ...emptyLessonProgressFields(),
  };

  if (!raw || typeof raw !== "object") {
    return defaults;
  }

  const progress = raw as LessonProgress;
  const answers = Array.isArray(progress.answers)
    ? progress.answers
        .map((item) => normalizeLessonQuestionAnswer(item))
        .filter((item): item is LessonQuestionAnswer => item != null)
    : [];

  return {
    lessonStatus: normalizeLessonStatus(progress.lessonStatus),
    startedAt: normalizeNullableString(progress.startedAt),
    startedAtUk: normalizeNullableString(progress.startedAtUk),
    completedAt: normalizeNullableString(progress.completedAt),
    completedAtUk: normalizeNullableString(progress.completedAtUk),
    questionCount:
      typeof progress.questionCount === "number" && progress.questionCount > 0
        ? progress.questionCount
        : 0,
    answeredCount:
      typeof progress.answeredCount === "number" ? progress.answeredCount : 0,
    nextQuestionIndex:
      typeof progress.nextQuestionIndex === "number"
        ? progress.nextQuestionIndex
        : 0,
    answeredQuestionIds: Array.isArray(progress.answeredQuestionIds)
      ? progress.answeredQuestionIds.filter(
          (id): id is string => typeof id === "string" && id.trim().length > 0,
        )
      : [],
    answers,
  };
}

function normalizeAnswer(raw: unknown): SafeAnswer | null {
  if (!raw || typeof raw !== "object") return null;
  const answer = raw as SafeAnswer;
  if (typeof answer.id !== "string" || !answer.id.trim()) return null;
  return {
    id: answer.id,
    answerText: normalizeNullableString(answer.answerText),
    answerImage: normalizeCourseThumbnail(answer.answerImage),
  };
}

function normalizeQuestion(raw: unknown): SafeQuestion | null {
  if (!raw || typeof raw !== "object") return null;
  const question = raw as SafeQuestion;
  if (typeof question.id !== "string" || !question.id.trim()) return null;
  const incorrectAnswers = Array.isArray(question.incorrectAnswers)
    ? question.incorrectAnswers
        .map((item) => normalizeAnswer(item))
        .filter((item): item is SafeAnswer => item != null)
    : [];
  return {
    id: question.id,
    question: normalizeNullableString(question.question),
    questionSummary: normalizeNullableString(question.questionSummary),
    correctAnswer: normalizeAnswer(question.correctAnswer),
    incorrectAnswers,
  };
}

export function normalizeLessonDetail(raw: unknown): SafeLessonDetail | null {
  if (!raw || typeof raw !== "object") return null;
  const lesson = raw as SafeLessonDetail;
  if (typeof lesson.id !== "string" || !lesson.id.trim()) return null;
  const questions = Array.isArray(lesson.questions)
    ? lesson.questions
        .map((item) => normalizeQuestion(item))
        .filter((item): item is SafeQuestion => item != null)
    : [];
  return {
    id: lesson.id,
    lessonName: normalizeNullableString(lesson.lessonName),
    lessonDescription: lesson.lessonDescription ?? null,
    completionCriteria:
      typeof lesson.completionCriteria === "number"
        ? lesson.completionCriteria
        : null,
    questions,
  };
}

function parseLessonSessionResponse(
  status: number,
  json: unknown,
): { response: LessonClientResponse; httpStatus: number } {
  if (
    (status === 200 || status === 201) &&
    json &&
    typeof json === "object" &&
    "lesson" in json &&
    "progress" in json
  ) {
    const lesson = normalizeLessonDetail((json as { lesson: unknown }).lesson);
    let progress = normalizeLessonProgress(
      (json as { progress: unknown }).progress,
    );
    if (lesson) {
      const questionTotal = lesson.questions.length;
      if (questionTotal > 0 && progress.questionCount !== questionTotal) {
        progress = {
          ...progress,
          questionCount: questionTotal,
          nextQuestionIndex:
            progress.nextQuestionIndex >= questionTotal
              ? questionTotal
              : progress.nextQuestionIndex,
        };
      }
      return {
        httpStatus: status,
        response: {
          ok: true,
          httpStatus: 200,
          code: "ok",
          lesson,
          progress,
        },
      };
    }
  }

  const message = readMessage(json);
  const detail = readDetail(json);
  return {
    httpStatus: status,
    response: {
      ok: false,
      httpStatus: status,
      code: codeForStatus(status),
      message:
        message ??
        (status === 404
          ? "Lesson not found."
          : status === 400
            ? "Invalid question or answer."
            : status === 401
              ? "Session expired or token is invalid. Please sign in again."
              : status === 403
                ? "Your account is suspended or blocked."
                : status >= 500
                  ? "Lesson service encountered an error. Please retry."
                  : "Could not load lesson."),
      detail,
    },
  };
}

async function fetchLessonUpstream(
  accessToken: string,
  path: string,
  init?: RequestInit,
): Promise<{ response: LessonClientResponse; httpStatus: number }> {
  let upstream: Response;
  try {
    upstream = await fetchCmTrainingApiWithBearer(accessToken, path, {
      cache: "no-store",
      ...init,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...init?.headers,
      },
    });
  } catch {
    return {
      httpStatus: 503,
      response: {
        ok: false,
        httpStatus: 503,
        code: "network_error",
        message: "Could not reach courses API.",
      },
    };
  }

  const status = upstream.status;
  const text = await upstream.text();
  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text) as unknown;
    } catch {
      json = { raw: text };
    }
  }

  return parseLessonSessionResponse(status, json);
}

function toSession(response: Extract<LessonClientResponse, { ok: true }>): LessonSession {
  return { lesson: response.lesson, progress: response.progress };
}

export async function buildGetLessonPayload(
  accessToken: string,
  courseId: string,
  lessonId: string,
): Promise<{ response: LessonClientResponse; httpStatus: number }> {
  return fetchLessonUpstream(
    accessToken,
    `/api/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}`,
  );
}

export async function buildStartLessonPayload(
  accessToken: string,
  courseId: string,
  lessonId: string,
): Promise<{ response: StartLessonClientResponse; httpStatus: number }> {
  const result = await fetchLessonUpstream(
    accessToken,
    `/api/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}/start`,
    { method: "POST" },
  );
  if (result.response.ok && (result.httpStatus === 200 || result.httpStatus === 201)) {
    return {
      httpStatus: result.httpStatus,
      response: {
        ...result.response,
        httpStatus: result.httpStatus as 200 | 201,
      },
    };
  }
  return result as { response: StartLessonClientResponse; httpStatus: number };
}

export async function buildSaveLessonAnswerPayload(
  accessToken: string,
  courseId: string,
  lessonId: string,
  questionId: string,
  answerId: string,
): Promise<{ response: SaveLessonAnswerClientResponse; httpStatus: number }> {
  const result = await fetchLessonUpstream(
    accessToken,
    `/api/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}/answers`,
    {
      method: "POST",
      body: JSON.stringify({ questionId, answerId }),
    },
  );
  if (result.response.ok && (result.httpStatus === 200 || result.httpStatus === 201)) {
    return {
      httpStatus: result.httpStatus,
      response: {
        ...result.response,
        httpStatus: result.httpStatus as 200 | 201,
      },
    };
  }
  return result as { response: SaveLessonAnswerClientResponse; httpStatus: number };
}

export { toSession };
