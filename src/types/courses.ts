import type { SafeCourseDetail, SafeCourseSummary, SafeEnrollment } from "@/types/course";

export type CoursesCode =
  | "ok"
  | "unauthenticated"
  | "forbidden"
  | "not_found"
  | "configuration_error"
  | "network_error"
  | "unknown";

export type CoursesListClientResponse =
  | {
      ok: true;
      httpStatus: 200;
      code: "ok";
      courses: SafeCourseSummary[];
    }
  | {
      ok: false;
      httpStatus: number;
      code: CoursesCode;
      message?: string;
      detail?: string;
    };

export type CourseDetailClientResponse =
  | {
      ok: true;
      httpStatus: 200;
      code: "ok";
      course: SafeCourseDetail;
    }
  | {
      ok: false;
      httpStatus: number;
      code: CoursesCode;
      message?: string;
      detail?: string;
    };

export function isCoursesListSuccess(
  response: CoursesListClientResponse,
): response is Extract<CoursesListClientResponse, { ok: true }> {
  return response.ok && response.httpStatus === 200;
}

export function isCourseDetailSuccess(
  response: CourseDetailClientResponse,
): response is Extract<CourseDetailClientResponse, { ok: true }> {
  return response.ok && response.httpStatus === 200;
}

export type EnrollCourseClientResponse =
  | {
      ok: true;
      httpStatus: 201;
      code: "ok";
      enrollment: SafeEnrollment;
    }
  | {
      ok: false;
      httpStatus: number;
      code: CoursesCode | "conflict";
      message?: string;
      detail?: string;
    };

export function isEnrollCourseSuccess(
  response: EnrollCourseClientResponse,
): response is Extract<EnrollCourseClientResponse, { ok: true }> {
  return response.ok && response.httpStatus === 201;
}

export type CompleteCourseClientResponse =
  | {
      ok: true;
      httpStatus: 200;
      code: "ok";
      enrollment: SafeEnrollment;
    }
  | {
      ok: false;
      httpStatus: number;
      code: CoursesCode | "not_found";
      message?: string;
      detail?: string;
    };

export function isCompleteCourseSuccess(
  response: CompleteCourseClientResponse,
): response is Extract<CompleteCourseClientResponse, { ok: true }> {
  return response.ok && response.httpStatus === 200;
}
