import { PERMISSIONS } from './permissions.js';

export function isAdmin(user) {
  return user?.role === 'admin';
}

export function can(user, permission) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return (user.permissions || []).includes(permission);
}

export function canAssignLeads(user) {
  return can(user, PERMISSIONS.LEADS_ASSIGN);
}

export function canVerifyListings(user) {
  return can(user, PERMISSIONS.LISTINGS_WRITE);
}

export function canManageInventory(user) {
  return can(user, PERMISSIONS.LISTINGS_WRITE);
}

export function canCreateLead(user) {
  return can(user, PERMISSIONS.LEADS_WRITE);
}

/** Returns scoped cities for members, or null for unrestricted (admin). */
export function cityScope(user) {
  if (!user || user.role === 'admin') return null;
  const cities = (user.cities || []).filter(Boolean);
  return cities.length ? cities : [];
}

/** Space-type scope for members. Empty/unset = no restriction (back-compat). */
export function spaceTypeScope(user) {
  if (!user || user.role === 'admin') return null;
  const types = (user.spaceTypes || []).filter(Boolean);
  return types.length ? types : null;
}
