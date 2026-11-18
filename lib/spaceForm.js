/**
 * Coworking space form (website `WorkSpace`), shared by Add and Edit.
 * The backend returns and accepts this same shape (GET /listings/:id/edit, POST/PATCH /listings).
 */

export const WEEKDAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

export const NEARBY = [
  { key: 'metro', label: 'Metro station', icon: 'train-outline', namePh: 'e.g. Sector 62 Metro' },
  { key: 'bus', label: 'Bus stop', icon: 'bus-outline', namePh: 'e.g. Sector 62 bus stop' },
  { key: 'taxi', label: 'Taxi stand', icon: 'car-outline', namePh: 'e.g. Electronic City taxi stand' },
  { key: 'ferry', label: 'Ferry stop', icon: 'boat-outline', namePh: 'Ferry stop name' },
  { key: 'tram', label: 'Tram', icon: 'subway-outline', namePh: 'Tram stop name' },
];

export const DURATION_LABELS = { month: 'Month', year: 'Year', week: 'Week', day: 'Day', hour: 'Hour' };

/** Quarter-hour slots in the admin panel's format ("9:00 AM"). */
export const TIME_OPTIONS = (() => {
  const out = [];
  for (let t = 0; t < 24 * 60; t += 15) {
    const h24 = Math.floor(t / 60);
    const m = t % 60;
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    out.push(`${h12}:${String(m).padStart(2, '0')} ${h24 < 12 ? 'AM' : 'PM'}`);
  }
  return out;
})();

/** "09:00 AM" (older data) and "9:00 AM" are the same slot. */
export const sameTime = (a, b) => String(a || '').replace(/^0/, '') === String(b || '').replace(/^0/, '');

export const STEPS = [
  { key: 'basics', title: 'Basic details', short: 'Basics', icon: 'business-outline', sub: 'Name, brand, seats and price' },
  { key: 'location', title: 'Location', short: 'Location', icon: 'location-outline', sub: 'City, area, address and nearby transport' },
  { key: 'plans', title: 'Plans & pricing', short: 'Plans', icon: 'pricetags-outline', sub: 'What the space offers and for how much' },
  { key: 'hours', title: 'Opening hours', short: 'Hours', icon: 'time-outline', sub: 'Which days the space is open' },
  { key: 'amenities', title: 'Amenities', short: 'Amenities', icon: 'sparkles-outline', sub: 'Tap everything the space has' },
  { key: 'photos', title: 'Photos', short: 'Photos', icon: 'images-outline', sub: 'First photo is the cover on the website' },
  { key: 'contacts', title: 'Contacts', short: 'Contacts', icon: 'call-outline', sub: 'Who to call at the space' },
  { key: 'about', title: 'About the space', short: 'About', icon: 'document-text-outline', sub: 'Description shown on the website' },
  { key: 'seo', title: 'Website SEO', short: 'SEO', icon: 'search-outline', sub: 'Optional — Google title and description' },
];

/** Managed office form steps (website /managed-office). */
export const MO_STEPS = [
  { key: 'moBasics', title: 'Office details', short: 'Basics', icon: 'business-outline', sub: 'Name, brand, seats and launch status' },
  { key: 'moLocation', title: 'Location', short: 'Location', icon: 'location-outline', sub: 'City, area, building and nearby metro' },
  { key: 'moPlans', title: 'Seat plans', short: 'Plans', icon: 'grid-outline', sub: 'Price per seat for each fit-out type' },
  { key: 'building', title: 'Building & lease', short: 'Building', icon: 'layers-outline', sub: 'Floors on offer, minimum seats, lock-in, rating' },
  { key: 'hours', title: 'Opening hours', short: 'Hours', icon: 'time-outline', sub: 'Which days the office is open' },
  { key: 'amenities', title: 'Amenities', short: 'Amenities', icon: 'sparkles-outline', sub: 'Tap everything the building has' },
  { key: 'photos', title: 'Photos', short: 'Photos', icon: 'images-outline', sub: 'First photo is the cover on the website' },
  { key: 'about', title: 'About the office', short: 'About', icon: 'document-text-outline', sub: 'Description shown on the website' },
  { key: 'seo', title: 'Website SEO', short: 'SEO', icon: 'search-outline', sub: 'Optional — Google title and description' },
];

/** PG / coliving form steps (website /coliving). */
export const PG_STEPS = [
  { key: 'pgBasics', title: 'PG details', short: 'Basics', icon: 'bed-outline', sub: 'Name, who it is for, contact and website settings' },
  { key: 'pgLocation', title: 'Location', short: 'Location', icon: 'location-outline', sub: 'City, area, address and map pin' },
  { key: 'pgRooms', title: 'Rooms & rent', short: 'Rooms', icon: 'pricetags-outline', sub: 'Each room type with rent and deposit' },
  { key: 'pgServices', title: 'Food & services', short: 'Services', icon: 'restaurant-outline', sub: 'Meals, laundry, parking, gate timing' },
  { key: 'pgAmenities', title: 'Amenities & rules', short: 'Amenities', icon: 'sparkles-outline', sub: 'Facilities in the building and rooms, house rules' },
  { key: 'photos', title: 'Photos', short: 'Photos', icon: 'images-outline', sub: 'First photo is the cover on the website' },
  { key: 'pgAbout', title: 'About the PG', short: 'About', icon: 'document-text-outline', sub: 'Description shown on the website' },
];

export const stepsFor = (vertical) => (vertical === 'managed-office' ? MO_STEPS : vertical === 'coliving' ? PG_STEPS : STEPS);

const emptySeo = () => ({
  title: '', description: '', keywords: '', index: true,
  twitterTitle: '', twitterDescription: '', twitterImage: null,
  ogTitle: '', ogDescription: '', ogImage: null,
});

export function emptySpace() {
  const hours = {};
  WEEKDAYS.forEach(({ key }) => {
    hours[key] = { open: key !== 'sunday', allDay: false, from: '9:00 AM', to: '8:00 PM' };
  });
  const nearby = {};
  NEARBY.forEach(({ key }) => { nearby[key] = { on: false, name: '', distance: '' }; });
  return {
    id: null,
    name: '',
    slug: '',
    status: 'pending',
    isActive: true,
    spaceTag: '',
    brand: '',
    seats: '',
    startingPrice: '',
    rating: '',
    ratingCount: '',
    ratingSource: '',
    areaSqft: '',
    currency: 'INR',
    smallTeam: false,
    enterprise: false,
    email: '',
    website: '',
    description: '',
    newDescription: '',
    location: {
      country: '', state: '', city: '', microLocation: '',
      name: '', buildingName: '', address: '', floor: '', postalCode: '', latitude: '', longitude: '',
    },
    nearby,
    hours,
    plans: [],
    amenities: [],
    photos: [],
    spaceContact: { name: '', email: '', phone: '', showOnWebsite: false },
    contacts: [],
    social: { facebook: '', twitter: '', instagram: '' },
    seo: emptySeo(),
    newSeo: emptySeo(),
    virtualSeo: emptySeo(),
    labels: { brand: '', country: '', state: '', city: '', microLocation: '' },
  };
}

export function emptyManagedOffice(defaultPlanType = '') {
  const base = emptySpace();
  return {
    id: null,
    vertical: 'managed-office',
    name: '',
    slug: '',
    status: 'pending',
    isActive: true,
    isNewLaunch: false,
    centreType: 'managed_office',
    brand: '',
    seats: '',
    description: '',
    newDescription: '',
    location: {
      country: '', state: '', city: '', microLocation: '', areaText: '', name: '', buildingName: '', address: '',
      floor: '', postalCode: '', landmark: '', landmarkDistance: '', latitude: '', longitude: '',
    },
    metro: { on: false, name: '', distance: '' },
    plans: [{ seatType: 'ready_to_move_in', type: defaultPlanType, price: '', per: 'month', show: true, image: null }],
    building: { totalFloors: '', superArea: '', totalSeats: '', floors: [] },
    lease: { minSeats: '', minMonths: '' },
    rating: { source: '', average: '', total: '' },
    hours: base.hours,
    amenities: [],
    photos: [],
    seo: emptySeo(),
    newSeo: emptySeo(),
    labels: { brand: '', country: '', state: '', city: '', microLocation: '' },
  };
}

export function emptyPg() {
  return {
    id: null,
    vertical: 'coliving',
    name: '',
    slug: '',
    status: 'inprogress',
    isActive: true,
    gender: 'Co-living',
    guests: 'Both',
    postedBy: 'Owner',
    contactNumber: '',
    contactEmail: '',
    location: { country: '', state: '', city: '', microLocation: '', address: '', street: '', latitude: '', longitude: '' },
    labels: { country: '', state: '', city: '', microLocation: '' },
    rooms: [{ type: 'Double Bed', rent: '', deposit: '' }],
    availableFrom: '',
    notice: { on: true, days: '30' },
    maintenance: { on: false, amount: '' },
    food: { on: false, meals: [] },
    laundry: { on: false, days: 'Mon-Fri' },
    cleaning: false,
    water: false,
    parking: { on: false, vehicle: 'Both' },
    gate: { on: false, time: '' },
    contactSchedule: 'Available All Day',
    startTime: '',
    endTime: '',
    commonAmenities: [],
    roomAmenities: [],
    rules: [],
    rating: '',
    description: '',
    newDescription: '',
    photos: [],
    googleIndex: 'auto',
    googleAuto: { ok: null, note: '' },
    verification: { at: null, by: '', method: '' },
  };
}

function normalizePg(item) {
  const base = emptyPg();
  return {
    ...base,
    ...item,
    location: { ...base.location, ...(item.location || {}) },
    labels: { ...base.labels, ...(item.labels || {}) },
    notice: { ...base.notice, ...(item.notice || {}) },
    maintenance: { ...base.maintenance, ...(item.maintenance || {}) },
    food: { ...base.food, ...(item.food || {}), meals: item.food?.meals || [] },
    laundry: { ...base.laundry, ...(item.laundry || {}) },
    parking: { ...base.parking, ...(item.parking || {}) },
    gate: { ...base.gate, ...(item.gate || {}) },
    googleAuto: { ...base.googleAuto, ...(item.googleAuto || {}) },
    verification: { ...base.verification, ...(item.verification || {}) },
    rooms: item.rooms?.length ? item.rooms : base.rooms,
    commonAmenities: item.commonAmenities || [],
    roomAmenities: item.roomAmenities || [],
    rules: item.rules || [],
    photos: item.photos || [],
  };
}

function normalizeManagedOffice(item) {
  const base = emptyManagedOffice();
  return {
    ...base,
    ...item,
    location: { ...base.location, ...(item.location || {}) },
    metro: { ...base.metro, ...(item.metro || {}) },
    building: { ...base.building, ...(item.building || {}), floors: item.building?.floors || [] },
    lease: { ...base.lease, ...(item.lease || {}) },
    rating: { ...base.rating, ...(item.rating || {}) },
    hours: { ...base.hours, ...(item.hours || {}) },
    seo: { ...emptySeo(), ...(item.seo || {}) },
    newSeo: { ...emptySeo(), ...(item.newSeo || {}) },
    labels: { ...base.labels, ...(item.labels || {}) },
    plans: item.plans || [],
    amenities: item.amenities || [],
    photos: item.photos || [],
  };
}

/** Fill gaps so every field the form touches exists. */
export function normalizeSpace(item) {
  if (item?.vertical === 'managed-office') return normalizeManagedOffice(item);
  if (item?.vertical === 'coliving') return normalizePg(item);
  const base = emptySpace();
  if (!item) return base;
  return {
    ...base,
    ...item,
    location: { ...base.location, ...(item.location || {}) },
    nearby: { ...base.nearby, ...(item.nearby || {}) },
    hours: { ...base.hours, ...(item.hours || {}) },
    spaceContact: { ...base.spaceContact, ...(item.spaceContact || {}) },
    social: { ...base.social, ...(item.social || {}) },
    seo: { ...emptySeo(), ...(item.seo || {}) },
    newSeo: { ...emptySeo(), ...(item.newSeo || {}) },
    virtualSeo: { ...emptySeo(), ...(item.virtualSeo || {}) },
    labels: { ...base.labels, ...(item.labels || {}) },
    plans: item.plans || [],
    amenities: item.amenities || [],
    photos: item.photos || [],
    contacts: item.contacts || [],
  };
}

const ENTITIES = { '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&rsquo;': '’', '&lsquo;': '‘', '&rdquo;': '”', '&ldquo;': '“', '&ndash;': '–', '&mdash;': '—' };

/** Website descriptions are HTML; staff edit them as plain paragraphs. */
export function htmlToText(html) {
  if (!html) return '';
  return String(html)
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\s*li[^>]*>/gi, '• ')
    .replace(/<\/\s*(p|div|li|h[1-6]|ul|ol)\s*>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&[a-z#0-9]+;/gi, (e) => ENTITIES[e.toLowerCase()] ?? e)
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function textToHtml(text) {
  const t = String(text || '').trim();
  if (!t) return '';
  return t
    .split(/\n{2,}/)
    .map((para) => `<p>${escapeHtml(para).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

function validateManagedOffice(form) {
  const stepOf = (key) => MO_STEPS.findIndex((s) => s.key === key);
  if (!form.name.trim()) return { step: stepOf('moBasics'), message: 'Enter the office name.' };
  if (!form.location.country) return { step: stepOf('moLocation'), message: 'Choose the country.' };
  if (!form.location.city) return { step: stepOf('moLocation'), message: 'Choose the city.' };
  const badPlan = form.plans.findIndex((p) => !p.seatType);
  if (badPlan >= 0) return { step: stepOf('moPlans'), message: `Plan ${badPlan + 1}: choose the seat type.` };
  const lat = String(form.location.latitude ?? '').trim();
  const lng = String(form.location.longitude ?? '').trim();
  if ((lat && !Number.isFinite(Number(lat))) || (lng && !Number.isFinite(Number(lng)))) {
    return { step: stepOf('moLocation'), message: 'Latitude and longitude must be numbers (e.g. 28.6139).' };
  }
  return null;
}

function validatePg(form) {
  const stepOf = (key) => PG_STEPS.findIndex((s) => s.key === key);
  if (!form.name.trim()) return { step: stepOf('pgBasics'), message: 'Enter the PG name.' };
  if (!form.gender) return { step: stepOf('pgBasics'), message: 'Choose who the PG is for.' };
  if (!form.location.city) return { step: stepOf('pgLocation'), message: 'Choose the city.' };
  const rooms = form.rooms.filter((r) => r.type);
  if (!rooms.length) return { step: stepOf('pgRooms'), message: 'Add at least one room type.' };
  const lat = String(form.location.latitude ?? '').trim();
  const lng = String(form.location.longitude ?? '').trim();
  if ((lat && !Number.isFinite(Number(lat))) || (lng && !Number.isFinite(Number(lng)))) {
    return { step: stepOf('pgLocation'), message: 'Latitude and longitude must be numbers (e.g. 28.6139).' };
  }
  if (form.availableFrom && !/^\d{4}-\d{2}-\d{2}$/.test(form.availableFrom.trim())) {
    return { step: stepOf('pgRooms'), message: 'Available from: use the format YYYY-MM-DD (e.g. 2026-12-01).' };
  }
  return null;
}

/** First problem that blocks saving, with the step to jump to. */
export function validateSpace(form) {
  if (form.vertical === 'managed-office') return validateManagedOffice(form);
  if (form.vertical === 'coliving') return validatePg(form);
  const stepOf = (key) => STEPS.findIndex((s) => s.key === key);
  if (!form.name.trim()) return { step: stepOf('basics'), message: 'Enter the space name.' };
  if (!form.brand) return { step: stepOf('basics'), message: 'Choose the brand (operator).' };
  if (!form.spaceTag) return { step: stepOf('basics'), message: 'Choose a space tag.' };
  if (!form.location.country) return { step: stepOf('location'), message: 'Choose the country.' };
  if (!form.location.city) return { step: stepOf('location'), message: 'Choose the city.' };
  const badPlan = form.plans.findIndex((p) => !p.type);
  if (badPlan >= 0) return { step: stepOf('plans'), message: `Plan ${badPlan + 1}: choose what the plan is.` };
  const lat = String(form.location.latitude ?? '').trim();
  const lng = String(form.location.longitude ?? '').trim();
  if ((lat && !Number.isFinite(Number(lat))) || (lng && !Number.isFinite(Number(lng)))) {
    return { step: stepOf('location'), message: 'Latitude and longitude must be numbers (e.g. 28.6139).' };
  }
  return null;
}

/** Body for create/update. Descriptions are converted only when staff changed them, so HTML formatting stays. */
export function toPayload(form, original) {
  const desc = (key, textKey) => {
    const before = htmlToText(original?.[key] || '');
    return form[textKey] === before ? original?.[key] || '' : textToHtml(form[textKey]);
  };
  // Status is changed only from the listing page (Approve / Pending / …), never by saving the form.
  // eslint-disable-next-line no-unused-vars
  const { labels, descriptionText, newDescriptionText, status, ...rest } = form;
  if (form.vertical === 'coliving') {
    // PGs: the website shows `new_description` first (else `description`); the form edits that text.
    const shownHtml = original?.newDescription || original?.description || '';
    const changed = newDescriptionText !== htmlToText(shownHtml);
    const { googleAuto, verification, description, newDescription, ...pgRest } = rest;
    return { ...pgRest, labels, ...(changed ? { newDescription: textToHtml(newDescriptionText) } : {}) };
  }
  if (form.vertical !== 'managed-office') {
    // Coworking: one "Description" field. The website shows `new_description` (else the old `description`),
    // so the form edits that text; the old description is kept as it is.
    const shownHtml = original?.newDescription || original?.description || '';
    const changed = newDescriptionText !== htmlToText(shownHtml);
    return {
      ...rest,
      description: original?.description || '',
      newDescription: changed ? textToHtml(newDescriptionText) : original?.newDescription || original?.description || '',
    };
  }
  return {
    ...rest,
    description: desc('description', 'descriptionText'),
    newDescription: desc('newDescription', 'newDescriptionText'),
  };
}

/** Form state = API shape + plain-text copies of the HTML descriptions. */
export function toFormState(item) {
  const n = normalizeSpace(item);
  if (n.vertical === 'coliving') {
    return { ...n, descriptionText: '', newDescriptionText: htmlToText(n.newDescription || n.description) };
  }
  if (n.vertical !== 'managed-office') {
    return { ...n, descriptionText: '', newDescriptionText: htmlToText(n.newDescription || n.description) };
  }
  return { ...n, descriptionText: htmlToText(n.description), newDescriptionText: htmlToText(n.newDescription) };
}
