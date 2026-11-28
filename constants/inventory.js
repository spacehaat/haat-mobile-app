import { PAGE_SIZE } from './listings';
import { DEFAULT_PAGE_SIZE } from './pagination';

export { PAGE_SIZE, DEFAULT_PAGE_SIZE };

/**
 * The inventory sections. Coworking = the website's /coworking spaces (green),
 * managed offices = /managed-office (indigo), PGs = /coliving (orange), virtual offices (teal). Colours + icons keep them apart.
 */
export const VERTICALS = {
  coworking: {
    key: 'coworking',
    label: 'Coworking',
    short: 'Coworking',
    plural: 'Coworking spaces',
    one: 'coworking space',
    many: 'coworking spaces',
    icon: 'people',
    color: '#2E7D32',
    soft: '#E8F5E9',
    border: '#A5D6A7',
    blurb: 'Desks & cabins, flexible plans',
  },
  'managed-office': {
    key: 'managed-office',
    label: 'Managed office',
    short: 'Managed',
    plural: 'Managed offices',
    one: 'managed office',
    many: 'managed offices',
    icon: 'business',
    color: '#3949AB',
    soft: '#E8EAF6',
    border: '#9FA8DA',
    blurb: 'Private floors for teams, longer lease',
  },
  coliving: {
    key: 'coliving',
    label: 'PG / Coliving',
    short: 'PG',
    plural: 'PGs',
    one: 'PG',
    many: 'PGs',
    icon: 'bed',
    color: '#C2410C',
    soft: '#FFF1E6',
    border: '#FDBA74',
    blurb: 'Rooms for students & professionals',
  },
  // Offices for lease: area, rent, furnishing (the admin panel's "Private offices").
  'private-office': {
    key: 'private-office',
    label: 'Private office',
    short: 'Private',
    plural: 'Private offices',
    one: 'private office',
    many: 'private offices',
    icon: 'briefcase',
    color: '#6D4C41',
    soft: '#EFEBE9',
    border: '#BCAAA4',
    blurb: 'Offices for lease by area and rent',
  },
  // Kept apart from coworking: business-address plans, with their own list and form.
  'virtual-office': {
    key: 'virtual-office',
    label: 'Virtual office',
    short: 'Virtual',
    plural: 'Virtual offices',
    one: 'virtual office',
    many: 'virtual offices',
    icon: 'mail',
    color: '#00796B',
    soft: '#E0F2F1',
    border: '#80CBC4',
    blurb: 'Business address, GST & mail handling',
  },
};
export const VERTICAL_LIST = [
  VERTICALS.coworking, VERTICALS['managed-office'], VERTICALS['private-office'], VERTICALS.coliving, VERTICALS['virtual-office'],
];

/** Private office furnishing (OfficeSpace.other_detail.office_type). */
export const OFFICE_TYPES = [
  { key: 'fully-furnished', label: 'Fully furnished' },
  { key: 'semi-furnished', label: 'Semi furnished' },
  { key: 'raw', label: 'Bare shell' },
  { key: 'build-to-suite', label: 'Built to suit' },
];

/** Private office monthly rent filter. */
export const PO_RENT_TIERS = [
  { value: null, label: 'Any rent' },
  { value: 50000, label: '≤ ₹50k' },
  { value: 100000, label: '≤ ₹1L' },
  { value: 200000, label: '≤ ₹2L' },
  { value: 500000, label: '≤ ₹5L' },
  { value: 1000000, label: '≤ ₹10L' },
];
export const verticalOf = (listing) => VERTICALS[listing?.vertical] || VERTICALS.coworking;

/** Managed office seat types (ManagedOffice.plans.seat_type). */
export const SEAT_TYPES = [
  { key: 'ready_to_move_in', label: 'Ready to move in', hint: 'Furnished, plug and play' },
  { key: 'warm_shell', label: 'Warm shell', hint: 'Basic fit-out done' },
  { key: 'bare_shell', label: 'Bare shell', hint: 'Empty floor, client fits out' },
];

/** PG "for" values as stored on the website (PG.availableFor). */
export const PG_GENDERS = ['Boys', 'Girls', 'Co-living'];

export const SPACE_TYPES = ['Hot desk', 'Dedicated desk', 'Private cabin', 'Managed office', 'Day pass', 'Virtual office'];

/** Fallback until /listings/meta returns the amenity names used on the website. */
export const AMENITIES = [
  'High speed wifi', 'Parking', 'Cafeteria', 'Meeting Rooms', 'Reception', 'Power Backup',
  'Air conditioning', 'Printer', 'Housekeeping', 'CCTV Security',
];

/** Website approval status of a space (WorkSpace.status). */
export const LISTING_STATUSES = [
  { key: 'all', label: 'All' },
  { key: 'approved', label: 'Approved' },
  { key: 'pending', label: 'Pending' },
  { key: 'inprogress', label: 'In progress' },
  { key: 'rejected', label: 'Rejected' },
];

export const STATUS_COLORS = {
  approved: { bg: '#E6F4EC', text: '#1F7A45', icon: 'checkmark-circle' },
  pending: { bg: '#FFF4E0', text: '#A35F00', icon: 'time' },
  inprogress: { bg: '#E8F0FE', text: '#2557D6', icon: 'sync-circle' },
  rejected: { bg: '#FBE9E9', text: '#C23434', icon: 'close-circle' },
};

export const SORTS = [
  { key: 'updated', label: 'Recently updated' },
  { key: 'newest', label: 'Newest' },
  { key: 'price', label: 'Lowest price' },
  { key: 'seats', label: 'Most seats' },
];

export const MIN_SEAT_TIERS = [0, 10, 25, 50];

export const MAX_PRICE_TIERS = [
  { value: null, label: 'Any price' },
  { value: 6000, label: '≤ ₹6k' },
  { value: 8000, label: '≤ ₹8k' },
  { value: 10000, label: '≤ ₹10k' },
  { value: 12000, label: '≤ ₹12k' },
  { value: 16000, label: '≤ ₹16k' },
  { value: 20000, label: '≤ ₹20k' },
  { value: 25000, label: '≤ ₹25k' },
];

export const INITIAL_FILTER = {
  type: 'All',
  officeType: 'All',
  fresh: 'All',
  maxPrice: null,
  minSeats: 0,
  amenities: [],
  virtualOffice: false,
  managedOffice: false,
  hotDesk: false,
  seatType: 'All',
  gender: 'All',
  food: false,
  sort: 'updated',
};

export function countActiveFilters(bFilter) {
  return (
    (bFilter.type !== 'All' ? 1 : 0)
    + (bFilter.fresh !== 'All' ? 1 : 0)
    + (bFilter.minSeats !== 0 ? 1 : 0)
    + (bFilter.maxPrice != null ? 1 : 0)
    + bFilter.amenities.length
    + (bFilter.hotDesk ? 1 : 0)
    + (bFilter.managedOffice ? 1 : 0)
    + (bFilter.virtualOffice ? 1 : 0)
    + (bFilter.seatType && bFilter.seatType !== 'All' ? 1 : 0)
    + (bFilter.gender && bFilter.gender !== 'All' ? 1 : 0)
    + (bFilter.food ? 1 : 0)
    + (bFilter.officeType && bFilter.officeType !== 'All' ? 1 : 0)
  );
}

export function buildListingFilters(bFilter, city, search, page, limit = DEFAULT_PAGE_SIZE, status = 'all', vertical = 'coworking') {
  const mo = vertical === 'managed-office';
  const pg = vertical === 'coliving';
  if (vertical === 'private-office') {
    return {
      vertical,
      status: status && status !== 'all' ? status : undefined,
      sort: bFilter.sort && bFilter.sort !== 'updated' ? bFilter.sort : undefined,
      counts: true,
      city: city === 'All cities' ? undefined : city,
      fresh: bFilter.fresh === 'All' ? undefined : bFilter.fresh,
      maxPrice: bFilter.maxPrice ?? undefined,
      officeType: bFilter.officeType && bFilter.officeType !== 'All' ? bFilter.officeType : undefined,
      amenities: bFilter.amenities.length ? bFilter.amenities : undefined,
      search: search || undefined,
      page,
      limit,
    };
  }
  if (pg) {
    return {
      vertical,
      status: status && status !== 'all' ? status : undefined,
      sort: bFilter.sort && bFilter.sort !== 'updated' ? bFilter.sort : undefined,
      counts: true,
      city: city === 'All cities' ? undefined : city,
      fresh: bFilter.fresh === 'All' ? undefined : bFilter.fresh,
      maxPrice: bFilter.maxPrice ?? undefined,
      gender: bFilter.gender && bFilter.gender !== 'All' ? bFilter.gender : undefined,
      food: bFilter.food || undefined,
      search: search || undefined,
      page,
      limit,
    };
  }
  return {
    vertical: mo ? vertical : undefined,
    status: status && status !== 'all' ? status : undefined,
    sort: bFilter.sort && bFilter.sort !== 'updated' ? bFilter.sort : undefined,
    counts: true,
    city: city === 'All cities' ? undefined : city,
    fresh: bFilter.fresh === 'All' ? undefined : bFilter.fresh,
    minSeats: bFilter.minSeats || undefined,
    maxPrice: bFilter.maxPrice ?? undefined,
    amenities: bFilter.amenities.length ? bFilter.amenities : undefined,
    // Space-type filters only mean something for coworking; seat type only for managed offices.
    ...(mo
      ? { seatType: bFilter.seatType && bFilter.seatType !== 'All' ? bFilter.seatType : undefined }
      : {
        type: bFilter.type,
        virtualOffice: bFilter.virtualOffice || undefined,
        managedOffice: bFilter.managedOffice || undefined,
        hotDesk: bFilter.hotDesk || undefined,
      }),
    search: search || undefined,
    page,
    limit,
  };
}

export function normalizeListing(l) {
  return { ...l, id: String(l._id || l.id), days: l.fresh?.days ?? 0 };
}
