import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { buildAdminFeaturesPayload } from "@/lib/api/admin-features";
import { forwardSetCookies } from "@/lib/api/forward-set-cookies";
import { auth0 } from "@/lib/auth0";

export async function GET(request: NextRequest) {
  const audience = process.env.AUTH0_AUDIENCE?.trim();
  if (!audience) {
    return NextResponse.json(
      {
        ok: false,
        httpStatus: 503,
        code: "configuration_error" as const,
        message: "AUTH0_AUDIENCE is required for admin features API.",
      },
      { status: 503 },
    );
  }

  const sidecar = new NextResponse(null, { status: 200 });

  try {
    const { token } = await auth0.getAccessToken(request, sidecar, { audience });
    const { response, httpStatus } = await buildAdminFeaturesPayload(token);
    if (!response.ok) {
      console.error("[api/admin/features] upstream error:", {
        httpStatus,
        code: response.code,
        message: response.message,
        detail: "detail" in response ? response.detail : undefined,
      });
    }
    const out = NextResponse.json(response, {
      status: response.ok ? 200 : httpStatus,
    });
    forwardSetCookies(sidecar, out);
    return out;
  } catch (error) {
    console.error("[api/admin/features] access token:", error);
    const message = error instanceof Error ? error.message : "";
    const isPermissionError =
      /insufficient|scope|forbidden|permission|access denied/i.test(message);

    const out = NextResponse.json(
      {
        ok: false,
        httpStatus: isPermissionError ? 403 : 401,
        code: isPermissionError
          ? ("forbidden" as const)
          : ("unauthenticated" as const),
        message: isPermissionError
          ? "You are signed in but lack users:write permission for the feature catalog."
          : "Not signed in or token unavailable for admin features route.",
        detail: message || undefined,
      },
      { status: isPermissionError ? 403 : 401 },
    );
    forwardSetCookies(sidecar, out);
    return out;
  }
}
