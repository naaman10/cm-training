import {
  CmTrainingApiError,
  fetchPublicHealth,
  getCmTrainingApiBaseUrl,
} from "@/lib/api/client";

export async function DashboardHealth() {
  let apiStatus: "ok" | "error";
  let apiDetail: string;
  try {
    const health = await fetchPublicHealth();
    apiStatus = health.status === "ok" ? "ok" : "error";
    apiDetail =
      apiStatus === "ok" ? "API reachable (/health)" : `Unexpected: ${health.status}`;
  } catch (e) {
    apiStatus = "error";
    apiDetail =
      e instanceof CmTrainingApiError
        ? e.message
        : "Could not reach the training API.";
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        API connection
      </h2>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Base URL:{" "}
        <span className="font-mono text-xs text-zinc-800 dark:text-zinc-200">
          {getCmTrainingApiBaseUrl()}
        </span>
      </p>
      <p
        className={`mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
          apiStatus === "ok"
            ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
            : "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200"
        }`}
      >
        <span
          className={`h-2 w-2 rounded-full ${
            apiStatus === "ok" ? "bg-emerald-500" : "bg-red-500"
          }`}
          aria-hidden
        />
        {apiDetail}
      </p>
    </section>
  );
}
