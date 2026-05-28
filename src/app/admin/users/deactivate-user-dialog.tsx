"use client";

import { useState } from "react";

import { usePortalSession } from "@/context/portal-session";
import type { SafeAdminUser } from "@/types/admin-user";
import type { DeactivateAdminUserClientResponse } from "@/types/admin-users";
import { isDeactivateAdminUserSuccess } from "@/types/admin-users";

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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [httpStatus, setHttpStatus] = useState<number | null>(null);

  const deactivatingSelf =
    portalUser?.id === user.id || portalUser?.email === user.email;

  async function onConfirm() {
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
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Deactivate <span className="font-medium text-zinc-900 dark:text-zinc-100">{displayName}</span>
          ? They will not be able to sign in again.
        </p>

        {deactivatingSelf ? (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
            You are deactivating your own account. You may lose admin access and
            be unable to sign in after this action.
          </p>
        ) : null}

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
            disabled={submitting}
            className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-60"
          >
            {submitting ? "Deactivating…" : "Deactivate"}
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
      </div>
    </div>
  );
}
