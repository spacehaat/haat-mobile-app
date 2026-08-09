export const colors = {
  brand: '#4CAF50',
  brandSoft: '#E8F5E9',
  brandInk: '#2E7D32',
  ink: '#1A1A1A',
  muted: '#6B6B6B',
  faint: '#9A968E',
  surface: '#FFFFFF',
  surface2: '#F4F2EE',
  border: '#E5E3DE',
  danger: '#D14343',
  success: '#2E9E5B',
};

const DEFAULT_API_URL = 'https://haat-api.spacehaat.com';

/** Trim trailing slash; never ship a blank/localhost URL to devices. */
export const apiBaseUrl = (() => {
  const raw = String(process.env.EXPO_PUBLIC_API_URL || '').trim().replace(/\/$/, '');
  if (!raw) return DEFAULT_API_URL;
  // Expo Go on a physical device cannot reach the host's localhost.
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(raw)) return DEFAULT_API_URL;
  return raw;
})();
