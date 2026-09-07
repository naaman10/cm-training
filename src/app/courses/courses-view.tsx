"use client";

import { useEffect, useMemo, useState } from "react";

import { FeatureUnauthorized } from "@/components/feature-unauthorized";
import { usePortalSession } from "@/context/portal-session";
import { splitCoursesByEnrollment } from "@/lib/courses/course-utils";
import { FEATURE_NAMES } from "@/lib/features/names";
import type { SafeCourseSummary } from "@/types/course";
import type { CoursesListClientResponse } from "@/types/courses";
import { isCoursesListSuccess } from "@/types/courses";

import { CoursesSection } from "./courses-section";

export function CoursesView() {
  const { can } = usePortalSession();
  const canViewCourses = can(FEATURE_NAMES.courses);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [httpStatus, setHttpStatus] = useState<number | null>(null);
  const [courses, setCourses] = useState<SafeCourseSummary[]>([]);

  async function loadCourses() {
    setLoading(true);
    setError(null);
    setDetail(null);
    setHttpStatus(null);

    let res: Response;
    let payload: CoursesListClientResponse;
    try {
      res = await fetch("/api/courses", {
        credentials: "include",
        cache: "no-store",
      });
      payload = (await res.json()) as CoursesListClientResponse;
    } catch {
      setError("Could not load courses. Please retry.");
      setHttpStatus(503);
      setCourses([]);
      setLoading(false);
      return;
    }

    if (isCoursesListSuccess(payload)) {
      setCourses(payload.courses);
      setLoading(false);
      return;
    }

    const status =
      typeof payload.httpStatus === "number" ? payload.httpStatus : res.status;
    setHttpStatus(status);
    setError(payload.message ?? "Could not load courses.");
    setDetail(typeof payload.detail === "string" ? payload.detail : null);
    setCourses([]);
    setLoading(false);
  }

  useEffect(() => {
    if (!canViewCourses) return;
    queueMicrotask(() => {
      void loadCourses();
    });
  }, [canViewCourses]);

  const { yourCourses, availableCourses } = useMemo(
    () => splitCoursesByEnrollment(courses),
    [courses],
  );

  if (!canViewCourses) {
    return (
      <FeatureUnauthorized message="You do not have access to courses." />
    );
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Loading courses…
        </p>
      </div>
    );
  }

  if (error) {
    const isBlocked = httpStatus === 403;
    const isUnavailable = httpStatus === 503;
    return (
      <div
        className={`rounded-2xl border p-6 shadow-sm ${
          isBlocked
            ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100"
            : "border-red-200 bg-red-50 text-red-900 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-100"
        }`}
      >
        <h2 className="text-lg font-semibold">
          {isBlocked
            ? "Access blocked"
            : isUnavailable
              ? "Courses unavailable"
              : "Could not load courses"}
        </h2>
        <p className="mt-2 text-sm">{error}</p>
        {detail ? (
          <p className="mt-2 text-xs font-mono opacity-85">{detail}</p>
        ) : null}
        {httpStatus != null ? (
          <p className="mt-2 text-xs opacity-85">HTTP {httpStatus}</p>
        ) : null}
        {httpStatus === 401 ? (
          <p className="mt-2 text-xs">
            Your session may have expired. Sign in again to continue.
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          {!isBlocked ? (
            <button
              type="button"
              onClick={() => void loadCourses()}
              className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
            >
              Retry
            </button>
          ) : null}
          {httpStatus === 401 ? (
            <a
              href="/auth/logout?returnTo=/auth/login?returnTo=%2Fcourses"
              className="rounded-full border border-current px-4 py-2 text-sm font-medium opacity-90 hover:opacity-100"
            >
              Re-authenticate
            </a>
          ) : null}
        </div>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No courses are available for your role yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {yourCourses.length > 0 ? (
        <CoursesSection
          title="Your courses"
          description="Courses you are enrolled in."
          courses={yourCourses}
          emptyMessage=""
        />
      ) : null}
      <CoursesSection
        title="Available courses"
        description="Courses you can enroll in."
        courses={availableCourses}
        emptyMessage="You are enrolled in all available courses."
      />
    </div>
  );
}
