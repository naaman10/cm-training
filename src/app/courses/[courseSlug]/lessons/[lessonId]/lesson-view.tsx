"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { LessonQuiz } from "@/app/courses/lesson-quiz";
import {
  courseDetailPath,
  courseSlugMatches,
  looksLikeContentfulEntryId,
} from "@/lib/courses/course-slug";
import { courseDisplayTitle } from "@/lib/courses/course-utils";
import { isLessonAccessible } from "@/lib/courses/lesson-utils";
import { richTextToPlainText } from "@/lib/courses/rich-text";
import type { SafeCourseDetail } from "@/types/course";
import type { LessonSession } from "@/types/lesson";
import type {
  CourseDetailClientResponse,
  CoursesListClientResponse,
} from "@/types/courses";
import {
  isCourseDetailSuccess,
  isCoursesListSuccess,
} from "@/types/courses";
import type { LessonClientResponse, StartLessonClientResponse } from "@/types/lessons";
import { isLessonSuccess, isStartLessonSuccess } from "@/types/lessons";

type LessonViewProps = {
  courseSlug: string;
  lessonId: string;
};

async function fetchCourseByRef(
  courseRef: string,
): Promise<SafeCourseDetail | null> {
  const byId = looksLikeContentfulEntryId(courseRef);
  const detailUrl = byId
    ? `/api/courses/${encodeURIComponent(courseRef)}`
    : `/api/courses/by-slug/${encodeURIComponent(courseRef)}`;

  let res = await fetch(detailUrl, { credentials: "include", cache: "no-store" });
  let payload = (await res.json()) as CourseDetailClientResponse;

  if (!isCourseDetailSuccess(payload) && !byId && res.status === 404) {
    const listRes = await fetch("/api/courses", {
      credentials: "include",
      cache: "no-store",
    });
    const listPayload = (await listRes.json()) as CoursesListClientResponse;
    if (isCoursesListSuccess(listPayload)) {
      const match = listPayload.courses.find((course) =>
        courseSlugMatches(course.courseSlug, courseRef),
      );
      if (match) {
        res = await fetch(`/api/courses/${encodeURIComponent(match.id)}`, {
          credentials: "include",
          cache: "no-store",
        });
        payload = (await res.json()) as CourseDetailClientResponse;
      }
    }
  }

  return isCourseDetailSuccess(payload) ? payload.course : null;
}

export function LessonView({ courseSlug, lessonId }: LessonViewProps) {
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [httpStatus, setHttpStatus] = useState<number | null>(null);
  const [course, setCourse] = useState<SafeCourseDetail | null>(null);
  const [session, setSession] = useState<LessonSession | null>(null);
  const [needsStart, setNeedsStart] = useState(false);

  const applySession = useCallback((payload: LessonSession) => {
    setSession(payload);
    setNeedsStart(false);
  }, []);

  const loadLessonContent = useCallback(
    async (courseId: string, useStart: boolean) => {
      const url = useStart
        ? `/api/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}/start`
        : `/api/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}`;

      const res = await fetch(url, {
        method: useStart ? "POST" : "GET",
        credentials: "include",
        cache: "no-store",
      });
      if (useStart) {
        const payload = (await res.json()) as StartLessonClientResponse;
        if (isStartLessonSuccess(payload)) {
          applySession({ lesson: payload.lesson, progress: payload.progress });
          return true;
        }
        const status =
          typeof payload.httpStatus === "number" ? payload.httpStatus : res.status;
        setHttpStatus(status);
        setError(payload.message ?? "Could not load lesson.");
        return false;
      }

      const payload = (await res.json()) as LessonClientResponse;
      if (isLessonSuccess(payload)) {
        applySession({ lesson: payload.lesson, progress: payload.progress });
        return true;
      }

      const status =
        typeof payload.httpStatus === "number" ? payload.httpStatus : res.status;
      setHttpStatus(status);
      setError(payload.message ?? "Could not load lesson.");
      return false;
    },
    [applySession, lessonId],
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setHttpStatus(null);
      setSession(null);
      setNeedsStart(false);

      const loadedCourse = await fetchCourseByRef(courseSlug);
      if (cancelled) return;

      if (!loadedCourse) {
        setCourse(null);
        setError("Course not found.");
        setHttpStatus(404);
        setLoading(false);
        return;
      }

      setCourse(loadedCourse);

      if (!isLessonAccessible(loadedCourse.enrollmentStatus)) {
        setError("Enroll in this course to access lessons.");
        setHttpStatus(404);
        setLoading(false);
        return;
      }

      const outlineLesson = loadedCourse.lessons.find((item) => item.id === lessonId);
      if (!outlineLesson) {
        setError("Lesson not found on this course.");
        setHttpStatus(404);
        setLoading(false);
        return;
      }

      if (outlineLesson.lessonStatus === "not_started") {
        setNeedsStart(true);
        setLoading(false);
        return;
      }

      const ok = await loadLessonContent(loadedCourse.id, false);
      if (!cancelled) {
        setLoading(false);
        if (!ok) setSession(null);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [courseSlug, lessonId, loadLessonContent]);

  async function handleStartLesson() {
    if (!course) return;
    setStarting(true);
    setError(null);
    const ok = await loadLessonContent(course.id, true);
    setStarting(false);
    if (!ok) {
      setNeedsStart(true);
    }
  }

  const courseHref = course ? courseDetailPath(course) : "/courses";
  const courseTitle = course ? courseDisplayTitle(course) : "Course";

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-6">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading lesson…</p>
      </div>
    );
  }

  if (error || !course) {
    const isEnrollment = httpStatus === 404 && error?.includes("Enroll");
    return (
      <div className="mx-auto max-w-lg px-4 py-10 lg:max-w-2xl lg:px-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-100">
          <h2 className="text-lg font-semibold">
            {isEnrollment ? "Enrollment required" : "Could not load lesson"}
          </h2>
          <p className="mt-2 text-sm">{error}</p>
          <Link
            href={courseHref}
            className="mt-4 inline-block text-sm font-medium underline"
          >
            Back to {courseTitle}
          </Link>
        </div>
      </div>
    );
  }

  if (needsStart && !session) {
    const outlineLesson = course.lessons.find((item) => item.id === lessonId);
    const intro = richTextToPlainText(outlineLesson?.lessonDescription);

    return (
      <div className="mx-auto min-h-screen w-full max-w-lg bg-zinc-100 px-4 py-8 dark:bg-zinc-950 lg:max-w-3xl lg:px-8">
        <Link
          href={courseHref}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <span aria-hidden>←</span>
          {courseTitle}
        </Link>

        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-medium uppercase tracking-wide text-violet-600 dark:text-violet-400">
            Lesson {outlineLesson?.order ?? "—"}
          </p>
          <h1 className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {outlineLesson?.lessonName?.trim() || "Lesson"}
          </h1>
          {intro ? (
            <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {intro}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => void handleStartLesson()}
            disabled={starting}
            className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-violet-600 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-60"
          >
            {starting ? "Starting…" : "Start lesson"}
          </button>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const description = richTextToPlainText(session.lesson.lessonDescription);

  return (
    <div className="mx-auto min-h-screen w-full max-w-lg bg-zinc-100 pb-10 dark:bg-zinc-950 lg:max-w-3xl lg:px-8 lg:py-6">
      <Link
        href={courseHref}
        className="inline-flex items-center gap-1.5 px-4 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 lg:px-0"
      >
        <span aria-hidden>←</span>
        {courseTitle}
      </Link>

      <article className="mx-4 mt-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 lg:mx-0 lg:mt-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-violet-600 dark:text-violet-400">
              Lesson
            </p>
            <h1 className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {session.lesson.lessonName?.trim() || "Lesson"}
            </h1>
          </div>
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium capitalize text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            {session.progress.lessonStatus.replace("_", " ")}
          </span>
        </div>

        {session.progress.startedAtUk ? (
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            Started {session.progress.startedAtUk}
          </p>
        ) : null}

        {description ? (
          <div className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            {description}
          </div>
        ) : null}

        <div className="mt-8 border-t border-zinc-100 pt-8 dark:border-zinc-800">
          <LessonQuiz lesson={session.lesson} />
        </div>
      </article>
    </div>
  );
}
