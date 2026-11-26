import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, TextInput, FlatList, Pressable, StyleSheet, ActivityIndicator, RefreshControl, ScrollView, Linking,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { mobileApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { cityOptionsForUser, isAdmin } from '../../lib/access';
import { formatRupees } from '../../lib/expenses';
import ListPagination from '../ui/ListPagination';
import { DEFAULT_PAGE_SIZE, VERTICALS } from '../../constants/inventory';
import { colors } from '../../constants/theme';

const V = VERTICALS['virtual-office'];
const STATUSES = [
  { key: '', label: 'All' },
  { key: 'Active', label: 'Active' },
  { key: 'Inactive', label: 'Inactive' },
];
const SORTS = [
  { key: '', label: 'City' },
  { key: 'sellingPriceInr', label: 'Lowest price' },
  { key: 'updated_on', label: 'Recently updated', orderBy: '-1' },
];

function VoCard({ vo, showCost }) {
  const amenities = (vo.amenityList || []).slice(0, 3);
  const more = (vo.amenityList || []).length - amenities.length;
  return (
    <Pressable style={styles.card} onPress={() => router.push(`/(tabs)/browser/vo/${vo.id}`)}>
      <View style={styles.cardTop}>
        <View style={[styles.cardIcon, { backgroundColor: V.soft }]}>
          <Ionicons name="mail-outline" size={18} color={V.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>{vo.spaceName}</Text>
          <Text style={styles.place} numberOfLines={1}>{[vo.locality, vo.city].filter(Boolean).join(', ')}</Text>
        </View>
        {!vo.isActive ? (
          <View style={styles.inactive}><Text style={styles.inactiveText}>Inactive</Text></View>
        ) : null}
      </View>

      <View style={styles.priceRow}>
        <View style={{ flex: 1 }}>
          {vo.sellingPriceInr ? (
            <>
              <Text style={styles.price}>{formatRupees(vo.sellingPriceInr)}<Text style={styles.per}> / year</Text></Text>
              <Text style={styles.sub}>
                {formatRupees(vo.sellingMonthlyPriceInr)} / month
                {showCost && vo.annualPriceInr ? `  ·  cost ${formatRupees(vo.annualPriceInr)}` : ''}
              </Text>
            </>
          ) : (
            <Text style={styles.noPrice}>Price on request</Text>
          )}
        </View>
        {vo.couponCode ? (
          <View style={styles.coupon}>
            <Ionicons name="pricetag" size={12} color="#9A5B00" />
            <Text style={styles.couponText}>{vo.couponCode} · {vo.couponPercentage}%</Text>
          </View>
        ) : null}
        {vo.phoneNumber ? (
          <Pressable
            style={styles.call}
            hitSlop={8}
            onPress={() => Linking.openURL(`tel:${vo.phoneNumber.replace(/\s/g, '')}`)}
            accessibilityLabel={`Call ${vo.spaceName}`}
          >
            <Ionicons name="call" size={16} color={V.color} />
          </Pressable>
        ) : null}
      </View>

      {amenities.length ? (
        <View style={styles.tags}>
          {amenities.map((a) => <Text key={a} style={styles.tag}>{a}</Text>)}
          {more > 0 ? <Text style={styles.tagMore}>+{more}</Text> : null}
        </View>
      ) : null}
    </Pressable>
  );
}

/** Inventory › Virtual: the virtual office list, with the section switcher passed in as `header`. */
export default function VirtualOfficeList({ header }) {
  const { user } = useAuth();
  const admin = isAdmin(user);
  const cityOptions = useMemo(() => cityOptionsForUser(user), [user]);
  const [city, setCity] = useState('All cities');
  const [status, setStatus] = useState('Active');
  const [sort, setSort] = useState(SORTS[0]);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);
  useEffect(() => { setPage(1); }, [city, status, sort, debounced, pageSize]);

  const filters = {
    page,
    limit: pageSize,
    search: debounced,
    city: city === 'All cities' ? '' : city,
    status,
    sortBy: sort.key,
    orderBy: sort.orderBy || '1',
  };
  const { data, isLoading, isRefetching, refetch, error } = useQuery({
    queryKey: ['virtual-offices', filters],
    queryFn: () => mobileApi.listVirtualOffices(filters),
    placeholderData: (prev) => prev,
  });
  // Cities that have virtual offices, so the chips aren't a list of empty cities.
  const { data: stats } = useQuery({
    queryKey: ['virtual-offices', 'stats'],
    queryFn: () => mobileApi.getVirtualOfficeStats(),
    staleTime: 5 * 60 * 1000,
  });
  const cityChips = useMemo(() => {
    const withVo = (stats?.cities || []).map((c) => c.city);
    return admin && withVo.length ? ['All cities', ...withVo] : cityOptions;
  }, [stats, cityOptions, admin]);

  const items = data?.items || [];
  const total = data?.total || 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const renderItem = useCallback(({ item }) => <VoCard vo={item} showCost={admin} />, [admin]);

  const listHeader = (
    <View style={styles.header}>
      {header}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={colors.muted} style={styles.searchIcon} />
        <TextInput
          style={styles.search}
          placeholder="Search space, locality, amenity…"
          placeholderTextColor={colors.faint}
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {STATUSES.map((s) => {
          const on = status === s.key;
          return (
            <Pressable key={s.label} style={[styles.statusTab, on && { backgroundColor: V.color, borderColor: V.color }]} onPress={() => setStatus(s.key)}>
              <Text style={[styles.statusText, on && { color: '#fff' }]}>{s.label}</Text>
            </Pressable>
          );
        })}
        <View style={styles.divider} />
        {SORTS.map((s) => {
          const on = sort.key === s.key;
          return (
            <Pressable key={s.label} style={[styles.statusTab, on && styles.sortOn]} onPress={() => setSort(s)}>
              {on ? <Ionicons name="swap-vertical" size={13} color={colors.ink} /> : null}
              <Text style={[styles.statusText, on && { fontWeight: '800' }]}>{s.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {cityChips.map((c) => {
          const on = city === c;
          return (
            <Pressable key={c} style={[styles.chip, on && { backgroundColor: V.soft, borderColor: V.color }]} onPress={() => setCity(c)}>
              {c === 'All cities' ? <Ionicons name="location-outline" size={13} color={on ? V.color : colors.muted} /> : null}
              <Text style={[styles.chipText, on && { color: V.color, fontWeight: '800' }]}>{c}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={styles.count}>
        {isLoading ? 'Loading virtual offices…' : `${total.toLocaleString('en-IN')} ${total === 1 ? V.one : V.many}`}
      </Text>
      {error ? <Text style={styles.error}>{error.message}</Text> : null}
    </View>
  );

  return (
    <FlatList
      style={{ flex: 1 }}
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      ListHeaderComponent={listHeader}
      contentContainerStyle={styles.listContent}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={V.color} />}
      ListEmptyComponent={(
        <View style={styles.empty}>
          {isLoading ? <ActivityIndicator color={V.color} /> : (
            <>
              <Ionicons name="mail-open-outline" size={32} color={colors.faint} />
              <Text style={styles.emptyTitle}>No virtual offices found</Text>
              <Text style={styles.emptyText}>Try another city or status.</Text>
            </>
          )}
        </View>
      )}
      ListFooterComponent={(
        <ListPagination
          page={page}
          pageCount={pageCount}
          total={total}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
          disabled={isLoading}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  listContent: { paddingHorizontal: 14, paddingBottom: 24, flexGrow: 1, gap: 10 },
  header: { paddingTop: 10, paddingBottom: 2 },
  searchWrap: { position: 'relative', marginBottom: 10 },
  searchIcon: { position: 'absolute', left: 14, top: 14, zIndex: 1 },
  search: {
    backgroundColor: colors.surface, borderRadius: 14, paddingVertical: 12, paddingLeft: 40, paddingRight: 12,
    fontSize: 15, color: colors.ink, borderWidth: 1, borderColor: colors.border,
  },
  chips: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 10, paddingRight: 12 },
  statusTab: {
    flexDirection: 'row', alignItems: 'center', gap: 4, height: 34, paddingHorizontal: 12,
    borderRadius: 11, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  sortOn: { backgroundColor: '#E9E6E0', borderColor: '#D6D2CA' },
  statusText: { fontSize: 13, fontWeight: '700', color: colors.ink },
  divider: { width: 1, height: 20, backgroundColor: colors.border },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4, height: 32, paddingHorizontal: 12, borderRadius: 999,
    borderWidth: 1, borderColor: colors.border,
  },
  chipText: { fontSize: 12.5, fontWeight: '600', color: colors.muted },
  count: { fontSize: 13, fontWeight: '700', color: colors.ink, marginBottom: 8, marginTop: 2 },
  error: { color: colors.danger, marginBottom: 8 },
  card: { backgroundColor: colors.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.border },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 15.5, fontWeight: '800', color: colors.ink },
  place: { fontSize: 12.5, color: colors.muted, marginTop: 1 },
  inactive: { backgroundColor: colors.surface2, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  inactiveText: { fontSize: 11, fontWeight: '700', color: colors.muted },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  price: { fontSize: 18, fontWeight: '800', color: colors.ink },
  per: { fontSize: 12, fontWeight: '600', color: colors.muted },
  sub: { fontSize: 12, color: colors.muted, marginTop: 1 },
  noPrice: { fontSize: 14, fontWeight: '700', color: colors.muted },
  coupon: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF4E0', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  couponText: { fontSize: 11, fontWeight: '800', color: '#9A5B00' },
  call: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: V.soft },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  tag: { fontSize: 11.5, color: colors.ink, backgroundColor: colors.surface2, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, overflow: 'hidden' },
  tagMore: { fontSize: 11.5, color: colors.muted, paddingVertical: 3 },
  empty: { padding: 40, alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: colors.ink },
  emptyText: { color: colors.muted, textAlign: 'center' },
});
