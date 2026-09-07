"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { AdminFeaturesClientResponse, SafeFeature } from "@/types/admin-features";
import { isAdminFeaturesSuccess } from "@/types/admin-features";
import type {
  AdminUserPermissionsClientResponse,
  GrantAdminUserPermissionClientResponse,
  RevokeAdminUserPermissionClientResponse,
  SafeUserPermissionGrant,
} from "@/types/admin-user-permissions";
import {
  isAdminUserPermissionsSuccess,
  isGrantAdminUserPermissionSuccess,
  isRevokeAdminUserPermissionSuccess,
} from "@/types/admin-user-permissions";

type UserPermissionTogglesProps = {
  userId: string;
  onSelfGrantChange?: () => Promise<void>;
};

type PermissionRow = {
  featureId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  granted: boolean;
};

function grantByFeatureId(
  grants: SafeUserPermissionGrant[],
): Map<string, SafeUserPermissionGrant> {
  const map = new Map<string, SafeUserPermissionGrant>();
  for (const grant of grants) {
    map.set(grant.featureId, grant);
  }
  return map;
}

function buildRows(
  features: SafeFeature[],
  grants: SafeUserPermissionGrant[],
): PermissionRow[] {
  const granted = grantByFeatureId(grants);
  const rows: PermissionRow[] = features
    .filter((feature) => feature.isActive)
    .map((feature) => ({
      featureId: feature.id,
      name: feature.name,
      description: feature.description,
      isActive: true,
      granted: granted.has(feature.id),
    }));

  const activeIds = new Set(rows.map((row) => row.featureId));
  for (const grant of grants) {
    if (grant.featureIsActive || activeIds.has(grant.featureId)) continue;
    rows.push({
      featureId: grant.featureId,
      name: grant.featureName,
      description: grant.featureDescription,
      isActive: false,
      granted: true,
    });
  }

  return rows;
}

export function UserPermissionToggles({
  userId,
  onSelfGrantChange,
}: UserPermissionTogglesProps) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [features, setFeatures] = useState<SafeFeature[]>([]);
  const [grants, setGrants] = useState<SafeUserPermissionGrant[]>([]);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const [featuresRes, grantsRes] = await Promise.all([
        fetch("/api/admin/features", {
          credentials: "include",
          cache: "no-store",
        }),
        fetch(`/api/admin/users/${encodeURIComponent(userId)}/permissions`, {
          credentials: "include",
          cache: "no-store",
        }),
      ]);

      const featuresPayload =
        (await featuresRes.json()) as AdminFeaturesClientResponse;
      const grantsPayload =
        (await grantsRes.json()) as AdminUserPermissionsClientResponse;

      if (!isAdminFeaturesSuccess(featuresPayload)) {
        setLoadError(
          featuresPayload.message ?? "Could not load the feature catalog.",
        );
        setFeatures([]);
        setGrants([]);
        setLoading(false);
        return;
      }

      if (!isAdminUserPermissionsSuccess(grantsPayload)) {
        setLoadError(
          grantsPayload.message ?? "Could not load this user's permissions.",
        );
        setFeatures(featuresPayload.features);
        setGrants([]);
        setLoading(false);
        return;
      }

      setFeatures(featuresPayload.features);
      setGrants(grantsPayload.permissions);
      setLoading(false);
    } catch {
      setLoadError("Network error while loading permissions. Please retry.");
      setFeatures([]);
      setGrants([]);
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  const rows = useMemo(() => buildRows(features, grants), [features, grants]);

  function setPending(featureId: string, pending: boolean) {
    setPendingIds((current) => {
      const next = new Set(current);
      if (pending) next.add(featureId);
      else next.delete(featureId);
      return next;
    });
  }

  function setRowError(featureId: string, message: string | null) {
    setRowErrors((current) => {
      if (message == null) {
        if (!(featureId in current)) return current;
        const next = { ...current };
        delete next[featureId];
        return next;
      }
      return { ...current, [featureId]: message };
    });
  }

  async function refreshGrants() {
    const res = await fetch(
      `/api/admin/users/${encodeURIComponent(userId)}/permissions`,
      { credentials: "include", cache: "no-store" },
    );
    const payload = (await res.json()) as AdminUserPermissionsClientResponse;
    if (isAdminUserPermissionsSuccess(payload)) {
      setGrants(payload.permissions);
    }
  }

  async function grantFeature(row: PermissionRow) {
    setPending(row.featureId, true);
    setRowError(row.featureId, null);
    try {
      const res = await fetch(
        `/api/admin/users/${encodeURIComponent(userId)}/permissions`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ featureName: row.name }),
        },
      );
      const payload =
        (await res.json()) as GrantAdminUserPermissionClientResponse;
      if (!isGrantAdminUserPermissionSuccess(payload)) {
        setRowError(
          row.featureId,
          payload.message ?? "Could not grant this permission.",
        );
        return;
      }
      await refreshGrants();
      if (onSelfGrantChange) await onSelfGrantChange();
    } catch {
      setRowError(row.featureId, "Network error while granting permission.");
    } finally {
      setPending(row.featureId, false);
    }
  }

  async function revokeFeature(row: PermissionRow) {
    setPending(row.featureId, true);
    setRowError(row.featureId, null);
    try {
      const res = await fetch(
        `/api/admin/users/${encodeURIComponent(userId)}/permissions/${encodeURIComponent(row.featureId)}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );
      const payload =
        (await res.json()) as RevokeAdminUserPermissionClientResponse;
      if (!isRevokeAdminUserPermissionSuccess(payload)) {
        setRowError(
          row.featureId,
          payload.message ?? "Could not revoke this permission.",
        );
        return;
      }
      await refreshGrants();
      if (onSelfGrantChange) await onSelfGrantChange();
    } catch {
      setRowError(row.featureId, "Network error while revoking permission.");
    } finally {
      setPending(row.featureId, false);
    }
  }

  async function onToggle(row: PermissionRow, nextGranted: boolean) {
    if (nextGranted) {
      await grantFeature(row);
      return;
    }
    await revokeFeature(row);
  }

  return (
    <section className="border-t border-zinc-200 pt-4 dark:border-zinc-700">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Feature permissions
      </h3>
      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
        Changes apply immediately and are separate from saving profile details.
      </p>

      {loading ? (
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          Loading permissions…
        </p>
      ) : null}

      {loadError ? (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-100">
          <p>{loadError}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-2 text-xs font-medium underline"
          >
            Retry
          </button>
        </div>
      ) : null}

      {!loading && !loadError && rows.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          No grantable features are available yet.
        </p>
      ) : null}

      {!loading && !loadError && rows.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {rows.map((row) => {
            const pending = pendingIds.has(row.featureId);
            const error = rowErrors[row.featureId];
            return (
              <li
                key={row.featureId}
                className="rounded-xl border border-zinc-200 px-3 py-2 dark:border-zinc-700"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {row.name}
                      {!row.isActive ? (
                        <span className="ml-2 text-xs font-normal text-zinc-500 dark:text-zinc-400">
                          Retired
                        </span>
                      ) : null}
                    </p>
                    {row.description ? (
                      <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                        {row.description}
                      </p>
                    ) : null}
                  </div>
                  {row.isActive ? (
                    <label className="flex shrink-0 items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                      <input
                        type="checkbox"
                        checked={row.granted}
                        disabled={pending}
                        onChange={(event) =>
                          void onToggle(row, event.target.checked)
                        }
                        className="h-4 w-4 rounded border-zinc-300"
                      />
                      <span className="text-xs">
                        {pending ? "Saving…" : row.granted ? "Granted" : "Off"}
                      </span>
                    </label>
                  ) : (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => void revokeFeature(row)}
                      className="shrink-0 rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800"
                    >
                      {pending ? "Revoking…" : "Revoke"}
                    </button>
                  )}
                </div>
                {error ? (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {error}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
