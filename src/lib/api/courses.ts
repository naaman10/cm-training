import { fetchCmTrainingApiWithBearer } from "@/lib/api/client";
import { normalizeCourseThumbnail } from "@/lib/courses/normalize-thumbnail";
import type { SafeCourseDetail, SafeCourseSummary } from "@/types/course";
import type {
  CourseDetailClientResponse,
  CoursesListClientResponse,
} from "@/types/courses";

function codeForStatus(
  status: number,
): Exclude<CoursesListClientResponse["code"], "ok"> {
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

function normalizeCourseSummary(raw: unknown): SafeCourseSummary | null {
  if (!raw || typeof raw !== "object") return null;
  const course = raw as SafeCourseSummary;
  if (typeof course.id !== "string" || !course.id.trim()) return null;
  return {
    ...course,
    thumbnail: normalizeCourseThumbnail(course.thumbnail),
  };
}

function normalizeCoursesList(raw: unknown): SafeCourseSummary[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => normalizeCourseSummary(item))
    .filter((course): course is SafeCourseSummary => course != null);
}

export async function buildCoursesListPayload(
  accessToken: string,
): Promise<{ response: CoursesListClientResponse; httpStatus: number }> {
  let upstream: Response;
  try {
    upstream = await fetchCmTrainingApiWithBearer(accessToken, "/api/courses", {
      cache: "no-store",
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

  if (status === 200 && json && typeof json === "object" && "courses" in json) {
    const courses = (json as { courses: unknown }).courses;
    if (Array.isArray(courses)) {
      return {
        httpStatus: 200,
        response: {
          ok: true,
          httpStatus: 200,
          code: "ok",
          courses: normalizeCoursesList(courses),
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
        (status === 401
          ? "Session expired or token is invalid. Please sign in again."
          : status === 403
            ? "Your account is suspended or blocked."
            : status === 404
              ? "Courses are not available for your profile."
              : status === 503
                ? "Courses are unavailable. Contentful may not be configured on the API."
                : status >= 500
                  ? "Courses service encountered an error. Please retry."
                  : "Could not load courses."),
      detail,
    },
  };
}

export async function buildCourseDetailPayload(
  accessToken: string,
  courseId: string,
): Promise<{ response: CourseDetailClientResponse; httpStatus: number }> {
  let upstream: Response;
  try {
    upstream = await fetchCmTrainingApiWithBearer(
      accessToken,
      `/api/courses/${encodeURIComponent(courseId)}`,
      { cache: "no-store" },
    );
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

  if (status === 200 && json && typeof json === "object" && "course" in json) {
    const rawCourse = (json as { course: unknown }).course;
    const normalized =
      rawCourse && typeof rawCourse === "object"
        ? normalizeCourseSummary(rawCourse)
        : null;
    if (normalized) {
      const detail = rawCourse as SafeCourseDetail;
      return {
        httpStatus: 200,
        response: {
          ok: true,
          httpStatus: 200,
          code: "ok",
          course: {
            ...normalized,
            prerequisites: Array.isArray(detail.prerequisites)
              ? detail.prerequisites
              : [],
          },
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
        (status === 401
          ? "Session expired or token is invalid. Please sign in again."
          : status === 403
            ? "Your account is suspended or blocked."
            : status === 404
              ? "Course not found."
              : status === 503
                ? "Courses are unavailable. Contentful may not be configured on the API."
                : status >= 500
                  ? "Courses service encountered an error. Please retry."
                  : "Could not load course."),
      detail,
    },
  };
}
