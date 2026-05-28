import { Auth0Client } from "@auth0/nextjs-auth0/server";

import { auth0OnCallback } from "./auth0-callback";

const audience = process.env.AUTH0_AUDIENCE?.trim();
const baseScopes = "openid profile email";
const apiScopes = "users:read users:write admin:all";

/**
 * For training API access tokens, set `AUTH0_AUDIENCE` to the API Identifier and add an
 * Auth0 Action so the access token includes `email` when the backend needs it for `/api/auth/me`.
 */
export const auth0 = new Auth0Client({
  signInReturnToPath: "/dashboard",
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
