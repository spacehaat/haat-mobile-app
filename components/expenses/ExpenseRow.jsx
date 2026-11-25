import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';
import { formatRupees, paidByLabel } from '../../lib/expenses';

export default function ExpenseRow({ expense, showPerson, onPress }) {
  const title = expense.note || expense.category?.name || 'Expense';
  const meta = [showPerson ? expense.person?.name : null, expense.note ? expense.category?.name : null, paidByLabel(expense)]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && styles.pressed]} onPress={onPress}>
      <View style={styles.icon}>
        <Ionicons name={expense.category?.icon || 'pricetag-outline'} size={18} color={colors.brandInk} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <Text style={styles.meta} numberOfLines={1}>{meta}</Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.amount}>{formatRupees(expense.amount)}</Text>
        {expense.needsSettling ? (
          <Text style={[styles.badge, styles.badgeDue]}>To pay back</Text>
        ) : expense.settled ? (
          <Text style={[styles.badge, styles.badgeDone]}>Paid back</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surface, paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  pressed: { backgroundColor: colors.surface2 },
  icon: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, minWidth: 0 },
  title: { fontSize: 15, fontWeight: '600', color: colors.ink },
  meta: { fontSize: 12, color: colors.muted, marginTop: 2 },
  right: { alignItems: 'flex-end' },
  amount: { fontSize: 15, fontWeight: '800', color: colors.ink },
  badge: { marginTop: 4, fontSize: 10, fontWeight: '700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, overflow: 'hidden' },
  badgeDue: { color: '#9A5B00', backgroundColor: '#FFF4E0' },
  badgeDone: { color: colors.brandInk, backgroundColor: colors.brandSoft },
});
