import { fetchCmTrainingApiWithBearer } from "@/lib/api/client";
import { normalizeCourseThumbnail } from "@/lib/courses/normalize-thumbnail";
import type {
  LessonProgress,
  LessonStatus,
  SafeAnswer,
  SafeLessonDetail,
  SafeQuestion,
} from "@/types/lesson";
import type {
  LessonClientResponse,
  StartLessonClientResponse,
} from "@/types/lessons";

type LessonApiCode = Exclude<LessonClientResponse["code"], "ok">;

function codeForStatus(status: number): LessonApiCode {
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

function normalizeLessonProgress(raw: unknown): LessonProgress {
  if (!raw || typeof raw !== "object") {
    return {
      lessonStatus: "not_started",
      startedAt: null,
      startedAtUk: null,
      completedAt: null,
      completedAtUk: null,
    };
  }
  const progress = raw as LessonProgress;
  return {
    lessonStatus: normalizeLessonStatus(progress.lessonStatus),
    startedAt: normalizeNullableString(progress.startedAt),
    startedAtUk: normalizeNullableString(progress.startedAtUk),
    completedAt: normalizeNullableString(progress.completedAt),
    completedAtUk: normalizeNullableString(progress.completedAtUk),
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
    status === 200 &&
    json &&
    typeof json === "object" &&
    "lesson" in json &&
    "progress" in json
  ) {
    const lesson = normalizeLessonDetail((json as { lesson: unknown }).lesson);
    const progress = normalizeLessonProgress(
      (json as { progress: unknown }).progress,
    );
    if (lesson) {
      return {
        httpStatus: 200,
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

export { normalizeLessonProgress };
