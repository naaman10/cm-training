"use client";

import { usePortalSession } from "@/context/portal-session";

export function DashboardPortalProfile() {
  const { user } = usePortalSession();

  if (!user) return null;

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Training portal profile
      </h2>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div className="sm:col-span-2">
          <dt className="text-zinc-500 dark:text-zinc-400">Name</dt>
          <dd className="font-medium text-zinc-900 dark:text-zinc-50">
            {[user.firstName, user.lastName].filter(Boolean).join(" ") ||
              user.email}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">Email</dt>
          <dd className="text-zinc-800 dark:text-zinc-200">{user.email}</dd>
        </div>
        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">Role</dt>
          <dd className="font-medium text-zinc-900 dark:text-zinc-100">
            {user.role}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-zinc-500 dark:text-zinc-400">User ID</dt>
          <dd className="font-mono text-xs text-zinc-700 dark:text-zinc-300">
            {user.id}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">Last login</dt>
          <dd className="text-zinc-800 dark:text-zinc-200">
            {user.lastLoginAtUk ?? user.lastLoginAt ?? "—"}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">Member since</dt>
          <dd className="text-zinc-800 dark:text-zinc-200">{user.createdAt}</dd>
        </div>
      </dl>
    </section>
  );
}
