/** Listing profile + gallery helpers (mirrors web helpers.js / schema.js). */

const EMPTY_COVER = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="360">'
  + '<rect fill="#E8F5E9" width="100%" height="100%"/>'
  + '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#9A968E" font-family="system-ui,sans-serif" font-size="16">No photo</text>'
  + '</svg>',
);

export const coverImg = (l) =>
  (l.images && l.images[0]) ? l.images[0] : EMPTY_COVER;

const EMPTY_PROFILE = {
  identity: {},
  capacity: {},
  pricing: {},
  salesIntel: {},
  operations: {},
  contactsMedia: {},
};

export function profileOf(l) {
  if (!l) return EMPTY_PROFILE;
  if (l.profile && typeof l.profile === 'object') return l.profile;
  return EMPTY_PROFILE;
}

function photoSrc(value) {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.startsWith('http') || trimmed.startsWith('data:image/') ? trimmed : '';
  }
  if (value && typeof value.url === 'string') return value.url.trim();
  return '';
}

/** Gallery: only photos the user uploaded — never invent stock images. */
export function allGalleryPhotos(l) {
  const ups = (l?.images || []).map(photoSrc).filter(Boolean);
  const meta = l?.photoMeta || [];
  if (!ups.length) return [];

  return ups.map((src, i) => {
    const m = meta[i] || {};
    return {
      src,
      label: m.label || `Photo ${i + 1}`,
      price: (m.price !== '' && m.price != null) ? Number(m.price) : undefined,
      unit: m.unit || '/seat',
      caption: m.caption,
    };
  });
}

export function normalizeListingRecord(l) {
  if (!l) return l;
  const id = l.id || l._id;
  return { ...l, id: id != null ? String(id) : id };
}

export function coverNote(client, count, idx = 0) {
  const c = client?.company || 'your team';
  const n = count;
  const variants = [
    `Hi ${client?.name || 'there'}, thanks for the brief. Based on your requirement I've hand-picked ${n} space${n > 1 ? 's' : ''} that fit your team size, budget and preferred location — all verified for live availability. Happy to arrange visits this week.`,
    `Hi ${client?.name || 'there'}, here are ${n} shortlisted option${n > 1 ? 's' : ''} for ${c}. Each is move-in ready with the amenities you asked for, and pricing is locked at current rates. Let me know which you'd like to tour.`,
    `Sharing ${n} curated workspace${n > 1 ? 's' : ''} for ${c} — matched on location, headcount and budget. All listings are freshness-verified, so what you see is genuinely available. Keen to hear your thoughts.`,
  ];
  return variants[idx % variants.length];
}

export function clientSafeListing(l) {
  const p = profileOf(l);
  return {
    operator: l.operator,
    type: l.type,
    city: l.city,
    micro: l.micro,
    id: l.id,
    images: l.images,
    seats: l.seats,
    price: l.price,
    avail: l.avail,
    fresh: l.fresh,
    amenities: l.amenities,
    address: p.identity?.address,
    nearestMetro: p.identity?.nearestMetro,
    buildingType: p.identity?.buildingType,
    carpet: p.identity?.carpet,
    securityDeposit: p.pricing?.securityDeposit,
    noticePeriod: p.pricing?.noticePeriod,
    cabinPrice: p.pricing?.privateCabin,
    dayPass: p.pricing?.dayPass,
    brochure: p.contactsMedia?.brochure,
    website: p.contactsMedia?.website,
  };
}

export function buildProposalRender(listings) {
  const safeItems = listings.map(clientSafeListing);
  return {
    listings: safeItems.map((l) => ({
      operator: l.operator,
      type: l.type,
      city: l.city,
      micro: l.micro,
      seats: Number(l.seats || 0),
      price: Number(l.price || 0),
      avail: l.avail || 'Available now',
      freshLabel: l.fresh?.label || 'Verified',
      carpet: Number(l.carpet || 0),
      buildingType: l.buildingType || '',
      nearestMetro: l.nearestMetro || '',
      securityDeposit: l.securityDeposit || '',
      noticePeriod: l.noticePeriod || '',
      amenities: l.amenities || [],
      gallery: allGalleryPhotos(l).map((ph) => ({
        src: ph.src,
        label: ph.label || l.type,
      })),
    })),
  };
}

export function formatKv(value) {
  if (value === undefined || value === null || value === '') return '—';
  return String(value);
}
