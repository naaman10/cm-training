import type { EnrollmentStatus, SafeCourseSummary } from "@/types/course";

export function courseDisplayTitle(course: SafeCourseSummary): string {
  return (
    course.courseName?.trim() ||
    course.internalName?.trim() ||
    "Untitled course"
  );
}

export function isEnrolledStatus(status: EnrollmentStatus): boolean {
  return status === "enrolled" || status === "completed";
}

export function splitCoursesByEnrollment(courses: SafeCourseSummary[]): {
  yourCourses: SafeCourseSummary[];
  availableCourses: SafeCourseSummary[];
} {
  const yourCourses: SafeCourseSummary[] = [];
  const availableCourses: SafeCourseSummary[] = [];

  for (const course of courses) {
    if (isEnrolledStatus(course.enrollmentStatus)) {
      yourCourses.push(course);
    } else {
      availableCourses.push(course);
    }
  }

  const byTitle = (a: SafeCourseSummary, b: SafeCourseSummary) =>
    courseDisplayTitle(a).localeCompare(courseDisplayTitle(b), undefined, {
      sensitivity: "base",
    });

  return {
    yourCourses: yourCourses.sort(byTitle),
    availableCourses: availableCourses.sort(byTitle),
  };
}
