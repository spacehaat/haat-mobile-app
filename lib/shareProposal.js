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
    throw new Error(`Unable to download PDF (status ${res.status})`);
  }
  return new Uint8Array(await res.arrayBuffer());
}

function saveBytesToFile(bytes, destination) {
  try {
    if (destination.exists) destination.delete();
  } catch {
    /* ignore */
  }
  try {
    destination.create({ overwrite: true });
  } catch {
    /* create may throw if already exists on some platforms */
  }
  destination.write(bytes);
  return destination;
}

/** Always prefer file:// — expo-sharing rejects content:// on Android. */
function fileUri(file) {
  const uri = file?.uri || '';
  if (uri.startsWith('file://')) return uri;
  if (uri.startsWith('/')) return `file://${uri}`;
  return uri;
}

/**
 * Share a local PDF file. Prefer expo-sharing (file attachment).
 * On iOS, also include curated message text with the file when possible.
 */
async function shareLocalPdf(file, dialogTitle, message = '') {
  const uri = fileUri(file);
  if (!uri || (!uri.startsWith('file://') && !uri.startsWith('/'))) {
    throw new Error('PDF file is not ready to share. Please try again.');
  }

  // iOS native share can attach file + message together.
  if (Platform.OS === 'ios') {
    try {
      const result = await Share.share({
        url: uri,
        message: message || undefined,
        title: dialogTitle,
      });
      if (result.action !== Share.dismissedAction) return true;
      return false;
    } catch (err) {
      if (isShareCancelled(err)) return false;
      // Fall through to expo-sharing.
    }
  }

  if (await Sharing.isAvailableAsync()) {
    // expo-sharing requires a file:// URL (not content://).
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle,
      UTI: 'com.adobe.pdf',
    });
    return true;
  }

  // Last resort: text-only share (should be rare).
  if (message) {
    const result = await Share.share({ message, title: dialogTitle });
    return result.action !== Share.dismissedAction;
  }

  throw new Error('Sharing is not available on this device');
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
  let lastError;

  if (proposalId) {
    try {
      const bytes = await fetchPdfBytes(proposalPdfApiUrl(proposalId), true);
      return saveBytesToFile(bytes, destination);
    } catch (err) {
      lastError = err;
      if (!pdfUrl) throw err;
    }
  }

  try {
    const resolvedUrl = resolvePdfUrl(pdfUrl);
    const bytes = await fetchPdfBytes(resolvedUrl, urlNeedsAuth(resolvedUrl));
    return saveBytesToFile(bytes, destination);
  } catch (err) {
    throw lastError || err;
  }
}

/**
 * Build curated client-facing message (no PDF URL — file is attached separately).
 */
export function buildProposalShareMessage({
  channel,
  clientName,
  clientCompany,
  listingCount,
  brokerName,
  title,
}) {
  const cl = clientName || 'there';
  const co = clientCompany || '';
  const count = listingCount || 0;
  const broker = brokerName || 'Spacehaat';
  const first = String(broker).split(' ')[0] || broker;
  const via = proposalChannelForApi(channel);

  if (via === 'email') {
    return [
      `Dear ${cl},`,
      '',
      `Please find attached a curated proposal${title ? ` (“${title}”)` : ''} with ${count} workspace option${count === 1 ? '' : 's'}${co ? ` for ${co}` : ''}, matched to your requirement and verified for live availability.`,
      '',
      'Do let me know your preferred options and I’ll arrange site visits.',
      '',
      'Warm regards,',
      `${broker} · Spacehaat`,
    ].join('\n');
  }

  return `Hi ${cl}! 👋 As discussed, here's a proposal with ${count} workspace option${count === 1 ? '' : 's'}${co ? ` for ${co}` : ''} that match your requirement. All are verified-available right now — PDF attached. Let me know which you'd like to visit. — ${first}, Spacehaat`;
}

/**
 * Share a proposal PDF via the native share sheet (file attachment + curated text).
 * Never shares PDF URL alone.
 */
export async function shareProposalPdfFile(pdfUrl, title, options = {}) {
  const {
    proposalId,
    message,
    clientName,
    clientCompany,
    listingCount,
    brokerName,
    channel = 'whatsapp',
  } = options;

  const file = await downloadProposalPdf(pdfUrl, title, { proposalId });
  const dialogTitle = title || 'Spacehaat proposal';
  const curated = message || buildProposalShareMessage({
    channel,
    clientName,
    clientCompany,
    listingCount,
    brokerName,
    title,
  });

  // Always copy curated text so WhatsApp/Email can paste if the OS share sheet
  // only attaches the file (common on Android).
  try {
    await Clipboard.setStringAsync(curated);
  } catch {
    /* clipboard optional */
  }

  try {
    const shared = await shareLocalPdf(file, dialogTitle, curated);
    if (!shared) return { sharedFile: false, cancelled: true, copied: true };
    return { sharedFile: true, cancelled: false, copied: true };
  } catch (err) {
    if (isShareCancelled(err)) return { sharedFile: false, cancelled: true, copied: true };
    throw err;
  }
}

/**
 * Save/send flow: share PDF file with curated message (no PDF URL in text).
 */
export async function shareProposalWithMessage({
  message,
  pdfUrl,
  title,
  channel,
  proposalId,
  clientName,
  clientCompany,
  listingCount,
  brokerName,
}) {
  if (!pdfUrl && !proposalId) {
    throw new Error('No PDF available for this proposal');
  }

  const curated = message || buildProposalShareMessage({
    channel,
    clientName,
    clientCompany,
    listingCount,
    brokerName,
    title,
  });

  const result = await shareProposalPdfFile(pdfUrl, title, {
    proposalId,
    message: curated,
    channel,
    clientName,
    clientCompany,
    listingCount,
    brokerName,
  });

  return {
    copied: true,
    sharedFile: Boolean(result.sharedFile),
    openedWhatsApp: false,
    cancelled: Boolean(result.cancelled),
  };
}

export function shareSuccessMessage({ channel, sharedFile, cancelled }) {
  if (cancelled) {
    return 'Message copied to clipboard. You can paste it when you share the PDF.';
  }
  const via = proposalChannelForApi(channel);
  if (sharedFile && via === 'email') {
    return 'PDF ready to send. Curated email text is on your clipboard — paste it into the email body.';
  }
  if (sharedFile && via === 'whatsapp') {
    return 'PDF ready to send. Curated WhatsApp text is on your clipboard — paste it with the attachment.';
  }
  if (sharedFile) {
    return 'PDF shared. Curated message is on your clipboard if you need to paste it.';
  }
  return 'Message copied to clipboard.';
}

/** @deprecated Prefer share sheet; kept for rare “open locally” needs. */
export async function openProposalPdf(pdfUrl, title, options) {
  const file = await downloadProposalPdf(pdfUrl, title, options);
  const uri = fileUri(file);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: title || 'Open proposal',
      UTI: 'com.adobe.pdf',
    });
    return;
  }

  const canOpen = await Linking.canOpenURL(uri);
  if (canOpen) {
    await Linking.openURL(uri);
    return;
  }
  throw new Error('No PDF viewer available on this device');
}
