import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import { AppState, View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import {
  authenticateBiometric,
  isBiometricAvailable,
  isBiometricEnabled,
  setBiometricEnabled,
  enableBiometricWithPrompt,
} from '../lib/biometric';
import { useAuth } from './AuthContext';
import { colors } from '../constants/theme';

const BiometricContext = createContext(null);

export function BiometricProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [locked, setLocked] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [available, setAvailable] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const isAuthenticatingRef = useRef(false);
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    (async () => {
      setAvailable(await isBiometricAvailable());
      setEnabled(await isBiometricEnabled());
    })();
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !enabled) {
      setLocked(false);
      return undefined;
    }

    const sub = AppState.addEventListener('change', (nextState) => {
      // Ignore transitions while the system Face ID / passcode sheet is open.
      if (isAuthenticatingRef.current) {
        appStateRef.current = nextState;
        return;
      }

      const prev = appStateRef.current;

      // Lock only when the app truly leaves the foreground (not inactive — that
      // includes the biometric/passcode system UI).
      if (nextState === 'background') {
        setLocked(true);
      } else if (prev === 'background' && nextState === 'active') {
        setLocked(true);
      }

      appStateRef.current = nextState;
    });

    return () => sub.remove();
  }, [isAuthenticated, enabled]);

  const unlock = useCallback(async () => {
    if (unlocking) return false;
    setUnlocking(true);
    isAuthenticatingRef.current = true;
    try {
      const ok = await authenticateBiometric();
      if (ok) setLocked(false);
      return ok;
    } finally {
      setUnlocking(false);
      // Let the system auth sheet finish dismissing before listening to AppState again.
      setTimeout(() => {
        isAuthenticatingRef.current = false;
      }, 400);
    }
  }, [unlocking]);

  const enable = useCallback(async () => {
    isAuthenticatingRef.current = true;
    try {
      const ok = await enableBiometricWithPrompt();
      if (ok) setEnabled(true);
      return ok;
    } finally {
      setTimeout(() => {
        isAuthenticatingRef.current = false;
      }, 400);
    }
  }, []);

  const disable = useCallback(async () => {
    await setBiometricEnabled(false);
    setEnabled(false);
    setLocked(false);
  }, []);

  const value = useMemo(() => ({
    locked: isAuthenticated && enabled && locked,
    enabled,
    available,
    unlock,
    enable,
    disable,
  }), [isAuthenticated, enabled, locked, available, unlock, enable, disable]);

  return (
    <BiometricContext.Provider value={value}>
      {children}
      {value.locked ? (
        <View style={styles.overlay}>
          <Text style={styles.title}>Spacehaat locked</Text>
          <Text style={styles.sub}>Authenticate to continue</Text>
          <Pressable style={styles.btn} onPress={unlock} disabled={unlocking}>
            {unlocking ? <ActivityIndicator color="#fff" /> : (
              <Text style={styles.btnText}>Unlock</Text>
            )}
          </Pressable>
        </View>
      ) : null}
    </BiometricContext.Provider>
  );
}

export function useBiometric() {
  const ctx = useContext(BiometricContext);
  if (!ctx) throw new Error('useBiometric must be used within BiometricProvider');
  return ctx;
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    zIndex: 9999,
  },
  title: { fontSize: 22, fontWeight: '800', color: colors.ink, marginBottom: 8 },
  sub: { fontSize: 14, color: colors.muted, marginBottom: 24 },
  btn: {
    backgroundColor: colors.brand, borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 32, minWidth: 160, alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
