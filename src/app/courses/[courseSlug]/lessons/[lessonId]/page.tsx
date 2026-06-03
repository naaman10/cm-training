import { MainNav } from "@/components/main-nav";

import { LessonView } from "./lesson-view";

export default async function CourseLessonPage(
  props: PageProps<"/courses/[courseSlug]/lessons/[lessonId]">,
) {
  const { courseSlug, lessonId } = await props.params;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-100 dark:bg-zinc-950">
      <header className="hidden lg:block">
        <MainNav actionHref="/auth/logout" actionLabel="Logout" />
      </header>
      <LessonView courseSlug={courseSlug} lessonId={lessonId} />
    </div>
  );
}
