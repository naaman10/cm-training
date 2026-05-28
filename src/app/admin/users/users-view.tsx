"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { usePortalSession } from "@/context/portal-session";
import type { AdminUsersClientResponse } from "@/types/admin-users";
import { isAdminUsersSuccess } from "@/types/admin-users";
import type { SafeAdminUser } from "@/types/admin-user";

import { EditUserDialog } from "./edit-user-dialog";
import { UserRowActions } from "./user-row-actions";

function isAdminRole(role: string | null | undefined): boolean {
  if (!role) return false;
  const normalized = role.trim().toLowerCase();
  return normalized === "admin" || normalized.includes("admin");
}

function formatName(user: SafeAdminUser): string {
  const full = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return full || user.email;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export function AdminUsersView() {
  const { user: portalUser, loading: portalLoading } = usePortalSession();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [httpStatus, setHttpStatus] = useState<number | null>(null);
  const [users, setUsers] = useState<SafeAdminUser[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [editingUser, setEditingUser] = useState<SafeAdminUser | null>(null);
  const [updatedEmail, setUpdatedEmail] = useState<string | null>(null);

  const isAdmin = isAdminRole(portalUser?.role);

  async function loadUsers() {
    setLoading(true);
    setError(null);
    setDetail(null);
    setHttpStatus(null);

    let json: unknown;
    let res: Response;
    try {
      res = await fetch("/api/admin/users", {
        credentials: "include",
        cache: "no-store",
      });
      json = await res.json();
    } catch {
      setError("Could not load users. Please retry.");
      setHttpStatus(503);
      setLoading(false);
      return;
    }

    const payload = json as AdminUsersClientResponse;
    if (isAdminUsersSuccess(payload)) {
      const sorted = [...payload.users].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setUsers(sorted);
      setLoading(false);
      return;
    }

    const status = typeof payload.httpStatus === "number" ? payload.httpStatus : res.status;
    setHttpStatus(status);
    setError(payload.message ?? "Could not load users.");
    setDetail(typeof payload.detail === "string" ? payload.detail : null);

    setLoading(false);
  }

  useEffect(() => {
    if (portalLoading) return;
    if (!isAdmin) return;
    queueMicrotask(() => {
      void loadUsers();
    });
  }, [portalLoading, isAdmin]);

  const statusOptions = useMemo(
    () => ["all", ...new Set(users.map((u) => u.status).filter(Boolean))],
    [users],
  );
  const roleOptions = useMemo(
    () => ["all", ...new Set(users.map((u) => u.role).filter(Boolean))],
    [users],
  );

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((u) => {
      const name = formatName(u).toLowerCase();
      const email = u.email.toLowerCase();
      const matchesSearch = !query || name.includes(query) || email.includes(query);
      const matchesStatus = statusFilter === "all" || u.status === statusFilter;
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [users, search, statusFilter, roleFilter]);

  if (portalLoading || loading) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading users…</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
        <h2 className="text-lg font-semibold">Not authorized</h2>
        <p className="mt-2 text-sm">
          You must be an admin user to access user management.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-100">
        <h2 className="text-lg font-semibold">
          {httpStatus === 403 ? "Not authorized" : "Could not load users"}
        </h2>
        <p className="mt-2 text-sm">{error}</p>
        {detail ? <p className="mt-2 text-xs font-mono opacity-85">{detail}</p> : null}
        <p className="mt-2 text-xs opacity-85">
          {httpStatus != null ? `HTTP ${httpStatus}` : null}
        </p>
        {httpStatus === 500 ? (
          <p className="mt-2 text-xs">
            Server error. Retry in a moment or check API logs.
          </p>
        ) : null}
        {httpStatus === 401 ? (
          <p className="mt-2 text-xs">
            Your session does not currently have the required admin API scopes.
            Re-authenticate after scope/permission changes.
          </p>
        ) : null}
        {httpStatus !== 403 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void loadUsers()}
              className="rounded-full bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
            >
              Retry
            </button>
            {httpStatus === 401 ? (
              <a
                href="/auth/logout?returnTo=/auth/login?returnTo=%2Fadmin%2Fusers"
                className="rounded-full border border-red-400 px-4 py-2 text-sm font-medium hover:bg-red-100 dark:border-red-700 dark:hover:bg-red-900/30"
              >
                Re-authenticate
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  function handleUserUpdated(user: SafeAdminUser) {
    setUsers((prev) => {
      const next = prev.map((u) => (u.id === user.id ? user : u));
      return [...next].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    });
    setEditingUser(null);
    setUpdatedEmail(user.email);
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {updatedEmail ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-100">
          User updated successfully: {updatedEmail}
        </div>
      ) : null}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {users.length} user{users.length === 1 ? "" : "s"}
        </p>
        <Link
          href="/admin/users/new"
          className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          Create user
        </Link>
      </div>
      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or email"
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        >
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status === "all" ? "All statuses" : status}
            </option>
          ))}
        </select>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        >
          {roleOptions.map((role) => (
            <option key={role} value={role}>
              {role === "all" ? "All roles" : role}
            </option>
          ))}
        </select>
      </div>

      {users.length === 0 ? (
        <p className="py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
          No users yet.
        </p>
      ) : filteredUsers.length === 0 ? (
        <p className="py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
          No results for current filters.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                <th className="px-3 py-3">Name</th>
                <th className="px-3 py-3">Email</th>
                <th className="px-3 py-3">Role</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Last login</th>
                <th className="px-3 py-3">Created date</th>
                <th className="px-3 py-3 text-right">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="text-zinc-800 dark:text-zinc-100">
                  <td className="px-3 py-3">{formatName(u)}</td>
                  <td className="px-3 py-3">{u.email}</td>
                  <td className="px-3 py-3">{u.role}</td>
                  <td className="px-3 py-3">{u.status}</td>
                  <td className="px-3 py-3">{u.lastLoginAtUk ?? "Never"}</td>
                  <td className="px-3 py-3">{formatDate(u.createdAt)}</td>
                  <td className="px-3 py-3">
                    <UserRowActions user={u} onEdit={setEditingUser} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editingUser ? (
        <EditUserDialog
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSuccess={handleUserUpdated}
        />
      ) : null}
    </section>
  );
}
