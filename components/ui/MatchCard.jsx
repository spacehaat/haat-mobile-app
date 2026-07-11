import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { inr } from '@spacehaat/utils';
import { colors } from '../../constants/theme';
import { scoreClass } from '../../constants/match';

const SCORE_COLORS = {
  strong: { bg: '#e6f4ec', text: '#2e9e5b' },
  good: { bg: '#E8F5E9', text: '#2E7D32' },
  weak: { bg: '#f4f2ee', text: '#6b6b6b' },
};

export default function MatchCard({ match, selected, onPress }) {
  const l = match.listing;
  const score = match.score;
  const why = match.reasons || [];
  const tier = match.verdict || (score >= 88 ? 'Strong match' : score >= 72 ? 'Good match' : 'Possible');
  const palette = SCORE_COLORS[scoreClass(score)];

  return (
    <Pressable style={[styles.card, selected && styles.cardSelected]} onPress={onPress}>
      <View style={[styles.check, selected && styles.checkOn]}>
        {selected ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
      </View>

      <View style={[styles.score, { backgroundColor: palette.bg }]}>
        <Text style={[styles.scoreNum, { color: palette.text }]}>{score}%</Text>
        <Text style={[styles.scoreLabel, { color: palette.text }]}>{tier}</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.operator}>{l.operator}</Text>
        <Text style={styles.loc}>{l.micro}, {l.city}</Text>
        <Text style={styles.facts}>
          {l.seats} seats · {inr(l.price)}/seat · {l.type}
        </Text>
        <View style={styles.whyRow}>
          {why.slice(0, 3).map((w) => (
            <View key={w.text} style={[styles.whyChip, w.ok ? styles.whyOk : styles.whyNo]}>
              <Ionicons
                name={w.ok ? 'checkmark-circle' : 'remove-circle-outline'}
                size={12}
                color={w.ok ? colors.success : colors.muted}
              />
              <Text style={styles.whyText} numberOfLines={1}>{w.text}</Text>
            </View>
          ))}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  cardSelected: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
  check: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center', marginTop: 4,
  },
  checkOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  score: {
    width: 64, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 6,
    alignItems: 'center', justifyContent: 'center',
  },
  scoreNum: { fontSize: 18, fontWeight: '800' },
  scoreLabel: { fontSize: 9, fontWeight: '700', textAlign: 'center', marginTop: 2 },
  body: { flex: 1, minWidth: 0 },
  operator: { fontSize: 14, fontWeight: '700', color: colors.ink },
  loc: { fontSize: 12, color: colors.muted, marginTop: 2 },
  facts: { fontSize: 12, color: colors.ink, marginTop: 6 },
  whyRow: { marginTop: 8, gap: 4 },
  whyChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 3, paddingHorizontal: 6, borderRadius: 6, alignSelf: 'flex-start',
  },
  whyOk: { backgroundColor: '#e6f4ec' },
  whyNo: { backgroundColor: colors.surface2 },
  whyText: { fontSize: 11, color: colors.ink, maxWidth: 200 },
});
