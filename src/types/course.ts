export type CourseRole = "admin" | "instructor" | "learner";

export type CourseThumbnail = {
  url: string;
  title?: string;
  width?: number;
  height?: number;
};

export type SafeCourseSummary = {
  id: string;
  internalName: string | null;
  courseName: string | null;
  courseDescription: unknown;
  courseRole: CourseRole | null;
  completionCriteria: number;
  lessonCount: number;
  thumbnail: CourseThumbnail | null;
  prerequisiteIds: string[];
};

export type CoursePrerequisite = {
  id: string;
  courseName: string | null;
};

export type SafeCourseDetail = SafeCourseSummary & {
  prerequisites: CoursePrerequisite[];
};
