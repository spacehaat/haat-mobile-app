import { FEATURES } from './features.js';
import { PERMISSIONS } from './permissions.js';
import { can, isAdmin } from './core.js';

/**
 * Screen registry — single source for section visibility.
 * Add a screen here + wire its route/tab once; UI gates derive from this map.
 */
export const SCREENS = {
  dashboard: { adminOnly: true },
  freshness: { adminOnly: true },
  inbox: { feature: 'inbox', adminOnly: true },
  users: { permission: PERMISSIONS.USERS_MANAGE },
  browser: { permission: PERMISSIONS.LISTINGS_READ },
  match: { permission: PERMISSIONS.PROPOSALS_WRITE },
  proposal: { permission: PERMISSIONS.PROPOSALS_WRITE },
  proposals: { permission: PERMISSIONS.PROPOSALS_READ },
  leads: { permission: PERMISSIONS.LEADS_READ },
};

/** Expo Router tab paths (mobile). */
export const MOBILE_TAB_PATHS = {
  dashboard: '/(tabs)',
  browser: '/(tabs)/browser',
  leads: '/(tabs)/leads',
  match: '/(tabs)/match',
  proposals: '/(tabs)/proposals',
  users: '/(tabs)/users',
};

/** Web app paths — kept here so both clients share screen ids. */
export const WEB_PATHS = {
  login: '/login',
  dashboard: '/dashboard',
  inbox: '/inbox',
  browser: '/browser',
  match: '/match',
  proposal: '/proposal',
  proposals: '/proposals',
  leads: '/leads',
  freshness: '/freshness',
  users: '/users',
};

const TAB_ORDER = ['dashboard', 'browser', 'leads', 'match', 'proposals', 'users'];

export function canSeeScreen(user, screen, options = {}) {
  if (!user) return false;
  const rule = SCREENS[screen];
  if (!rule) return false;

  const features = options.features || FEATURES;
  if (rule.feature && !features[rule.feature]) return false;
  if (rule.adminOnly) return isAdmin(user);
  if (rule.permission) return can(user, rule.permission);
  return true;
}

export function canSeeBrowserTab(user) {
  return canSeeScreen(user, 'browser');
}

export function canSeeMatchTab(user) {
  return canSeeScreen(user, 'match');
}

export function canSeeProposalsTab(user) {
  return canSeeScreen(user, 'proposals');
}

export function canSeeProposalBuilder(user) {
  return canSeeScreen(user, 'proposal');
}

export function canSeeLeadsTab(user) {
  return canSeeScreen(user, 'leads');
}

export function canSeeFreshness(user) {
  return canSeeScreen(user, 'freshness');
}

export function canSeeUsersTab(user) {
  return canSeeScreen(user, 'users');
}

export function canSeeDashboardTab(user) {
  return canSeeScreen(user, 'dashboard');
}

/** First allowed mobile tab for post-login redirect. */
export function defaultTabPathForUser(user) {
  if (!user) return '/(auth)/login';
  for (const screen of TAB_ORDER) {
    if (canSeeScreen(user, screen) && MOBILE_TAB_PATHS[screen]) {
      return MOBILE_TAB_PATHS[screen];
    }
  }
  return '/(auth)/login';
}

/** Web default landing path. */
export function defaultPathForUser(user) {
  if (!user) return WEB_PATHS.login;
  return user.role === 'admin' ? WEB_PATHS.dashboard : WEB_PATHS.browser;
}

export function visibleScreensForUser(user, options = {}) {
  return Object.keys(SCREENS).filter((screen) => canSeeScreen(user, screen, options));
}
