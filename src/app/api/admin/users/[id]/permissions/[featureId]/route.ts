import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { buildRevokeAdminUserPermissionPayload } from "@/lib/api/admin-user-permissions";
import { forwardSetCookies } from "@/lib/api/forward-set-cookies";
import { auth0 } from "@/lib/auth0";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; featureId: string }> },
) {
  const audience = process.env.AUTH0_AUDIENCE?.trim();
  if (!audience) {
    return NextResponse.json(
      {
        ok: false,
        httpStatus: 503,
        code: "configuration_error" as const,
        message: "AUTH0_AUDIENCE is required for admin user permissions API.",
      },
      { status: 503 },
    );
  }

  const { id, featureId: rawFeatureId } = await context.params;
  const userId = id?.trim();
  const featureId = rawFeatureId?.trim();
  if (!userId || !featureId) {
    return NextResponse.json(
      {
        ok: false,
        httpStatus: 400,
        code: "bad_request" as const,
        message: "User id and feature id are required.",
      },
      { status: 400 },
    );
  }

  const sidecar = new NextResponse(null, { status: 200 });
  try {
    const { token } = await auth0.getAccessToken(request, sidecar, { audience });
    const { response, httpStatus } = await buildRevokeAdminUserPermissionPayload(
      token,
      userId,
      featureId,
    );
    if (!response.ok) {
      console.error(
        "[api/admin/users/:id/permissions/:featureId] revoke upstream error:",
        {
          userId,
          featureId,
          httpStatus,
          code: response.code,
          message: response.message,
          detail: "detail" in response ? response.detail : undefined,
        },
      );
    }
    const out = NextResponse.json(response, {
      status: response.ok ? 200 : httpStatus,
    });
    forwardSetCookies(sidecar, out);
    return out;
  } catch (error) {
    console.error(
      "[api/admin/users/:id/permissions/:featureId] revoke access token:",
      error,
    );
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
          ? "You are signed in but lack users:write permission to revoke features."
          : "Not signed in or token unavailable for revoke permission route.",
        detail: message || undefined,
      },
      { status: isPermissionError ? 403 : 401 },
    );
    forwardSetCookies(sidecar, out);
    return out;
  }
}
