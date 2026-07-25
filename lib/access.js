import { CITIES } from '../constants/listings';

export {
  PERMISSIONS,
  ALL_PERMISSIONS,
  DEFAULT_MEMBER_PERMISSIONS,
  PERM_LABELS,
  permissionLabel,
  FEATURES,
  isFeatureEnabled,
  isAdmin,
  can,
  canAssignLeads,
  canVerifyListings,
  canManageInventory,
  canCreateLead,
  cityScope,
  SCREENS,
  MOBILE_TAB_PATHS,
  canSeeScreen,
  canSeeBrowserTab,
  canSeeMatchTab,
  canSeeProposalsTab,
  canSeeProposalBuilder,
  canSeeLeadsTab,
  canSeeFreshness,
  canSeeUsersTab,
  canSeeDashboardTab,
  defaultTabPathForUser,
  visibleScreensForUser,
} from '@spacehaat/access';

export function defaultCityForUser(user) {
  const cities = (user?.cities || []).filter(Boolean);
  if (cities.length === 1) return cities[0];
  return 'All cities';
}

export function cityOptionsForUser(user) {
  if (user?.role === 'admin') return CITIES;
  const scoped = (user?.cities || []).filter(Boolean);
  if (!scoped.length) return ['All cities'];
  return ['All cities', ...scoped];
}

/** Cities assignable to members in user admin UI. */
export const ASSIGNABLE_CITIES = CITIES.filter((c) => c !== 'All cities');
