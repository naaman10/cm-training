"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type {
  CreateAdminUserClientResponse,
  CreateAdminUserInput,
} from "@/types/admin-users";

import { ADMIN_ROLE_OPTIONS } from "../admin-user-utils";

const DEFAULT_ROLE = "instructor";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function CreateUserForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState(DEFAULT_ROLE);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [httpStatus, setHttpStatus] = useState<number | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setDetail(null);
    setHttpStatus(null);

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedRole = role.trim();
    if (!isValidEmail(normalizedEmail)) {
      setError("Please enter a valid email address.");
      setHttpStatus(400);
      return;
    }
    if (!normalizedRole) {
      setError("Role is required.");
      setHttpStatus(400);
      return;
    }

    const body: CreateAdminUserInput = {
      email: normalizedEmail,
      role: normalizedRole,
      firstName: firstName.trim() || undefined,
      lastName: lastName.trim() || undefined,
    };

    setSubmitting(true);
    let res: Response;
    let payload: CreateAdminUserClientResponse;
    try {
      res = await fetch("/api/admin/users", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      payload = (await res.json()) as CreateAdminUserClientResponse;
    } catch {
      setSubmitting(false);
      setError("Network error while creating user. Please retry.");
      setHttpStatus(503);
      return;
    }

    if (payload.ok) {
      router.push(
        `/admin/users?created=1&email=${encodeURIComponent(payload.user.email)}`,
      );
      return;
    }

    const status =
      typeof payload.httpStatus === "number" ? payload.httpStatus : res.status;
    setSubmitting(false);
    setHttpStatus(status);
    setError(payload.message ?? "Could not create user.");
    setDetail(typeof payload.detail === "string" ? payload.detail : null);
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-700 dark:text-zinc-300">Email *</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
              placeholder="new.user@example.com"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-700 dark:text-zinc-300">Role *</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
            >
              {ADMIN_ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-700 dark:text-zinc-300">First name</span>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
              placeholder="New"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-700 dark:text-zinc-300">Last name</span>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
              placeholder="User"
            />
          </label>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-100">
            <p>{error}</p>
            {httpStatus != null ? (
              <p className="mt-1 text-xs opacity-80">HTTP {httpStatus}</p>
            ) : null}
            {detail ? <p className="mt-1 text-xs font-mono opacity-80">{detail}</p> : null}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
          >
            {submitting ? "Creating…" : "Create user"}
          </button>
          <Link
            href="/admin/users"
            className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Cancel
          </Link>
        </div>
      </form>
    </section>
  );
}
