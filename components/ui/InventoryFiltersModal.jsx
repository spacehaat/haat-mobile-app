import {
  Modal, View, Text, Pressable, ScrollView, StyleSheet, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  SPACE_TYPES, AMENITIES, BUILDING_TYPES, MIN_SEAT_TIERS, MAX_PRICE_TIERS, INITIAL_FILTER,
} from '../../constants/inventory';
import { colors } from '../../constants/theme';

function FilterGroup({ label, children }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupLabel}>{label}</Text>
      {children}
    </View>
  );
}

function OptRow({ options, value, onChange }) {
  return (
    <View style={styles.opts}>
      {options.map(([v, label]) => (
        <Pressable
          key={v || label}
          style={[styles.opt, value === v && styles.optOn]}
          onPress={() => onChange(v)}
        >
          <Text style={[styles.optText, value === v && styles.optTextOn]}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function InventoryFiltersModal({ visible, filter, onChange, onClose, onReset }) {
  const set = (key, val) => onChange({ ...filter, [key]: val });
  const toggleAmenity = (a) => {
    const next = filter.amenities.includes(a)
      ? filter.amenities.filter((x) => x !== a)
      : [...filter.amenities, a];
    set('amenities', next);
  };
  const toggleFlag = (flag) => set(flag, !filter[flag]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.head}>
          <Text style={styles.title}>Filters</Text>
          <View style={styles.headActions}>
            <Pressable onPress={onReset} hitSlop={8}>
              <Text style={styles.reset}>Reset</Text>
            </Pressable>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={26} color={colors.ink} />
            </Pressable>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <FilterGroup label="Space type">
            <OptRow
              options={[['All', 'All'], ...SPACE_TYPES.map((t) => [t, t])]}
              value={filter.type}
              onChange={(v) => set('type', v)}
            />
          </FilterGroup>

          <FilterGroup label="Freshness">
            <OptRow
              options={[['All', 'All'], ['fresh', 'Fresh'], ['stale', 'Stale'], ['expired', 'Expired']]}
              value={filter.fresh}
              onChange={(v) => set('fresh', v)}
            />
          </FilterGroup>

          <FilterGroup label="Min seats">
            <OptRow
              options={MIN_SEAT_TIERS.map((n) => [n, n === 0 ? 'Any' : `${n}+ seats`])}
              value={filter.minSeats}
              onChange={(v) => set('minSeats', v)}
            />
          </FilterGroup>

          <FilterGroup label="Max price / seat">
            <OptRow
              options={MAX_PRICE_TIERS.map(({ value, label }) => [value, label])}
              value={filter.maxPrice}
              onChange={(v) => set('maxPrice', v)}
            />
          </FilterGroup>

          <FilterGroup label="Building type">
            <OptRow
              options={[['All', 'All'], ...BUILDING_TYPES.map((t) => [t, t])]}
              value={filter.buildingType}
              onChange={(v) => set('buildingType', v)}
            />
          </FilterGroup>

          <FilterGroup label="Quick flags">
            <View style={styles.opts}>
              {[
                ['hotDesk', 'Hot desk available'],
                ['managedOffice', 'Managed office'],
                ['virtualOffice', 'Virtual office'],
                ['vastu', 'Vastu compliant'],
              ].map(([flag, label]) => (
                <Pressable
                  key={flag}
                  style={[styles.opt, filter[flag] && styles.optOn]}
                  onPress={() => toggleFlag(flag)}
                >
                  <Text style={[styles.optText, filter[flag] && styles.optTextOn]}>{label}</Text>
                </Pressable>
              ))}
            </View>
          </FilterGroup>

          <FilterGroup label="Amenities">
            <View style={styles.opts}>
              {AMENITIES.map((a) => (
                <Pressable
                  key={a}
                  style={[styles.opt, filter.amenities.includes(a) && styles.optOn]}
                  onPress={() => toggleAmenity(a)}
                >
                  <Text style={[styles.optText, filter.amenities.includes(a) && styles.optTextOn]}>{a}</Text>
                </Pressable>
              ))}
            </View>
          </FilterGroup>
        </ScrollView>

        <View style={styles.foot}>
          <Pressable style={styles.applyBtn} onPress={onClose}>
            <Text style={styles.applyText}>Show results</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

export { INITIAL_FILTER };

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface2 },
  head: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  title: { fontSize: 17, fontWeight: '700', color: colors.ink },
  headActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  reset: { color: colors.brand, fontWeight: '600', fontSize: 14 },
  content: { padding: 16, paddingBottom: 24 },
  group: { marginBottom: 20 },
  groupLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase',
    color: colors.faint, marginBottom: 10,
  },
  opts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  opt: {
    minHeight: 34, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  optOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  optText: { fontSize: 13, fontWeight: '600', color: colors.ink },
  optTextOn: { color: '#fff' },
  foot: {
    padding: 16, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface,
  },
  applyBtn: {
    backgroundColor: colors.brand, borderRadius: 12, paddingVertical: 14, alignItems: 'center',
  },
  applyText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
