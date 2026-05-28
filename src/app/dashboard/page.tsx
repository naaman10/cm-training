import { MainNav } from "@/components/main-nav";

import { DashboardHealth } from "./dashboard-health";
import { DashboardPortalProfile } from "./dashboard-portal-profile";

export default function DashboardPage() {
  /* Auth + portal profile gated in layout (`PortalSessionGate`). */
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <header>
        <MainNav actionHref="/auth/logout" actionLabel="Logout" />
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-10">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Training portal access is active when your profile loads below.
          </p>
        </div>

        <DashboardPortalProfile />
        <DashboardHealth />
      </main>
    </div>
  );
}
