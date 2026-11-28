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

/** May approve / reject a property and switch it on or off on the website (admins always). */
export function canEnableListings(user) {
  return can(user, PERMISSIONS.LISTINGS_ENABLE);
}

/**
 * Space types a user can be given; each opens one inventory section (same as the backend's USER_SPACE_TYPES).
 * OS = the older "Office space" code, which opens both office sections.
 */
export const MODULE_SPACE_TYPES = {
  coworking: ['CW'],
  'managed-office': ['MO', 'OS'],
  'private-office': ['PO', 'OS'],
  coliving: ['CL'],
  'virtual-office': ['VO'],
};
export const INVENTORY_MODULES = Object.keys(MODULE_SPACE_TYPES);

/** Inventory sections the user may see: all for admins, else only those their space types open. */
export function inventoryModules(user) {
  if (!user) return [];
  if (user.role === 'admin') return [...INVENTORY_MODULES];
  const types = new Set((user.spaceTypes || []).filter(Boolean));
  return INVENTORY_MODULES.filter((m) => MODULE_SPACE_TYPES[m].some((t) => types.has(t)));
}

export function canUseModule(user, vertical) {
  return inventoryModules(user).includes(vertical);
}

/** Space-type scope for members. Empty/unset = no restriction (back-compat). */
export function spaceTypeScope(user) {
  if (!user || user.role === 'admin') return null;
  const types = (user.spaceTypes || []).filter(Boolean);
  return types.length ? types : null;
}
