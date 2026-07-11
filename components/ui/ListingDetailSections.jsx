import { View, Text, Pressable, StyleSheet, Linking } from 'react-native';
import { useState } from 'react';
import { inr } from '@spacehaat/utils';
import DetailSection from './DetailSection';
import { profileOf, formatKv } from '../../lib/listingHelpers';
import { colors } from '../../constants/theme';

function KvRow({ label, value, dynamic }) {
  return (
    <View style={styles.kvRow}>
      <Text style={styles.kvLabel}>
        {label}{dynamic ? ' •' : ''}
      </Text>
      <Text style={styles.kvValue}>{formatKv(value)}</Text>
    </View>
  );
}

function SectionDivider({ label }) {
  return <Text style={styles.divide}>{label}</Text>;
}

export default function ListingDetailSections({ listing, canSeeInternal }) {
  const p = profileOf(listing);
  const I = p.identity || {};
  const C = p.capacity || {};
  const P = p.pricing || {};
  const S = p.salesIntel || {};
  const O = p.operations || {};
  const F = p.contactsMedia || {};

  const [open, setOpen] = useState({ A: true, B: false, C: false, D: false, E: false, F: false });
  const toggle = (key) => setOpen((prev) => ({ ...prev, [key]: !prev[key] }));

  const amenities = F.extraAmenities || listing.amenities || [];

  return (
    <View style={styles.wrap}>
      <DetailSection
        title="A · Identity & Location"
        tag="static"
        open={open.A}
        onToggle={() => toggle('A')}
      >
        <KvRow label="Centre name" value={I.centreName} />
        <KvRow label="Building type" value={I.buildingType} />
        <KvRow label="Full address" value={I.address} />
        <KvRow label="Maps link" value={I.mapsLink} />
        {I.mapsLink ? (
          <Pressable onPress={() => Linking.openURL(I.mapsLink.startsWith('http') ? I.mapsLink : `https://${I.mapsLink}`)}>
            <Text style={styles.link}>Open in Maps</Text>
          </Pressable>
        ) : null}
        <KvRow label="Nearest metro" value={I.nearestMetro} />
        <KvRow label="Nearest railway" value={I.nearestRail} />
        <KvRow label="Floor(s) occupied" value={I.floors} />
        <KvRow label="Ownership" value={I.ownership} />
        <KvRow label="Entrance facing" value={I.entranceFacing} />
        <KvRow label="Zoning / area type" value={I.zoning} />
        <KvRow label="Vastu compliant" value={I.vastu ? 'Yes' : 'No'} />
        <KvRow label="Layout type" value={I.layoutType} />
        <KvRow label="Super built-up" value={I.superBuiltUp ? `${Number(I.superBuiltUp).toLocaleString('en-IN')} sq ft` : null} />
        <KvRow label="Carpet area" value={I.carpet ? `${Number(I.carpet).toLocaleString('en-IN')} sq ft` : null} />
        <KvRow label="Desk size" value={I.deskSize} />
      </DetailSection>

      <DetailSection
        title="B · Capacity"
        tag="dynamic"
        open={open.B}
        onToggle={() => toggle('B')}
      >
        <KvRow label="Total seats (excl. meeting/conf)" value={C.totalSeats} />
        <KvRow label="Total open workstations" value={C.totalWorkstations} />
        <KvRow label="Total private cabins" value={C.totalCabins ? `${C.totalCabins} (${C.cabinSeatsEach || 4}-seater)` : null} />
        <KvRow label="Meeting rooms" value={C.meetingRooms ? `${C.meetingRooms} (${C.meetingRoomSeats || 6}-seat)` : null} />
        <KvRow label="Conference rooms" value={C.conferenceRooms ? `${C.conferenceRooms} (${C.conferenceSeats || 12}-seat)` : null} />
        <SectionDivider label="Live availability" />
        <KvRow label="Open workstations available" value={C.availWorkstations ?? listing.seats} dynamic />
        <KvRow label="Private cabins available" value={C.availCabins != null ? `${C.availCabins} (${C.availCabinSeats || 4}-seater)` : null} dynamic />
        <KvRow label="Hot desk available" value={C.hotDeskAvailable ? `Yes · ${C.hotDeskCount || 0} seats` : 'No'} dynamic />
      </DetailSection>

      <DetailSection
        title="C · Pricing"
        tag="dynamic"
        open={open.C}
        onToggle={() => toggle('C')}
      >
        <KvRow label="Hot desk" value={P.hotDesk != null ? `${inr(P.hotDesk)}/mo` : null} dynamic />
        <KvRow label="Dedicated desk" value={P.dedicatedDesk != null ? `${inr(P.dedicatedDesk)}/seat/mo` : `${inr(listing.price)}/seat/mo`} dynamic />
        <KvRow label="Private cabin" value={P.privateCabin != null ? `${inr(P.privateCabin)}/seat/mo` : null} dynamic />
        <KvRow label="Managed office" value={P.managedPerSqft != null ? `₹${P.managedPerSqft}/sq ft` : null} dynamic />
        <KvRow label="Conference room (hr)" value={P.confRoomHour != null ? inr(P.confRoomHour) : null} dynamic />
        <KvRow label="Conference room (day)" value={P.confRoomDay != null ? inr(P.confRoomDay) : null} dynamic />
        <KvRow label="Meeting room (hr)" value={P.meetingRoomHour != null ? inr(P.meetingRoomHour) : null} dynamic />
        <KvRow label="Day pass" value={P.dayPass != null ? inr(P.dayPass) : null} dynamic />
        <KvRow label="Car parking" value={P.carParking != null ? `${inr(P.carParking)}/mo` : null} dynamic />
        <KvRow label="2-wheeler parking" value={P.twoWheeler != null ? `${inr(P.twoWheeler)}/mo` : null} dynamic />
        <KvRow label="Beyond-hours" value={P.beyondHours} dynamic />
        <KvRow label="Signage board (reception)" value={P.signageBoard != null ? inr(P.signageBoard) : null} dynamic />
        <KvRow label="Security deposit" value={P.securityDeposit} dynamic />
        <KvRow label="Notice period" value={P.noticePeriod} dynamic />
      </DetailSection>

      {canSeeInternal ? (
        <DetailSection
          title="D · Sales Intelligence"
          tag="internal"
          internal
          open={open.D}
          onToggle={() => toggle('D')}
        >
          <KvRow label="Pitching price" value={S.pitchingPrice != null ? inr(S.pitchingPrice) : null} />
          <KvRow label="Closing price" value={S.closingPrice != null ? inr(S.closingPrice) : null} />
          <KvRow label="YoY increment" value={S.yoyIncrement} />
          <KvRow label="Nearby competitors" value={(S.competitors || []).join('; ') || null} />
          <KvRow label="Expansion plans" value={S.expansionPlans} />
          <KvRow label="Commission / payment a/c" value={S.commissionAccount} />
        </DetailSection>
      ) : null}

      <DetailSection
        title="E · Operations"
        tag="static"
        open={open.E}
        onToggle={() => toggle('E')}
      >
        <KvRow label="Timings" value={O.timings} />
        <KvRow label="Days open" value={O.daysOpen} />
        <KvRow label="Sunday client visits" value={O.sundayVisits ? 'Yes' : 'No'} />
        <KvRow label="Managed office available" value={O.managedOfficeAvailable ? 'Yes' : 'No'} dynamic />
        <KvRow label="Virtual office available" value={O.virtualOfficeAvailable ? 'Yes' : 'No'} dynamic />
      </DetailSection>

      <DetailSection
        title="F · Contacts & Amenities"
        tag="static"
        open={open.F}
        onToggle={() => toggle('F')}
      >
        <KvRow label="Centre manager" value={`${F.centerManager?.name || '—'} · ${F.centerManager?.phone || '—'}`} />
        <KvRow label="Community manager" value={`${F.communityManager?.name || '—'} · ${F.communityManager?.phone || '—'}`} />
        <KvRow label="Sales contact" value={F.salesPhone} />
        <KvRow label="Sales email" value={F.salesEmail} />
        <KvRow label="Account email" value={F.accountEmail} />
        <KvRow label="Car parking" value={F.carParkingAvailable ? `Yes · ${F.carParkingSpaces || 0} spaces` : 'No'} />
        <KvRow label="2-wheeler spaces" value={F.twoWheelerSpaces} />

        {amenities.length ? (
          <>
            <SectionDivider label="Extra amenities" />
            <View style={styles.amenRow}>
              {amenities.map((a) => (
                <Text key={a} style={styles.amenChip}>{a}</Text>
              ))}
            </View>
          </>
        ) : null}

        <SectionDivider label="Links" />
        <View style={styles.linksRow}>
          {F.brochure ? <Text style={styles.linkChip}>📄 {F.brochure}</Text> : null}
          {F.website ? <Text style={styles.linkChip}>🌐 {F.website}</Text> : null}
          {F.instagram ? <Text style={styles.linkChip}>📷 {F.instagram}</Text> : null}
          {F.linkedin ? <Text style={styles.linkChip}>🔗 LinkedIn</Text> : null}
          {F.virtualTour ? <Text style={styles.linkChip}>▶ Virtual tour</Text> : null}
        </View>
      </DetailSection>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 0 },
  kvRow: { paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  kvLabel: { fontSize: 12, color: colors.muted, marginBottom: 2 },
  kvValue: { fontSize: 14, fontWeight: '600', color: colors.ink, lineHeight: 20 },
  divide: {
    fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase',
    color: colors.faint, marginTop: 8, marginBottom: 4,
  },
  link: { color: colors.brand, fontWeight: '600', fontSize: 13, marginBottom: 4 },
  amenRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  amenChip: {
    fontSize: 12, fontWeight: '600', color: colors.ink,
    backgroundColor: colors.surface2, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999,
  },
  linksRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  linkChip: {
    fontSize: 12, color: colors.ink, backgroundColor: colors.surface2,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
  },
});
