/** Stable feature keys for `can()`. Catalog from GET /api/admin/features is the source of truth. */
export const FEATURE_NAMES = {
  userManagement: "user_management",
  courses: "courses",
  enrollments: "enrollments",
  lessons: "lessons",
  socialCreate: "social:create",
  socialPost: "social:post",
} as const;

export type FeatureName = (typeof FEATURE_NAMES)[keyof typeof FEATURE_NAMES];
