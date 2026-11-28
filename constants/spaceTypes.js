export const LEAD_SPACE_TYPES = [
  { value: 'CW', label: 'Coworking Space' },
  { value: 'VO', label: 'Virtual Office' },
  { value: 'CL', label: 'Coliving Space' },
  { value: 'OS', label: 'Office Space' },
];

export const DEFAULT_LEAD_SPACE_TYPE = 'CW';

export const LEAD_SPACE_TYPE_LABEL = Object.fromEntries(
  LEAD_SPACE_TYPES.map((t) => [t.value, t.label]),
);

export function spaceTypeLabel(code) {
  return LEAD_SPACE_TYPE_LABEL[code] || code || 'Coworking Space';
}

/**
 * Space types given to a user: each opens one Inventory section and routes that kind of lead to them.
 * OS (Office space) is the older code for both office sections; the user form turns it into MO + PO.
 */
export const USER_SPACE_TYPES = [
  { value: 'CW', label: 'Coworking' },
  { value: 'MO', label: 'Managed office' },
  { value: 'PO', label: 'Private office' },
  { value: 'CL', label: 'PG / Coliving' },
  { value: 'VO', label: 'Virtual office' },
];

const USER_SPACE_TYPE_LABEL = { ...Object.fromEntries(USER_SPACE_TYPES.map((t) => [t.value, t.label])), OS: 'Office space' };

export function userSpaceTypeLabel(code) {
  return USER_SPACE_TYPE_LABEL[code] || code;
}

/** Old "OS" becomes the two office sections it used to cover. */
export function expandUserSpaceTypes(types = []) {
  return [...new Set(types.flatMap((t) => (t === 'OS' ? ['MO', 'PO'] : [t])))];
}
