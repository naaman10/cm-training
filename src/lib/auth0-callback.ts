import type { OnCallbackHook } from "@auth0/nextjs-auth0/types";
import {
  AuthorizationCodeGrantError,
  AuthorizationError,
  OAuth2Error,
  type SdkError,
} from "@auth0/nextjs-auth0/errors";
import { NextResponse } from "next/server";

function oauthCause(err: SdkError): OAuth2Error | undefined {
  if (
    (err instanceof AuthorizationError ||
      err instanceof AuthorizationCodeGrantError) &&
    err.cause instanceof OAuth2Error
  ) {
    return err.cause;
  }
  return undefined;
}

function buildLoginErrorUrl(
  baseUrl: string,
  sdkError: SdkError,
): string {
  const url = new URL("/login", baseUrl);
  url.searchParams.set("code", sdkError.code);
  const oauth = oauthCause(sdkError);
  if (oauth?.code) {
    url.searchParams.set("oauth", oauth.code);
  }
  const description =
    oauth?.message?.trim() || sdkError.message.trim() || "Sign-in failed.";
  const safe = description.slice(0, 400);
  url.searchParams.set("description", safe);
  return url.toString();
}

export const auth0OnCallback: OnCallbackHook = async (error, ctx) => {
  const base = ctx.appBaseUrl;
  if (!base) {
    throw new Error(
      "Auth0 callback could not resolve appBaseUrl. Set APP_BASE_URL in .env.local.",
    );
  }

  if (error) {
    return NextResponse.redirect(buildLoginErrorUrl(base, error));
  }

  const target = ctx.returnTo?.startsWith("/") ? ctx.returnTo : "/dashboard";
  return NextResponse.redirect(new URL(target, base).toString());
};
