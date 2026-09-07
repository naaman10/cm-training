export type FeatureSession = {
  isAdmin: boolean;
  permissions: string[];
};

export function can(
  featureName: string,
  me: FeatureSession,
): boolean {
  return me.isAdmin || me.permissions.includes(featureName);
}

/** Role identity check — not a product feature grant. */
export function roleIncludesAdmin(role: string | null | undefined): boolean {
  if (!role) return false;
  return role.trim().toLowerCase().includes("admin");
}
