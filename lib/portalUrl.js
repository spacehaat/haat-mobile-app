/** Public web URL base for client portal links shared with clients. */
export const portalWebBase = (
  process.env.EXPO_PUBLIC_PORTAL_URL || 'https://app.spacehaat.in'
).replace(/\/$/, '');

export function clientPortalUrl(shareTokenOrPath) {
  if (!shareTokenOrPath) return '';
  if (shareTokenOrPath.startsWith('http')) return shareTokenOrPath;
  const path = shareTokenOrPath.startsWith('/p/')
    ? shareTokenOrPath
    : `/p/${shareTokenOrPath}`;
  return `${portalWebBase}${path}`;
}
