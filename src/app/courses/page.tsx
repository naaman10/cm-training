import { MainNav } from "@/components/main-nav";

import { CoursesView } from "./courses-view";

export default function CoursesPage() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <header>
        <MainNav actionHref="/auth/logout" actionLabel="Logout" />
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-10">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Courses
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Training courses available for your role.
          </p>
        </div>
        <CoursesView />
      </main>
    </div>
  );
}
