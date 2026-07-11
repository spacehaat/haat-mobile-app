import * as SecureStore from 'expo-secure-store';
import { createMobileApi } from '@spacehaat/api-client/mobile';
import { apiBaseUrl } from '../constants/theme';

const ACCESS_KEY = 'spacehaat.accessToken';
const REFRESH_KEY = 'spacehaat.refreshToken';

let unauthorizedHandler = null;

export function setMobileUnauthorizedHandler(fn) {
  unauthorizedHandler = fn;
}

export async function getAccessToken() {
  return SecureStore.getItemAsync(ACCESS_KEY);
}

async function getRefreshToken() {
  return SecureStore.getItemAsync(REFRESH_KEY);
}

async function setTokens(accessToken, refreshToken) {
  await SecureStore.setItemAsync(ACCESS_KEY, accessToken);
  if (refreshToken) {
    await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
  }
}

export async function clearMobileTokens() {
  await SecureStore.deleteItemAsync(ACCESS_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}

export async function hasStoredSession() {
  const token = await getAccessToken();
  return Boolean(token);
}

export const mobileApi = createMobileApi({
  baseUrl: apiBaseUrl,
  getAccessToken,
  getRefreshToken,
  setTokens,
  onUnauthorized: () => unauthorizedHandler?.(),
});

export async function mobileLogin(email, password) {
  const data = await mobileApi.loginMobile(email, password);
  if (data.accessToken && data.refreshToken) {
    await setTokens(data.accessToken, data.refreshToken);
  }
  return data;
}

export async function mobileLogout() {
  const refreshToken = await getRefreshToken();
  try {
    await mobileApi.logout(refreshToken || undefined);
  } catch {
    // Clear local session even if network logout fails.
  } finally {
    await clearMobileTokens();
  }
}
