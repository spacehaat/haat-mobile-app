export const SAMPLE_ENQUIRY = `Hi, this is Ananya Rao from PayNest Labs.

We need a private office for 18 people in Koramangala, Bangalore. Budget is around ₹9,000 per seat and we'd like to move in by mid-July. Parking and meeting rooms are must-haves.

Email: ananya@paynest.in
Phone: +91 98765 43210`;

export const CITIES = ['Bangalore', 'Mumbai', 'Delhi NCR', 'Hyderabad', 'Pune', 'Chennai'];

export const INITIAL_REQ = {
  city: 'Bangalore',
  locality: 'Koramangala',
  teamSize: 30,
  budgetPerSeat: 9000,
  moveIn: 'In 2 weeks',
  amenities: ['Meeting rooms', '24x7 access'],
  spaceTypes: [],
  tierPreference: 'any',
};

export function reqToApi(req) {
  return {
    city: req.city || '',
    locality: req.locality || '',
    teamSize: Number(req.teamSize) || 0,
    budgetPerSeat: Number(req.budgetPerSeat) || 0,
    amenities: req.amenities || [],
    spaceTypes: req.spaceTypes || [],
    moveIn: req.moveIn || '',
    tierPreference: req.tierPreference || 'any',
  };
}

export function apiToReq(r) {
  return {
    city: r.city || '',
    locality: r.locality || '',
    teamSize: r.teamSize || 0,
    budgetPerSeat: r.budgetPerSeat || 0,
    amenities: r.amenities || [],
    spaceTypes: r.spaceTypes || [],
    moveIn: r.moveIn || '',
    tierPreference: r.tierPreference || 'any',
  };
}

export function parseSourceLabel(source) {
  if (source === 'openai') return 'AI parsed';
  if (source === 'rules') return 'Smart parsed';
  return 'Manual criteria';
}

export function scoreClass(score) {
  if (score >= 88) return 'strong';
  if (score >= 72) return 'good';
  return 'weak';
}
