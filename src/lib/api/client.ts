export const DEFAULT_CM_TRAINING_API_URL =
  "https://cm-training-api.onrender.com";

export function getCmTrainingApiBaseUrl(): string {
  const raw =
    process.env.CM_TRAINING_API_URL?.trim() ||
    process.env.NEXT_PUBLIC_CM_TRAINING_API_URL?.trim() ||
    DEFAULT_CM_TRAINING_API_URL;
  return raw.replace(/\/+$/, "");
}

export class CmTrainingApiError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "CmTrainingApiError";
  }
}

export async function fetchCmTrainingApiPublic(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const base = getCmTrainingApiBaseUrl();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return fetch(`${base}${normalized}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...init?.headers,
    },
  });
}

/** Public health endpoint — verifies reachability without a bearer token. */
export async function fetchPublicHealth(): Promise<{ status: string }> {
  const res = await fetchCmTrainingApiPublic("/health", { cache: "no-store" });
  if (!res.ok) {
    throw new CmTrainingApiError(
      `Health check failed (${res.status})`,
      res.status,
    );
  }
  return res.json() as Promise<{ status: string }>;
}

/** Call a protected CM Training route with a bearer access token when you add endpoints. */
export async function fetchCmTrainingApiWithBearer(
  accessToken: string,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  return fetchCmTrainingApiPublic(path, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...init?.headers,
    },
  });
}
