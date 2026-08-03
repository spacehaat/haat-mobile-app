/** Public web URL base for client portal links — must match the live web app host. */
export const portalWebBase = (
  process.env.EXPO_PUBLIC_PORTAL_URL || 'https://haat-web-app.vercel.app'
).replace(/\/$/, '');

/**
 * Build the same client portal URL shape as web:
 *   `${origin}/p/${shareToken}`
 */
export function clientPortalUrl(shareTokenOrPath) {
  if (!shareTokenOrPath) return '';
  if (shareTokenOrPath.startsWith('http')) return shareTokenOrPath;
  const path = shareTokenOrPath.startsWith('/p/')
    ? shareTokenOrPath
    : `/p/${String(shareTokenOrPath).replace(/^\//, '')}`;
  return `${portalWebBase}${path}`;
}
