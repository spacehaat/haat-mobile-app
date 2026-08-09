import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../../constants/theme';

/**
 * Chip picker for lead assignee.
 * Empty selection = auto-assign by city (backend load-balances).
 */
export default function AssigneePicker({
  options = [],
  value = '',
  suggestedId = '',
  loading = false,
  onChange,
  label = 'Assign to',
}) {
  const suggested = options.find((u) => u.id === suggestedId);
  const autoLabel = suggested
    ? `Auto-assign → ${suggested.name}`
    : 'Auto-assign by city';

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.hint}>
        Pick a user to assign this lead only to them. Leave auto to balance by open leads.
      </Text>
      {loading ? (
        <ActivityIndicator color={colors.brand} style={{ marginVertical: 8 }} />
      ) : (
        <View style={styles.chips}>
          <Pressable
            style={[styles.chip, !value && styles.chipOn]}
            onPress={() => onChange?.('')}
          >
            <Text style={[styles.chipText, !value && styles.chipTextOn]} numberOfLines={1}>
              {autoLabel}
            </Text>
          </Pressable>
          {options.map((u) => {
            const on = value === u.id;
            return (
              <Pressable
                key={u.id}
                style={[styles.chip, on && styles.chipOn]}
                onPress={() => onChange?.(u.id)}
              >
                <Text style={[styles.chipText, on && styles.chipTextOn]} numberOfLines={1}>
                  {u.name}
                  {u.role === 'admin' ? ' (Admin)' : ''}
                  {typeof u.openLeads === 'number' ? ` · ${u.openLeads} open` : ''}
                </Text>
              </Pressable>
            );
          })}
          {!options.length ? (
            <Text style={styles.empty}>No assignable users for this city.</Text>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '600', color: colors.muted, marginBottom: 4 },
  hint: { fontSize: 12, color: colors.faint, marginBottom: 8, lineHeight: 17 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: '100%',
  },
  chipOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.ink },
  chipTextOn: { color: '#fff' },
  empty: { fontSize: 12, color: colors.muted, paddingVertical: 4 },
});
