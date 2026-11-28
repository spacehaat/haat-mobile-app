import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { inr } from '@spacehaat/utils';
import { profileOf } from '../../lib/listingHelpers';
import { colors } from '../../constants/theme';
import { verticalOf } from '../../constants/inventory';

const UNIT = { month: '/mo', year: '/yr', week: '/wk', day: '/day', hour: '/hr' };

const open = (url) => url && Linking.openURL(url).catch(() => {});
const tel = (phone) => {
  const digits = String(phone || '').replace(/[^\d+]/g, '');
  return digits ? `tel:${digits}` : null;
};

function Card({ icon, title, right, children, tint }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <View style={[styles.cardIcon, tint && { backgroundColor: tint.soft }]}><Ionicons name={icon} size={16} color={tint ? tint.color : colors.brandInk} /></View>
        <Text style={styles.cardTitle}>{title}</Text>
        {right}
      </View>
      {children}
    </View>
  );
}

function Row({ icon, label, value, onPress, last }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <Pressable disabled={!onPress} onPress={onPress} style={[styles.row, last && { borderBottomWidth: 0 }]}>
      <Ionicons name={icon} size={17} color={colors.muted} style={{ marginTop: 1 }} />
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={[styles.rowValue, onPress && { color: colors.brandInk }]}>{String(value)}</Text>
      </View>
      {onPress ? <Ionicons name="open-outline" size={16} color={colors.brandInk} /> : null}
    </Pressable>
  );
}

function Fact({ label, value, unit }) {
  if (!value) return null;
  return (
    <View style={styles.fact}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue}>{value}{unit ? <Text style={styles.planUnit}>{unit}</Text> : null}</Text>
    </View>
  );
}

function Person({ role, person }) {
  if (!person?.name && !person?.phone) return null;
  const link = tel(person.phone);
  return (
    <View style={styles.person}>
      <View style={styles.avatar}><Text style={styles.avatarText}>{(person.name || role).trim().charAt(0).toUpperCase()}</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.personName}>{person.name || '—'}</Text>
        <Text style={styles.personRole}>{role}{person.phone ? ` · ${person.phone}` : ''}</Text>
      </View>
      {link ? (
        <Pressable onPress={() => open(link)} style={styles.callBtn} hitSlop={6}>
          <Ionicons name="call" size={16} color={colors.brandInk} />
        </Pressable>
      ) : null}
    </View>
  );
}

/** Everything the website knows about a coworking space, grouped for sales staff. */
export default function ListingDetailSections({ listing, canSeeInternal }) {
  const p = profileOf(listing);
  const v = verticalOf(listing);
  const mo = v.key === 'managed-office';
  const pg = v.key === 'coliving';
  const po = v.key === 'private-office';
  const P = listing.pg || {};
  const office = listing.office || {};
  const PO = listing.privateOffice || {};
  const I = p.identity || {};
  const O = p.operations || {};
  const F = p.contactsMedia || {};
  const [more, setMore] = useState(false);

  const plans = listing.plans || [];
  const monthly = plans.filter((pl) => pl.unit === 'month');
  const priced = monthly.filter((pl) => !pl.onRequest && pl.price > 0);
  const lowest = priced.length ? priced.reduce((a, b) => (b.price < a.price ? b : a)) : null;
  const amenities = (listing.amenities?.length ? listing.amenities : F.extraAmenities) || [];
  const description = listing.description || '';
  const hours = listing.hours || [];

  return (
    <View style={styles.wrap}>
      {plans.length ? (
        <Card tint={v} icon={mo ? 'grid-outline' : pg ? 'bed-outline' : 'pricetags-outline'} title={mo ? 'Seat plans' : pg ? 'Rooms & rent' : 'Plans & pricing'} right={<Text style={styles.cardHint}>{plans.length} {pg ? 'room type' : 'plan'}{plans.length > 1 ? 's' : ''}</Text>}>
          <View style={styles.plans}>
            {plans.map((pl, i) => (
              <View key={`${pl.label}-${i}`} style={[styles.plan, pl === lowest && [styles.planBest, { backgroundColor: v.soft, borderColor: v.color }]]}>
                <Text style={styles.planName} numberOfLines={2}>{pl.label}</Text>
                {pl.onRequest ? (
                  <Text style={[styles.planPrice, { fontSize: 15 }]}>On request</Text>
                ) : (
                  <Text style={styles.planPrice}>{inr(pl.price)}<Text style={styles.planUnit}>{mo ? '/seat' : ''}{UNIT[pl.unit] || ''}</Text></Text>
                )}
                {pg && pl.deposit ? <Text style={styles.planUnit}>Deposit {inr(pl.deposit)}</Text> : null}
                {pl === lowest ? <Text style={[styles.planTag, { backgroundColor: v.color }]}>Lowest / mo</Text> : null}
              </View>
            ))}
          </View>
        </Card>
      ) : null}

      {mo && (office.minSeats || office.minMonths || office.superArea || office.totalFloors || office.floors?.length) ? (
        <Card tint={v} icon="business-outline" title="Building & lease">
          <View style={styles.facts}>
            <Fact label="Minimum seats" value={office.minSeats} />
            <Fact label="Lock-in" value={office.minMonths} unit=" months" />
            <Fact label="Super area" value={office.superArea ? office.superArea.toLocaleString('en-IN') : ''} unit=" sq ft" />
            <Fact label="Floors in building" value={office.totalFloors} />
            <Fact label="Seats in building" value={office.totalSeats} />
            <Fact label="Centre type" value={office.centreType} />
          </View>
          {office.floors?.length ? (
            <View style={{ marginTop: 10 }}>
              <Text style={styles.subLabel}>Floors on offer</Text>
              {office.floors.map((f, i) => (
                <View key={i} style={[styles.floorRow, i === office.floors.length - 1 && { borderBottomWidth: 0 }]}>
                  <Text style={styles.floorName}>{f.floor !== '' && f.floor !== null ? `Floor ${f.floor}` : `Floor ${i + 1}`}</Text>
                  <Text style={styles.floorMeta}>
                    {[f.area ? `${f.area.toLocaleString('en-IN')} sq ft` : '', f.seats ? `${f.seats} seats` : ''].filter(Boolean).join(' · ') || '—'}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </Card>
      ) : null}

      {po ? (
        <Card tint={v} icon="briefcase-outline" title="Office for lease">
          <View style={styles.facts}>
            <Fact label="Area" value={PO.areaSqft ? PO.areaSqft.toLocaleString('en-IN') : ''} unit=" sq ft" />
            <Fact label="Monthly rent" value={PO.monthlyRent ? inr(PO.monthlyRent) : ''} />
            <Fact label="Rent per sq ft" value={PO.rentPerSqft ? inr(PO.rentPerSqft) : ''} />
            <Fact label="Furnishing" value={PO.officeType} />
            <Fact label="Floor" value={PO.floor} />
            <Fact label="Security deposit" value={PO.securityDeposit} />
          </View>
          <Row icon="construct-outline" label="Maintenance" value={PO.maintenance} />
          <Row icon="business-outline" label="Building" value={PO.buildingName} />
          <Row icon="navigate-outline" label="How to reach" value={PO.howToReach} />
          <Row icon="time-outline" label="Access" value={[PO.open24 ? 'Open 24 hours' : '', PO.sundayOpen ? 'Open on Sunday' : ''].filter(Boolean).join(' · ')} last />
          {PO.facilities?.length ? (
            <View style={{ marginTop: 10 }}>
              <Text style={styles.subLabel}>Inside the office</Text>
              {PO.facilities.map((f, i) => (
                <View key={`${f.name}-${i}`} style={[styles.floorRow, i === PO.facilities.length - 1 && { borderBottomWidth: 0 }]}>
                  <Text style={styles.floorName}>{f.name}</Text>
                  <Text style={styles.floorMeta}>{f.value || '—'}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </Card>
      ) : null}

      {mo && office.rating ? (
        <Card tint={v} icon="star-outline" title="Rating">
          <Text style={styles.rating}>
            ★ {office.rating.average}
            <Text style={styles.planUnit}>{office.rating.total ? `  ·  ${office.rating.total} reviews` : ''}{office.rating.source ? `  ·  ${office.rating.source}` : ''}</Text>
          </Text>
        </Card>
      ) : null}

      {pg ? (
        <Card tint={v} icon="home-outline" title="PG details">
          <Row icon="people-outline" label="For" value={P.gender ? `${P.gender}${P.guests && P.guests !== 'Both' ? ` · ${P.guests}` : ''}` : ''} />
          <Row icon="restaurant-outline" label="Food" value={P.food} />
          <Row icon="shirt-outline" label="Laundry" value={P.laundry} />
          <Row icon="calendar-outline" label="Notice period" value={P.noticeDays ? `${P.noticeDays} days` : 'None'} />
          <Row icon="person-outline" label="Listed by" value={P.postedBy} />
          <Row icon="star-outline" label="Rating" value={P.rating ? `★ ${P.rating}` : ''} />
          <Row icon="shield-checkmark-outline" label="Website badge" value={P.websiteVerifiedAt ? `Verified on ${new Date(P.websiteVerifiedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : 'Not verified'} />
          <Row icon="logo-google" label="In Google" value={P.inGoogle === false ? 'No (noindex)' : P.inGoogle === true ? 'Yes' : 'Not checked yet'} last />
        </Card>
      ) : null}

      {pg && P.rules?.length ? (
        <Card icon="list-outline" title="House rules" right={<Text style={styles.cardHint}>{P.rules.length}</Text>}>
          <View style={styles.amenities}>
            {P.rules.map((r) => (
              <View key={r} style={styles.amenity}>
                <Ionicons name="ellipse" size={7} color={colors.muted} />
                <Text style={styles.amenityText}>{r}</Text>
              </View>
            ))}
          </View>
        </Card>
      ) : null}

      {amenities.length ? (
        <Card icon="sparkles-outline" title="Amenities" right={<Text style={styles.cardHint}>{amenities.length}</Text>}>
          <View style={styles.amenities}>
            {amenities.map((a) => (
              <View key={a} style={styles.amenity}>
                <Ionicons name="checkmark-circle" size={14} color={colors.brand} />
                <Text style={styles.amenityText}>{a}</Text>
              </View>
            ))}
          </View>
        </Card>
      ) : null}

      {description ? (
        <Card icon="document-text-outline" title={pg ? 'About this PG' : po ? 'About this office' : 'About this space'}>
          <Text style={styles.about} numberOfLines={more ? undefined : 4}>{description}</Text>
          {description.length > 220 ? (
            <Pressable onPress={() => setMore((m) => !m)} hitSlop={6}>
              <Text style={styles.moreLink}>{more ? 'Show less' : 'Read more'}</Text>
            </Pressable>
          ) : null}
        </Card>
      ) : null}

      <Card icon="location-outline" title="Location">
        <Row icon="business-outline" label="Address" value={I.address} />
        <Row icon="flag-outline" label="Landmark" value={I.landmark} />
        <Row icon="train-outline" label="Nearest metro" value={I.nearestMetro} />
        <Row icon="layers-outline" label="Floor" value={I.floors} />
        <Row icon="map-outline" label="Map" value={I.mapsLink ? 'Open in Google Maps' : null} onPress={() => open(I.mapsLink)} last />
      </Card>

      {hours.length || O.timings ? (
        <Card icon="time-outline" title="Opening hours">
          {hours.length
            ? hours.map((h, i) => <Row key={h.label} icon="calendar-outline" label={h.label} value={h.value} last={i === hours.length - 1} />)
            : <Row icon="calendar-outline" label={O.daysOpen || 'Timings'} value={O.timings} last />}
        </Card>
      ) : null}

      {canSeeInternal && pg && (F.salesPhone || F.salesEmail) ? (
        <Card icon="call-outline" title="PG contact" right={<Text style={styles.internal}>Internal</Text>}>
          <Row icon="call-outline" label="Phone" value={F.salesPhone} onPress={tel(F.salesPhone) ? () => open(tel(F.salesPhone)) : null} />
          <Row icon="mail-outline" label="Email" value={F.salesEmail} onPress={F.salesEmail ? () => open(`mailto:${F.salesEmail}`) : null} last />
        </Card>
      ) : null}

      {canSeeInternal && !mo && !pg ? (
        <Card icon="people-outline" title="Space contacts" right={<Text style={styles.internal}>Internal</Text>}>
          <Person role="Centre manager" person={F.centerManager} />
          <Person role="Community manager" person={F.communityManager} />
          <Row icon="call-outline" label="Sales phone" value={F.salesPhone} onPress={tel(F.salesPhone) ? () => open(tel(F.salesPhone)) : null} />
          <Row icon="mail-outline" label="Sales email" value={F.salesEmail} onPress={F.salesEmail ? () => open(`mailto:${F.salesEmail}`) : null} />
          <Row icon="globe-outline" label="Operator website" value={F.website} onPress={F.website ? () => open(F.website.startsWith('http') ? F.website : `https://${F.website}`) : null} last />
          {!F.centerManager?.name && !F.communityManager?.name && !F.salesPhone && !F.salesEmail ? (
            <Text style={styles.emptyNote}>No contacts added on the website yet.</Text>
          ) : null}
        </Card>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  card: {
    backgroundColor: colors.surface, borderRadius: 18, padding: 16,
    shadowColor: '#0B2A14', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  cardIcon: { width: 30, height: 30, borderRadius: 10, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: colors.ink },
  cardHint: { fontSize: 12, fontWeight: '700', color: colors.muted },
  internal: { fontSize: 10.5, fontWeight: '800', color: '#A35F00', backgroundColor: '#FFF4E0', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, overflow: 'hidden' },
  plans: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  plan: {
    flexGrow: 1, flexBasis: '46%', borderRadius: 14, padding: 12, backgroundColor: colors.surface2, gap: 4,
  },
  planBest: { backgroundColor: colors.brandSoft, borderWidth: 1, borderColor: colors.brand },
  planName: { fontSize: 12.5, fontWeight: '700', color: colors.muted },
  planPrice: { fontSize: 18, fontWeight: '800', color: colors.ink },
  planUnit: { fontSize: 12, fontWeight: '600', color: colors.muted },
  planTag: { position: 'absolute', top: 8, right: 8, fontSize: 9.5, fontWeight: '800', color: '#fff', backgroundColor: colors.brand, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, overflow: 'hidden' },
  amenities: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amenity: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.surface2, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10 },
  amenityText: { fontSize: 12.5, fontWeight: '600', color: colors.ink },
  about: { fontSize: 14, lineHeight: 21, color: colors.ink },
  moreLink: { marginTop: 6, fontSize: 13, fontWeight: '800', color: colors.brandInk },
  row: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  rowLabel: { fontSize: 11.5, fontWeight: '700', color: colors.faint, textTransform: 'uppercase', letterSpacing: 0.3 },
  rowValue: { fontSize: 14.5, fontWeight: '600', color: colors.ink, marginTop: 2, lineHeight: 20 },
  person: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 15, fontWeight: '800', color: colors.brandInk },
  personName: { fontSize: 14.5, fontWeight: '700', color: colors.ink },
  personRole: { fontSize: 12.5, color: colors.muted, marginTop: 1 },
  callBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  emptyNote: { fontSize: 13, color: colors.muted, paddingVertical: 6 },
  facts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  fact: { flexGrow: 1, flexBasis: '46%', backgroundColor: colors.surface2, borderRadius: 12, padding: 10 },
  factLabel: { fontSize: 11, fontWeight: '700', color: colors.faint, textTransform: 'uppercase', letterSpacing: 0.3 },
  factValue: { fontSize: 16, fontWeight: '800', color: colors.ink, marginTop: 2 },
  subLabel: { fontSize: 12, fontWeight: '800', color: colors.muted, marginBottom: 4 },
  floorRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  floorName: { fontSize: 14, fontWeight: '700', color: colors.ink },
  floorMeta: { fontSize: 13.5, color: colors.muted },
  rating: { fontSize: 20, fontWeight: '800', color: colors.ink },
});
