import { Linking, Alert } from 'react-native';

function normalizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

export function firstNameOf(fullName) {
  const first = String(fullName || '').trim().split(/\s+/)[0];
  return first || 'there';
}

/** India-friendly daypart greeting from the device clock. */
export function timeOfDayGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export function leadFollowUpWhatsAppMessage({ clientName, memberName, spaceType } = {}) {
  const firstName = firstNameOf(clientName);
  const member = firstNameOf(memberName);
  const greeting = timeOfDayGreeting();
  const intro = `Hi ${firstName}, ${greeting}! 👋\n\n`
    + `${member === 'there' ? 'SpaceWallah' : member} this side from *SpaceWallah*.\n\n`;

  if (spaceType === 'VO') {
    return (
      intro
      + `I just received your query regarding a *Virtual Office*.\n\n`
      + `Just let me know which purpose you are looking for:\n`
      + `🧾 GST Registration\n`
      + `🏢 Business Address\n`
      + `📄 Company Registration\n\n`
      + `Once I know, I’ll share the most suitable virtual office options with you.`
    );
  }

  return (
    intro
    + `I’m following up regarding your query for a *Coworking Space*.\n\n`
    + `Could you please share your exact requirements, such as:\n`
    + `📍 Preferred Location\n`
    + `💰 Budget per Seat\n`
    + `👥 Number of Seats Required\n\n`
    + `Once I have these details, I’ll share the most suitable coworking options with you.`
  );
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
