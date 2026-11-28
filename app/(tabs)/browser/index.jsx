import { useCallback, useMemo, useState, useEffect } from 'react';
import {
  View, Text, TextInput, FlatList, Pressable, StyleSheet,
  ActivityIndicator, RefreshControl, ScrollView, Alert,
} from 'react-native';
import { router, useNavigation } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { mobileApi } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import { useProposal } from '../../../context/ProposalContext';
import {
  cityOptionsForUser, canSeeFreshness, canSeeProposalBuilder, canManageInventory, inventoryModules,
} from '../../../lib/access';
import ListingCard from '../../../components/ui/ListingCard';
import InventoryFiltersModal, { INITIAL_FILTER } from '../../../components/ui/InventoryFiltersModal';
import ListPagination from '../../../components/ui/ListPagination';
import VirtualOfficeList from '../../../components/virtual-office/VirtualOfficeList';
import {
  buildListingFilters, countActiveFilters, normalizeListing, DEFAULT_PAGE_SIZE,
  LISTING_STATUSES, STATUS_COLORS, VERTICALS, VERTICAL_LIST,
} from '../../../constants/inventory';
import { colors } from '../../../constants/theme';

export default function BrowserScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const {
    isInProposal, addToProposal, removeFromProposal, proposalCount,
  } = useProposal();
  const showProposal = canSeeProposalBuilder(user);

  const cityOptions = useMemo(() => cityOptionsForUser(user), [user]);
  // Only the sections this user's space types open (admins see all).
  const sections = useMemo(() => {
    const allowed = new Set(inventoryModules(user));
    return VERTICAL_LIST.filter((v) => allowed.has(v.key));
  }, [user]);
  const [picked, setPicked] = useState(null);
  const vertical = sections.some((v) => v.key === picked) ? picked : sections[0]?.key || 'coworking';
  const noSections = sections.length === 0;
  const V = VERTICALS[vertical];
  const isVo = vertical === 'virtual-office';
  const [city, setCity] = useState('All cities');
  const [status, setStatus] = useState('all');
  const [bFilter, setBFilter] = useState(INITIAL_FILTER);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [view, setView] = useState('grid');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const activeFilterCount = countActiveFilters(bFilter);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerRight}>
          {showProposal && proposalCount > 0 ? (
            <Pressable
              onPress={() => router.push('/(tabs)/proposals/builder')}
              style={styles.propBadge}
            >
              <Ionicons name="document-text" size={16} color="#fff" />
              <Text style={styles.propBadgeText}>{proposalCount}</Text>
            </Pressable>
          ) : null}
          {canSeeFreshness(user) ? (
            <Pressable
              onPress={() => router.push('/(tabs)/browser/freshness')}
              style={styles.headerIcon}
            >
              <Ionicons name="leaf-outline" size={24} color={colors.brand} />
            </Pressable>
          ) : null}
          {canManageInventory(user) && !noSections ? (
            <Pressable onPress={() => router.push(isVo ? '/(tabs)/browser/vo/edit' : `/(tabs)/browser/add?vertical=${vertical}`)} style={[styles.addBtn, { backgroundColor: V.color }]} hitSlop={6}>
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.addBtnText}>Add</Text>
            </Pressable>
          ) : null}
        </View>
      ),
    });
  }, [navigation, user, proposalCount, showProposal, vertical, V.color, isVo, noSections]);

  const onSearchChange = useCallback((text) => {
    setSearch(text);
    setPage(1);
    clearTimeout(onSearchChange._t);
    onSearchChange._t = setTimeout(() => setDebouncedSearch(text.trim()), 350);
  }, []);

  useEffect(() => { setPage(1); }, [bFilter, city, status, debouncedSearch, pageSize, vertical]);

  const queryKey = useMemo(
    () => ['listings', vertical, page, pageSize, city, status, bFilter, debouncedSearch],
    [vertical, page, pageSize, city, status, bFilter, debouncedSearch],
  );

  const { data, isLoading, isRefetching, refetch, error } = useQuery({
    queryKey,
    queryFn: () => mobileApi.listListings(buildListingFilters(bFilter, city, debouncedSearch, page, pageSize, status, vertical)),
    placeholderData: (prev) => prev,
    enabled: !isVo && !noSections,
  });
  const { data: meta } = useQuery({
    queryKey: ['listings-meta'],
    queryFn: () => mobileApi.getListingsMeta(),
    staleTime: 10 * 60 * 1000,
  });
  const counts = data?.statusCounts || {};

  const items = (data?.items || []).map(normalizeListing);
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const toggleProposal = async (id, listing) => {
    try {
      if (isInProposal(id)) {
        await removeFromProposal(id);
      } else {
        const result = await addToProposal(id, listing);
        if (result.reason === 'already') {
          Alert.alert('Already added', 'This space is already in your proposal.');
        }
      }
    } catch (err) {
      Alert.alert('Proposal', err.message || 'Could not update proposal');
    }
  };

  const switchVertical = (key) => {
    if (key === vertical) return;
    setPicked(key);
    setBFilter(INITIAL_FILTER);
    setStatus('all');
  };

  // One section only: no switch, just that section.
  const verticalSwitch = sections.length < 2 ? null : (
      <View style={styles.vSwitch}>
        {sections.map((v) => {
          const on = v.key === vertical;
          return (
            <Pressable
              key={v.key}
              onPress={() => switchVertical(v.key)}
              style={[styles.vCard, on && { backgroundColor: v.color, borderColor: v.color }]}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
            >
              <View style={[styles.vIcon, { backgroundColor: on ? 'rgba(255,255,255,0.2)' : v.soft }]}>
                <Ionicons name={on ? v.icon : `${v.icon}-outline`} size={18} color={on ? '#fff' : v.color} />
              </View>
              <View style={{ alignSelf: 'stretch' }}>
                <Text style={[styles.vLabel, on && { color: '#fff' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>{v.short || v.plural}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
  );

  const listHeader = (
    <View style={styles.header}>
      {verticalSwitch}

      <View style={styles.searchRow}>
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={colors.muted} style={styles.searchIcon} />
          <TextInput
            style={styles.search}
            placeholder={vertical === 'managed-office' ? 'Search office, building, area, city…'
              : vertical === 'private-office' ? 'Search office, building, area, city…'
                : vertical === 'coliving' ? 'Search PG name, area, city, PG id…' : 'Search space, brand, area, city…'}
            placeholderTextColor={colors.faint}
            value={search}
            onChangeText={onSearchChange}
            clearButtonMode="while-editing"
          />
        </View>
        <Pressable style={[styles.filterBtn, activeFilterCount > 0 && styles.filterBtnOn]} onPress={() => setFiltersOpen(true)}>
          <Ionicons name="options-outline" size={20} color={activeFilterCount > 0 ? '#fff' : colors.ink} />
          {activeFilterCount > 0 ? (
            <View style={styles.filterDot}><Text style={styles.filterDotText}>{activeFilterCount}</Text></View>
          ) : null}
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusRow}>
        {LISTING_STATUSES.filter((s) => !(vertical === 'coliving' && s.key === 'pending')).map((s) => {
          const on = status === s.key;
          const tone = STATUS_COLORS[s.key];
          const n = counts[s.key];
          return (
            <Pressable
              key={s.key}
              onPress={() => setStatus(s.key)}
              style={[styles.statusTab, on && { backgroundColor: tone ? tone.text : colors.ink, borderColor: tone ? tone.text : colors.ink }]}
            >
              {tone ? <View style={[styles.statusDot, { backgroundColor: on ? '#fff' : tone.text }]} /> : null}
              <Text style={[styles.statusText, on && { color: '#fff' }]}>{s.label}</Text>
              {n != null ? (
                <View style={[styles.statusCount, on && { backgroundColor: 'rgba(255,255,255,0.22)' }]}>
                  <Text style={[styles.statusCountText, on && { color: '#fff' }]}>{n}</Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {cityOptions.map((c) => (
          <Pressable
            key={c}
            style={[styles.chip, city === c && { backgroundColor: V.soft, borderColor: V.color }]}
            onPress={() => { setCity(c); setPage(1); }}
          >
            {c === 'All cities' ? <Ionicons name="location-outline" size={13} color={city === c ? V.color : colors.muted} /> : null}
            <Text style={[styles.chipText, city === c && { color: V.color, fontWeight: '800' }]}>{c}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.toolbar}>
        <Text style={styles.count}>
          {isLoading ? `Loading ${V.many}…` : `${total.toLocaleString('en-IN')} ${total === 1 ? V.one : V.many}`}
        </Text>
        <View style={styles.viewToggle}>
          <Pressable style={[styles.viewBtn, view === 'grid' && styles.viewBtnOn]} onPress={() => setView('grid')}>
            <Ionicons name="albums-outline" size={16} color={view === 'grid' ? colors.ink : colors.muted} />
          </Pressable>
          <Pressable style={[styles.viewBtn, view === 'table' && styles.viewBtnOn]} onPress={() => setView('table')}>
            <Ionicons name="list-outline" size={16} color={view === 'table' ? colors.ink : colors.muted} />
          </Pressable>
        </View>
      </View>

      {error ? <Text style={styles.error}>{error.message}</Text> : null}
    </View>
  );

  if (noSections) {
    return (
      <View style={styles.noAccess}>
        <Ionicons name="lock-closed-outline" size={36} color={colors.faint} />
        <Text style={styles.noAccessTitle}>No inventory sections yet</Text>
        <Text style={styles.noAccessText}>
          Your account has no space types assigned. Ask an admin to give you Coworking, Managed office, Private office, PG or Virtual office access.
        </Text>
      </View>
    );
  }

  if (isVo) {
    return (
      <View style={styles.screen}>
        <VirtualOfficeList header={verticalSwitch} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        style={styles.list}
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ListingCard
            listing={item}
            compact={view === 'table'}
            showProposalAction={showProposal && vertical !== 'coliving'}
            inProposal={isInProposal(item.id)}
            onToggleProposal={toggleProposal}
            onPress={(id) => {
              if (!id) return;
              router.push(`/(tabs)/browser/${encodeURIComponent(String(id))}`);
            }}
          />
        )}
        ListHeaderComponent={listHeader}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.brand} />}
        ListEmptyComponent={(
          <View style={styles.empty}>
            {isLoading ? <ActivityIndicator color={colors.brand} /> : (
              <>
                <Ionicons name="search-outline" size={32} color={colors.faint} />
                <Text style={styles.emptyTitle}>No {V.many} found</Text>
                <Text style={styles.emptyText}>Try another city, status or fewer filters.</Text>
              </>
            )}
          </View>
        )}
        ListFooterComponent={(
          <ListPagination
            page={page}
            pageCount={totalPages}
            total={total}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
            disabled={isLoading}
          />
        )}
      />

      <InventoryFiltersModal
        visible={filtersOpen}
        filter={bFilter}
        onChange={setBFilter}
        onClose={() => setFiltersOpen(false)}
        onReset={() => setBFilter(INITIAL_FILTER)}
        amenityOptions={meta?.amenities}
        vertical={vertical}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface2 },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 14, paddingBottom: 24, flexGrow: 1 },
  header: { paddingTop: 10, paddingBottom: 6 },
  headerRight: { flexDirection: 'row', alignItems: 'center', marginRight: 8, gap: 4 },
  headerIcon: { padding: 4 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: colors.brand, borderRadius: 999, paddingLeft: 8, paddingRight: 11, paddingVertical: 6, marginLeft: 4 },
  addBtnText: { color: '#fff', fontWeight: '800', fontSize: 13.5 },
  propBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.brand, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, marginRight: 4,
  },
  propBadgeText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  vSwitch: { flexDirection: 'row', gap: 5, marginBottom: 12 },
  vCard: {
    flex: 1, alignItems: 'center', gap: 4, paddingVertical: 8, paddingHorizontal: 3, borderRadius: 14,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  vIcon: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  vLabel: { fontSize: 12.5, fontWeight: '800', color: colors.ink, textAlign: 'center' },
  vBlurb: { fontSize: 10.5, color: colors.muted, marginTop: 1 },
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  searchWrap: { flex: 1, position: 'relative' },
  searchIcon: { position: 'absolute', left: 14, top: 14, zIndex: 1 },
  search: {
    backgroundColor: colors.surface, borderRadius: 14, paddingVertical: 12, paddingLeft: 40, paddingRight: 12,
    fontSize: 15, color: colors.ink, borderWidth: 1, borderColor: colors.border,
  },
  filterBtn: {
    width: 46, height: 46, borderRadius: 14, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  filterBtnOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  filterDot: {
    position: 'absolute', top: -5, right: -5, backgroundColor: colors.brand,
    minWidth: 19, height: 19, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.surface2,
  },
  filterDotText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  statusRow: { gap: 8, paddingBottom: 10, paddingRight: 12 },
  noAccess: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 10, backgroundColor: colors.surface2 },
  noAccessTitle: { fontSize: 17, fontWeight: '800', color: colors.ink },
  noAccessText: { fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 20 },
  statusTab: {
    flexDirection: 'row', alignItems: 'center', gap: 6, height: 38, paddingHorizontal: 13,
    borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 13, fontWeight: '700', color: colors.ink },
  statusCount: { minWidth: 22, paddingHorizontal: 6, height: 20, borderRadius: 10, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  statusCountText: { fontSize: 11, fontWeight: '800', color: colors.muted },
  chips: { flexDirection: 'row', gap: 8, paddingBottom: 10, paddingRight: 12 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    height: 32, paddingHorizontal: 12, borderRadius: 999, backgroundColor: 'transparent',
    borderWidth: 1, borderColor: colors.border,
  },
  chipOn: { backgroundColor: colors.brandSoft, borderColor: colors.brand },
  chipText: { fontSize: 12.5, fontWeight: '600', color: colors.muted },
  chipTextOn: { color: colors.brandInk, fontWeight: '800' },
  toolbar: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, marginTop: 2 },
  count: { flex: 1, fontSize: 13, fontWeight: '700', color: colors.ink },
  viewToggle: { flexDirection: 'row', backgroundColor: '#E9E6E0', borderRadius: 10, padding: 3 },
  viewBtn: { width: 34, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  viewBtnOn: { backgroundColor: colors.surface },
  error: { color: colors.danger, marginBottom: 8 },
  empty: { padding: 40, alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: colors.ink },
  emptyText: { color: colors.muted, textAlign: 'center' },
});
