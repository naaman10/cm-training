import { fetchCmTrainingApiWithBearer } from "@/lib/api/client";
import type {
  AdminUserPermissionsClientResponse,
  GrantAdminUserPermissionClientResponse,
  GrantAdminUserPermissionInput,
  RevokeAdminUserPermissionClientResponse,
  SafePermissionRow,
  SafeUserPermissionGrant,
} from "@/types/admin-user-permissions";

function codeForStatus(
  status: number,
): Exclude<AdminUserPermissionsClientResponse["code"], "ok"> {
  if (status === 400) return "bad_request";
  if (status === 401) return "unauthenticated";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  return "unknown";
}

function readMessage(json: unknown): string | undefined {
  if (!json || typeof json !== "object") return undefined;
  const obj = json as Record<string, unknown>;
  if (typeof obj.message === "string" && obj.message.trim()) return obj.message;
  if (typeof obj.error === "string" && obj.error.trim()) return obj.error;
  if (
    typeof obj.error === "object" &&
    obj.error &&
    typeof (obj.error as { message?: unknown }).message === "string"
  ) {
    return (obj.error as { message: string }).message;
  }
  return undefined;
}

function readDetail(json: unknown): string | undefined {
  if (!json || typeof json !== "object") return undefined;
  const obj = json as Record<string, unknown>;
  if (typeof obj.detail === "string" && obj.detail.trim()) return obj.detail;
  return undefined;
}

function readString(
  obj: Record<string, unknown>,
  ...keys: string[]
): string | null {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string") return value;
  }
  return null;
}

function readBoolean(
  obj: Record<string, unknown>,
  ...keys: string[]
): boolean | null {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "boolean") return value;
  }
  return null;
}

async function parseJson(upstream: Response): Promise<unknown> {
  const text = await upstream.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { raw: text };
  }
}

export function normalizeUserPermissionGrant(
  value: unknown,
): SafeUserPermissionGrant | null {
  if (!value || typeof value !== "object") return null;
  const obj = value as Record<string, unknown>;
  const id = readString(obj, "id");
  const userId = readString(obj, "userId", "user_id");
  const featureId = readString(obj, "featureId", "feature_id");
  const featureName = readString(obj, "featureName", "feature_name");
  if (!id || !userId || !featureId || !featureName) return null;
  return {
    id,
    userId,
    featureId,
    grantedAt: readString(obj, "grantedAt", "granted_at") ?? "",
    grantedBy: readString(obj, "grantedBy", "granted_by"),
    featureName,
    featureDescription: readString(obj, "featureDescription", "feature_description"),
    featureIsActive:
      readBoolean(obj, "featureIsActive", "feature_is_active") ?? true,
    grantedByEmail: readString(obj, "grantedByEmail", "granted_by_email"),
  };
}

function normalizePermissionRow(value: unknown): SafePermissionRow | null {
  if (!value || typeof value !== "object") return null;
  const obj = value as Record<string, unknown>;
  const id = readString(obj, "id");
  const userId = readString(obj, "userId", "user_id");
  const featureId = readString(obj, "featureId", "feature_id");
  if (!id || !userId || !featureId) return null;
  return {
    id,
    userId,
    featureId,
    grantedAt: readString(obj, "grantedAt", "granted_at") ?? "",
    grantedBy: readString(obj, "grantedBy", "granted_by"),
  };
}

export async function buildAdminUserPermissionsPayload(
  accessToken: string,
  userId: string,
): Promise<{ response: AdminUserPermissionsClientResponse; httpStatus: number }> {
  let upstream: Response;
  try {
    upstream = await fetchCmTrainingApiWithBearer(
      accessToken,
      `/api/admin/users/${encodeURIComponent(userId)}/permissions`,
      { cache: "no-store" },
    );
  } catch {
    return {
      httpStatus: 503,
      response: {
        ok: false,
        httpStatus: 503,
        code: "network_error",
        message: "Could not reach admin user permissions API.",
      },
    };
  }

  const status = upstream.status;
  const json = await parseJson(upstream);

  if (status === 200 && json && typeof json === "object" && "permissions" in json) {
    const raw = (json as { permissions: unknown }).permissions;
    if (Array.isArray(raw)) {
      const permissions = raw
        .map(normalizeUserPermissionGrant)
        .filter((row): row is SafeUserPermissionGrant => row != null);
      return {
        httpStatus: 200,
        response: {
          ok: true,
          httpStatus: 200,
          code: "ok",
          permissions,
        },
      };
    }
  }

  const message = readMessage(json);
  const detail = readDetail(json);
  return {
    httpStatus: status,
    response: {
      ok: false,
      httpStatus: status,
      code: codeForStatus(status),
      message:
        message ??
        (status === 401
          ? "Session expired or token is invalid. Please sign in again."
          : status === 403
            ? "You are not authorized to view user permissions."
            : status === 404
              ? "User not found."
              : status >= 500
                ? "Admin user permissions service encountered an error. Please retry."
                : "Could not load user permissions."),
      detail,
    },
  };
}

export async function buildGrantAdminUserPermissionPayload(
  accessToken: string,
  userId: string,
  input: GrantAdminUserPermissionInput,
): Promise<{
  response: GrantAdminUserPermissionClientResponse;
  httpStatus: number;
}> {
  let upstream: Response;
  try {
    upstream = await fetchCmTrainingApiWithBearer(
      accessToken,
      `/api/admin/users/${encodeURIComponent(userId)}/permissions`,
      {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ featureName: input.featureName }),
      },
    );
  } catch {
    return {
      httpStatus: 503,
      response: {
        ok: false,
        httpStatus: 503,
        code: "network_error",
        message: "Could not reach admin user permissions API.",
      },
    };
  }

  const status = upstream.status;
  const json = await parseJson(upstream);

  if (status === 200 && json && typeof json === "object" && "permission" in json) {
    const permission = normalizePermissionRow(
      (json as { permission: unknown }).permission,
    );
    if (permission) {
      return {
        httpStatus: 200,
        response: {
          ok: true,
          httpStatus: 200,
          code: "ok",
          permission,
        },
      };
    }
  }

  const message = readMessage(json);
  const detail = readDetail(json);
  return {
    httpStatus: status,
    response: {
      ok: false,
      httpStatus: status,
      code: codeForStatus(status),
      message:
        message ??
        (status === 400
          ? "Feature name is required."
          : status === 401
            ? "Session expired or token is invalid. Please sign in again."
            : status === 403
              ? "You are not authorized to grant permissions."
              : status === 404
                ? "User or feature not found."
                : status >= 500
                  ? "Admin grant-permission service encountered an error. Please retry."
                  : "Could not grant permission."),
      detail,
    },
  };
}

export async function buildRevokeAdminUserPermissionPayload(
  accessToken: string,
  userId: string,
  featureId: string,
): Promise<{
  response: RevokeAdminUserPermissionClientResponse;
  httpStatus: number;
}> {
  let upstream: Response;
  try {
    upstream = await fetchCmTrainingApiWithBearer(
      accessToken,
      `/api/admin/users/${encodeURIComponent(userId)}/permissions/${encodeURIComponent(featureId)}`,
      {
        method: "DELETE",
        cache: "no-store",
      },
    );
  } catch {
    return {
      httpStatus: 503,
      response: {
        ok: false,
        httpStatus: 503,
        code: "network_error",
        message: "Could not reach admin user permissions API.",
      },
    };
  }

  const status = upstream.status;
  const json = await parseJson(upstream);

  if (status === 200) {
    const message =
      readMessage(json) ??
      (json &&
      typeof json === "object" &&
      "ok" in json &&
      (json as { ok?: unknown }).ok === true
        ? "Permission revoked"
        : null);
    if (message) {
      return {
        httpStatus: 200,
        response: {
          ok: true,
          httpStatus: 200,
          code: "ok",
          message,
        },
      };
    }
  }

  const message = readMessage(json);
  const detail = readDetail(json);
  return {
    httpStatus: status,
    response: {
      ok: false,
      httpStatus: status,
      code: codeForStatus(status),
      message:
        message ??
        (status === 401
          ? "Session expired or token is invalid. Please sign in again."
          : status === 403
            ? "You are not authorized to revoke permissions."
            : status === 404
              ? "User or feature not found."
              : status >= 500
                ? "Admin revoke-permission service encountered an error. Please retry."
                : "Could not revoke permission."),
      detail,
    },
  };
}
