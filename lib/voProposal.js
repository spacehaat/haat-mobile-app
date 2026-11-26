import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert, Linking, Platform, Share } from 'react-native';
import { getAccessToken } from './api';
import { apiBaseUrl } from '../constants/theme';

const digits = (phone) => {
  const d = String(phone || '').replace(/\D/g, '');
  return d.length === 10 ? `91${d}` : d;
};

/** WhatsApp with the message filled in: straight to the client's chat when we have a number. */
export async function sendOnWhatsApp(text, phone) {
  const to = digits(phone);
  const msg = encodeURIComponent(text);
  const url = to ? `https://wa.me/${to}?text=${msg}` : `whatsapp://send?text=${msg}`;
  try {
    await Linking.openURL(url);
  } catch {
    // No WhatsApp: fall back to the share sheet so the text still goes somewhere.
    await Share.share({ message: text });
  }
}

/** Mail app with subject and body filled in. */
export async function sendByEmail({ text, subject }, email) {
  const url = `mailto:${encodeURIComponent(String(email || '').trim())}?subject=${encodeURIComponent(subject || '')}&body=${encodeURIComponent(text)}`;
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('No mail app', 'Could not open an email app. The text has been opened in the share sheet instead.');
    await Share.share({ message: text, title: subject });
  }
}

/** Builds the PDF on the server, saves it to the app cache and opens the share sheet with it. */
export async function shareProposalPdf(body, { message } = {}) {
  const token = await getAccessToken();
  const res = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/api/v1/virtual-offices/proposal/pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let msg = `Could not make the PDF (status ${res.status})`;
    try {
      msg = (await res.json())?.error?.message || msg;
    } catch {
      /* not JSON */
    }
    throw new Error(msg);
  }
  const bytes = new Uint8Array(await res.arrayBuffer());
  const safe = String(body.clientName || '').replace(/[^\w]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40);
  const file = new File(Paths.cache, `SpaceWallah_Virtual_Office${safe ? `_${safe}` : ''}.pdf`);
  try {
    if (file.exists) file.delete();
  } catch {
    /* ignore */
  }
  file.create({ overwrite: true });
  file.write(bytes);
  const uri = file.uri.startsWith('file://') ? file.uri : `file://${file.uri}`;

  if (Platform.OS === 'ios') {
    const r = await Share.share({ url: uri, message: message || undefined, title: 'Virtual office proposal' });
    return r.action !== Share.dismissedAction;
  }
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Virtual office proposal', UTI: 'com.adobe.pdf' });
    return true;
  }
  throw new Error('Sharing is not available on this device');
}
