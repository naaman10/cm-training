export type CourseRole = "admin" | "instructor" | "learner";

export type EnrollmentStatus = "available" | "enrolled" | "completed";

export type CourseThumbnail = {
  url: string;
  title?: string;
  width?: number;
  height?: number;
};

export type SafeCourseSummary = {
  id: string;
  courseSlug: string | null;
  internalName: string | null;
  courseName: string | null;
  courseDescription: unknown;
  courseRole: CourseRole | null;
  completionCriteria: number | null;
  lessonCount: number;
  thumbnail: CourseThumbnail | null;
  prerequisiteIds: string[];
  enrollmentStatus: EnrollmentStatus;
  enrolledAt: string | null;
  enrolledAtUk: string | null;
  completedAt: string | null;
  completedAtUk: string | null;
};

export type CoursePrerequisite = {
  id: string;
  courseName: string | null;
};

import type { LessonProgress } from "@/types/lesson";

export type SafeCourseLesson = {
  id: string;
  order: number;
  lessonName: string | null;
  lessonDescription: unknown;
} & LessonProgress;

export type SafeCourseDetail = SafeCourseSummary & {
  prerequisites: CoursePrerequisite[];
  lessons: SafeCourseLesson[];
};

export type SafeEnrollment = {
  id: string;
  courseId: string;
  status: "enrolled" | "completed";
  enrolledAt: string | null;
  enrolledAtUk: string | null;
  completedAt: string | null;
  completedAtUk: string | null;
};
