import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '../../constants/theme';

export default function KpiCard({ label, value, sub, loading, onPress }) {
  const Wrapper = onPress ? Pressable : View;

  return (
    <Wrapper style={styles.card} onPress={onPress}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{loading ? '…' : value}</Text>
      {sub ? <Text style={styles.sub}>{sub}</Text> : null}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.muted,
    marginBottom: 8,
  },
  value: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.ink,
  },
  sub: {
    marginTop: 6,
    fontSize: 12,
    color: colors.muted,
    lineHeight: 17,
  },
});
