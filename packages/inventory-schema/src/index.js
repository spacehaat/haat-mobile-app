export const SPACE_TYPES = ['Hot desk', 'Dedicated desk', 'Private cabin', 'Managed office'];

export const AMENITIES = [
  'Wi-Fi', 'Parking', 'Cafeteria', 'Meeting rooms', '24x7 access', 'AC',
  'Reception', 'Phone booths', 'Printer', 'Pantry', 'Metro <5min', 'Gym',
];

export const BUILDING_TYPES = ['IT park', 'Standalone', 'Mixed-use'];

export const LISTING_CITIES = ['Gurugram', 'Noida', 'Delhi', 'Bangalore', 'Mumbai', 'Pune', 'Hyderabad', 'Ahmedabad', 'Jaipur', 'Chennai', 'Lucknow', 'Indore'];

/** Six-step wizard schema — keep in sync with web InventoryWizard. */
export const INV_SCHEMA = [
  { id: 'A', title: 'Identity & Location', tag: 'static', fields: [
    { p: 'core.operator', l: 'Operator', req: true, ph: 'e.g. Awfis' },
    { p: 'identity.centreName', l: 'Centre name', ph: 'auto if blank' },
    { p: 'core.city', l: 'City', t: 'select', req: true, opts: () => LISTING_CITIES },
    { p: 'core.micro', l: 'Micro-market', req: true, ph: 'e.g. Koramangala' },
    { p: 'identity.address', l: 'Full address', t: 'textarea', ph: 'Building, street, area, city, PIN' },
    { p: 'identity.mapsLink', l: 'Google Maps link', ph: 'maps.google.com/…' },
    { p: 'identity.nearestMetro', l: 'Nearest metro station' },
    { p: 'identity.nearestRail', l: 'Nearest railway station' },
    { p: 'identity.floors', l: 'Floor(s) occupied', ph: 'e.g. 3rd–5th floor' },
    { p: 'core.type', l: 'Space type', t: 'select', req: true, opts: () => SPACE_TYPES },
    { p: 'identity.buildingType', l: 'Building type', t: 'select', opts: () => BUILDING_TYPES },
    { p: 'identity.ownership', l: 'Building ownership', t: 'select', opts: () => ['Leased', 'Developer-owned', 'Managed lease'] },
    { p: 'identity.entranceFacing', l: 'Entrance facing', t: 'select', opts: () => ['North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West'] },
    { p: 'identity.zoning', l: 'Area type / zoning', ph: 'e.g. Commercial, SEZ' },
    { p: 'identity.superBuiltUp', l: 'Super built-up', t: 'num', suf: 'sq ft' },
    { p: 'identity.carpet', l: 'Carpet area', t: 'num', suf: 'sq ft' },
    { p: 'identity.layoutType', l: 'Layout type', ph: 'e.g. Open-plan' },
    { p: 'identity.deskSize', l: 'Desk size', ph: 'e.g. 4 × 2 ft' },
    { p: 'identity.vastu', l: 'Vastu compliant', t: 'toggle' },
  ]},
  { id: 'B', title: 'Capacity', tag: 'mixed', fields: [
    { p: 'capacity.totalSeats', l: 'Total seats (excl. meeting/conf)', t: 'num' },
    { p: 'capacity.totalWorkstations', l: 'Total open workstations', t: 'num' },
    { p: 'capacity.totalCabins', l: 'Total private cabins', t: 'num' },
    { p: 'capacity.cabinSeatsEach', l: 'Seats per cabin', t: 'num' },
    { p: 'capacity.meetingRooms', l: 'Meeting rooms', t: 'num' },
    { p: 'capacity.meetingRoomSeats', l: 'Seats per meeting room', t: 'num' },
    { p: 'capacity.conferenceRooms', l: 'Conference rooms', t: 'num' },
    { p: 'capacity.conferenceSeats', l: 'Seats per conference room', t: 'num' },
    { div: 'Live availability', tag: 'live' },
    { p: 'core.seats', l: 'Open workstations available', t: 'num', req: true, live: true },
    { p: 'capacity.availCabins', l: 'Private cabins available', t: 'num', live: true },
    { p: 'capacity.availCabinSeats', l: 'Seats per available cabin', t: 'num', live: true },
    { p: 'capacity.hotDeskAvailable', l: 'Hot desk available', t: 'toggle', live: true },
    { p: 'capacity.hotDeskCount', l: 'Hot desks available (count)', t: 'num', live: true },
    { p: 'core.avail', l: 'Available from', live: true, ph: 'e.g. Available now' },
  ]},
  { id: 'C', title: 'Pricing', tag: 'live', fields: [
    { p: 'core.price', l: 'Dedicated desk / seat / mo', t: 'inr', req: true },
    { p: 'pricing.hotDesk', l: 'Hot desk charges / mo', t: 'inr' },
    { p: 'pricing.privateCabin', l: 'Private cabin / seat / mo', t: 'inr' },
    { p: 'pricing.managedPerSqft', l: 'Managed office / sq ft', t: 'inr' },
    { p: 'pricing.confRoomHour', l: 'Conference room / hour', t: 'inr' },
    { p: 'pricing.confRoomDay', l: 'Conference room / day', t: 'inr' },
    { p: 'pricing.meetingRoomHour', l: 'Meeting room / hour', t: 'inr' },
    { p: 'pricing.dayPass', l: 'Day pass', t: 'inr' },
    { p: 'pricing.carParking', l: 'Car parking / mo', t: 'inr' },
    { p: 'pricing.twoWheeler', l: '2-wheeler parking / mo', t: 'inr' },
    { p: 'pricing.signageBoard', l: 'Signage board (reception)', t: 'inr' },
    { p: 'pricing.beyondHours', l: 'Beyond-hours charges', ph: 'e.g. ₹150/hr after 10 PM' },
    { p: 'pricing.securityDeposit', l: 'Security deposit', ph: 'e.g. 2 months' },
    { p: 'pricing.noticePeriod', l: 'Notice period', t: 'select', opts: () => ['1 month', '2 months', '3 months'] },
  ]},
  { id: 'D', title: 'Sales Intelligence', tag: 'internal', fields: [
    { p: 'salesIntel.pitchingPrice', l: 'Pitching price', t: 'inr' },
    { p: 'salesIntel.closingPrice', l: 'Closing price', t: 'inr' },
    { p: 'salesIntel.yoyIncrement', l: 'YoY increment', ph: 'e.g. 8%' },
    { p: 'salesIntel.competitors', l: 'Nearby competitors (one per line)', t: 'list' },
    { p: 'salesIntel.expansionPlans', l: 'Expansion plans', t: 'textarea' },
    { p: 'salesIntel.commissionAccount', l: 'Payment / commission account', t: 'textarea' },
  ]},
  { id: 'E', title: 'Operations', tag: 'mixed', fields: [
    { p: 'operations.timings', l: 'Timings', ph: 'e.g. 9:00 AM – 9:00 PM' },
    { p: 'operations.daysOpen', l: 'Days open', t: 'select', opts: () => ['Mon – Fri', 'Mon – Sat', 'All days'] },
    { p: 'operations.sundayVisits', l: 'Client visits on Sunday', t: 'toggle' },
    { p: 'operations.managedOfficeAvailable', l: 'Managed office available', t: 'toggle', live: true },
    { p: 'operations.virtualOfficeAvailable', l: 'Virtual office available', t: 'toggle', live: true },
  ]},
  { id: 'F', title: 'Contacts & Amenities', tag: 'static', fields: [
    { p: 'contactsMedia.centerManager.name', l: 'Centre manager — name' },
    { p: 'contactsMedia.centerManager.phone', l: 'Centre manager — phone' },
    { p: 'contactsMedia.communityManager.name', l: 'Community manager — name' },
    { p: 'contactsMedia.communityManager.phone', l: 'Community manager — phone' },
    { p: 'contactsMedia.salesPhone', l: 'Salesperson contact number' },
    { p: 'contactsMedia.salesEmail', l: 'Sales email ID' },
    { p: 'contactsMedia.accountEmail', l: 'Account email ID' },
    { p: 'contactsMedia.carParkingAvailable', l: 'Car parking available', t: 'toggle' },
    { p: 'contactsMedia.carParkingSpaces', l: 'Car parking spaces', t: 'num' },
    { p: 'contactsMedia.twoWheelerSpaces', l: '2-wheeler parking spaces', t: 'num' },
    { p: 'core.amenities', l: 'Extra amenities', t: 'chips', choices: () => AMENITIES },
    { p: 'contactsMedia.brochure', l: 'Brochure / proposal PDF', ph: 'file name or link' },
    { p: 'contactsMedia.website', l: 'Website link' },
    { p: 'contactsMedia.virtualTour', l: 'Virtual tour (YouTube)' },
    { p: 'contactsMedia.instagram', l: 'Instagram link' },
    { p: 'contactsMedia.linkedin', l: 'LinkedIn link' },
  ]},
];

export function schemaFieldPaths(schema = INV_SCHEMA) {
  const paths = [];
  for (const group of schema) {
    for (const field of group.fields || []) {
      if (field.p) paths.push(field.p);
    }
  }
  return paths;
}

function getNested(obj, path) {
  if (!obj || !path) return undefined;
  return path.split('.').reduce((cur, key) => (cur == null ? undefined : cur[key]), obj);
}

function setNested(obj, path, value) {
  const parts = path.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i += 1) {
    if (!cur[parts[i]] || typeof cur[parts[i]] !== 'object') cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}

/** Read a wizard path from a listing document. */
export function readListingPath(listing, path) {
  if (!listing) return undefined;
  if (path.startsWith('core.')) {
    const key = path.slice(5);
    return listing[key];
  }
  return getNested(listing.profile, path);
}

/** Build flat draft map for the wizard from a listing. */
export function listingToDraft(listing, schema = INV_SCHEMA) {
  const draft = {};
  for (const path of schemaFieldPaths(schema)) {
    const val = readListingPath(listing, path);
    if (val !== undefined && val !== null && val !== '') {
      draft[path] = val;
    }
  }
  if (listing?.tier) draft['core.tier'] = listing.tier;
  return draft;
}

function coerceFieldValue(field, raw) {
  if (raw === undefined || raw === null || raw === '') return undefined;
  if (field.t === 'toggle') return Boolean(raw);
  if (field.t === 'num' || field.t === 'inr') {
    const n = Number(raw);
    return Number.isFinite(n) ? n : undefined;
  }
  if (field.t === 'list') {
    if (Array.isArray(raw)) return raw.filter(Boolean);
    return String(raw).split('\n').map((s) => s.trim()).filter(Boolean);
  }
  if (field.t === 'chips') return Array.isArray(raw) ? raw : [];
  return raw;
}

/** Convert wizard draft to API create/update payload. */
export function draftToListingPayload(draft, schema = INV_SCHEMA) {
  const payload = {
    amenities: [],
    source: 'manual',
  };
  const profile = {};

  for (const group of schema) {
    for (const field of group.fields || []) {
      if (!field.p || field.t === 'images') continue;
      const coerced = coerceFieldValue(field, draft[field.p]);
      if (coerced === undefined) continue;

      if (field.p.startsWith('core.')) {
        payload[field.p.slice(5)] = coerced;
      } else {
        setNested(profile, field.p, coerced);
      }
    }
  }

  if (draft['core.tier']) payload.tier = draft['core.tier'];
  if (Object.keys(profile).length) payload.profile = profile;
  return payload;
}

export function validateDraft(draft, schema = INV_SCHEMA) {
  const errors = [];
  for (const group of schema) {
    for (const field of group.fields || []) {
      if (!field.req) continue;
      const val = draft[field.p];
      if (val === undefined || val === null || val === '') {
        errors.push(`${field.l} is required`);
      }
    }
  }
  return errors;
}

function deepMerge(target, source) {
  if (!source) return target;
  const out = { ...(target || {}) };
  for (const [key, val] of Object.entries(source)) {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      out[key] = deepMerge(out[key], val);
    } else {
      out[key] = val;
    }
  }
  return out;
}

/** Merge a PATCH payload into an existing listing (preserves untouched profile sections). */
export function mergeListingUpdate(existing, payload) {
  if (!existing) return payload;
  const next = { ...payload };
  if (payload.profile) {
    next.profile = deepMerge(existing.profile || {}, payload.profile);
  }
  return next;
}

/** Filter schema groups for users without internal access. */
export function schemaForUser(canSeeInternal, schema = INV_SCHEMA) {
  if (canSeeInternal) return schema;
  return schema.filter((g) => g.tag !== 'internal');
}
