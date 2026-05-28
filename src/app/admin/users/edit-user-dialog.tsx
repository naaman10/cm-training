"use client";

import { useEffect, useMemo, useState } from "react";

import { usePortalSession } from "@/context/portal-session";
import type { SafeAdminUser } from "@/types/admin-user";
import type {
  EditAdminUserClientResponse,
  EditAdminUserInput,
} from "@/types/admin-users";
import { isEditAdminUserSuccess } from "@/types/admin-users";

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "instructor", label: "Instructor" },
  { value: "learner", label: "Learner" },
] as const;

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function roleForSelect(apiRole: string): string {
  const lower = apiRole.toLowerCase();
  if (lower.includes("admin")) return "admin";
  if (lower.includes("instructor")) return "instructor";
  if (lower.includes("learner")) return "learner";
  const first = apiRole.split(",")[0]?.trim().toLowerCase();
  return first || "instructor";
}

function isAdminRole(role: string | null | undefined): boolean {
  if (!role) return false;
  const normalized = role.trim().toLowerCase();
  return normalized === "admin" || normalized.includes("admin");
}

function buildPatchPayload(
  initial: SafeAdminUser,
  email: string,
  firstName: string,
  lastName: string,
  role: string,
): EditAdminUserInput {
  const payload: EditAdminUserInput = {};
  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail !== initial.email.trim().toLowerCase()) {
    payload.email = normalizedEmail;
  }

  const nextFirst = firstName.trim();
  const initialFirst = (initial.firstName ?? "").trim();
  if (nextFirst !== initialFirst) {
    payload.firstName = nextFirst || null;
  }

  const nextLast = lastName.trim();
  const initialLast = (initial.lastName ?? "").trim();
  if (nextLast !== initialLast) {
    payload.lastName = nextLast || null;
  }

  const normalizedRole = role.trim();
  if (normalizedRole && normalizedRole !== roleForSelect(initial.role)) {
    payload.role = normalizedRole;
  }

  return payload;
}

type EditUserDialogProps = {
  user: SafeAdminUser;
  onClose: () => void;
  onSuccess: (user: SafeAdminUser) => void;
};

export function EditUserDialog({ user, onClose, onSuccess }: EditUserDialogProps) {
  const { user: portalUser } = usePortalSession();

  const [email, setEmail] = useState(user.email);
  const [firstName, setFirstName] = useState(user.firstName ?? "");
  const [lastName, setLastName] = useState(user.lastName ?? "");
  const [role, setRole] = useState(() => roleForSelect(user.role));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [httpStatus, setHttpStatus] = useState<number | null>(null);

  useEffect(() => {
    setEmail(user.email);
    setFirstName(user.firstName ?? "");
    setLastName(user.lastName ?? "");
    setRole(roleForSelect(user.role));
    setError(null);
    setEmailError(null);
    setDetail(null);
    setHttpStatus(null);
  }, [user]);

  const patchPayload = useMemo(
    () => buildPatchPayload(user, email, firstName, lastName, role),
    [user, email, firstName, lastName, role],
  );

  const isDirty = Object.keys(patchPayload).length > 0;
  const normalizedEmail = email.trim().toLowerCase();
  const isValid =
    isValidEmail(normalizedEmail) && role.trim().length > 0 && isDirty;

  const editingSelf =
    portalUser?.id === user.id || portalUser?.email === user.email;
  const removingOwnAdmin =
    editingSelf &&
    isAdminRole(user.role) &&
    role.trim().toLowerCase() !== "admin" &&
    !role.trim().toLowerCase().includes("admin");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setEmailError(null);
    setDetail(null);
    setHttpStatus(null);

    if (!isValidEmail(normalizedEmail)) {
      setError("Please enter a valid email address.");
      setEmailError("Please enter a valid email address.");
      setHttpStatus(400);
      return;
    }
    if (!isDirty) return;

    setSubmitting(true);
    let res: Response;
    let payload: EditAdminUserClientResponse;
    try {
      res = await fetch(`/api/admin/users/${encodeURIComponent(user.id)}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(patchPayload),
      });
      payload = (await res.json()) as EditAdminUserClientResponse;
    } catch {
      setSubmitting(false);
      setError("Network error while updating user. Please retry.");
      setHttpStatus(503);
      return;
    }

    if (isEditAdminUserSuccess(payload)) {
      onSuccess(payload.user);
      return;
    }

    const status =
      typeof payload.httpStatus === "number" ? payload.httpStatus : res.status;
    setSubmitting(false);
    setHttpStatus(status);
    setError(payload.message ?? "Could not update user.");
    setDetail(typeof payload.detail === "string" ? payload.detail : null);
    if (status === 409) {
      setEmailError(payload.message ?? "This email is already in use.");
    }
  }

  const emailChanged =
    normalizedEmail !== user.email.trim().toLowerCase() && isDirty;

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
        aria-labelledby="edit-user-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2
              id="edit-user-title"
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              Edit user
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Update profile and role. Status is not editable here.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg px-2 py-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span className="text-zinc-700 dark:text-zinc-300">Email *</span>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError(null);
                }}
                required
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
              />
              {emailError ? (
                <span className="text-xs text-red-600 dark:text-red-400">
                  {emailError}
                </span>
              ) : null}
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="text-zinc-700 dark:text-zinc-300">First name</span>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="text-zinc-700 dark:text-zinc-300">Last name</span>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span className="text-zinc-700 dark:text-zinc-300">Role *</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {emailChanged ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
              Changing email updates the user&apos;s Auth0 login identifier. They
              will sign in with the new address on their next login.
            </p>
          ) : null}

          {removingOwnAdmin ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
              You are removing your own admin role. You may lose access to admin
              features after you sign in again or your token refreshes.
            </p>
          ) : null}

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-100">
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
              {httpStatus === 404 ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-2 block text-xs font-medium underline"
                >
                  Back to user list
                </button>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={submitting || !isValid}
              className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
            >
              {submitting ? "Saving…" : "Save changes"}
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
        </form>
      </div>
    </div>
  );
}
