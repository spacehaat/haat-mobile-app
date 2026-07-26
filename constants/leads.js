export const STAGES = [
  ['', 'All'],
  ['new', 'New'],
  ['cna', 'CNA'],
  ['cmb', 'CMB'],
  ['qualified', 'Qualified'],
  ['proposal_sent', 'Proposal sent'],
  ['visit_scheduled', 'Visit scheduled'],
  ['negotiation', 'Negotiation'],
  ['won', 'Won'],
  ['lost', 'Lost'],
];

export const STAGE_LABEL = Object.fromEntries(
  STAGES.filter(([v]) => v).map(([v, l]) => [v, l]),
);

export const STAGE_LABEL_LONG = {
  ...STAGE_LABEL,
  cna: 'Call not attend',
  cmb: 'Call me back',
};

export const STAGE_COLORS = {
  new: { bg: '#eef4ff', text: '#3559c7' },
  cna: { bg: '#fdecec', text: '#b42318' },
  cmb: { bg: '#fff4e5', text: '#b54708' },
  qualified: { bg: '#f3efff', text: '#6b4bc4' },
  proposal_sent: { bg: '#E8F5E9', text: '#2E7D32' },
  visit_scheduled: { bg: '#e7f7f3', text: '#1f7a62' },
  negotiation: { bg: '#fff6e8', text: '#a86408' },
  won: { bg: '#e6f4ec', text: '#2e9e5b' },
  lost: { bg: '#fbe9e9', text: '#d14343' },
};

export const PAGE_SIZE = 20;
