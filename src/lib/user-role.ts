import type { User } from "@auth0/nextjs-auth0/types";

function formatRoleValue(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  if (Array.isArray(value) && value.length > 0) {
    const parts = value.filter((v): v is string => typeof v === "string");
    if (parts.length > 0) {
      return parts.join(", ");
    }
  }
  return null;
}

/**
 * Best-effort role label from Auth0 profile claims (RBAC, Actions, or custom namespace).
 */
export function resolveUserRole(user: User): string {
  const claimKey = process.env.AUTH0_ROLE_CLAIM?.trim();
  if (claimKey) {
    const fromClaim = formatRoleValue(user[claimKey]);
    if (fromClaim) return fromClaim;
  }

  const fromRoles = formatRoleValue(user.roles);
  if (fromRoles) return fromRoles;

  const fromRole = formatRoleValue(user.role);
  if (fromRole) return fromRole;

  return "Not configured — add a roles claim in Auth0 or set AUTH0_ROLE_CLAIM";
}

export function resolveDisplayName(user: User): string {
  return (
    user.name ||
    user.nickname ||
    user.email ||
    user.sub ||
    "Unknown user"
  );
}
