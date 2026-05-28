import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { auth0 } from "@/lib/auth0";
import { buildPortalMePayload } from "@/lib/api/portal-me";

/** Forward refreshed session cookies from Auth0 SDK onto the outbound JSON response. */
function forwardSetCookies(from: NextResponse, to: NextResponse): void {
  const getSetCookie = from.headers.getSetCookie?.bind(from.headers);
  if (typeof getSetCookie === "function") {
    for (const c of getSetCookie()) {
      to.headers.append("Set-Cookie", c);
    }
    return;
  }
  const legacy = from.headers.get("set-cookie");
  if (legacy) {
    to.headers.append("Set-Cookie", legacy);
  }
}

/**
 * Portal BFF: loads `GET {CM_TRAINING_API_URL}/api/auth/me` with Bearer access token only
 * (no cookies to the upstream API).
 */
export async function GET(request: NextRequest) {
  const audience = process.env.AUTH0_AUDIENCE?.trim();
  if (!audience) {
    return NextResponse.json(
      {
        ok: false,
        httpStatus: 503,
        code: "configuration_error" as const,
        message:
          "AUTH0_AUDIENCE must be set so the app can request an access token for the training API.",
      },
      { status: 503 },
    );
  }

  const tokenSidecar = new NextResponse(null, { status: 200 });

  try {
    const { token } = await auth0.getAccessToken(request, tokenSidecar, {
      audience,
    });
    const { response: payload, httpStatus } = await buildPortalMePayload(token);
    const status = payload.ok ? 200 : httpStatus;
    if (!payload.ok) {
      console.error("[portal/me] upstream error:", {
        httpStatus,
        code: payload.code,
        message: payload.message,
        detail: "detail" in payload ? payload.detail : undefined,
      });
    }
    const out = NextResponse.json(payload, { status });
    forwardSetCookies(tokenSidecar, out);
    return out;
  } catch (err) {
    console.error("[portal/me] getAccessToken:", err);
    const out = NextResponse.json(
      {
        ok: false,
        httpStatus: 401,
        code: "unauthenticated" as const,
        message: "Not signed in or access token unavailable for this API audience.",
      },
      { status: 401 },
    );
    forwardSetCookies(tokenSidecar, out);
    return out;
  }
}
