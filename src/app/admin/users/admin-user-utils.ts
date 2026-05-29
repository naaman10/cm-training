import type { SafeAdminUser } from "@/types/admin-user";
import type { PortalUser } from "@/types/portal-user";

export function formatAdminUserName(user: SafeAdminUser): string {
  const full = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return full || user.email;
}

export function isInactiveStatus(status: string): boolean {
  return status.trim().toLowerCase() === "inactive";
}

export function isSamePortalUser(
  portalUser: PortalUser | null | undefined,
  adminUser: SafeAdminUser,
): boolean {
  if (!portalUser) return false;
  if (portalUser.id && portalUser.id === adminUser.id) return true;
  return (
    portalUser.email.trim().toLowerCase() === adminUser.email.trim().toLowerCase()
  );
}
