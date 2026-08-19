/** Mask phone for operator lead-registration emails: 9540xxxxx07 */
export function maskPhoneForLeadEmail(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  let d = digits;
  if (d.length >= 12 && d.startsWith('91')) d = d.slice(-10);
  else if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  if (d.length < 6) return String(phone || '').trim() || '—';
  return `${d.slice(0, 4)}xxxxx${d.slice(-2)}`;
}

function firstNameOf(fullName) {
  const first = String(fullName || '').trim().split(/\s+/)[0];
  return first || 'Team';
}

export function requirementLabelFromLead(lead) {
  const range = String(lead?.seatRange || '').trim();
  if (range) {
    if (/seats?/i.test(range)) return range;
    return `${range} seats`;
  }
  if (lead?.seats) return `${lead.seats} seats`;
  if (lead?.interestedIn?.length) return lead.interestedIn.join(', ');
  return '';
}

export function buildLeadRegistrationEmail({
  recipientName,
  clientName,
  companyName,
  requirement,
  contact,
  memberName,
  memberPhone,
} = {}) {
  const greeting = firstNameOf(recipientName);
  const client = String(clientName || '').trim() || 'Client';
  const company = String(companyName || '').trim();
  const req = String(requirement || '').trim() || 'Coworking space';
  const masked = maskPhoneForLeadEmail(contact);
  const member = String(memberName || '').trim() || 'Spacehaat';
  const phone = String(memberPhone || '').trim();

  const detailLines = [
    'Lead Details:',
    `Client Name: ${client}`,
  ];
  if (company) detailLines.push(`Company: ${company}`);
  detailLines.push('', `Requirement: ${req}`, `Contact Details: ${masked}`);

  const lines = [
    `Dear ${greeting},`,
    '',
    'Greetings from Spacehaat.',
    '',
    'We would like to formally register a client lead with your team for deal tracking and attribution purposes.',
    '',
    ...detailLines,
    '',
    'Kindly acknowledge receipt of this email and confirm that the above lead has been registered as a Spacehaat-referred lead, so that the same can be credited to us in case of deal closure.',
    '',
    'Please let us know if any additional information is required from our end.',
    '',
    'Thank you for your cooperation.',
    '',
    'Best regards,',
    member,
    'Spacehaat',
  ];
  if (phone) lines.push(phone);

  const subject = `Lead Registration – ${client} | Spacehaat`;
  return { subject, body: lines.join('\n') };
}

export function leadRegistrationMailto({ to, subject, body } = {}) {
  const email = String(to || '').trim();
  // Empty To is intentional — user fills the recipient in the mail app.
  // Mail apps (esp. iOS) need CRLF in mailto bodies or line breaks are lost.
  const normalizedBody = String(body || '').replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
  const parts = [];
  if (subject) parts.push(`subject=${encodeURIComponent(String(subject))}`);
  if (normalizedBody) parts.push(`body=${encodeURIComponent(normalizedBody)}`);
  const qs = parts.join('&');
  return qs ? `mailto:${email}?${qs}` : `mailto:${email}`;
}
