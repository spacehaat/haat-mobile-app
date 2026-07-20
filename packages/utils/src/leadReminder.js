/** Shared lead reminder helpers for web + mobile. */

export const REMINDER_PRESETS = [
  { id: 'tomorrow', label: 'Tomorrow' },
  { id: '3days', label: 'In 3 days' },
  { id: '1week', label: 'In 1 week' },
  { id: '1month', label: 'In 1 month' },
  { id: 'custom', label: 'Pick date & time' },
];

export const DEFAULT_REMINDER_HOUR = 10;
export const DEFAULT_REMINDER_MINUTE = 0;

export function pad2(n) {
  return String(n).padStart(2, '0');
}

export function defaultCustomDateString() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function defaultCustomTimeString() {
  return `${pad2(DEFAULT_REMINDER_HOUR)}:${pad2(DEFAULT_REMINDER_MINUTE)}`;
}

export function applyTimeToDate(baseDate, timeStr) {
  const d = new Date(baseDate);
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(timeStr || '').trim());
  const hours = match ? Number(match[1]) : DEFAULT_REMINDER_HOUR;
  const minutes = match ? Number(match[2]) : DEFAULT_REMINDER_MINUTE;
  d.setHours(hours, minutes, 0, 0);
  return d;
}

export function buildReminderDate(presetId, { customDate, customTime } = {}) {
  const base = new Date();
  base.setSeconds(0, 0);

  if (presetId === 'tomorrow') {
    base.setDate(base.getDate() + 1);
    return applyTimeToDate(base, defaultCustomTimeString());
  }
  if (presetId === '3days') {
    base.setDate(base.getDate() + 3);
    return applyTimeToDate(base, defaultCustomTimeString());
  }
  if (presetId === '1week') {
    base.setDate(base.getDate() + 7);
    return applyTimeToDate(base, defaultCustomTimeString());
  }
  if (presetId === '1month') {
    base.setMonth(base.getMonth() + 1);
    return applyTimeToDate(base, defaultCustomTimeString());
  }

  const datePart = customDate || defaultCustomDateString();
  const parsed = new Date(`${datePart}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return applyTimeToDate(parsed, customTime || defaultCustomTimeString());
}

export function formatReminderDateTime(value) {
  if (!value) return 'Not set';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'Not set';
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function reminderStatus(dueAt) {
  if (!dueAt) return { key: 'none', label: 'No reminder set' };
  const due = new Date(dueAt);
  if (Number.isNaN(due.getTime())) return { key: 'none', label: 'No reminder set' };

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDue = new Date(due.getFullYear(), due.getMonth(), due.getDate());

  if (due.getTime() < now.getTime()) {
    return { key: 'overdue', label: 'Overdue — follow up now' };
  }
  if (startOfDue.getTime() === startOfToday.getTime()) {
    return { key: 'today', label: 'Due today' };
  }
  const diffDays = Math.ceil((startOfDue.getTime() - startOfToday.getTime()) / (24 * 60 * 60 * 1000));
  return { key: 'upcoming', label: diffDays === 1 ? 'Due tomorrow' : `Due in ${diffDays} days` };
}

export function toLocalDateTimeInputValue(isoValue) {
  if (!isoValue) return '';
  const d = new Date(isoValue);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function fromLocalDateTimeInputValue(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}
