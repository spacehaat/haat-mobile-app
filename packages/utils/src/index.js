/** Shared pure helpers for web + mobile. */

export function initials(name) {
  return (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join('')
    .toUpperCase() || '?';
}

export function inr(n) {
  return n == null ? '—' : `₹${Number(n).toLocaleString('en-IN')}`;
}

export function priceRange(summary) {
  const { priceMin, priceMax } = summary || {};
  if (!priceMin && !priceMax) return '—';
  if (priceMin === priceMax) return inr(priceMin);
  return `${inr(priceMin)}–${inr(priceMax)}`;
}

export {
  REMINDER_PRESETS,
  DEFAULT_REMINDER_HOUR,
  DEFAULT_REMINDER_MINUTE,
  defaultCustomDateString,
  defaultCustomTimeString,
  buildReminderDate,
  formatReminderDateTime,
  reminderStatus,
  toLocalDateTimeInputValue,
  fromLocalDateTimeInputValue,
} from './leadReminder.js';
