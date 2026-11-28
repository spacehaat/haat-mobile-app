import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { inr } from '@spacehaat/utils';
import FreshBadge from './FreshBadge';
import ListingStatusBadge from './StatusBadge';
import { coverImg } from '../../lib/listingHelpers';
import { colors } from '../../constants/theme';
import { verticalOf } from '../../constants/inventory';

function Cover({ uri, style, children }) {
  return (
    <View style={[styles.cover, style]}>
      {uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : (
        <View style={styles.coverEmpty}><Ionicons name="business-outline" size={28} color="#B7C9BA" /></View>
      )}
      {children}
    </View>
  );
}

function ProposalButton({ inProposal, onPress, small }) {
  return (
    <Pressable
      onPress={(e) => { e.stopPropagation?.(); onPress(); }}
      hitSlop={8}
      style={[small ? styles.propSmall : styles.propBtn, inProposal && styles.propOn]}
      accessibilityLabel={inProposal ? 'Remove from proposal' : 'Add to proposal'}
    >
      <Ionicons name={inProposal ? 'checkmark' : 'add'} size={small ? 17 : 18} color={inProposal ? '#fff' : colors.brandInk} />
      {small ? null : <Text style={[styles.propText, inProposal && { color: '#fff' }]}>{inProposal ? 'In proposal' : 'Proposal'}</Text>}
    </Pressable>
  );
}

/** Coloured "Coworking" / "Managed office" / "PG / Coliving" tag so the sections never look alike. */
export function VerticalTag({ listing, onImage, small }) {
  const v = verticalOf(listing);
  return (
    <View style={[styles.vTag, { backgroundColor: onImage ? v.color : v.soft }, small && styles.vTagSmall]}>
      <Ionicons name={v.icon} size={small ? 11 : 12} color={onImage ? '#fff' : v.color} />
      <Text style={[styles.vTagText, { color: onImage ? '#fff' : v.color }, small && { fontSize: 10.5 }]}>{v.label}</Text>
    </View>
  );
}

/** A website coworking space, managed office, private office or PG in the inventory list. */
export default function ListingCard({
  listing, onPress, inProposal, onToggleProposal, showProposalAction, compact,
}) {
  const id = listing.id || listing._id;
  const cover = coverImg(listing);
  const place = [listing.micro, listing.city].filter(Boolean).join(', ');
  const v = verticalOf(listing);
  const mo = v.key === 'managed-office';
  const pg = v.key === 'coliving';
  const po = v.key === 'private-office';
  const types = po ? [listing.privateOffice?.officeType].filter(Boolean) : mo
    ? (listing.office?.seatTypes || [])
    : pg ? (listing.spaceTypes || [])
      : (listing.spaceTypes?.length ? listing.spaceTypes : [listing.type]).filter(Boolean);
  const lease = mo ? [
    listing.office?.minSeats ? `Min ${listing.office.minSeats} seats` : '',
    listing.office?.minMonths ? `${listing.office.minMonths}-month lock-in` : '',
  ].filter(Boolean).join(' · ') : pg ? [
    listing.pg?.gender ? `For ${listing.pg.gender === 'Co-living' ? 'everyone (co-living)' : listing.pg.gender.toLowerCase()}` : '',
    listing.pg?.food && listing.pg.food !== 'Not included' ? `Food: ${listing.pg.food}` : 'No food',
  ].filter(Boolean).join(' · ') : po ? [
    listing.privateOffice?.areaSqft ? `${listing.privateOffice.areaSqft.toLocaleString('en-IN')} sq ft` : '',
    listing.privateOffice?.floor ? `Floor ${listing.privateOffice.floor}` : '',
    listing.privateOffice?.securityDeposit ? `Deposit ${listing.privateOffice.securityDeposit}` : '',
  ].filter(Boolean).join(' · ') : '';
  const unit = pg || po ? ' /mo' : ' /seat/mo';
  const toggle = () => onToggleProposal?.(id, listing);

  if (compact) {
    return (
      <Pressable style={({ pressed }) => [styles.row, { borderLeftWidth: 4, borderLeftColor: v.color }, pressed && styles.pressed]} onPress={() => onPress(id)}>
        <Cover uri={cover} style={styles.thumb} />
        <View style={styles.rowBody}>
          <Text style={styles.rowName} numberOfLines={1}>{listing.operator}</Text>
          <Text style={styles.rowSub} numberOfLines={1}>{place || '—'}</Text>
          <View style={styles.rowMeta}>
            <VerticalTag listing={listing} small />
            <ListingStatusBadge status={listing.status} compact />
            <Text style={styles.rowPrice}>{listing.price ? `${inr(listing.price)}/mo` : 'Price on request'}</Text>
          </View>
        </View>
        {showProposalAction ? <ProposalButton small inProposal={inProposal} onPress={toggle} /> : null}
      </Pressable>
    );
  }

  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]} onPress={() => onPress(id)}>
      <Cover uri={cover}>
        <View style={styles.coverTop}>
          <ListingStatusBadge status={listing.status} onImage />
          {listing.images?.length > 1 ? (
            <View style={styles.photoCount}>
              <Ionicons name="images-outline" size={12} color="#fff" />
              <Text style={styles.photoCountText}>{listing.images.length}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.coverBottom}>
          <VerticalTag listing={listing} onImage />
          {mo && listing.office?.isNewLaunch ? <Text style={styles.newLaunch}>New launch</Text> : null}
          {listing.isActive === false ? <View style={styles.inactive}><Text style={styles.inactiveText}>Hidden on website</Text></View> : null}
        </View>
      </Cover>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>{listing.operator}</Text>
          <FreshBadge fresh={listing.fresh} compact />
        </View>
        <View style={styles.placeRow}>
          <Ionicons name="location-outline" size={13} color={colors.muted} />
          <Text style={styles.place} numberOfLines={1}>{place || 'Location not set'}</Text>
        </View>

        {types.length ? (
          <View style={styles.types}>
            {types.slice(0, 3).map((t) => <Text key={t} style={[styles.typeChip, { color: v.color, backgroundColor: v.soft }]}>{t}</Text>)}
            {types.length > 3 ? <Text style={styles.typeMore}>+{types.length - 3}</Text> : null}
          </View>
        ) : null}
        {lease ? (
          <View style={styles.placeRow}>
            <Ionicons name={pg ? 'people-outline' : 'document-text-outline'} size={13} color={v.color} />
            <Text style={[styles.place, { color: colors.ink, fontWeight: '600' }]} numberOfLines={1}>{lease}</Text>
          </View>
        ) : null}

        <View style={styles.footer}>
          <View style={{ flex: 1 }}>
            <Text style={styles.priceLabel}>Starting from</Text>
            <Text style={styles.price}>
              {listing.price ? inr(listing.price) : 'On request'}
              {listing.price ? <Text style={styles.priceUnit}>{unit}</Text> : null}
            </Text>
          </View>
          {pg && listing.pg?.websiteVerifiedAt ? (
            <View style={styles.seats}>
              <Ionicons name="shield-checkmark-outline" size={14} color={v.color} />
              <Text style={styles.seatsText}>Verified</Text>
            </View>
          ) : null}
          {listing.seats ? (
            <View style={styles.seats}>
              <Ionicons name="people-outline" size={14} color={colors.ink} />
              <Text style={styles.seatsText}>{listing.seats} seats</Text>
            </View>
          ) : null}
          {showProposalAction ? <ProposalButton inProposal={inProposal} onPress={toggle} /> : null}
        </View>
      </View>
    </Pressable>
  );
}

const shadow = {
  shadowColor: '#0B2A14', shadowOpacity: 0.08, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 3,
};

const styles = StyleSheet.create({
  pressed: { opacity: 0.92, transform: [{ scale: 0.995 }] },
  card: { backgroundColor: colors.surface, borderRadius: 18, marginBottom: 14, overflow: 'hidden', ...shadow },
  cover: { height: 168, backgroundColor: '#EAF2EB', overflow: 'hidden' },
  coverEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  coverTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10 },
  photoCount: {
    flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999,
  },
  photoCountText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  coverBottom: { position: 'absolute', left: 10, bottom: 10, right: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  vTag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999 },
  vTagSmall: { paddingHorizontal: 7, paddingVertical: 3 },
  vTagText: { fontSize: 11.5, fontWeight: '800' },
  newLaunch: { fontSize: 11, fontWeight: '800', color: '#7A4B00', backgroundColor: '#FFE7A8', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, overflow: 'hidden' },
  inactive: { backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  inactiveText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  body: { padding: 14, gap: 6 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { flex: 1, fontSize: 17, fontWeight: '800', color: colors.ink, letterSpacing: -0.2 },
  placeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  place: { flex: 1, fontSize: 13, color: colors.muted },
  types: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  typeChip: {
    fontSize: 11.5, fontWeight: '700', color: colors.brandInk, backgroundColor: colors.brandSoft,
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, overflow: 'hidden',
  },
  typeMore: { fontSize: 11.5, fontWeight: '700', color: colors.muted, paddingVertical: 4 },
  footer: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8, paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border,
  },
  priceLabel: { fontSize: 10.5, fontWeight: '700', color: colors.faint, textTransform: 'uppercase', letterSpacing: 0.4 },
  price: { fontSize: 18, fontWeight: '800', color: colors.ink, marginTop: 1 },
  priceUnit: { fontSize: 12, fontWeight: '600', color: colors.muted },
  seats: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.surface2, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 10 },
  seatsText: { fontSize: 12, fontWeight: '700', color: colors.ink },
  propBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 11, paddingVertical: 8,
    borderRadius: 12, borderWidth: 1.5, borderColor: colors.brand, backgroundColor: colors.brandSoft,
  },
  propOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  propText: { fontSize: 12.5, fontWeight: '800', color: colors.brandInk },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface,
    borderRadius: 14, padding: 10, marginBottom: 10, ...shadow, shadowOpacity: 0.05,
  },
  thumb: { width: 72, height: 72, borderRadius: 12 },
  rowBody: { flex: 1, minWidth: 0, gap: 3 },
  rowName: { fontSize: 15, fontWeight: '800', color: colors.ink },
  rowSub: { fontSize: 12.5, color: colors.muted },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  rowPrice: { fontSize: 12.5, fontWeight: '700', color: colors.ink },
  propSmall: {
    width: 36, height: 36, borderRadius: 12, borderWidth: 1.5, borderColor: colors.brand,
    backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center',
  },
});
