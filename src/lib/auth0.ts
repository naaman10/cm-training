import { Auth0Client } from "@auth0/nextjs-auth0/server";

import { auth0OnCallback } from "./auth0-callback";

const audience = process.env.AUTH0_AUDIENCE?.trim();
const baseScopes = "openid profile email";
const apiScopes = "users:read users:write admin:all";
const appBaseUrlRaw = process.env.APP_BASE_URL?.trim();

function normalizeAppBaseUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const withProtocol = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(raw)
    ? raw
    : `https://${raw}`;
  try {
    return new URL(withProtocol).toString().replace(/\/$/, "");
  } catch {
    return undefined;
  }
}

const appBaseUrl = normalizeAppBaseUrl(appBaseUrlRaw);

/**
 * For training API access tokens, set `AUTH0_AUDIENCE` to the API Identifier and add an
 * Auth0 Action so the access token includes `email` when the backend needs it for `/api/auth/me`.
 */
export const auth0 = new Auth0Client({
  signInReturnToPath: "/dashboard",
  ...(appBaseUrl ? { appBaseUrl } : {}),
  onCallback: auth0OnCallback,
  ...(audience
    ? {
        authorizationParameters: {
          audience,
          scope: `${baseScopes} ${apiScopes}`,
        },
      }
    : {}),
});
