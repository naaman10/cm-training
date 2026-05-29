import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { auth0 } from "@/lib/auth0";
import { buildPasswordResetAdminUserPayload } from "@/lib/api/admin-users";

function forwardSetCookies(from: NextResponse, to: NextResponse): void {
  const getSetCookie = from.headers.getSetCookie?.bind(from.headers);
  if (typeof getSetCookie === "function") {
    for (const cookie of getSetCookie()) {
      to.headers.append("Set-Cookie", cookie);
    }
    return;
  }
  const legacy = from.headers.get("set-cookie");
  if (legacy) to.headers.append("Set-Cookie", legacy);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const audience = process.env.AUTH0_AUDIENCE?.trim();
  if (!audience) {
    return NextResponse.json(
      {
        ok: false,
        httpStatus: 503,
        code: "configuration_error" as const,
        message: "AUTH0_AUDIENCE is required for admin users API.",
      },
      { status: 503 },
    );
  }

  const { id } = await context.params;
  const userId = id?.trim();
  if (!userId) {
    return NextResponse.json(
      {
        ok: false,
        httpStatus: 400,
        code: "bad_request" as const,
        message: "User id is required.",
      },
      { status: 400 },
    );
  }

  const sidecar = new NextResponse(null, { status: 200 });
  try {
    const { token } = await auth0.getAccessToken(request, sidecar, { audience });

    const { response, httpStatus } = await buildPasswordResetAdminUserPayload(
      token,
      userId,
    );
    if (!response.ok) {
      console.error("[api/admin/users/:id/password-reset] upstream error:", {
        userId,
        httpStatus,
        code: response.code,
        message: response.message,
        detail: "detail" in response ? response.detail : undefined,
      });
    }
    const out = NextResponse.json(response, {
      status: response.ok ? 202 : httpStatus,
    });
    forwardSetCookies(sidecar, out);
    return out;
  } catch (error) {
    console.error("[api/admin/users/:id/password-reset] access token:", error);
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
          ? "You are signed in but lack users:write permission for password reset."
          : "Not signed in or token unavailable for password reset route.",
        detail: message || undefined,
      },
      { status: isPermissionError ? 403 : 401 },
    );
    forwardSetCookies(sidecar, out);
    return out;
  }
}
