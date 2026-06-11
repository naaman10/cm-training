"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { LessonHub } from "@/app/courses/lesson-hub";
import { LessonQuestionPage } from "@/app/courses/lesson-question-page";
import {
  courseDetailPath,
  courseSlugMatches,
  looksLikeContentfulEntryId,
} from "@/lib/courses/course-slug";
import { courseDisplayTitle } from "@/lib/courses/course-utils";
import { isLessonAccessible } from "@/lib/courses/lesson-utils";
import { answersByQuestionId } from "@/lib/courses/lesson-progress";
import {
  lessonDetailPath,
  lessonQuestionPath,
  parseLessonQuestionIndex,
} from "@/lib/courses/lesson-path";
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
import type {
  LessonClientResponse,
  SaveLessonAnswerClientResponse,
  StartLessonClientResponse,
} from "@/types/lessons";
import {
  isLessonSuccess,
  isSaveLessonAnswerSuccess,
  isStartLessonSuccess,
} from "@/types/lessons";

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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const questionIndex = parseLessonQuestionIndex(searchParams.get("q"));

  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [httpStatus, setHttpStatus] = useState<number | null>(null);
  const [course, setCourse] = useState<SafeCourseDetail | null>(null);
  const [session, setSession] = useState<LessonSession | null>(null);

  const loadLessonContent = useCallback(
    async (courseId: string, useStart: boolean): Promise<LessonSession | null> => {
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
          const nextSession = { lesson: payload.lesson, progress: payload.progress };
          setSession(nextSession);
          return nextSession;
        }
        const status =
          typeof payload.httpStatus === "number" ? payload.httpStatus : res.status;
        setHttpStatus(status);
        setError(payload.message ?? "Could not start lesson.");
        return null;
      }

      const payload = (await res.json()) as LessonClientResponse;
      if (isLessonSuccess(payload)) {
        const nextSession = { lesson: payload.lesson, progress: payload.progress };
        setSession(nextSession);
        return nextSession;
      }

      const status =
        typeof payload.httpStatus === "number" ? payload.httpStatus : res.status;
      setHttpStatus(status);
      setError(payload.message ?? "Could not load lesson.");
      return null;
    },
    [lessonId],
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setHttpStatus(null);

      const loadedCourse = await fetchCourseByRef(courseSlug);
      if (cancelled) return;

      if (!loadedCourse) {
        setCourse(null);
        setSession(null);
        setError("Course not found.");
        setHttpStatus(404);
        setLoading(false);
        return;
      }

      setCourse(loadedCourse);

      if (!isLessonAccessible(loadedCourse.enrollmentStatus)) {
        setSession(null);
        setError("Enroll in this course to access lessons.");
        setHttpStatus(404);
        setLoading(false);
        return;
      }

      const outlineLesson = loadedCourse.lessons.find((item) => item.id === lessonId);
      if (!outlineLesson) {
        setSession(null);
        setError("Lesson not found on this course.");
        setHttpStatus(404);
        setLoading(false);
        return;
      }

      const loadedSession = await loadLessonContent(loadedCourse.id, false);
      if (cancelled) return;
      if (!loadedSession) {
        setSession(null);
        setLoading(false);
        return;
      }

      if (!cancelled) {
        setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [courseSlug, lessonId, questionIndex, loadLessonContent]);

  const courseHref = course ? courseDetailPath(course) : "/courses";
  const courseTitle = course ? courseDisplayTitle(course) : "Course";
  const hubHref = course ? lessonDetailPath(course, lessonId) : pathname;

  useEffect(() => {
    if (loading || questionIndex == null || !session) return;
    if (questionIndex >= session.lesson.questions.length) {
      router.replace(hubHref);
    }
  }, [loading, questionIndex, session, router, hubHref]);

  const outlineLessonForCounts = course?.lessons.find(
    (item) => item.id === lessonId,
  );
  const progress = session?.progress;
  const sessionQuestionTotal = session?.lesson.questions.length ?? 0;
  const questionCount =
    sessionQuestionTotal > 0
      ? sessionQuestionTotal
      : (progress?.questionCount ?? outlineLessonForCounts?.questionCount ?? 0);
  const answeredCount =
    progress?.answeredCount ?? outlineLessonForCounts?.answeredCount ?? 0;
  const answerMap = progress ? answersByQuestionId(progress) : {};

  function goToQuestion(index: number) {
    if (!course) return;
    router.push(lessonQuestionPath(course, lessonId, index));
  }

  async function handleStart() {
    if (!course) return;
    setStarting(true);
    setError(null);

    const outlineLesson = course.lessons.find((item) => item.id === lessonId);
    const lessonStarted = outlineLesson?.lessonStatus !== "not_started";

    let loadedSession = session;
    if (!lessonStarted) {
      loadedSession = await loadLessonContent(course.id, true);
    } else if (!loadedSession) {
      loadedSession = await loadLessonContent(course.id, false);
    }

    setStarting(false);
    if (!loadedSession) return;

    const totalQuestions = loadedSession.lesson.questions.length;
    if (totalQuestions === 0) return;

    const { nextQuestionIndex } = loadedSession.progress;
    const nextIndex =
      nextQuestionIndex >= 0 && nextQuestionIndex < totalQuestions
        ? nextQuestionIndex
        : 0;
    goToQuestion(nextIndex);
  }

  function handleContinue() {
    if (!session) return;
    const total = session.lesson.questions.length;
    const { nextQuestionIndex } = session.progress;
    if (nextQuestionIndex < total) {
      goToQuestion(nextQuestionIndex);
    }
  }

  async function handleQuestionNext(selectedAnswerId: string) {
    if (!course || !session || questionIndex == null) return;
    const question = session.lesson.questions[questionIndex];
    if (!question) return;

    setSaving(true);
    setError(null);

    let res: Response;
    let payload: SaveLessonAnswerClientResponse;
    try {
      res = await fetch(
        `/api/courses/${encodeURIComponent(course.id)}/lessons/${encodeURIComponent(lessonId)}/answers`,
        {
          method: "POST",
          credentials: "include",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionId: question.id,
            answerId: selectedAnswerId,
          }),
        },
      );
      payload = (await res.json()) as SaveLessonAnswerClientResponse;
    } catch {
      setSaving(false);
      setError("Network error while saving your answer. Please retry.");
      return;
    }

    setSaving(false);

    if (!isSaveLessonAnswerSuccess(payload)) {
      setHttpStatus(
        typeof payload.httpStatus === "number" ? payload.httpStatus : res.status,
      );
      setError(payload.message ?? "Could not save answer.");
      return;
    }

    const nextSession = { lesson: payload.lesson, progress: payload.progress };
    setSession(nextSession);

    const total = payload.lesson.questions.length;
    const { nextQuestionIndex } = payload.progress;
    if (nextQuestionIndex < total) {
      goToQuestion(nextQuestionIndex);
      return;
    }
    router.push(hubHref);
  }

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

  const outlineLesson = course.lessons.find((item) => item.id === lessonId);
  if (!outlineLesson) {
    return null;
  }

  const lessonStarted = outlineLesson.lessonStatus !== "not_started";

  if (questionIndex != null) {
    if (!session || session.lesson.questions.length === 0) {
      return (
        <div className="flex min-h-[50vh] items-center justify-center px-6">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Redirecting…</p>
        </div>
      );
    }

    if (questionIndex >= session.lesson.questions.length) {
      return (
        <div className="flex min-h-[50vh] items-center justify-center px-6">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Redirecting…</p>
        </div>
      );
    }

    const question = session.lesson.questions[questionIndex];
    if (!question) {
      return null;
    }

    return (
      <LessonQuestionPage
        lesson={session.lesson}
        question={question}
        questionIndex={questionIndex}
        questionCount={questionCount}
        courseHref={courseHref}
        courseTitle={courseTitle}
        hubHref={hubHref}
        initialSelectedId={answerMap[question.id] ?? null}
        saving={saving}
        onNext={(selectedAnswerId) => void handleQuestionNext(selectedAnswerId)}
      />
    );
  }

  return (
    <LessonHub
      courseHref={courseHref}
      courseTitle={courseTitle}
      outlineLesson={outlineLesson}
      answeredCount={answeredCount}
      questionCount={questionCount}
      lessonStarted={lessonStarted}
      starting={starting}
      onStart={() => void handleStart()}
      onContinue={handleContinue}
    />
  );
}
