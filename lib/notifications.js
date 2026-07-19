import { AppState, Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { mobileApi } from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Spacehaat',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#4CAF50',
  });
}

export async function registerForPushNotifications() {
  if (!Device.isDevice) {
    console.warn('[push] skipped — not a physical device');
    return null;
  }

  await ensureAndroidChannel();

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    console.warn('[push] permission not granted:', finalStatus);
    return null;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId
    ?? Constants.easConfig?.projectId;
  if (!projectId) {
    console.warn('[push] missing EAS projectId');
    return null;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
  const token = tokenData?.data;
  if (!token) {
    console.warn('[push] empty Expo push token');
    return null;
  }

  await mobileApi.registerDevice({
    token,
    platform: Platform.OS,
  });
  console.log('[push] registered device', Platform.OS, token.slice(0, 28) + '...');
  return token;
}

export function addNotificationResponseListener(handler) {
  return Notifications.addNotificationResponseReceivedListener(handler);
}

export async function unregisterPushNotifications(token) {
  if (!token) return;
  try {
    await mobileApi.unregisterDevice(token);
  } catch {
    // Best effort on logout.
  }
}

/** Re-register when app returns to foreground (covers permission grants + token refresh). */
export function startPushRegistrationWatcher(onToken) {
  let running = false;

  const run = async () => {
    if (running) return;
    running = true;
    try {
      const token = await registerForPushNotifications();
      if (token) onToken?.(token);
    } catch (err) {
      console.warn('[push] registration failed', err?.message || err);
    } finally {
      running = false;
    }
  };

  run();
  const sub = AppState.addEventListener('change', (state) => {
    if (state === 'active') run();
  });
  return () => sub.remove();
}
