import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const ENABLED_KEY = 'spacehaat.biometricEnabled';

export async function isBiometricAvailable() {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return compatible && enrolled;
}

export async function isBiometricEnabled() {
  const v = await SecureStore.getItemAsync(ENABLED_KEY);
  return v === '1';
}

export async function setBiometricEnabled(enabled) {
  if (enabled) {
    await SecureStore.setItemAsync(ENABLED_KEY, '1');
  } else {
    await SecureStore.deleteItemAsync(ENABLED_KEY);
  }
}

export async function authenticateBiometric(reason = 'Unlock Spacehaat') {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: reason,
    cancelLabel: 'Cancel',
    disableDeviceFallback: false,
  });
  return result.success;
}

export async function enableBiometricWithPrompt() {
  const available = await isBiometricAvailable();
  if (!available) return false;
  const ok = await authenticateBiometric('Enable biometric unlock');
  if (ok) await setBiometricEnabled(true);
  return ok;
}
