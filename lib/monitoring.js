/**
 * Optional error monitoring — set EXPO_PUBLIC_SENTRY_DSN to enable.
 * Install @sentry/react-native when ready for production (M3.5).
 */

export function initMonitoring() {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  // Sentry SDK can be wired here when @sentry/react-native is added:
  // Sentry.init({ dsn, enableInExpoDevelopment: false });
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log('[monitoring] Sentry DSN configured — add @sentry/react-native to enable');
  }
}

export function captureError(error, context = {}) {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    if (__DEV__) console.warn('[monitoring]', error, context);
    return;
  }
  // Sentry.captureException(error, { extra: context });
}
