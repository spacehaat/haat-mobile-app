import { View, Text, StyleSheet } from 'react-native';
import { FRESH_COLORS } from '../../constants/listings';

export default function FreshBadge({ fresh, compact }) {
  if (!fresh) return null;
  const palette = FRESH_COLORS[fresh.state] || { bg: '#f4f2ee', text: '#6b6b6b' };

  return (
    <View style={[styles.badge, compact && styles.compact, { backgroundColor: palette.bg }]}>
      <View style={[styles.dot, { backgroundColor: palette.text }]} />
      <Text style={[styles.text, compact && styles.textCompact, { color: palette.text }]}>
        {fresh.label || fresh.state}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  compact: { paddingHorizontal: 8, paddingVertical: 3 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 11, fontWeight: '700' },
  textCompact: { fontSize: 10 },
});
