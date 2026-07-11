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
import { registerForPushNotifications, unregisterPushNotifications } from '../lib/notifications';

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
    await unregisterPushNotifications(pushTokenRef.current);
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
    registerForPushNotifications()
      .then((token) => { pushTokenRef.current = token; })
      .catch(() => {});
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
        registerForPushNotifications()
          .then((t) => { pushTokenRef.current = t; })
          .catch(() => {});
      } catch {
        await clearMobileTokens();
      } finally {
        setBooting(false);
      }
    })();
  }, [applySession]);

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
