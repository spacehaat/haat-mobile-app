import { PAGE_SIZE } from './listings';

export { PAGE_SIZE };

export const SPACE_TYPES = ['Hot desk', 'Dedicated desk', 'Private cabin', 'Managed office'];

export const AMENITIES = [
  'Wi-Fi', 'Parking', 'Cafeteria', 'Meeting rooms', '24x7 access', 'AC',
  'Reception', 'Phone booths', 'Printer', 'Pantry', 'Metro <5min', 'Gym',
];

export const BUILDING_TYPES = ['IT park', 'Standalone', 'Mixed-use'];

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
  fresh: 'All',
  maxPrice: null,
  minSeats: 0,
  amenities: [],
  buildingType: 'All',
  virtualOffice: false,
  managedOffice: false,
  hotDesk: false,
  vastu: false,
};

export function countActiveFilters(bFilter) {
  return (
    (bFilter.type !== 'All' ? 1 : 0)
    + (bFilter.fresh !== 'All' ? 1 : 0)
    + (bFilter.minSeats !== 0 ? 1 : 0)
    + (bFilter.maxPrice != null ? 1 : 0)
    + (bFilter.buildingType !== 'All' ? 1 : 0)
    + bFilter.amenities.length
    + (bFilter.hotDesk ? 1 : 0)
    + (bFilter.managedOffice ? 1 : 0)
    + (bFilter.virtualOffice ? 1 : 0)
    + (bFilter.vastu ? 1 : 0)
  );
}

export function buildListingFilters(bFilter, city, search, page) {
  return {
    city: city === 'All cities' ? undefined : city,
    type: bFilter.type,
    fresh: bFilter.fresh === 'All' ? undefined : bFilter.fresh,
    minSeats: bFilter.minSeats || undefined,
    maxPrice: bFilter.maxPrice ?? undefined,
    amenities: bFilter.amenities.length ? bFilter.amenities : undefined,
    buildingType: bFilter.buildingType,
    virtualOffice: bFilter.virtualOffice || undefined,
    managedOffice: bFilter.managedOffice || undefined,
    hotDesk: bFilter.hotDesk || undefined,
    vastu: bFilter.vastu || undefined,
    search: search || undefined,
    page,
    limit: PAGE_SIZE,
  };
}

export function normalizeListing(l) {
  return { ...l, id: String(l._id || l.id), days: l.fresh?.days ?? 0 };
}
