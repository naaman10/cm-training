import { fetchCmTrainingApiWithBearer } from "@/lib/api/client";
import { normalizeCourseThumbnail } from "@/lib/courses/normalize-thumbnail";
import type {
  EnrollmentStatus,
  SafeCourseDetail,
  SafeCourseLesson,
  SafeCourseSummary,
  SafeEnrollment,
} from "@/types/course";
import type {
  CourseDetailClientResponse,
  CoursesListClientResponse,
  EnrollCourseClientResponse,
  CompleteCourseClientResponse,
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

function normalizeEnrollmentStatus(raw: unknown): EnrollmentStatus {
  if (raw === "enrolled" || raw === "completed" || raw === "available") {
    return raw;
  }
  return "available";
}

function normalizeNullableString(raw: unknown): string | null {
  return typeof raw === "string" && raw.trim() ? raw : null;
}

function normalizeCourseLessons(raw: unknown): SafeCourseLesson[] {
  if (!Array.isArray(raw)) return [];
  const lessons: SafeCourseLesson[] = [];
  raw.forEach((item, index) => {
    if (!item || typeof item !== "object") return;
    const lesson = item as SafeCourseLesson;
    if (typeof lesson.id !== "string" || !lesson.id.trim()) return;
    lessons.push({
      id: lesson.id,
      order:
        typeof lesson.order === "number" && lesson.order > 0
          ? lesson.order
          : index + 1,
      lessonName: normalizeNullableString(lesson.lessonName),
      lessonDescription: lesson.lessonDescription ?? null,
    });
  });
  return lessons.sort((a, b) => a.order - b.order);
}

function normalizeCourseSummary(raw: unknown): SafeCourseSummary | null {
  if (!raw || typeof raw !== "object") return null;
  const course = raw as SafeCourseSummary;
  if (typeof course.id !== "string" || !course.id.trim()) return null;
  return {
    id: course.id,
    internalName: normalizeNullableString(course.internalName),
    courseName: normalizeNullableString(course.courseName),
    courseDescription: course.courseDescription ?? null,
    courseRole: course.courseRole ?? null,
    completionCriteria:
      typeof course.completionCriteria === "number"
        ? course.completionCriteria
        : null,
    lessonCount:
      typeof course.lessonCount === "number" ? course.lessonCount : 0,
    thumbnail: normalizeCourseThumbnail(course.thumbnail),
    prerequisiteIds: Array.isArray(course.prerequisiteIds)
      ? course.prerequisiteIds.filter(
          (id): id is string => typeof id === "string" && id.trim().length > 0,
        )
      : [],
    enrollmentStatus: normalizeEnrollmentStatus(course.enrollmentStatus),
    enrolledAt: normalizeNullableString(course.enrolledAt),
    enrolledAtUk: normalizeNullableString(course.enrolledAtUk),
    completedAt: normalizeNullableString(course.completedAt),
    completedAtUk: normalizeNullableString(course.completedAtUk),
  };
}

function normalizeCourseDetail(raw: unknown): SafeCourseDetail | null {
  const summary = normalizeCourseSummary(raw);
  if (!summary) return null;
  const detail = raw as SafeCourseDetail;
  return {
    ...summary,
    prerequisites: Array.isArray(detail.prerequisites)
      ? detail.prerequisites
      : [],
    lessons: normalizeCourseLessons(detail.lessons),
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
    const normalized = normalizeCourseDetail(rawCourse);
    if (normalized) {
      return {
        httpStatus: 200,
        response: {
          ok: true,
          httpStatus: 200,
          code: "ok",
          course: normalized,
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

function normalizeEnrollment(raw: unknown): SafeEnrollment | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  if (typeof row.id !== "string" || !row.id.trim()) return null;
  const courseId =
    typeof row.courseId === "string"
      ? row.courseId
      : typeof row.contentfulCourseId === "string"
        ? row.contentfulCourseId
        : "";
  if (!courseId) return null;
  return {
    id: row.id,
    courseId,
    status: row.status === "completed" ? "completed" : "enrolled",
    enrolledAt: normalizeNullableString(row.enrolledAt),
    enrolledAtUk: normalizeNullableString(row.enrolledAtUk),
    completedAt: normalizeNullableString(row.completedAt),
    completedAtUk: normalizeNullableString(row.completedAtUk),
  };
}

export async function buildEnrollCoursePayload(
  accessToken: string,
  courseId: string,
): Promise<{ response: EnrollCourseClientResponse; httpStatus: number }> {
  let upstream: Response;
  try {
    upstream = await fetchCmTrainingApiWithBearer(
      accessToken,
      `/api/courses/${encodeURIComponent(courseId)}/enroll`,
      {
        method: "POST",
        cache: "no-store",
      },
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

  if (status === 201 && json && typeof json === "object" && "enrollment" in json) {
    const enrollment = normalizeEnrollment(
      (json as { enrollment: unknown }).enrollment,
    );
    if (enrollment) {
      return {
        httpStatus: 201,
        response: {
          ok: true,
          httpStatus: 201,
          code: "ok",
          enrollment,
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
      code:
        status === 409
          ? "conflict"
          : codeForStatus(status),
      message:
        message ??
        (status === 401
          ? "Session expired or token is invalid. Please sign in again."
          : status === 403
            ? "Your account is suspended or blocked."
            : status === 404
              ? "Course not found."
              : status === 409
                ? "You are already enrolled in this course."
                : status === 503
                  ? "Course enrollment is unavailable."
                  : status >= 500
                    ? "Enrollment service encountered an error. Please retry."
                    : "Could not enroll in course."),
      detail,
    },
  };
}

export async function buildCompleteCoursePayload(
  accessToken: string,
  courseId: string,
): Promise<{ response: CompleteCourseClientResponse; httpStatus: number }> {
  let upstream: Response;
  try {
    upstream = await fetchCmTrainingApiWithBearer(
      accessToken,
      `/api/courses/${encodeURIComponent(courseId)}/complete`,
      {
        method: "POST",
        cache: "no-store",
      },
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

  if (status === 200 && json && typeof json === "object" && "enrollment" in json) {
    const enrollment = normalizeEnrollment(
      (json as { enrollment: unknown }).enrollment,
    );
    if (enrollment) {
      return {
        httpStatus: 200,
        response: {
          ok: true,
          httpStatus: 200,
          code: "ok",
          enrollment,
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
      code: status === 404 ? "not_found" : codeForStatus(status),
      message:
        message ??
        (status === 401
          ? "Session expired or token is invalid. Please sign in again."
          : status === 403
            ? "Your account is suspended or blocked."
            : status === 404
              ? "Enrollment not found."
              : status === 503
                ? "Course completion is unavailable."
                : status >= 500
                  ? "Completion service encountered an error. Please retry."
                  : "Could not mark course complete."),
      detail,
    },
  };
}
