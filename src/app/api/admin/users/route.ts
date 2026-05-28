import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { auth0 } from "@/lib/auth0";
import {
  buildAdminUsersPayload,
  buildCreateAdminUserPayload,
} from "@/lib/api/admin-users";
import type { CreateAdminUserInput } from "@/types/admin-users";

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

export async function GET(request: NextRequest) {
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

  const sidecar = new NextResponse(null, { status: 200 });

  try {
    // Reuse the audience token from the signed-in session. Requesting per-call scopes can
    // fail depending on refresh-token policy and cause avoidable 401s.
    const { token } = await auth0.getAccessToken(request, sidecar, { audience });

    const { response, httpStatus } = await buildAdminUsersPayload(token);
    const out = NextResponse.json(response, {
      status: response.ok ? 200 : httpStatus,
    });
    forwardSetCookies(sidecar, out);
    return out;
  } catch (error) {
    console.error("[api/admin/users] access token:", error);
    const message = error instanceof Error ? error.message : "";
    const isPermissionError =
      /insufficient|scope|forbidden|permission|access denied/i.test(message);

    const out = NextResponse.json(
      {
        ok: false,
        httpStatus: isPermissionError ? 403 : 401,
        code: isPermissionError ? ("forbidden" as const) : ("unauthenticated" as const),
        message: isPermissionError
          ? "You are signed in but lack users:read permission for admin users."
          : "Not signed in or token unavailable for admin users route.",
        detail: message || undefined,
      },
      { status: isPermissionError ? 403 : 401 },
    );
    forwardSetCookies(sidecar, out);
    return out;
  }
}

export async function POST(request: NextRequest) {
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

  const sidecar = new NextResponse(null, { status: 200 });
  try {
    // Reuse the audience token from login/session; backend enforces users:write/admin:all.
    const { token } = await auth0.getAccessToken(request, sidecar, { audience });

    let input: CreateAdminUserInput;
    try {
      input = (await request.json()) as CreateAdminUserInput;
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

    const { response, httpStatus } = await buildCreateAdminUserPayload(token, input);
    if (!response.ok) {
      console.error("[api/admin/users] create upstream error:", {
        httpStatus,
        code: response.code,
        message: response.message,
        detail: "detail" in response ? response.detail : undefined,
      });
    }
    const out = NextResponse.json(response, {
      status: response.ok ? 201 : httpStatus,
    });
    forwardSetCookies(sidecar, out);
    return out;
  } catch (error) {
    console.error("[api/admin/users] create access token:", error);
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
          ? "You are signed in but lack users:write permission for create user."
          : "Not signed in or token unavailable for create user route.",
        detail: message || undefined,
      },
      { status: isPermissionError ? 403 : 401 },
    );
    forwardSetCookies(sidecar, out);
    return out;
  }
}
