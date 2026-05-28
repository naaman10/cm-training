"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  type PortalMeClientResponse,
  type PortalMeCode,
  isPortalMeSuccess,
} from "@/types/portal-me";
import type { PortalUser } from "@/types/portal-user";

export interface UsePortalSessionResult {
  user: PortalUser | null;
  loading: boolean;
  error: string | null;
  detail: string | null;
  httpStatus: number | null;
  code: PortalMeCode | null;
  refetch: (options?: { force?: boolean }) => Promise<void>;
}

const PortalSessionContext = createContext<UsePortalSessionResult | undefined>(
  undefined,
);

const MIN_REFETCH_MS = 30_000;
const MAX_NETWORK_RETRIES = 2;
const BASE_BACKOFF_MS = 400;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPortalOnce(): Promise<PortalMeClientResponse> {
  const res = await fetch("/api/portal/me", {
    credentials: "include",
    cache: "no-store",
  });
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    return {
      ok: false,
      httpStatus: res.status || 503,
      code:
        res.status === 401
          ? "unauthenticated"
          : res.status >= 500 || res.status === 503 || res.status === 0
            ? "network_error"
            : "unknown",
      message:
        res.ok || !(res.status > 0)
          ? "Invalid JSON from portal session route."
          : `Portal route returned HTTP ${res.status} with non-JSON (check server terminals / deployment logs).`,
    };
  }

  const d = data as Record<string, unknown>;
  const merged =
    typeof d.httpStatus !== "number" ? { ...d, httpStatus: res.status } : d;

  return merged as PortalMeClientResponse;
}

async function fetchPortalMeWithRetry(): Promise<PortalMeClientResponse> {
  let lastErr = "Could not reach the portal API.";
  for (let attempt = 0; attempt <= MAX_NETWORK_RETRIES; attempt++) {
    try {
      const data = await fetchPortalOnce();
      const transient =
        attempt < MAX_NETWORK_RETRIES &&
        ((!data.ok && data.httpStatus >= 502) ||
          (!data.ok && data.code === "network_error"));

      if (transient) {
        await sleep(BASE_BACKOFF_MS * 2 ** attempt);
        continue;
      }
      return data;
    } catch (e) {
      lastErr = e instanceof Error ? e.message : lastErr;
      if (attempt < MAX_NETWORK_RETRIES) {
        await sleep(BASE_BACKOFF_MS * 2 ** attempt);
      }
    }
  }
  return {
    ok: false,
    httpStatus: 503,
    code: "network_error",
    message: lastErr,
  };
}

export function PortalSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const value = usePortalSessionInner();
  return (
    <PortalSessionContext.Provider value={value}>
      {children}
    </PortalSessionContext.Provider>
  );
}

/** Portal profile (`/api/portal/me` → training `/api/auth/me`). Must live under `<PortalSessionProvider />`. */
export function usePortalSession(): UsePortalSessionResult {
  const ctx = useContext(PortalSessionContext);
  if (!ctx) {
    throw new Error(
      "usePortalSession must be used within <PortalSessionProvider />",
    );
  }
  return ctx;
}

function usePortalSessionInner(): UsePortalSessionResult {
  const [user, setUser] = useState<PortalUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [httpStatus, setHttpStatus] = useState<number | null>(null);
  const [code, setCode] = useState<PortalMeCode | null>(null);

  const lastOkAtRef = useRef(0);
  const latestUserRef = useRef<PortalUser | null>(null);
  const inFlightRef = useRef(false);

  const load = useCallback(async (force = false) => {
    const now = Date.now();
    if (
      !force &&
      latestUserRef.current &&
      now - lastOkAtRef.current < MIN_REFETCH_MS
    ) {
      setLoading(false);
      return;
    }
    if (inFlightRef.current) return;

    inFlightRef.current = true;
    setLoading(true);
    setError(null);
    setDetail(null);
    setHttpStatus(null);

    const data = await fetchPortalMeWithRetry();

    if (isPortalMeSuccess(data)) {
      latestUserRef.current = data.user;
      lastOkAtRef.current = Date.now();
      setUser(data.user);
      setCode("ok");
      setError(null);
      setDetail(null);
      setHttpStatus(200);
      inFlightRef.current = false;
      setLoading(false);
      return;
    }

    setCode(data.code);
    setHttpStatus(
      typeof data.httpStatus === "number" ? data.httpStatus : null,
    );
    setDetail(typeof data.detail === "string" ? data.detail : null);
    setError(data.message ?? "Portal session request failed.");

    const needsLogout =
      data.code === "unauthenticated" ||
      data.code === "unauthorized_token" ||
      data.httpStatus === 401;

    const needsApproval =
      data.httpStatus === 403 || data.code === "forbidden_pending";

    if (needsLogout) {
      latestUserRef.current = null;
      setUser(null);
      window.location.assign(
        `/auth/logout?returnTo=${encodeURIComponent("/login")}`,
      );
      return;
    }

    if (needsApproval) {
      latestUserRef.current = null;
      setUser(null);
      window.location.assign("/pending-approval");
      return;
    }

    latestUserRef.current = null;
    setUser(null);

    inFlightRef.current = false;
    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void load(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bootstrap once on mount
  }, []);

  useEffect(() => {
    const onFocusOrVisible = () => {
      if (
        typeof document !== "undefined" &&
        document.visibilityState !== "visible"
      )
        return;
      queueMicrotask(() => {
        void load(false);
      });
    };

    window.addEventListener("focus", onFocusOrVisible);
    document.addEventListener("visibilitychange", onFocusOrVisible);
    return () => {
      window.removeEventListener("focus", onFocusOrVisible);
      document.removeEventListener("visibilitychange", onFocusOrVisible);
    };
  }, [load]);

  const refetch = useCallback(
    async (options?: { force?: boolean }) => {
      await load(options?.force ?? true);
    },
    [load],
  );

  return { user, loading, error, detail, httpStatus, code, refetch };
}
