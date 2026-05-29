"use client";

import { useState } from "react";

import { usePortalSession } from "@/context/portal-session";
import type { SafeAdminUser } from "@/types/admin-user";
import type { DeactivateAdminUserClientResponse } from "@/types/admin-users";
import { isDeactivateAdminUserSuccess } from "@/types/admin-users";

import { isSamePortalUser } from "./admin-user-utils";

type DeactivateUserDialogProps = {
  user: SafeAdminUser;
  displayName: string;
  onClose: () => void;
  onSuccess: (user: SafeAdminUser) => void;
};

export function DeactivateUserDialog({
  user,
  displayName,
  onClose,
  onSuccess,
}: DeactivateUserDialogProps) {
  const { user: portalUser } = usePortalSession();
  const [acknowledged, setAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [httpStatus, setHttpStatus] = useState<number | null>(null);

  const isSelf = isSamePortalUser(portalUser, user);

  async function onConfirm() {
    if (isSelf || !acknowledged) return;

    setError(null);
    setDetail(null);
    setHttpStatus(null);
    setSubmitting(true);

    let res: Response;
    let payload: DeactivateAdminUserClientResponse;
    try {
      res = await fetch(
        `/api/admin/users/${encodeURIComponent(user.id)}/deactivate`,
        {
          method: "POST",
          credentials: "include",
        },
      );
      payload = (await res.json()) as DeactivateAdminUserClientResponse;
    } catch {
      setSubmitting(false);
      setError("Network error while deactivating user. Please retry.");
      setHttpStatus(503);
      return;
    }

    if (isDeactivateAdminUserSuccess(payload)) {
      onSuccess(payload.user);
      return;
    }

    const status =
      typeof payload.httpStatus === "number" ? payload.httpStatus : res.status;
    setSubmitting(false);
    setHttpStatus(status);
    setError(payload.message ?? "Could not deactivate user.");
    setDetail(typeof payload.detail === "string" ? payload.detail : null);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="deactivate-user-title"
        className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
      >
        <h2
          id="deactivate-user-title"
          className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
        >
          Deactivate account
        </h2>

        {isSelf ? (
          <>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              You cannot deactivate your own account. Ask another admin to
              deactivate <span className="font-medium text-zinc-900 dark:text-zinc-100">{displayName}</span> if needed.
            </p>
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
              Deactivating yourself would block sign-in and remove admin access
              to this portal.
            </div>
            <div className="mt-6">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                Close
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              You are about to deactivate{" "}
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {displayName}
              </span>{" "}
              (<span className="font-mono text-xs">{user.email}</span>).
            </p>
            <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
              <li>They will not be able to sign in again.</li>
              <li>Their status will be set to inactive in the portal.</li>
              <li>There is no reactivate option in the app yet.</li>
            </ul>

            <label className="mt-4 flex cursor-pointer items-start gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm dark:border-zinc-700 dark:bg-zinc-950/50">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                disabled={submitting}
                className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-red-600 focus:ring-red-500"
              />
              <span className="text-zinc-700 dark:text-zinc-300">
                I understand this will block the user from signing in and cannot
                be undone from this app.
              </span>
            </label>

            {error ? (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-100">
                <p>{error}</p>
                {httpStatus != null ? (
                  <p className="mt-1 text-xs opacity-80">HTTP {httpStatus}</p>
                ) : null}
                {detail ? (
                  <p className="mt-1 text-xs font-mono opacity-80">{detail}</p>
                ) : null}
                {httpStatus === 401 ? (
                  <a
                    href="/auth/logout?returnTo=/auth/login?returnTo=%2Fadmin%2Fusers"
                    className="mt-2 inline-block text-xs font-medium underline"
                  >
                    Re-authenticate
                  </a>
                ) : null}
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void onConfirm()}
                disabled={submitting || !acknowledged}
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Deactivating…" : "Confirm deactivation"}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
