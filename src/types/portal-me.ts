import type { PortalUser } from "@/types/portal-user";

export type PortalMeCode =
  | "ok"
  | "unauthenticated"
  | "unauthorized_token"
  | "configuration_error"
  | "bad_request_email"
  | "forbidden_pending"
  | "conflict_email"
  | "network_error"
  | "invalid_response"
  | "unknown";

/**
 * JSON body returned by Next.js route `GET /api/portal/me` (BFF → training API; Bearer-only upstream).
 */
export type PortalMeClientResponse =
  | {
      ok: true;
      httpStatus: 200;
      code: "ok";
      user: PortalUser;
    }
  | {
      ok: false;
      httpStatus: number;
      code: PortalMeCode;
      message?: string;
      /** Partial debug from backend when present */
      detail?: string;
    };

export function isPortalMeSuccess(
  r: PortalMeClientResponse,
): r is Extract<PortalMeClientResponse, { ok: true }> {
  return r.ok === true && r.httpStatus === 200;
}
