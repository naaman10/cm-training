import { fetchCmTrainingApiWithBearer } from "@/lib/api/client";
import type {
  AdminFeaturesClientResponse,
  SafeFeature,
} from "@/types/admin-features";

function codeForStatus(
  status: number,
): Exclude<AdminFeaturesClientResponse["code"], "ok"> {
  if (status === 400) return "bad_request";
  if (status === 401) return "unauthenticated";
  if (status === 403) return "forbidden";
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

export function normalizeFeature(value: unknown): SafeFeature | null {
  if (!value || typeof value !== "object") return null;
  const obj = value as Record<string, unknown>;
  const id = readString(obj, "id");
  const name = readString(obj, "name");
  if (!id || !name) return null;
  const description = readString(obj, "description");
  const isActive = readBoolean(obj, "isActive", "is_active") ?? true;
  const createdAt = readString(obj, "createdAt", "created_at") ?? "";
  return {
    id,
    name,
    description: description && description.trim() ? description : null,
    isActive,
    createdAt,
  };
}

export async function buildAdminFeaturesPayload(
  accessToken: string,
): Promise<{ response: AdminFeaturesClientResponse; httpStatus: number }> {
  let upstream: Response;
  try {
    upstream = await fetchCmTrainingApiWithBearer(
      accessToken,
      "/api/admin/features",
      { cache: "no-store" },
    );
  } catch {
    return {
      httpStatus: 503,
      response: {
        ok: false,
        httpStatus: 503,
        code: "network_error",
        message: "Could not reach admin features API.",
      },
    };
  }

  const status = upstream.status;
  const text = await upstream.text();
  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text) as unknown;
    } catch {
      json = { raw: text };
    }
  }

  if (status === 200 && json && typeof json === "object" && "features" in json) {
    const raw = (json as { features: unknown }).features;
    if (Array.isArray(raw)) {
      const features = raw
        .map(normalizeFeature)
        .filter((feature): feature is SafeFeature => feature != null);
      return {
        httpStatus: 200,
        response: {
          ok: true,
          httpStatus: 200,
          code: "ok",
          features,
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
            ? "You are not authorized to view the feature catalog."
            : status >= 500
              ? "Admin features service encountered an error. Please retry."
              : "Could not load features."),
      detail,
    },
  };
}
