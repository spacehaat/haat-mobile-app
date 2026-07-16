import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { router } from 'expo-router';
import {
  can as checkPermission,
  canSeeScreen as checkScreen,
  defaultTabPathForUser,
} from '../lib/access';
import {
  clearMobileTokens,
  getAccessToken,
  mobileApi,
  mobileLogin,
  mobileLogout,
  setMobileUnauthorizedHandler,
} from '../lib/api';
import { startPushRegistrationWatcher } from '../lib/notifications';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [permissionCatalog, setPermissionCatalog] = useState([]);
  const [booting, setBooting] = useState(true);
  const pushTokenRef = useRef(null);

  const applySession = useCallback((data) => {
    if (data?.user) setUser(data.user);
    if (data?.catalog?.permissions?.length) {
      setPermissionCatalog(data.catalog.permissions);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const data = await mobileApi.getMe();
    applySession(data);
    return data.user;
  }, [applySession]);

  const signOut = useCallback(async () => {
    // Keep the Expo push token on the server; next login reassigns it to the new user.
    pushTokenRef.current = null;
    await mobileLogout();
    setUser(null);
    setPermissionCatalog([]);
    router.replace('/(auth)/login');
  }, []);

  const signIn = useCallback(async (email, password) => {
    await mobileLogin(email, password);
    let session;
    try {
      session = await mobileApi.getMe();
    } catch {
      session = null;
    }
    if (session) {
      applySession(session);
    }
    const activeUser = session?.user;
    if (!activeUser) throw new Error('Could not load user profile');
    router.replace(defaultTabPathForUser(activeUser));
    return activeUser;
  }, [applySession]);

  useEffect(() => {
    setMobileUnauthorizedHandler(() => {
      clearMobileTokens();
      setUser(null);
      setPermissionCatalog([]);
      router.replace('/(auth)/login');
    });

    (async () => {
      try {
        const token = await getAccessToken();
        if (!token) return;
        const data = await mobileApi.getMe();
        applySession(data);
      } catch (err) {
        const isAuthError = err?.status === 401 || err?.code === 'UNAUTHENTICATED';
        if (isAuthError) {
          await clearMobileTokens();
        }
      } finally {
        setBooting(false);
      }
    })();
  }, [applySession]);

  // Register / refresh push token whenever a user session is active.
  useEffect(() => {
    if (!user) return undefined;

    return startPushRegistrationWatcher((token) => {
      pushTokenRef.current = token;
    });
  }, [user]);

  const can = useCallback((permission) => checkPermission(user, permission), [user]);
  const canSeeScreen = useCallback((screen) => checkScreen(user, screen), [user]);

  const value = useMemo(() => ({
    user,
    booting,
    signIn,
    signOut,
    refreshUser,
    permissionCatalog,
    isAuthenticated: Boolean(user),
    can,
    canSeeScreen,
    defaultTabPath: defaultTabPathForUser(user),
  }), [user, booting, signIn, signOut, refreshUser, permissionCatalog, can, canSeeScreen]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

/** Convenience hook for permission checks in screens. */
export function useAccess() {
  const { user, can, canSeeScreen, permissionCatalog, defaultTabPath } = useAuth();
  return { user, can, canSeeScreen, permissionCatalog, defaultTabPath };
}
