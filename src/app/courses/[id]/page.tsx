import { MainNav } from "@/components/main-nav";

import { CourseDetailView } from "./course-detail-view";

export default async function CourseDetailPage(
  props: PageProps<"/courses/[id]">,
) {
  const { id } = await props.params;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-100 dark:bg-zinc-950">
      <header className="hidden lg:block">
        <MainNav actionHref="/auth/logout" actionLabel="Logout" />
      </header>
      <CourseDetailView courseId={id} />
    </div>
  );
}
