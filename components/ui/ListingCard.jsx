import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { inr } from '@spacehaat/utils';
import FreshBadge from './FreshBadge';
import { colors } from '../../constants/theme';

export default function ListingCard({
  listing, onPress, inProposal, onToggleProposal, showProposalAction, compact,
}) {
  const id = listing.id || listing._id;

  if (compact) {
    return (
      <Pressable style={styles.row} onPress={() => onPress(id)}>
        <View style={styles.rowBody}>
          <Text style={styles.rowOp} numberOfLines={1}>{listing.operator}</Text>
          <Text style={styles.rowSub} numberOfLines={1}>{listing.micro} · {listing.seats} seats · {inr(listing.price)}</Text>
        </View>
        <FreshBadge fresh={listing.fresh} compact />
        {showProposalAction ? (
          <Pressable
            style={[styles.propBtn, inProposal && styles.propBtnOn]}
            onPress={(e) => { e.stopPropagation?.(); onToggleProposal?.(id, listing); }}
            hitSlop={8}
          >
            <Ionicons name={inProposal ? 'checkmark' : 'add'} size={16} color={inProposal ? '#fff' : colors.brand} />
          </Pressable>
        ) : null}
      </Pressable>
    );
  }

  return (
    <Pressable style={styles.card} onPress={() => onPress(id)}>
      <View style={styles.top}>
        <View style={styles.body}>
          <Text style={styles.operator}>{listing.operator}</Text>
          <Text style={styles.loc}>{listing.micro}, {listing.city}</Text>
        </View>
        <FreshBadge fresh={listing.fresh} compact />
      </View>
      <Text style={styles.facts}>
        {listing.seats} seats · {inr(listing.price)}/seat · {listing.type}
      </Text>
      {listing.avail ? <Text style={styles.avail}>{listing.avail}</Text> : null}
      {listing.tier ? <Text style={styles.tier}>{listing.tier} tier</Text> : null}

      {showProposalAction ? (
        <Pressable
          style={[styles.actionBtn, inProposal && styles.actionBtnOn]}
          onPress={(e) => { e.stopPropagation?.(); onToggleProposal?.(id, listing); }}
        >
          <Ionicons name={inProposal ? 'checkmark-circle' : 'add-circle-outline'} size={18} color={inProposal ? '#fff' : colors.brand} />
          <Text style={[styles.actionText, inProposal && styles.actionTextOn]}>
            {inProposal ? 'In proposal' : 'Add to proposal'}
          </Text>
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  body: { flex: 1, minWidth: 0 },
  operator: { fontSize: 15, fontWeight: '700', color: colors.ink },
  loc: { fontSize: 12, color: colors.muted, marginTop: 2 },
  facts: { fontSize: 13, fontWeight: '600', color: colors.ink },
  avail: { fontSize: 12, color: colors.muted, marginTop: 4 },
  tier: { fontSize: 11, color: colors.faint, marginTop: 2 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: 10, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: colors.brand, backgroundColor: colors.brandSoft,
  },
  actionBtnOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  actionText: { fontSize: 13, fontWeight: '700', color: colors.brand },
  actionTextOn: { color: '#fff' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.surface, borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: colors.border, marginBottom: 8,
  },
  rowBody: { flex: 1, minWidth: 0 },
  rowOp: { fontSize: 14, fontWeight: '700', color: colors.ink },
  rowSub: { fontSize: 12, color: colors.muted, marginTop: 2 },
  propBtn: {
    width: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: colors.brand,
    alignItems: 'center', justifyContent: 'center',
  },
  propBtnOn: { backgroundColor: colors.brand },
});
