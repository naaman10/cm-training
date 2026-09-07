export interface SafeUserPermissionGrant {
  id: string;
  userId: string;
  featureId: string;
  grantedAt: string;
  grantedBy: string | null;
  featureName: string;
  featureDescription: string | null;
  featureIsActive: boolean;
  grantedByEmail: string | null;
}

export interface SafePermissionRow {
  id: string;
  userId: string;
  featureId: string;
  grantedAt: string;
  grantedBy: string | null;
}

export type AdminUserPermissionsCode =
  | "ok"
  | "unauthenticated"
  | "forbidden"
  | "bad_request"
  | "not_found"
  | "network_error"
  | "configuration_error"
  | "unknown";

export type AdminUserPermissionsClientResponse =
  | {
      ok: true;
      httpStatus: 200;
      code: "ok";
      permissions: SafeUserPermissionGrant[];
    }
  | {
      ok: false;
      httpStatus: number;
      code: AdminUserPermissionsCode;
      message?: string;
      detail?: string;
    };

export type GrantAdminUserPermissionInput = {
  featureName: string;
};

export type GrantAdminUserPermissionClientResponse =
  | {
      ok: true;
      httpStatus: 200;
      code: "ok";
      permission: SafePermissionRow;
    }
  | {
      ok: false;
      httpStatus: number;
      code: AdminUserPermissionsCode;
      message?: string;
      detail?: string;
    };

export type RevokeAdminUserPermissionClientResponse =
  | {
      ok: true;
      httpStatus: 200;
      code: "ok";
      message: string;
    }
  | {
      ok: false;
      httpStatus: number;
      code: AdminUserPermissionsCode;
      message?: string;
      detail?: string;
    };

export function isAdminUserPermissionsSuccess(
  response: AdminUserPermissionsClientResponse,
): response is Extract<AdminUserPermissionsClientResponse, { ok: true }> {
  return response.ok && response.httpStatus === 200;
}

export function isGrantAdminUserPermissionSuccess(
  response: GrantAdminUserPermissionClientResponse,
): response is Extract<GrantAdminUserPermissionClientResponse, { ok: true }> {
  return response.ok && response.httpStatus === 200;
}

export function isRevokeAdminUserPermissionSuccess(
  response: RevokeAdminUserPermissionClientResponse,
): response is Extract<RevokeAdminUserPermissionClientResponse, { ok: true }> {
  return response.ok && response.httpStatus === 200;
}
