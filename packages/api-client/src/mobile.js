import { createApiClient } from './client.js';
import { createApiMethods } from './methods.js';

const AUTH_PATHS_WITHOUT_REFRESH = ['/auth/login', '/auth/refresh'];
const AUTH_PATHS_WITHOUT_LOGOUT = ['/auth/login', '/auth/refresh'];

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
    // Refresh runs in this wrapper before logout; don't clear session on first 401.
    onUnauthorized: null,
  });

  async function request(path, opts, retried = false) {
    try {
      return await rawRequest(path, opts);
    } catch (err) {
      const canRefresh = (
        err.status === 401
        && !retried
        && getRefreshToken
        && setTokens
        && !AUTH_PATHS_WITHOUT_REFRESH.some((suffix) => path.endsWith(suffix))
      );

      if (!canRefresh) {
        if (
          err.status === 401
          && onUnauthorized
          && !AUTH_PATHS_WITHOUT_LOGOUT.some((suffix) => path.endsWith(suffix))
        ) {
          onUnauthorized();
        }
        throw err;
      }

      try {
        if (!refreshPromise) {
          refreshPromise = (async () => {
            const refreshToken = await getRefreshToken();
            if (!refreshToken) {
              const noRefreshErr = new Error('No refresh token');
              noRefreshErr.status = 401;
              throw noRefreshErr;
            }
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
        return request(path, opts, true);
      } catch (refreshErr) {
        if (onUnauthorized) onUnauthorized();
        throw refreshErr.status ? refreshErr : err;
      }
    }
  }

  return createApiMethods(request);
}

export { createApiClient } from './client.js';
export { createApiMethods } from './methods.js';
