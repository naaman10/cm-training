import { NextResponse } from "next/server";

export function forwardSetCookies(from: NextResponse, to: NextResponse): void {
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
