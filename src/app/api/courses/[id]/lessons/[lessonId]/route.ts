import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { forwardSetCookies } from "@/lib/api/forward-set-cookies";
import { buildGetLessonPayload } from "@/lib/api/lessons";
import { auth0 } from "@/lib/auth0";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; lessonId: string }> },
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

  const { id, lessonId } = await context.params;
  const courseId = id?.trim();
  const lesson = lessonId?.trim();
  if (!courseId || !lesson) {
    return NextResponse.json(
      {
        ok: false,
        httpStatus: 400,
        code: "unknown" as const,
        message: "Course id and lesson id are required.",
      },
      { status: 400 },
    );
  }

  const sidecar = new NextResponse(null, { status: 200 });
  try {
    const { token } = await auth0.getAccessToken(request, sidecar, { audience });
    const { response, httpStatus } = await buildGetLessonPayload(
      token,
      courseId,
      lesson,
    );
    const out = NextResponse.json(response, {
      status: response.ok ? 200 : httpStatus,
    });
    forwardSetCookies(sidecar, out);
    return out;
  } catch (error) {
    const out = NextResponse.json(
      {
        ok: false,
        httpStatus: 401,
        code: "unauthenticated" as const,
        message: "Not signed in or token unavailable for lesson route.",
        detail: error instanceof Error ? error.message : undefined,
      },
      { status: 401 },
    );
    forwardSetCookies(sidecar, out);
    return out;
  }
}
