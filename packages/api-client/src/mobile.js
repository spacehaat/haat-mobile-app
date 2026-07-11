import { createApiClient } from './client.js';
import { createApiMethods } from './methods.js';

/**
 * Bearer-token API client for Expo / React Native.
 * @param {Object} options
 * @param {string} [options.baseUrl]
 * @param {() => Promise<string | null>} options.getAccessToken
 * @param {() => Promise<string | null>} [options.getRefreshToken]
 * @param {(accessToken: string, refreshToken: string) => Promise<void>} [options.setTokens]
 * @param {() => void} [options.onUnauthorized]
 */
export function createMobileApi(options) {
  const {
    baseUrl = '',
    getAccessToken,
    getRefreshToken,
    setTokens,
    onUnauthorized,
  } = options;

  let refreshPromise = null;

  const { request: rawRequest } = createApiClient({
    baseUrl,
    getAccessToken,
    onUnauthorized,
  });

  async function request(path, opts) {
    try {
      return await rawRequest(path, opts);
    } catch (err) {
      if (err.status !== 401 || !getRefreshToken || !setTokens || path.endsWith('/auth/refresh')) {
        throw err;
      }

      if (!refreshPromise) {
        refreshPromise = (async () => {
          const refreshToken = await getRefreshToken();
          if (!refreshToken) throw err;
          const data = await rawRequest('/api/v1/auth/refresh', {
            method: 'POST',
            body: { refreshToken },
          });
          await setTokens(data.accessToken, data.refreshToken ?? refreshToken);
          return data.accessToken;
        })().finally(() => {
          refreshPromise = null;
        });
      }

      await refreshPromise;
      return rawRequest(path, opts);
    }
  }

  return createApiMethods(request);
}

export { createApiClient } from './client.js';
export { createApiMethods } from './methods.js';
