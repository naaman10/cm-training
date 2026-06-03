import type { LessonSession } from "@/types/lesson";
import type { CoursesCode } from "@/types/courses";

export type LessonClientResponse =
  | {
      ok: true;
      httpStatus: 200;
      code: "ok";
      lesson: LessonSession["lesson"];
      progress: LessonSession["progress"];
    }
  | {
      ok: false;
      httpStatus: number;
      code: CoursesCode;
      message?: string;
      detail?: string;
    };

export type StartLessonClientResponse =
  | {
      ok: true;
      httpStatus: 200 | 201;
      code: "ok";
      lesson: LessonSession["lesson"];
      progress: LessonSession["progress"];
    }
  | {
      ok: false;
      httpStatus: number;
      code: CoursesCode;
      message?: string;
      detail?: string;
    };

export function isLessonSuccess(
  response: LessonClientResponse,
): response is Extract<LessonClientResponse, { ok: true }> {
  return response.ok && response.httpStatus === 200;
}

export function isStartLessonSuccess(
  response: StartLessonClientResponse,
): response is Extract<StartLessonClientResponse, { ok: true }> {
  return response.ok && (response.httpStatus === 200 || response.httpStatus === 201);
}
