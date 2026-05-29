import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { auth0 } from "@/lib/auth0";
import { buildCourseDetailPayload } from "@/lib/api/courses";

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
        message: "AUTH0_AUDIENCE is required for courses API.",
      },
      { status: 503 },
    );
  }

  const { id } = await context.params;
  const courseId = id?.trim();
  if (!courseId) {
    return NextResponse.json(
      {
        ok: false,
        httpStatus: 400,
        code: "unknown" as const,
        message: "Course id is required.",
      },
      { status: 400 },
    );
  }

  const sidecar = new NextResponse(null, { status: 200 });
  try {
    const { token } = await auth0.getAccessToken(request, sidecar, { audience });
    const { response, httpStatus } = await buildCourseDetailPayload(
      token,
      courseId,
    );
    if (!response.ok) {
      console.error("[api/courses/:id] upstream error:", {
        courseId,
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
    console.error("[api/courses/:id] access token:", error);
    const out = NextResponse.json(
      {
        ok: false,
        httpStatus: 401,
        code: "unauthenticated" as const,
        message: "Not signed in or token unavailable for courses route.",
        detail: error instanceof Error ? error.message : undefined,
      },
      { status: 401 },
    );
    forwardSetCookies(sidecar, out);
    return out;
  }
}
