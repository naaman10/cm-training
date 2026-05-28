"use client";

import Link from "next/link";

import { usePortalSession } from "@/context/portal-session";

export function PortalSessionGate({ children }: { children: React.ReactNode }) {
  const { loading, user, error, detail, httpStatus, code, refetch } =
    usePortalSession();

  if (loading && !user) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6">
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent"
          aria-hidden
        />
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Loading your training profile…
        </p>
      </div>
    );
  }

  if (!user || code !== "ok") {
    const isConflict = code === "conflict_email" || code === "bad_request_email";
    return (
      <div className="mx-auto max-w-xl px-6 py-16">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-8 text-amber-950 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/25 dark:text-amber-100">
          <h1 className="text-lg font-semibold">
            Training portal unavailable
          </h1>
          <p className="mt-2 text-sm leading-relaxed">{error}</p>
          {detail ? (
            <p className="mt-2 text-xs font-mono leading-relaxed opacity-90">
              {detail}
            </p>
          ) : null}
          {httpStatus != null ? (
            <p className="mt-2 text-xs text-amber-800/80 dark:text-amber-200/80">
              HTTP {httpStatus}
              {code ? ` · ${code}` : null}
            </p>
          ) : code ? (
            <p className="mt-2 text-xs text-amber-800/80 dark:text-amber-200/80">
              {code}
            </p>
          ) : null}
          {code === "configuration_error" ? (
            <p className="mt-3 text-xs leading-relaxed text-amber-900/90 dark:text-amber-200/90">
              Set <span className="font-mono">AUTH0_AUDIENCE</span> and{" "}
              <span className="font-mono">CM_TRAINING_API_URL</span>{" "}
              (or NEXT_PUBLIC…) in the environment, then redeploy / restart dev.
            </p>
          ) : null}
          {code === "invalid_response" ? (
            <p className="mt-3 text-xs leading-relaxed text-amber-900/90 dark:text-amber-200/90">
              The API did not return <span className="font-mono">{"{ user }"}</span>{" "}
              as expected — confirm <span className="font-mono">GET /api/auth/me</span> on
              your training API and <span className="font-mono">CM_TRAINING_API_URL</span>.
            </p>
          ) : null}
          {httpStatus != null && httpStatus >= 500 ? (
            <p className="mt-3 text-xs leading-relaxed text-amber-900/90 dark:text-amber-200/90">
              The training API hit a server error (check Render logs / Neon /
              JWKS verification / missing <span className="font-mono">email</span> on the
              access token).
            </p>
          ) : null}
          {isConflict ? (
            <p className="mt-3 text-xs leading-relaxed text-amber-900/90 dark:text-amber-200/90">
              If this persists, contact an administrator — Auth0 may need an
              Action to put <span className="font-mono">email</span> on the API
              access token, or the account may require a merge in the database.
            </p>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void refetch({ force: true })}
              className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
            >
              Try again
            </button>
            <a
              href="/auth/logout"
              className="rounded-full border border-amber-300 px-4 py-2 text-sm font-medium hover:bg-amber-100 dark:border-amber-800 dark:hover:bg-amber-900/40"
            >
              Sign out
            </a>
          </div>
          <p className="mt-4 text-xs text-amber-800/80 dark:text-amber-200/75">
            <Link href="/" className="underline-offset-2 hover:underline">
              Home
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
