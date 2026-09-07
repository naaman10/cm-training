import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  buildAdminUserPermissionsPayload,
  buildGrantAdminUserPermissionPayload,
} from "@/lib/api/admin-user-permissions";
import { forwardSetCookies } from "@/lib/api/forward-set-cookies";
import { auth0 } from "@/lib/auth0";
import type { GrantAdminUserPermissionInput } from "@/types/admin-user-permissions";

async function requireUserId(
  context: { params: Promise<{ id: string }> },
): Promise<string | NextResponse> {
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
  return userId;
}

export async function GET(
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
        message: "AUTH0_AUDIENCE is required for admin user permissions API.",
      },
      { status: 503 },
    );
  }

  const userIdOrError = await requireUserId(context);
  if (userIdOrError instanceof NextResponse) return userIdOrError;
  const userId = userIdOrError;

  const sidecar = new NextResponse(null, { status: 200 });
  try {
    const { token } = await auth0.getAccessToken(request, sidecar, { audience });
    const { response, httpStatus } = await buildAdminUserPermissionsPayload(
      token,
      userId,
    );
    if (!response.ok) {
      console.error("[api/admin/users/:id/permissions] list upstream error:", {
        userId,
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
    console.error("[api/admin/users/:id/permissions] list access token:", error);
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
          ? "You are signed in but lack users:read permission for user grants."
          : "Not signed in or token unavailable for user permissions route.",
        detail: message || undefined,
      },
      { status: isPermissionError ? 403 : 401 },
    );
    forwardSetCookies(sidecar, out);
    return out;
  }
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
        message: "AUTH0_AUDIENCE is required for admin user permissions API.",
      },
      { status: 503 },
    );
  }

  const userIdOrError = await requireUserId(context);
  if (userIdOrError instanceof NextResponse) return userIdOrError;
  const userId = userIdOrError;

  const sidecar = new NextResponse(null, { status: 200 });
  try {
    const { token } = await auth0.getAccessToken(request, sidecar, { audience });

    let input: GrantAdminUserPermissionInput;
    try {
      input = (await request.json()) as GrantAdminUserPermissionInput;
    } catch {
      return NextResponse.json(
        {
          ok: false,
          httpStatus: 400,
          code: "bad_request" as const,
          message: "Invalid JSON request body.",
        },
        { status: 400 },
      );
    }

    const featureName =
      typeof input.featureName === "string" ? input.featureName.trim() : "";
    if (!featureName) {
      return NextResponse.json(
        {
          ok: false,
          httpStatus: 400,
          code: "bad_request" as const,
          message: "featureName is required.",
        },
        { status: 400 },
      );
    }

    const { response, httpStatus } = await buildGrantAdminUserPermissionPayload(
      token,
      userId,
      { featureName },
    );
    if (!response.ok) {
      console.error("[api/admin/users/:id/permissions] grant upstream error:", {
        userId,
        featureName,
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
    console.error("[api/admin/users/:id/permissions] grant access token:", error);
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
          ? "You are signed in but lack users:write permission to grant features."
          : "Not signed in or token unavailable for grant permission route.",
        detail: message || undefined,
      },
      { status: isPermissionError ? 403 : 401 },
    );
    forwardSetCookies(sidecar, out);
    return out;
  }
}
