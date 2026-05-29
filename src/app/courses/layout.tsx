import { redirect } from "next/navigation";

import { PortalSessionGate } from "@/components/portal-session-gate";
import { PortalSessionProvider } from "@/context/portal-session";
import { auth0 } from "@/lib/auth0";

export default async function CoursesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth0.getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <PortalSessionProvider>
      <PortalSessionGate>{children}</PortalSessionGate>
    </PortalSessionProvider>
  );
}
