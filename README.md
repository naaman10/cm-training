# CM Training (frontend)

Next.js app for the CM Training driving-instructor programme: Auth0 sign-in, dashboard, and integration with the CM Training API (`https://cm-training-api.onrender.com`).

<!--
  Auth / portal notes:
  • This frontend uses Authorization Code (+ PKCE) via @auth0/nextjs-auth0 (Regular Web Application).
    Set authorizationParameters.audience in Auth0 Dashboard + env AUTH0_AUDIENCE equal to your
    Training API Identifier so access tokens validate on the backend.
  • Backend GET /api/auth/me expects Bearer access tokens with aud = that Identifier; optionally
    set `openid profile email` and add an Auth0 Action to copy `email` into the API access token
    so Neon/user bootstrap can resolve the caller on first `/api/auth/me`.
  • CORS: configure the deployed API FRONTEND_ORIGIN to NEXT_PUBLIC_FRONTEND_ORIGIN exactly.
-->

## Requirements

- Node.js 20+
- An [Auth0](https://auth0.com) **Regular Web Application**
- CM Training Auth0 **API** (resource server) with Identifier set to **`AUTH0_AUDIENCE`** and this app authorized

## Setup

1. Copy `.env.example` to `.env.local` and fill in Auth0 values (`AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_SECRET`). Set **`AUTH0_AUDIENCE`**, **`CM_TRAINING_API_URL`** (no trailing slash), and **`NEXT_PUBLIC_FRONTEND_ORIGIN`** (exact browser origin).

2. In the Auth0 application settings, set:

   - **Allowed Callback URLs**: `http://localhost:3000/auth/callback`
   - **Allowed Logout URLs**: `http://localhost:3000`
   - **Allowed Web Origins** (if prompted): `http://localhost:3000`

3. **Roles on the dashboard**: Legacy Auth0-session role labels use **Roles** paragraph (below). Portal profile uses **`user.role`** from **`GET /api/auth/me`** (Neon-backed).

4. **Training API authorization** (`AUTH0_AUDIENCE`):

   - Create an Auth0 **API** (**APIs → Create API**) whose **Identifier** matches `AUTH0_AUDIENCE`.
   - **Applications →** your Regular Web Application → **APIs** tab → **Authorize** that API (*Client … not authorized…* appears if skipped).
   - Optional: enable API **RBAC** and add Permissions; extend `authorizationParameters.scope` / Auth0 Roles as needed.

5. **Portal session** (`/api/auth/me`):

   - After login the app loads **`GET {CM_TRAINING_API_URL}/api/auth/me`** with **`Authorization: Bearer <access_token>`** only — no upstream cookies (`src/app/api/portal/me/route.ts` BFF).
   - Responses: **200** portal access; **403** redirects to **`/pending-approval`** (inactive DB user); **401** signs out via **`/auth/logout`**; **400** missing `email` in token — fix Auth0 Action; **409** email conflict — contact admin.
   - Client state: **`usePortalSession`** in `src/context/portal-session.tsx` (debounced refetch ~30s, window focus retries with backoff).

6. **Admin users view** (`/admin/users`):

   - Frontend route is wrapped by Auth0 + portal session guard and then checks the portal user role includes `admin`.
   - Data source is BFF route **`GET /api/admin/users`** (`src/app/api/admin/users/route.ts`) which fetches backend **`GET /api/admin/users`** with bearer token.
   - Token request includes scope **`users:read`** and your API must grant that permission.
   - UI supports search (name/email), role filter, status filter, empty states, and explicit handling for 401/403/500.

7. Run the dev server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000): redirects to Auth0 when signed out, or **`/dashboard`** when signed in. **`/login`** keeps the email form and OAuth callback errors.

### Troubleshooting

| Symptom | Things to check |
|---------|----------------|
| *Client … is not authorized to access resource server …* | Applications → APIs → Authorize matching API Identifier |
| Pending approval loop | Activate user in Neon / admin tooling; **`/dashboard`** redirects to **`/pending-approval`** on **403** |
| Wrong audience / stale token after env change | Sign out completely, clear site cookies; verify `AUTH0_AUDIENCE` matches API Identifier |

## Project layout

| Path | Purpose |
|------|---------|
| `src/proxy.ts` | Auth0 middleware / session |
| `src/lib/auth0.ts` | `Auth0Client`: audience + scopes for API access tokens |
| `src/lib/api/client.ts` | Prefers **`CM_TRAINING_API_URL`** (server) → `NEXT_PUBLIC_CM_TRAINING_API_URL`, Bearer helper |
| `src/lib/api/fetch-with-auth.ts` | `fetchTrainingApiWithBearer` helper |
| `src/lib/api/portal-me.ts` | Build portal `/api/auth/me` response from upstream training API |
| `src/app/api/portal/me/route.ts` | BFF token exchange + Bearer-only upstream proxy |
| `src/context/portal-session.tsx` | `PortalSessionProvider` + **`usePortalSession`** |
| `src/components/portal-session-gate.tsx` | Guards dashboard until **200 `user`** or error UI |
| `src/app/dashboard/layout.tsx` | Auth0 session + portal provider wrapper |
| `src/app/pending-approval/page.tsx` | **403 / inactive account** UX |
| `src/types/portal-user.ts` | `PortalUser` DTO mirrors backend `/api/auth/me` |

## Scripts

- `npm run dev` — development
- `npm run build` — production build
- `npm run start` — serve production build
- `npm run lint` — ESLint
