import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { STATUS_COLORS } from '../../constants/inventory';

/** Website approval status of a space: Approved / Pending / In progress / Rejected. */
export default function ListingStatusBadge({ status, compact, onImage }) {
  if (!status?.key) return null;
  const c = STATUS_COLORS[status.key] || STATUS_COLORS.pending;
  return (
    <View style={[styles.pill, compact && styles.compact, { backgroundColor: onImage ? 'rgba(255,255,255,0.95)' : c.bg }]}>
      <Ionicons name={c.icon} size={compact ? 11 : 13} color={c.text} />
      <Text style={[styles.text, compact && styles.textCompact, { color: c.text }]}>{status.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999,
  },
  compact: { paddingHorizontal: 7, paddingVertical: 3 },
  text: { fontSize: 11.5, fontWeight: '800' },
  textCompact: { fontSize: 10.5 },
});
