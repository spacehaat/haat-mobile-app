/**
 * Feature flags — flip to true when a capability is production-ready.
 */

export const FEATURES = {
  inbox: false,
};

export function isFeatureEnabled(key) {
  return Boolean(FEATURES[key]);
}
