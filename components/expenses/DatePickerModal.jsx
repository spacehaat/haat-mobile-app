import { useEffect, useMemo, useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';
import { monthLabel, shiftMonth, todayIso } from '../../lib/expenses';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** A small month calendar (no native module needed). Future days are disabled. */
export default function DatePickerModal({ visible, value, onSelect, onClose }) {
  const today = todayIso();
  const [month, setMonth] = useState((value || today).slice(0, 7));

  useEffect(() => {
    if (visible) setMonth((value || today).slice(0, 7));
  }, [visible, value, today]);

  const cells = useMemo(() => {
    const [y, m] = month.split('-').map(Number);
    const first = new Date(y, m - 1, 1).getDay();
    const days = new Date(y, m, 0).getDate();
    const list = Array.from({ length: first }, () => null);
    for (let d = 1; d <= days; d += 1) list.push(`${month}-${String(d).padStart(2, '0')}`);
    return list;
  }, [month]);

  const canGoNext = month < today.slice(0, 7);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.header}>
            <Pressable hitSlop={10} onPress={() => setMonth(shiftMonth(month, -1))}>
              <Ionicons name="chevron-back" size={22} color={colors.ink} />
            </Pressable>
            <Text style={styles.title}>{monthLabel(month)}</Text>
            <Pressable hitSlop={10} disabled={!canGoNext} onPress={() => setMonth(shiftMonth(month, 1))}>
              <Ionicons name="chevron-forward" size={22} color={canGoNext ? colors.ink : colors.border} />
            </Pressable>
          </View>
          <View style={styles.grid}>
            {WEEKDAYS.map((d, i) => (
              <Text key={`w${i}`} style={styles.weekday}>{d}</Text>
            ))}
            {cells.map((iso, i) => {
              if (!iso) return <View key={`e${i}`} style={styles.cell} />;
              const future = iso > today;
              const selected = iso === value;
              return (
                <Pressable
                  key={iso}
                  style={[styles.cell, selected && styles.cellSelected]}
                  disabled={future}
                  onPress={() => {
                    onSelect(iso);
                    onClose();
                  }}
                >
                  <Text style={[styles.day, future && styles.dayFuture, iso === today && styles.dayToday, selected && styles.daySelected]}>
                    {Number(iso.slice(8))}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', padding: 24 },
  sheet: { backgroundColor: colors.surface, borderRadius: 18, padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  title: { fontSize: 16, fontWeight: '700', color: colors.ink },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  weekday: { width: '14.28%', textAlign: 'center', fontSize: 12, fontWeight: '700', color: colors.muted, paddingVertical: 6 },
  cell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 999 },
  cellSelected: { backgroundColor: colors.brand },
  day: { fontSize: 15, color: colors.ink },
  dayFuture: { color: colors.border },
  dayToday: { fontWeight: '800', color: colors.brandInk },
  daySelected: { color: '#FFFFFF', fontWeight: '800' },
});
