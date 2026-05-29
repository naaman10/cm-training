"use client";

import { useEffect, useState } from "react";

import { normalizeCourseThumbnail } from "@/lib/courses/normalize-thumbnail";
import type { SafeCourseSummary } from "@/types/course";
import type { CoursesListClientResponse } from "@/types/courses";
import { isCoursesListSuccess } from "@/types/courses";

import { CourseCard } from "./course-card";

export function CoursesView() {
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
      const withThumbnails = payload.courses.map((course) => ({
        ...course,
        thumbnail: normalizeCourseThumbnail(course.thumbnail),
      }));
      const sorted = [...withThumbnails].sort((a, b) =>
        (a.courseName ?? a.internalName ?? "").localeCompare(
          b.courseName ?? b.internalName ?? "",
          undefined,
          { sensitivity: "base" },
        ),
      );
      setCourses(sorted);
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
    queueMicrotask(() => {
      void loadCourses();
    });
  }, []);

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
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <li key={course.id}>
          <CourseCard course={course} />
        </li>
      ))}
    </ul>
  );
}
