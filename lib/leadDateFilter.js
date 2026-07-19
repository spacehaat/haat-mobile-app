/** Lead date-range presets for web + mobile filters. */

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function startOfWeekMonday(date) {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(d, diff);
}

function startOfMonth(date) {
  const d = startOfDay(date);
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function startOfYear(date) {
  const d = startOfDay(date);
  return new Date(d.getFullYear(), 0, 1);
}

function toRange(from, toExclusive) {
  return {
    dateFrom: from.toISOString(),
    dateTo: toExclusive.toISOString(),
  };
}

/** @returns {{ dateFrom?: string, dateTo?: string }} */
export function resolveLeadDateRange(period, custom = {}) {
  const now = new Date();

  switch (period) {
    case 'all':
      return {};
    case 'today':
      return toRange(startOfDay(now), addDays(startOfDay(now), 1));
    case 'yesterday': {
      const y = addDays(startOfDay(now), -1);
      return toRange(y, startOfDay(now));
    }
    case 'this_week':
      return toRange(startOfWeekMonday(now), addDays(startOfWeekMonday(now), 7));
    case 'last_week': {
      const start = addDays(startOfWeekMonday(now), -7);
      return toRange(start, addDays(start, 7));
    }
    case 'this_month':
      return toRange(startOfMonth(now), startOfMonth(addDays(startOfMonth(now), 32)));
    case 'last_month': {
      const start = startOfMonth(addDays(startOfMonth(now), -1));
      return toRange(start, startOfMonth(now));
    }
    case 'this_year':
      return toRange(startOfYear(now), startOfYear(addDays(startOfYear(now), 366)));
    case 'last_year': {
      const start = startOfYear(addDays(startOfYear(now), -1));
      return toRange(start, startOfYear(now));
    }
    case 'custom': {
      const from = custom.from ? startOfDay(custom.from) : null;
      const to = custom.to ? addDays(startOfDay(custom.to), 1) : null;
      if (from && to && from < to) return toRange(from, to);
      if (from && !to) return toRange(from, addDays(from, 1));
      if (!from && to) return { dateTo: to.toISOString() };
      return {};
    }
    default:
      return toRange(startOfMonth(now), startOfMonth(addDays(startOfMonth(now), 32)));
  }
}

export const WEB_DATE_FILTERS = [
  ['custom', 'Custom'],
  ['today', 'Today'],
  ['yesterday', 'Yesterday'],
  ['this_week', 'This Week'],
  ['last_week', 'Last Week'],
  ['this_month', 'This Month'],
];

export const MOBILE_DATE_FILTERS = [
  ['custom', 'Custom'],
  ['today', 'Today'],
  ['yesterday', 'Yesterday'],
  ['this_week', 'This Week'],
  ['last_week', 'Last Week'],
  ['this_month', 'This Month'],
  ['this_year', 'This Year'],
];

export function leadDateFilterLabel(period, options = WEB_DATE_FILTERS) {
  return options.find(([value]) => value === period)?.[1] || 'This Month';
}
