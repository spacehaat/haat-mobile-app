import {
  Modal, View, Text, Pressable, ScrollView, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  SPACE_TYPES, SEAT_TYPES, AMENITIES, MIN_SEAT_TIERS, MAX_PRICE_TIERS, INITIAL_FILTER, SORTS, VERTICALS, PG_GENDERS,
  OFFICE_TYPES, PO_RENT_TIERS,
} from '../../constants/inventory';
import { colors } from '../../constants/theme';
import ModalSafeArea from './ModalSafeArea';

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

export default function InventoryFiltersModal({
  visible, filter, onChange, onClose, onReset, amenityOptions, vertical = 'coworking',
}) {
  const mo = vertical === 'managed-office';
  const pg = vertical === 'coliving';
  const po = vertical === 'private-office';
  const v = VERTICALS[vertical] || VERTICALS.coworking;
  const amenityList = amenityOptions?.length ? amenityOptions : AMENITIES;
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
      <ModalSafeArea style={styles.safe}>
        <View style={styles.head}>
          <View>
            <Text style={styles.title}>Filters</Text>
            <Text style={[styles.forVertical, { color: v.color }]}>{v.plural}</Text>
          </View>
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
          <FilterGroup label="Sort by">
            <OptRow
              options={SORTS.map((o) => [o.key, o.label])}
              value={filter.sort || 'updated'}
              onChange={(v) => set('sort', v)}
            />
          </FilterGroup>

          {po ? (
            <FilterGroup label="Furnishing">
              <OptRow
                options={[['All', 'All'], ...OFFICE_TYPES.map((t) => [t.key, t.label])]}
                value={filter.officeType || 'All'}
                onChange={(val) => set('officeType', val)}
              />
            </FilterGroup>
          ) : pg ? (
            <FilterGroup label="PG for">
              <OptRow
                options={[['All', 'All'], ...PG_GENDERS.map((g) => [g, g])]}
                value={filter.gender || 'All'}
                onChange={(val) => set('gender', val)}
              />
            </FilterGroup>
          ) : mo ? (
            <FilterGroup label="Seat type">
              <OptRow
                options={[['All', 'All'], ...SEAT_TYPES.map((t) => [t.key, t.label])]}
                value={filter.seatType || 'All'}
                onChange={(val) => set('seatType', val)}
              />
            </FilterGroup>
          ) : (
            <FilterGroup label="Space type">
              <OptRow
                options={[['All', 'All'], ...SPACE_TYPES.map((t) => [t, t])]}
                value={filter.type}
                onChange={(val) => set('type', val)}
              />
            </FilterGroup>
          )}

          <FilterGroup label="Last verified">
            <OptRow
              options={[['All', 'All'], ['fresh', 'Within 5 days'], ['stale', '6–14 days'], ['expired', 'Over 14 days']]}
              value={filter.fresh}
              onChange={(v) => set('fresh', v)}
            />
          </FilterGroup>

          {pg || po ? null : (
          <FilterGroup label="Min seats">
            <OptRow
              options={MIN_SEAT_TIERS.map((n) => [n, n === 0 ? 'Any' : `${n}+ seats`])}
              value={filter.minSeats}
              onChange={(v) => set('minSeats', v)}
            />
          </FilterGroup>
          )}

          <FilterGroup label={pg || po ? 'Max rent / month' : 'Max price / seat'}>
            <OptRow
              options={(po ? PO_RENT_TIERS : MAX_PRICE_TIERS).map(({ value, label }) => [value, label])}
              value={filter.maxPrice ?? null}
              onChange={(v) => set('maxPrice', v)}
            />
          </FilterGroup>

          {pg ? (
            <FilterGroup label="Quick flags">
              <View style={styles.opts}>
                <Pressable style={[styles.opt, filter.food && styles.optOn]} onPress={() => toggleFlag('food')}>
                  <Text style={[styles.optText, filter.food && styles.optTextOn]}>Food included</Text>
                </Pressable>
              </View>
            </FilterGroup>
          ) : null}

          {mo || pg || po ? null : (
          <FilterGroup label="Quick flags">
            <View style={styles.opts}>
              {[
                ['hotDesk', 'Hot desk available'],
                ['managedOffice', 'Managed office'],
                ['virtualOffice', 'Virtual office'],
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
          )}

          {pg ? null : (
          <FilterGroup label="Amenities">
            <View style={styles.opts}>
              {amenityList.map((a) => (
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
          )}
        </ScrollView>

        <View style={styles.foot}>
          <Pressable style={styles.applyBtn} onPress={onClose}>
            <Text style={styles.applyText}>Show results</Text>
          </Pressable>
        </View>
      </ModalSafeArea>
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
  forVertical: { fontSize: 12, fontWeight: '800', marginTop: 1 },
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
