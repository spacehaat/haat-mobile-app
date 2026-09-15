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
