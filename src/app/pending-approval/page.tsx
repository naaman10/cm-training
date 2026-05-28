import Link from "next/link";
import { redirect } from "next/navigation";

import { auth0 } from "@/lib/auth0";

export default async function PendingApprovalPage() {
  const session = await auth0.getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-16 dark:bg-zinc-950">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-10 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
          CM Training
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Waiting for admin approval
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          You successfully signed in, but your account is not active in the
          training portal yet. An administrator needs to approve your access
          before you can open the dashboard.
        </p>
        {session.user?.email ? (
          <p className="mt-4 rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
            Signed in as <strong>{session.user.email}</strong>
          </p>
        ) : null}
        <div className="mt-8 flex flex-col gap-3 text-sm">
          <a
            href="/auth/logout"
            className="inline-flex justify-center rounded-full border border-zinc-300 px-4 py-2.5 font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Sign out
          </a>
          <Link
            href="/"
            className="text-center font-medium text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
