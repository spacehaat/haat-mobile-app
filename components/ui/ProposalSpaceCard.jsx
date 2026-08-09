import { View, Text, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { inr } from '@spacehaat/utils';
import FreshBadge from './FreshBadge';
import { allGalleryPhotos, clientSafeListing } from '../../lib/listingHelpers';
import { DEFAULT_PROPOSAL_AMENITIES, PROPOSAL_AVAILABLE_NOW } from '../../constants/proposalDefaults';
import { colors } from '../../constants/theme';

export default function ProposalSpaceCard({ listing, index, total }) {
  const safe = clientSafeListing(listing);
  const photos = allGalleryPhotos(listing).slice(0, 4);
  const loc = `${listing.micro}, ${listing.city}`;

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.idx}>
          <Text style={styles.idxNum}>{String(index + 1).padStart(2, '0')}</Text>
          <Text style={styles.idxOf}>of {String(total).padStart(2, '0')}</Text>
        </View>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>{listing.operator}</Text>
          <View style={styles.locRow}>
            <Ionicons name="location-outline" size={12} color={colors.muted} />
            <Text style={styles.loc}>{loc}</Text>
          </View>
        </View>
        <FreshBadge fresh={listing.fresh} compact />
      </View>

      {photos.length > 0 ? (
        <View style={styles.gal}>
          {photos.map((ph, i) => (
            <View key={`${ph.src}-${i}`} style={styles.galCell}>
              <Image source={{ uri: ph.src }} style={styles.galImg} />
              <Text style={styles.galLbl} numberOfLines={1}>{ph.label || listing.type}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.metrics}>
        <View style={[styles.metric, styles.metricHi]}>
          <Text style={styles.metricL}>Price / seat</Text>
          <Text style={styles.metricV}>{inr(listing.price)}/mo</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricL}>Availability</Text>
          <Text style={styles.metricV}>{PROPOSAL_AVAILABLE_NOW}</Text>
        </View>
      </View>

      <View style={styles.facts}>
        {safe.buildingType ? (
          <View style={styles.fact}>
            <Ionicons name="business-outline" size={12} color={colors.muted} />
            <Text style={styles.factText}>{safe.buildingType}</Text>
          </View>
        ) : null}
        {safe.nearestMetro ? (
          <View style={styles.fact}>
            <Ionicons name="train-outline" size={12} color={colors.muted} />
            <Text style={styles.factText} numberOfLines={1}>{safe.nearestMetro}</Text>
          </View>
        ) : null}
        {safe.securityDeposit ? (
          <View style={styles.fact}>
            <Ionicons name="document-text-outline" size={12} color={colors.muted} />
            <Text style={styles.factText}>Deposit {safe.securityDeposit}</Text>
          </View>
        ) : null}
        {safe.noticePeriod ? (
          <View style={styles.fact}>
            <Ionicons name="calendar-outline" size={12} color={colors.muted} />
            <Text style={styles.factText}>{safe.noticePeriod} notice</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.amenRow}>
        {DEFAULT_PROPOSAL_AMENITIES.map((a) => (
          <View key={a} style={styles.amenChip}>
            <Ionicons name="checkmark" size={10} color={colors.success} />
            <Text style={styles.amenText}>{a}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: colors.border, marginBottom: 12,
  },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  idx: { alignItems: 'center', minWidth: 36 },
  idxNum: { fontSize: 18, fontWeight: '800', color: colors.brand },
  idxOf: { fontSize: 10, color: colors.muted, fontWeight: '600' },
  titleWrap: { flex: 1, minWidth: 0 },
  title: { fontSize: 16, fontWeight: '800', color: colors.ink },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  loc: { fontSize: 12, color: colors.muted, flex: 1 },
  gal: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  galCell: { width: '48%', flexGrow: 1 },
  galImg: { width: '100%', height: 80, borderRadius: 8, backgroundColor: colors.surface2 },
  galLbl: { fontSize: 10, color: colors.muted, marginTop: 4, fontWeight: '600' },
  metrics: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  metric: {
    flex: 1, backgroundColor: colors.surface2, borderRadius: 10, padding: 10,
  },
  metricHi: { backgroundColor: colors.brandSoft },
  metricL: { fontSize: 10, color: colors.muted, fontWeight: '600', textTransform: 'uppercase' },
  metricV: { fontSize: 13, fontWeight: '800', color: colors.ink, marginTop: 4 },
  facts: { gap: 6, marginBottom: 10 },
  fact: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  factText: { fontSize: 12, color: colors.ink, flex: 1 },
  amenRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  amenChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.surface2, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 999,
  },
  amenText: { fontSize: 11, fontWeight: '600', color: colors.ink },
});
