/**
 * Matches training API `/api/auth/me` → `{ user }` (`200`).
 */
export interface PortalUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  lastLoginAtUk: string | null;
}
