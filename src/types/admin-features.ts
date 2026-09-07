export interface SafeFeature {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

export type AdminFeaturesCode =
  | "ok"
  | "unauthenticated"
  | "forbidden"
  | "bad_request"
  | "network_error"
  | "configuration_error"
  | "unknown";

export type AdminFeaturesClientResponse =
  | {
      ok: true;
      httpStatus: 200;
      code: "ok";
      features: SafeFeature[];
    }
  | {
      ok: false;
      httpStatus: number;
      code: AdminFeaturesCode;
      message?: string;
      detail?: string;
    };

export function isAdminFeaturesSuccess(
  response: AdminFeaturesClientResponse,
): response is Extract<AdminFeaturesClientResponse, { ok: true }> {
  return response.ok && response.httpStatus === 200;
}
