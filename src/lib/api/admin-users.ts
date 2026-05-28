import { fetchCmTrainingApiWithBearer } from "@/lib/api/client";
import type {
  AdminUsersClientResponse,
  CreateAdminUserClientResponse,
  CreateAdminUserInput,
} from "@/types/admin-users";
import type { SafeAdminUser } from "@/types/admin-user";

function codeForStatus(
  status: number,
): Exclude<AdminUsersClientResponse["code"], "ok"> {
  if (status === 400) return "bad_request";
  if (status === 401) return "unauthenticated";
  if (status === 403) return "forbidden";
  if (status === 409) return "conflict";
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

export async function buildAdminUsersPayload(
  accessToken: string,
): Promise<{ response: AdminUsersClientResponse; httpStatus: number }> {
  let upstream: Response;
  try {
    upstream = await fetchCmTrainingApiWithBearer(accessToken, "/api/admin/users", {
      cache: "no-store",
    });
  } catch {
    return {
      httpStatus: 503,
      response: {
        ok: false,
        httpStatus: 503,
        code: "network_error",
        message: "Could not reach admin users API.",
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

  if (status === 200 && json && typeof json === "object" && "users" in json) {
    const users = (json as { users: unknown }).users;
    if (Array.isArray(users)) {
      return {
        httpStatus: 200,
        response: {
          ok: true,
          httpStatus: 200,
          code: "ok",
          users: users as SafeAdminUser[],
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
            ? "You are not authorized to view users."
            : status >= 500
              ? "Admin users service encountered an error. Please retry."
              : "Could not load users."),
      detail,
    },
  };
}

export async function buildCreateAdminUserPayload(
  accessToken: string,
  input: CreateAdminUserInput,
): Promise<{ response: CreateAdminUserClientResponse; httpStatus: number }> {
  let upstream: Response;
  try {
    upstream = await fetchCmTrainingApiWithBearer(accessToken, "/api/admin/users", {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });
  } catch {
    return {
      httpStatus: 503,
      response: {
        ok: false,
        httpStatus: 503,
        code: "network_error",
        message: "Could not reach admin users API.",
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

  if (status === 201 && json && typeof json === "object" && "user" in json) {
    const user = (json as { user: unknown }).user;
    if (user && typeof user === "object") {
      return {
        httpStatus: 201,
        response: {
          ok: true,
          httpStatus: 201,
          code: "ok",
          user: user as SafeAdminUser,
        },
      };
    }
  }

  const message = readMessage(json);
  const detail =
    readDetail(json) ||
    (json &&
    typeof json === "object" &&
    "raw" in json &&
    typeof (json as { raw?: unknown }).raw === "string"
      ? (json as { raw: string }).raw
      : undefined);
  return {
    httpStatus: status,
    response: {
      ok: false,
      httpStatus: status,
      code: codeForStatus(status),
      message:
        message ??
        (status === 400
          ? "Please provide a valid email and role."
          : status === 401
            ? "Session expired or token is invalid. Please sign in again."
            : status === 403
              ? "You are not authorized to create users."
              : status === 409
                ? "A user with this email already exists."
                : status >= 500
                  ? "Admin create-user service encountered an error. Please retry."
                  : "Could not create user."),
      detail,
    },
  };
}
