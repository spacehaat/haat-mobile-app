export function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function leadSubtitle(lead) {
  const parts = [];
  const seatLabel = lead?.seatRange?.trim()
    ? `${lead.seatRange.trim()} seats`
    : (lead?.seats ? `${lead.seats} seats` : '');
  if (seatLabel) parts.push(seatLabel);
  if (lead?.microlocation) parts.push(lead.microlocation);
  else if (lead?.city) parts.push(lead.city);
  return parts.join(' · ');
}

export function isOverdue(dueAt) {
  return dueAt && new Date(dueAt) < new Date();
}

export function greetingName(name) {
  return name?.split(' ')[0] || 'there';
}
