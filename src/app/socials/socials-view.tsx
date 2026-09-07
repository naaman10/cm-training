"use client";

import { FeatureUnauthorized } from "@/components/feature-unauthorized";
import { usePortalSession } from "@/context/portal-session";
import { FEATURE_NAMES } from "@/lib/features/names";

export function SocialsView() {
  const { can } = usePortalSession();
  const canCreateSocial = can(FEATURE_NAMES.socialCreate);

  if (!canCreateSocial) {
    return (
      <FeatureUnauthorized message="You do not have access to Socials." />
    );
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Create a post
      </h2>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Draft a post here. Publishing will connect when the social API is
        available.
      </p>
      <label className="mt-6 flex flex-col gap-1 text-sm">
        <span className="text-zinc-700 dark:text-zinc-300">Post</span>
        <textarea
          rows={6}
          disabled
          placeholder="Write a social post…"
          className="resize-y rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-500"
        />
      </label>
      <button
        type="button"
        disabled
        className="mt-4 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white opacity-60"
      >
        Create post
      </button>
    </section>
  );
}
