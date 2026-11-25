/** Helpers for the Expenses tab: money, days (`YYYY-MM-DD`, phone's local day) and months (`YYYY-MM`). */

export function formatRupees(value) {
  const n = Number(value || 0);
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

const pad = (n) => String(n).padStart(2, '0');

export function toIsoDay(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseIsoDay(iso) {
  const [y, m, d] = String(iso).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function todayIso() {
  return toIsoDay(new Date());
}

export function shiftDay(iso, days) {
  const d = parseIsoDay(iso);
  d.setDate(d.getDate() + days);
  return toIsoDay(d);
}

export function currentMonth() {
  return todayIso().slice(0, 7);
}

export function shiftMonth(month, delta) {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export function monthLabel(month) {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

/** "Today", "Yesterday", or "Mon, 23 Nov" (with the year when it isn't this year). */
export function dayLabel(iso) {
  const today = todayIso();
  if (iso === today) return 'Today';
  if (iso === shiftDay(today, -1)) return 'Yesterday';
  const d = parseIsoDay(iso);
  const sameYear = iso.slice(0, 4) === today.slice(0, 4);
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', ...(sameYear ? {} : { year: 'numeric' }) });
}

export const PAID_BY = [
  { value: 'company', label: 'Company', hint: 'Paid from the company account', icon: 'business-outline' },
  { value: 'self', label: 'Self', hint: 'Paid from their own pocket; the company pays them back', icon: 'person-outline' },
  { value: 'other', label: 'Someone else', hint: 'Another person paid; the company pays them back', icon: 'people-outline' },
];

export function paidByLabel(expense) {
  if (expense.paidBy === 'company') return 'Paid by company';
  if (expense.paidBy === 'other') return `Paid by ${expense.paidByName || 'someone else'}`;
  return `Paid by ${expense.person?.name || 'self'}`;
}

/** Icons offered when an admin creates a category. */
export const CATEGORY_ICONS = [
  'pricetag-outline', 'car-outline', 'fast-food-outline', 'briefcase-outline', 'cafe-outline',
  'home-outline', 'flash-outline', 'wifi-outline', 'call-outline', 'print-outline',
  'construct-outline', 'gift-outline', 'megaphone-outline', 'cash-outline', 'medkit-outline', 'airplane-outline',
];
