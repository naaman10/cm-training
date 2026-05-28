import { MainNav } from "@/components/main-nav";

import { AdminUsersView } from "./users-view";

function getStringParam(
  value: string | string[] | undefined,
): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value[0]) return value[0];
  return undefined;
}

export default async function AdminUsersPage(props: PageProps<"/admin/users">) {
  const searchParams = await props.searchParams;
  const created = getStringParam(searchParams.created) === "1";
  const createdEmail = getStringParam(searchParams.email);

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <header>
        <MainNav actionHref="/auth/logout" actionLabel="Logout" />
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-10">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            User Management
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Admin-only view of all portal users.
          </p>
        </div>
        {created ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-100">
            User created successfully
            {createdEmail ? `: ${createdEmail}` : "."}
          </div>
        ) : null}
        <AdminUsersView />
      </main>
    </div>
  );
}
