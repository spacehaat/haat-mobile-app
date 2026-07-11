import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import { Linking, Platform, Share } from 'react-native';
import { getAccessToken } from './api';
import { apiBaseUrl } from '../constants/theme';

/** Map UI channel ids to API values (matches web AppContext). */
export function proposalChannelForApi(channel) {
  if (channel === 'wa') return 'whatsapp';
  if (channel === 'em' || channel === 'email') return 'email';
  return channel;
}

function resolvePdfUrl(pdfUrl) {
  if (!pdfUrl) return pdfUrl;
  if (/^https?:\/\//i.test(pdfUrl)) return pdfUrl;
  const base = apiBaseUrl.replace(/\/$/, '');
  const path = pdfUrl.startsWith('/') ? pdfUrl : `/${pdfUrl}`;
  return `${base}${path}`;
}

function safeFilename(title) {
  return (title || 'Spacehaat_Proposal').replace(/[^\w.-]+/g, '_').slice(0, 80);
}

function isShareCancelled(err) {
  const msg = String(err?.message || '').toLowerCase();
  return msg.includes('cancel') || msg.includes('dismiss') || err?.code === 'ERR_SHARING_CANCELLED';
}

function apiOrigin() {
  try {
    return new URL(apiBaseUrl).origin;
  } catch {
    return '';
  }
}

/** Only attach Bearer token for same-origin API URLs — S3 rejects unexpected auth headers. */
function urlNeedsAuth(url) {
  const origin = apiOrigin();
  if (!origin) return false;
  try {
    return new URL(url).origin === origin;
  } catch {
    return false;
  }
}

function proposalPdfApiUrl(proposalId) {
  const base = apiBaseUrl.replace(/\/$/, '');
  return `${base}/api/v1/proposals/${proposalId}/pdf`;
}

async function fetchPdfBytes(url, useAuth) {
  const headers = {};
  if (useAuth) {
    const token = await getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`Unable to download a file. Response has status ${res.status}`);
  }
  return new Uint8Array(await res.arrayBuffer());
}

function saveBytesToFile(bytes, destination) {
  if (destination.exists) {
    destination.delete();
  }
  destination.create({ overwrite: true });
  destination.write(bytes);
  return destination;
}

/** URI suitable for Linking / Sharing (content URI on Android when available). */
function shareableUri(file) {
  if (Platform.OS === 'android' && file.contentUri) return file.contentUri;
  return file.uri;
}

async function shareLocalPdf(file, dialogTitle, message) {
  const uri = shareableUri(file);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle,
      UTI: 'com.adobe.pdf',
    });
    return true;
  }
  if (Platform.OS === 'ios') {
    const result = await Share.share({ message, url: uri, title: dialogTitle });
    return result.action !== Share.dismissedAction;
  }
  return false;
}

/**
 * Download a proposal PDF to the app cache.
 * Prefers the authenticated API proxy when proposalId is known.
 * @returns {Promise<File>}
 */
export async function downloadProposalPdf(pdfUrl, title, { proposalId } = {}) {
  if (!pdfUrl && !proposalId) {
    throw new Error('No PDF available for this proposal');
  }

  const destination = new File(Paths.cache, `${safeFilename(title)}.pdf`);

  if (proposalId) {
    try {
      const bytes = await fetchPdfBytes(proposalPdfApiUrl(proposalId), true);
      return saveBytesToFile(bytes, destination);
    } catch (err) {
      if (!pdfUrl) throw err;
      // Backend proxy unavailable — fall back to direct URL without auth headers.
    }
  }

  const resolvedUrl = resolvePdfUrl(pdfUrl);
  const bytes = await fetchPdfBytes(resolvedUrl, urlNeedsAuth(resolvedUrl));
  return saveBytesToFile(bytes, destination);
}

/**
 * Open a proposal PDF in the device viewer (downloads first if remote).
 */
export async function openProposalPdf(pdfUrl, title, options) {
  const file = await downloadProposalPdf(pdfUrl, title, options);
  const uri = shareableUri(file);

  const canOpen = await Linking.canOpenURL(uri);
  if (canOpen) {
    await Linking.openURL(uri);
    return;
  }
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: title || 'Open proposal',
      UTI: 'com.adobe.pdf',
    });
    return;
  }
  throw new Error('No PDF viewer available on this device');
}

/**
 * Share a proposal PDF via the native share sheet (file attachment).
 */
export async function shareProposalPdfFile(pdfUrl, title, options) {
  const file = await downloadProposalPdf(pdfUrl, title, options);
  const dialogTitle = title || 'Spacehaat proposal';

  try {
    const shared = await shareLocalPdf(file, dialogTitle);
    if (!shared) throw new Error('Sharing is not available on this device');
    return { sharedFile: true };
  } catch (err) {
    if (isShareCancelled(err)) return { sharedFile: false, cancelled: true };
    throw err;
  }
}

/**
 * Save/send flow: copy message to clipboard, then share PDF file (and optionally open WhatsApp).
 */
export async function shareProposalWithMessage({ message, pdfUrl, title, channel, proposalId }) {
  await Clipboard.setStringAsync(message);

  const apiChannel = proposalChannelForApi(channel);
  const dialogTitle = title || 'Spacehaat proposal';
  let sharedFile = false;
  let openedWhatsApp = false;

  if (apiChannel === 'whatsapp') {
    const waUri = `https://wa.me/?text=${encodeURIComponent(message)}`;
    if (await Linking.canOpenURL(waUri)) {
      await Linking.openURL(waUri);
      openedWhatsApp = true;
      return { copied: true, sharedFile: false, openedWhatsApp: true };
    }
  }

  if (pdfUrl || proposalId) {
    try {
      const file = await downloadProposalPdf(pdfUrl, title, { proposalId });
      sharedFile = await shareLocalPdf(file, dialogTitle, message);
    } catch (err) {
      if (!isShareCancelled(err)) throw err;
    }
  }

  if (!sharedFile && !openedWhatsApp) {
    const result = await Share.share({ message, title: dialogTitle });
    if (result.action === Share.dismissedAction) {
      return { copied: true, sharedFile: false, openedWhatsApp: false, cancelled: true };
    }
  }

  return { copied: true, sharedFile, openedWhatsApp };
}

export function shareSuccessMessage({ channel, openedWhatsApp, sharedFile, cancelled }) {
  if (cancelled) return 'Message copied to clipboard.';
  const via = proposalChannelForApi(channel);
  if (openedWhatsApp) {
    return 'Message copied and WhatsApp opened with your proposal text (includes PDF link).';
  }
  if (sharedFile && via === 'email') {
    return 'Message copied to clipboard. Attach the shared PDF in your email app.';
  }
  if (sharedFile) {
    return 'Message copied to clipboard and PDF shared.';
  }
  return 'Message copied to clipboard. Share the PDF link with your client.';
}
