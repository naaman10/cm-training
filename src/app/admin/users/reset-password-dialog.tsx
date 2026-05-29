"use client";

import { useState } from "react";

import type { SafeAdminUser } from "@/types/admin-user";
import type { PasswordResetAdminUserClientResponse } from "@/types/admin-users";
import { isPasswordResetAdminUserSuccess } from "@/types/admin-users";

type ResetPasswordDialogProps = {
  user: SafeAdminUser;
  onClose: () => void;
  onSuccess: (email: string) => void;
};

export function ResetPasswordDialog({
  user,
  onClose,
  onSuccess,
}: ResetPasswordDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [httpStatus, setHttpStatus] = useState<number | null>(null);

  const email = user.email.trim();

  async function onConfirm() {
    if (!email) return;

    setError(null);
    setDetail(null);
    setHttpStatus(null);
    setSubmitting(true);

    let res: Response;
    let payload: PasswordResetAdminUserClientResponse;
    try {
      res = await fetch(
        `/api/admin/users/${encodeURIComponent(user.id)}/password-reset`,
        {
          method: "POST",
          credentials: "include",
        },
      );
      payload = (await res.json()) as PasswordResetAdminUserClientResponse;
    } catch {
      setSubmitting(false);
      setError("Network error while requesting password reset. Please retry.");
      setHttpStatus(503);
      return;
    }

    if (isPasswordResetAdminUserSuccess(payload)) {
      onSuccess(email);
      return;
    }

    const status =
      typeof payload.httpStatus === "number" ? payload.httpStatus : res.status;
    setSubmitting(false);
    setHttpStatus(status);
    setError(payload.message ?? "Could not request password reset.");
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
        aria-labelledby="reset-password-title"
        className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
      >
        <h2
          id="reset-password-title"
          className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
        >
          Reset password
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Send a password reset email to{" "}
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {email || "this user"}
          </span>
          ? Auth0 will email them a link to set a new password.
        </p>
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          You will not see or set a password here. The user completes the reset
          from their inbox.
        </p>

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
            disabled={submitting || !email}
            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Sending…" : "Send reset email"}
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
