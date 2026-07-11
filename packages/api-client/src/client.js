const DEFAULT_SKIP_UNAUTHORIZED = ['/auth/me', '/auth/login', '/auth/refresh'];

/**
 * @param {Object} [options]
 * @param {string} [options.baseUrl]
 * @param {RequestCredentials} [options.credentials]
 * @param {() => Promise<string | null> | string | null} [options.getAccessToken]
 * @param {() => void} [options.onUnauthorized]
 * @param {string[]} [options.skipUnauthorizedPaths]
 */
export function createApiClient(options = {}) {
  const {
    baseUrl = '',
    credentials = 'same-origin',
    getAccessToken = null,
    onUnauthorized = null,
    skipUnauthorizedPaths = DEFAULT_SKIP_UNAUTHORIZED,
  } = options;

  /**
   * @param {string} path
   * @param {{ method?: string, body?: unknown, formData?: boolean }} [opts]
   */
  async function request(path, { method = 'GET', body, formData = false } = {}) {
    /** @type {Record<string, string>} */
    const headers = {};

    if (body && !formData) {
      headers['content-type'] = 'application/json';
    }

    if (getAccessToken) {
      const token = await getAccessToken();
      if (token) headers.authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: Object.keys(headers).length ? headers : undefined,
      body: formData ? body : (body ? JSON.stringify(body) : undefined),
      credentials: getAccessToken ? 'omit' : credentials,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg = data?.error?.message || `Request failed (${res.status})`;
      const err = new Error(msg);
      err.status = res.status;
      err.code = data?.error?.code;
      err.data = data;

      if (
        res.status === 401
        && onUnauthorized
        && !skipUnauthorizedPaths.some((suffix) => path.endsWith(suffix))
      ) {
        onUnauthorized();
      }

      throw err;
    }

    return data;
  }

  return { request };
}
