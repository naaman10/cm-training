"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { FeatureUnauthorized } from "@/components/feature-unauthorized";
import { usePortalSession } from "@/context/portal-session";
import {
  courseDetailPath,
  courseSlugMatches,
  looksLikeContentfulEntryId,
} from "@/lib/courses/course-slug";
import { courseDisplayTitle } from "@/lib/courses/course-utils";
import {
  continueLearningHref,
  isLessonAccessible,
} from "@/lib/courses/lesson-utils";
import { emptyLessonProgressFields } from "@/lib/courses/lesson-progress";
import { lessonDetailPath } from "@/lib/courses/lesson-path";
import { FEATURE_NAMES } from "@/lib/features/names";
import { richTextToPlainText } from "@/lib/courses/rich-text";
import type { SafeCourseDetail, SafeCourseLesson } from "@/types/course";
import type {
  CompleteCourseClientResponse,
  CourseDetailClientResponse,
  CoursesListClientResponse,
  EnrollCourseClientResponse,
} from "@/types/courses";
import {
  isCompleteCourseSuccess,
  isCourseDetailSuccess,
  isCoursesListSuccess,
  isEnrollCourseSuccess,
} from "@/types/courses";

import { CourseDetailActions } from "../course-detail-actions";
import { CourseHero } from "../course-hero";
import { CourseLessonRow } from "../course-lesson-row";

type CourseDetailViewProps = {
  courseRef: string;
};

function buildLessons(course: SafeCourseDetail): SafeCourseLesson[] {
  if (course.lessons.length > 0) return course.lessons;
  if (course.lessonCount <= 0) return [];
  return Array.from({ length: course.lessonCount }, (_, index) => ({
    id: `placeholder-${index + 1}`,
    order: index + 1,
    lessonName: index === 0 ? "Introduction" : `Lesson ${index + 1}`,
    lessonDescription: null,
    lessonStatus: "not_started" as const,
    startedAt: null,
    startedAtUk: null,
    completedAt: null,
    completedAtUk: null,
    ...emptyLessonProgressFields(),
  }));
}

function CourseMeta({
  lessonCount,
  completionCriteria,
}: {
  lessonCount: number;
  completionCriteria: number | null | undefined;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="font-semibold text-zinc-900 dark:text-zinc-50">
        {lessonCount} lesson{lessonCount === 1 ? "" : "s"}
      </span>
      {completionCriteria != null ? (
        <span className="text-zinc-500 dark:text-zinc-400">
          Pass {completionCriteria}%
        </span>
      ) : null}
    </div>
  );
}

function EnrollmentBanners({ course }: { course: SafeCourseDetail }) {
  return (
    <>
      {course.enrollmentStatus === "completed" && course.completedAtUk ? (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
          Completed on {course.completedAtUk}
        </p>
      ) : null}

      {course.enrollmentStatus === "enrolled" && course.enrolledAtUk ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Enrolled {course.enrolledAtUk}
        </p>
      ) : null}
    </>
  );
}

export function CourseDetailView({ courseRef }: CourseDetailViewProps) {
  const router = useRouter();
  const { can } = usePortalSession();
  const canViewCourses = can(FEATURE_NAMES.courses);
  const canEnroll = can(FEATURE_NAMES.enrollments);
  const canAccessLessons = can(FEATURE_NAMES.lessons);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [httpStatus, setHttpStatus] = useState<number | null>(null);
  const [course, setCourse] = useState<SafeCourseDetail | null>(null);

  async function loadCourse() {
    setLoading(true);
    setError(null);
    setDetail(null);
    setHttpStatus(null);

    const ref = courseRef.trim();
    const byId = looksLikeContentfulEntryId(ref);
    const detailUrl = byId
      ? `/api/courses/${encodeURIComponent(ref)}`
      : `/api/courses/by-slug/${encodeURIComponent(ref)}`;

    let res: Response;
    let payload: CourseDetailClientResponse;
    try {
      res = await fetch(detailUrl, {
        credentials: "include",
        cache: "no-store",
      });
      payload = (await res.json()) as CourseDetailClientResponse;
    } catch {
      setError("Could not load course. Please retry.");
      setHttpStatus(503);
      setCourse(null);
      setLoading(false);
      return;
    }

    if (isCourseDetailSuccess(payload)) {
      const loaded = payload.course;
      setCourse(loaded);
      setLoading(false);

      if (byId && loaded.courseSlug?.trim()) {
        router.replace(courseDetailPath(loaded));
      }
      return;
    }

    let status =
      typeof payload.httpStatus === "number" ? payload.httpStatus : res.status;

    if (!byId && status === 404) {
      try {
        const listRes = await fetch("/api/courses", {
          credentials: "include",
          cache: "no-store",
        });
        const listPayload = (await listRes.json()) as CoursesListClientResponse;
        if (isCoursesListSuccess(listPayload)) {
          const match = listPayload.courses.find((item) =>
            courseSlugMatches(item.courseSlug, ref),
          );
          if (match) {
            const idRes = await fetch(
              `/api/courses/${encodeURIComponent(match.id)}`,
              { credentials: "include", cache: "no-store" },
            );
            const idPayload = (await idRes.json()) as CourseDetailClientResponse;
            if (isCourseDetailSuccess(idPayload)) {
              setCourse(idPayload.course);
              setLoading(false);
              return;
            }
            payload = idPayload;
            status =
              typeof idPayload.httpStatus === "number"
                ? idPayload.httpStatus
                : idRes.status;
          }
        }
      } catch {
        // Keep original slug lookup error below.
      }
    }

    setHttpStatus(status);
    setError(payload.message ?? "Could not load course.");
    setDetail(typeof payload.detail === "string" ? payload.detail : null);
    setCourse(null);
    setLoading(false);
  }

  async function enrollInCourse() {
    if (!course || course.enrollmentStatus !== "available" || !canEnroll) return;

    setEnrolling(true);
    setActionError(null);

    let res: Response;
    let payload: EnrollCourseClientResponse;
    try {
      res = await fetch(
        `/api/courses/${encodeURIComponent(course.id)}/enroll`,
        { method: "POST", credentials: "include" },
      );
      payload = (await res.json()) as EnrollCourseClientResponse;
    } catch {
      setEnrolling(false);
      setActionError("Network error while enrolling. Please retry.");
      return;
    }

    if (isEnrollCourseSuccess(payload)) {
      await loadCourse();
      setEnrolling(false);
      router.refresh();
      return;
    }

    const status =
      typeof payload.httpStatus === "number" ? payload.httpStatus : res.status;
    setEnrolling(false);
    if (status === 409) {
      await loadCourse();
      return;
    }
    setActionError(payload.message ?? "Could not enroll in this course.");
  }

  async function markComplete() {
    if (!course || course.enrollmentStatus !== "enrolled") return;
    if (
      !window.confirm(
        "Mark this course as complete? You can still review the lessons afterwards.",
      )
    ) {
      return;
    }

    setCompleting(true);
    setActionError(null);

    let res: Response;
    let payload: CompleteCourseClientResponse;
    try {
      res = await fetch(
        `/api/courses/${encodeURIComponent(course.id)}/complete`,
        { method: "POST", credentials: "include" },
      );
      payload = (await res.json()) as CompleteCourseClientResponse;
    } catch {
      setCompleting(false);
      setActionError("Network error while marking complete. Please retry.");
      return;
    }

    if (isCompleteCourseSuccess(payload)) {
      await loadCourse();
      setCompleting(false);
      router.refresh();
      return;
    }

    setCompleting(false);
    setActionError(payload.message ?? "Could not mark course complete.");
  }

  useEffect(() => {
    if (!canViewCourses) return;
    queueMicrotask(() => {
      void loadCourse();
    });
  }, [courseRef, canViewCourses]);

  if (!canViewCourses) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10">
        <FeatureUnauthorized message="You do not have access to courses." />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-6 lg:min-h-[60vh]">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Loading course…
        </p>
      </div>
    );
  }

  if (error || !course) {
    const isBlocked = httpStatus === 403;
    const isNotFound = httpStatus === 404;
    return (
      <div className="mx-auto max-w-lg px-4 py-10 lg:max-w-2xl lg:px-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-100">
          <h2 className="text-lg font-semibold">
            {isNotFound
              ? "Course not found"
              : isBlocked
                ? "Access blocked"
                : "Could not load course"}
          </h2>
          <p className="mt-2 text-sm">{error}</p>
          {detail ? (
            <p className="mt-1 text-xs opacity-80">{detail}</p>
          ) : null}
          <Link
            href="/courses"
            className="mt-4 inline-block text-sm font-medium underline"
          >
            Back to courses
          </Link>
        </div>
      </div>
    );
  }

  const title = courseDisplayTitle(course);
  const description = richTextToPlainText(course.courseDescription);
  const lessons = buildLessons(course);
  const lessonCount = course.lessonCount || lessons.length;
  const previewImageUrl = course.thumbnail?.url ?? null;
  const subtitle = course.courseRole
    ? `For ${course.courseRole} learners`
    : null;

  const actionProps = {
    enrollmentStatus: course.enrollmentStatus,
    enrolling,
    completing,
    actionError,
    continueHref: canAccessLessons ? continueLearningHref(course) : null,
    canEnroll,
    canAccessLessons,
    onEnroll: () => void enrollInCourse(),
    onComplete: () => void markComplete(),
  };

  const lessonsUnlocked =
    canAccessLessons && isLessonAccessible(course.enrollmentStatus);

  const lessonList =
    lessons.length === 0 ? (
      <div className="rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        No lessons published yet.
      </div>
    ) : (
      <ul>
        {lessons.map((lesson) => (
          <CourseLessonRow
            key={lesson.id}
            lesson={lesson}
            locked={!lessonsUnlocked}
            href={
              lessonsUnlocked ? lessonDetailPath(course, lesson.id) : null
            }
            previewImageUrl={previewImageUrl}
          />
        ))}
      </ul>
    );

  return (
    <div className="mx-auto min-h-screen w-full max-w-lg bg-zinc-100 pb-28 dark:bg-zinc-950 lg:max-w-6xl lg:px-8 lg:pb-10 lg:pt-6">
      <div className="lg:grid lg:grid-cols-12 lg:items-start lg:gap-8 xl:gap-10">
        <aside className="lg:sticky lg:top-6 lg:col-span-5 lg:self-start xl:col-span-4">
          <Link
            href="/courses"
            className="mb-4 hidden items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 lg:inline-flex"
          >
            <span aria-hidden>←</span>
            All courses
          </Link>

          <CourseHero
            thumbnail={course.thumbnail}
            title={title}
            subtitle={subtitle}
            backHref="/courses"
          />

          <div className="mt-6 hidden space-y-5 lg:block">
            <CourseMeta
              lessonCount={lessonCount}
              completionCriteria={course.completionCriteria}
            />

            {description ? (
              <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {description}
              </p>
            ) : null}

            <div className="space-y-3">
              <EnrollmentBanners course={course} />
            </div>

            <CourseDetailActions {...actionProps} />
          </div>
        </aside>

        <div className="relative -mt-6 rounded-t-[28px] bg-white px-5 pb-6 pt-6 shadow-sm dark:bg-zinc-900 lg:col-span-7 lg:mt-0 lg:rounded-2xl lg:border lg:border-zinc-200 lg:px-8 lg:py-8 lg:shadow-sm dark:lg:border-zinc-800 xl:col-span-8">
          <div className="mb-4 lg:hidden">
            <CourseMeta
              lessonCount={lessonCount}
              completionCriteria={course.completionCriteria}
            />
          </div>

          {description ? (
            <p className="mb-6 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 lg:hidden">
              {description}
            </p>
          ) : null}

          <div className="mb-4 space-y-3 lg:hidden">
            <EnrollmentBanners course={course} />
          </div>

          <h2 className="mb-4 hidden text-lg font-semibold text-zinc-900 dark:text-zinc-50 lg:block">
            Lessons
          </h2>

          {lessonList}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/95 px-4 py-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95 lg:hidden">
        <div className="mx-auto w-full max-w-lg">
          <CourseDetailActions {...actionProps} />
        </div>
      </div>
    </div>
  );
}
