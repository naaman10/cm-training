"use client";

import { FormEvent, useState } from "react";

type Props = {
  /** Extra classes for the primary button */
  submitClassName?: string;
};

/**
 * Email + password fields for UX expectations. Only the email is sent to Auth0
 * as `login_hint` (Universal Login). The password is entered again on Auth0 — we
 * never send it over the wire from this form (OIDC code flow).
 */
export function SignInForm({ submitClassName }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const hint = email.trim();
    const params = new URLSearchParams();
    if (hint) {
      params.set("login_hint", hint);
    }
    params.set("returnTo", "/dashboard");
    const qs = params.toString();
    // Full navigation — Auth0 recommends avoiding client-side routing for /auth/login
    window.location.assign(qs ? `/auth/login?${qs}` : "/auth/login");
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
      <div>
        <label
          htmlFor="signin-email"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Email
        </label>
        <input
          id="signin-email"
          name="email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
          className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-zinc-900 shadow-sm outline-none ring-emerald-500/30 placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label
          htmlFor="signin-password"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Password
        </label>
        <input
          id="signin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(ev) => setPassword(ev.target.value)}
          className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-zinc-900 shadow-sm outline-none ring-emerald-500/30 placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
          placeholder="••••••••"
        />
        <p className="mt-1.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          For security, your password is submitted on Auth0&apos;s sign-in page (not
          from this site). Use the same password you use for your account after you
          continue.
        </p>
      </div>
      <button
        type="submit"
        className={
          submitClassName ??
          "inline-flex w-full items-center justify-center rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500"
        }
      >
        Continue to sign in
      </button>
    </form>
  );
}
