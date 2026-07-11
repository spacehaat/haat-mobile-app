import { View, Text, StyleSheet } from 'react-native';
import { STAGE_COLORS, STAGE_LABEL } from '../../constants/leads';

export default function StageBadge({ stage, compact }) {
  const palette = STAGE_COLORS[stage] || { bg: colorsFallback.bg, text: colorsFallback.text };
  const label = STAGE_LABEL[stage] || stage || 'Unknown';

  return (
    <View style={[styles.badge, compact && styles.compact, { backgroundColor: palette.bg }]}>
      <Text style={[styles.text, compact && styles.textCompact, { color: palette.text }]}>{label}</Text>
    </View>
  );
}

const colorsFallback = { bg: '#f4f2ee', text: '#6b6b6b' };

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  compact: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
  textCompact: {
    fontSize: 11,
  },
});
