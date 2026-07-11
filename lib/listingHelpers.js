/** Listing profile + gallery helpers (mirrors web helpers.js / schema.js). */

const WORKSPACE_IMGS = [
  'photo-1497366754035-f200968a6e72', 'photo-1497366811353-6870744d04b2', 'photo-1524758631624-e2822e304c36',
  'photo-1556761175-5973dc0f32e7', 'photo-1497215728101-856f4ea42174', 'photo-1604328698692-f76ea9498e76',
  'photo-1521737604893-d14cc237f11d', 'photo-1531973576160-7125cd663d86', 'photo-1600508774634-4e11d34730e2',
  'photo-1542744173-8e7e53415bb0', 'photo-1505373877841-8d25f7d46678', 'photo-1568992687947-868a62a9f521',
];

function hashStr(s) {
  let h = 0;
  for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

export function imgUrl(seed, w = 600, h = 360) {
  const idx = hashStr(String(seed)) % WORKSPACE_IMGS.length;
  return `https://images.unsplash.com/${WORKSPACE_IMGS[idx]}?auto=format&fit=crop&w=${w}&h=${h}&q=70`;
}

export const coverImg = (l, w = 600, h = 360) =>
  (l.images && l.images[0]) ? l.images[0] : imgUrl(l.id, w, h);

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

export function allGalleryPhotos(l) {
  const p = profileOf(l);
  const cab = p.capacity?.cabinSeatsEach || 4;
  const defs = [
    { label: 'Hero photo', caption: `${l.type} area — matches client request` },
    { label: 'Reception & entrance' },
    { label: `Private cabin — ${cab} seater`, price: p.pricing?.privateCabin, unit: '/seat' },
    { label: 'Meeting room' },
    { label: 'Cafeteria & breakout' },
    { label: 'Dedicated desk bay', price: p.pricing?.dedicatedDesk, unit: '/seat' },
    { label: 'Hot desk zone', price: p.pricing?.hotDesk, unit: '/seat' },
    { label: 'Conference room', price: p.pricing?.confRoomDay, unit: '/day' },
    { label: 'Phone booth' }, { label: 'Lounge & breakout' }, { label: 'Pantry' },
    { label: 'Terrace / balcony' }, { label: 'Car parking' }, { label: 'Corridor & common area' },
    { label: 'Washrooms' }, { label: 'Building facade' },
  ];
  const ups = l.images || [];
  const meta = l.photoMeta || [];
  const pick = (m, d) => ({
    label: (m && m.label) ? m.label : (d.label || 'Photo'),
    price: (m && m.price !== '' && m.price != null) ? Number(m.price) : d.price,
    unit: d.unit || '/seat',
    caption: d.caption,
  });
  if (ups.length) {
    return ups.map((src, i) => ({ src, ...pick(meta[i], defs[i] || { label: `Photo ${i + 1}` }) }));
  }
  return defs.map((d, i) => ({ src: imgUrl(`${l.id}-g${i}`, 400, 300), ...pick(null, d) }));
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
