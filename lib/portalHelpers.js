import { inr } from '@spacehaat/utils';

export function initials(name = '') {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || 'SH';
}

export function statusFor(feedback, listingId) {
  const hit = (feedback?.interactions || []).find((x) => x.listingId === listingId);
  if (!hit?.status || hit.status === 'none') return 'pending';
  return hit.status;
}

export function listingPhotos(listing) {
  const imgs = listing.images?.length ? listing.images : [];
  if (!imgs.length) return [{ src: '', label: listing.type || 'Workspace' }];
  return imgs.map((src, i) => ({
    src,
    label: i === 0 ? (listing.type || 'Main view') : `Photo ${i + 1}`,
  }));
}

export function priceRangeLabel(listings) {
  const prices = listings.map((l) => l.price).filter(Boolean);
  if (!prices.length) return '—';
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  if (min === max) return inr(min);
  return `₹${Math.round(min / 1000)}k–${Math.round(max / 1000)}k`;
}

export function formatPortalWhen(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-IN', {
    day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
  });
}
