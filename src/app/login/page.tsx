import Link from "next/link";
import { redirect } from "next/navigation";

import { SignInForm } from "@/components/sign-in-form";
import { auth0 } from "@/lib/auth0";

function firstString(
  value: string | string[] | undefined,
): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value[0]) return value[0];
  return undefined;
}

export default async function LoginPage(props: PageProps<"/login">) {
  const session = await auth0.getSession();
  if (session) {
    redirect("/dashboard");
  }

  const searchParams = await props.searchParams;
  const errCode = firstString(searchParams.code);
  const oauthCode = firstString(searchParams.oauth);
  const description = firstString(searchParams.description);
  const hasError = Boolean(description || errCode || oauthCode);
  const descLower = description?.toLowerCase() ?? "";
  const isResourceServerUnauthorized =
    descLower.includes("not authorized") &&
    descLower.includes("resource server");
  const showAudienceHint =
    oauthCode === "access_denied" ||
    descLower.includes("audience") ||
    isResourceServerUnauthorized;

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-zinc-100 to-zinc-200 px-6 py-16 dark:from-zinc-950 dark:to-zinc-900">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200/80 bg-white p-10 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
        <div className="text-center">
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
            CM Training
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Sign in with your email. You will finish entering your credentials on
            Auth0, then return to your dashboard.
          </p>
        </div>

        {hasError ? (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100"
          >
            <p className="font-medium">Sign-in could not be completed</p>
            {description ? (
              <p className="mt-2 leading-relaxed">{description}</p>
            ) : null}
            <p className="mt-2 text-xs text-red-800/90 dark:text-red-200/90">
              {errCode ? `Code: ${errCode}` : null}
              {errCode && oauthCode ? " · " : null}
              {oauthCode ? `OAuth: ${oauthCode}` : null}
            </p>
            {showAudienceHint ? (
              <div className="mt-3 space-y-3 text-xs leading-relaxed text-red-800 dark:text-red-200/90">
                {isResourceServerUnauthorized ? (
                  <p className="font-medium text-red-900 dark:text-red-100">
                    Fix in Auth0 (this app must be allowed to use your API):
                  </p>
                ) : null}
                <ol className="list-decimal space-y-2 pl-4">
                  <li>
                    Ensure an API exists: <strong>APIs → Create API</strong> (or
                    open yours). The API <strong>Identifier</strong> must match{" "}
                    <code className="rounded bg-red-100 px-1 py-0.5 font-mono dark:bg-red-900/60">
                      AUTH0_AUDIENCE
                    </code>{" "}
                    exactly (e.g. <code className="font-mono">https://cm-training-api.onrender.com</code>
                    ).
                  </li>
                  <li>
                    <strong>Applications →</strong> your CM Training Regular Web App →{" "}
                    <strong>APIs</strong> tab → find that API → turn on{" "}
                    <strong>Authorize</strong> (allow this app to request access
                    tokens for the resource server).
                  </li>
                  <li>
                    If you only need login without calling the API yet, remove{" "}
                    <code className="rounded bg-red-100 px-1 py-0.5 font-mono dark:bg-red-900/60">
                      AUTH0_AUDIENCE
                    </code>{" "}
                    from <code className="font-mono">.env.local</code> and restart
                    the dev server.
                  </li>
                </ol>
              </div>
            ) : null}
          </div>
        ) : null}

        <SignInForm />

        <p className="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-500">
          By continuing you agree to your organisation&apos;s access policies.{" "}
          <Link href="/" className="text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400">
            Home
          </Link>
        </p>
      </div>
    </div>
  );
}
