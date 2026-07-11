/**
 * Client-side mirror of backend permission catalogue.
 * Keep in sync with apps/backend/src/modules/auth/permissions.ts
 */

export const PERMISSIONS = {
  LISTINGS_READ: 'listings:read',
  LISTINGS_WRITE: 'listings:write',
  PROPOSALS_READ: 'proposals:read',
  PROPOSALS_WRITE: 'proposals:write',
  LEADS_READ: 'leads:read',
  LEADS_WRITE: 'leads:write',
  LEADS_ASSIGN: 'leads:assign',
  USERS_MANAGE: 'users:manage',
};

export const ALL_PERMISSIONS = Object.values(PERMISSIONS);

export const DEFAULT_MEMBER_PERMISSIONS = [
  PERMISSIONS.LISTINGS_READ,
  PERMISSIONS.PROPOSALS_READ,
  PERMISSIONS.PROPOSALS_WRITE,
  PERMISSIONS.LEADS_READ,
  PERMISSIONS.LEADS_WRITE,
];

/** Human-readable labels for admin UIs (web + mobile). */
export const PERM_LABELS = {
  [PERMISSIONS.LISTINGS_READ]: 'View inventory',
  [PERMISSIONS.LISTINGS_WRITE]: 'Manage inventory',
  [PERMISSIONS.PROPOSALS_READ]: 'View proposals',
  [PERMISSIONS.PROPOSALS_WRITE]: 'Create & send proposals',
  [PERMISSIONS.LEADS_READ]: 'View leads',
  [PERMISSIONS.LEADS_WRITE]: 'Manage leads',
  [PERMISSIONS.LEADS_ASSIGN]: 'Assign leads',
  [PERMISSIONS.USERS_MANAGE]: 'Manage users',
};

export function permissionLabel(permission) {
  return PERM_LABELS[permission] || permission;
}
