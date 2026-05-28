import type { SafeAdminUser } from "@/types/admin-user";

export type AdminUsersCode =
  | "ok"
  | "unauthenticated"
  | "forbidden"
  | "bad_request"
  | "conflict"
  | "network_error"
  | "configuration_error"
  | "unknown";

export type AdminUsersClientResponse =
  | {
      ok: true;
      httpStatus: 200;
      code: "ok";
      users: SafeAdminUser[];
    }
  | {
      ok: false;
      httpStatus: number;
      code: AdminUsersCode;
      message?: string;
      detail?: string;
    };

export type CreateAdminUserInput = {
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
};

export type CreateAdminUserClientResponse =
  | {
      ok: true;
      httpStatus: 201;
      code: "ok";
      user: SafeAdminUser;
    }
  | {
      ok: false;
      httpStatus: number;
      code: AdminUsersCode;
      message?: string;
      detail?: string;
    };

export function isAdminUsersSuccess(
  response: AdminUsersClientResponse,
): response is Extract<AdminUsersClientResponse, { ok: true }> {
  return response.ok && response.httpStatus === 200;
}
