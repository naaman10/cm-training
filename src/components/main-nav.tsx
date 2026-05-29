"use client";

import Link from "next/link";
import { usePortalSession } from "@/context/portal-session";

type MainNavProps = {
  actionHref: string;
  actionLabel: string;
};

export function MainNav({ actionHref, actionLabel }: MainNavProps) {
  const { user } = usePortalSession();
  const isAdmin = user?.role?.toLowerCase().includes("admin");

  return (
    <nav className="mx-auto mt-6 w-full max-w-5xl px-4 sm:px-6">
      <div className="flex items-center justify-between gap-4 rounded-full border border-zinc-200/80 bg-white/90 px-4 py-2 shadow-sm backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/85">
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="text-base font-semibold text-zinc-900 dark:text-zinc-100"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- external brand asset */}
            <img
              src="https://res.cloudinary.com/njh101010/image/upload/v1779956768/checkmirrors/website/cm-logo.png"
              alt="Mainline Logo"
              className="h-5 w-auto"
            />
      
          </Link>
          <div className="hidden items-center gap-5 text-sm font-medium text-zinc-600 md:flex dark:text-zinc-300">
            <Link
              className="transition hover:text-zinc-900 dark:hover:text-zinc-100"
              href="/courses"
            >
              Courses
            </Link>
            {isAdmin ? (
              <Link
                className="transition hover:text-zinc-900 dark:hover:text-zinc-100"
                href="/admin/users"
              >
                User Management
              </Link>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={actionHref}
            className="inline-flex h-9 items-center rounded-xl border border-zinc-200 px-4 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            {actionLabel}
          </a>
        </div>
      </div>
    </nav>
  );
}
