import { Linking, Alert } from 'react-native';

function normalizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

export async function openWhatsApp(phone, message = '') {
  const normalized = normalizePhone(phone);
  if (!normalized) {
    Alert.alert('No phone number', 'This lead does not have a phone number on file.');
    return;
  }

  const text = encodeURIComponent(message);
  const url = text
    ? `https://wa.me/${normalized}?text=${text}`
    : `https://wa.me/${normalized}`;

  const supported = await Linking.canOpenURL(url);
  if (!supported) {
    Alert.alert('WhatsApp unavailable', 'Could not open WhatsApp on this device.');
    return;
  }
  await Linking.openURL(url);
}
