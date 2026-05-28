import { fetchCmTrainingApiWithBearer } from "@/lib/api/client";
import type { PortalMeClientResponse } from "@/types/portal-me";
import type { PortalUser } from "@/types/portal-user";

const ME_PATH = "/api/auth/me";

/**
 * Proxies portal profile from the training API using only `Authorization: Bearer`.
 * Intended for Route Handlers (after resolving an access token); no cookies forwarded upstream.
 */
export async function fetchTrainingApiMe(accessToken: string): Promise<Response> {
  const path = ME_PATH.startsWith("/") ? ME_PATH : `/${ME_PATH}`;
  return fetchCmTrainingApiWithBearer(accessToken, path, {
    cache: "no-store",
  });
}

/** Error branch only — never use for successful JSON with `{ user }`. */
function portalCodeForStatus(status: number): Exclude<
  PortalMeClientResponse["code"],
  "ok"
> {
  switch (status) {
    case 400:
      return "bad_request_email";
    case 401:
      return "unauthorized_token";
    case 403:
      return "forbidden_pending";
    case 409:
      return "conflict_email";
    default:
      return "unknown";
  }
}

function extractUpstreamMessage(json: unknown): string | undefined {
  if (!json || typeof json !== "object") return undefined;
  const o = json as Record<string, unknown>;
  if (typeof o.message === "string" && o.message.trim()) return o.message.trim();
  if (typeof o.error === "string" && o.error.trim()) return o.error.trim();
  if (
    typeof o.error === "object" &&
    o.error &&
    typeof (o.error as { message?: unknown }).message === "string"
  ) {
    const m = (o.error as { message: string }).message.trim();
    if (m) return m;
  }
  return undefined;
}

function extractUpstreamDetail(json: unknown): string | undefined {
  if (!json || typeof json !== "object") return undefined;
  const o = json as Record<string, unknown>;
  if (typeof o.detail === "string" && o.detail.trim()) return o.detail.trim();
  return undefined;
}

export async function buildPortalMePayload(
  accessToken: string,
): Promise<{ response: PortalMeClientResponse; httpStatus: number }> {
  let upstream: Response;
  try {
    upstream = await fetchTrainingApiMe(accessToken);
  } catch {
    return {
      httpStatus: 503,
      response: {
        ok: false,
        httpStatus: 503,
        code: "network_error",
        message: "Could not reach the training API. Try again shortly.",
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

  if (status === 200 && json && typeof json === "object" && "user" in json) {
    const user = (json as { user: unknown }).user;
    if (user && typeof user === "object") {
      return {
        httpStatus: 200,
        response: {
          ok: true,
          httpStatus: 200,
          code: "ok",
          user: user as PortalUser,
        },
      };
    }
  }

  if (status === 200) {
    const hint = extractUpstreamMessage(json);
    return {
      httpStatus: 200,
      response: {
        ok: false,
        httpStatus: 200,
        code: "invalid_response",
        message:
          hint ??
          "Training API returned 200 but no `{ user }` object. Check the API contract and deployment URL.",
        detail: extractUpstreamDetail(json),
      },
    };
  }

  const message = extractUpstreamMessage(json);
  const detail = extractUpstreamDetail(json);

  return {
    httpStatus: status,
    response: {
      ok: false,
      httpStatus: status,
      code: portalCodeForStatus(status),
      message:
        message ??
        (status === 400
          ? "Access token is missing an email claim. Contact an administrator to fix Auth0."
          : status === 403
            ? "Your account is not active yet. An administrator must approve access."
            : status === 409
              ? "This email is already linked to another account. Contact an administrator."
              : status === 401
                ? "Session or token is not valid for the training API. Sign in again."
                : status >= 500
                  ? "The training API returned a server error. Check API logs and database connectivity."
                  : "Could not load your training profile."),
      detail,
    },
  };
}
