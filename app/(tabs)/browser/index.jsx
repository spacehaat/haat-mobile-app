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
  cityOptionsForUser, canSeeFreshness, defaultCityForUser, canSeeProposalBuilder,
  canManageInventory,
} from '../../../lib/access';
import ListingCard from '../../../components/ui/ListingCard';
import InventoryFiltersModal, { INITIAL_FILTER } from '../../../components/ui/InventoryFiltersModal';
import {
  buildListingFilters, countActiveFilters, normalizeListing, PAGE_SIZE,
} from '../../../constants/inventory';
import { colors } from '../../../constants/theme';

export default function BrowserScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const {
    isInProposal, addToProposal, removeFromProposal, proposalCount,
  } = useProposal();
  const showProposal = canSeeProposalBuilder(user);
  const canEdit = canManageInventory(user);

  const cityOptions = useMemo(() => cityOptionsForUser(user), [user]);
  const [city, setCity] = useState(() => {
    const opts = cityOptionsForUser(user);
    if (opts.includes(defaultCityForUser(user))) return defaultCityForUser(user);
    return opts[0] || 'All cities';
  });
  const [bFilter, setBFilter] = useState(INITIAL_FILTER);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [view, setView] = useState('grid');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

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
          {canEdit ? (
            <Pressable
              onPress={() => router.push('/(tabs)/browser/new')}
              style={styles.headerIcon}
            >
              <Ionicons name="add-circle-outline" size={26} color={colors.brand} />
            </Pressable>
          ) : null}
        </View>
      ),
    });
  }, [navigation, user, proposalCount, showProposal, canEdit]);

  const onSearchChange = useCallback((text) => {
    setSearch(text);
    setPage(1);
    clearTimeout(onSearchChange._t);
    onSearchChange._t = setTimeout(() => setDebouncedSearch(text.trim()), 350);
  }, []);

  useEffect(() => { setPage(1); }, [bFilter, city, debouncedSearch]);

  const queryKey = useMemo(
    () => ['listings', page, city, bFilter, debouncedSearch],
    [page, city, bFilter, debouncedSearch],
  );

  const { data, isLoading, isRefetching, refetch, error } = useQuery({
    queryKey,
    queryFn: () => mobileApi.listListings(buildListingFilters(bFilter, city, debouncedSearch, page)),
  });

  const items = (data?.items || []).map(normalizeListing);
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

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

  const listHeader = (
    <View style={styles.header}>
      <View style={styles.searchRow}>
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={colors.muted} style={styles.searchIcon} />
          <TextInput
            style={styles.search}
            placeholder="Search operator, location, type…"
            placeholderTextColor={colors.faint}
            value={search}
            onChangeText={onSearchChange}
            clearButtonMode="while-editing"
          />
        </View>
        <Pressable style={styles.filterBtn} onPress={() => setFiltersOpen(true)}>
          <Ionicons name="options-outline" size={20} color={colors.ink} />
          {activeFilterCount > 0 ? (
            <View style={styles.filterDot}><Text style={styles.filterDotText}>{activeFilterCount}</Text></View>
          ) : null}
        </Pressable>
      </View>

      <View style={styles.toolbar}>
        <Pressable style={[styles.viewBtn, view === 'grid' && styles.viewBtnOn]} onPress={() => setView('grid')}>
          <Ionicons name="grid-outline" size={16} color={view === 'grid' ? '#fff' : colors.muted} />
        </Pressable>
        <Pressable style={[styles.viewBtn, view === 'table' && styles.viewBtnOn]} onPress={() => setView('table')}>
          <Ionicons name="list-outline" size={16} color={view === 'table' ? '#fff' : colors.muted} />
        </Pressable>
        {total > 0 ? <Text style={styles.count}>{total} listings</Text> : null}
      </View>

      <Text style={styles.filterLabel}>City</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {cityOptions.map((c) => (
          <Pressable
            key={c}
            style={[styles.chip, city === c && styles.chipOn]}
            onPress={() => { setCity(c); setPage(1); }}
          >
            <Text style={[styles.chipText, city === c && styles.chipTextOn]}>{c}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {error ? <Text style={styles.error}>{error.message}</Text> : null}
    </View>
  );

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
            showProposalAction={showProposal}
            inProposal={isInProposal(item.id)}
            onToggleProposal={toggleProposal}
            onPress={(id) => router.push({ pathname: '/(tabs)/browser/[id]', params: { id: String(id) } })}
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
                <Text style={styles.emptyText}>No listings match your filters.</Text>
              </>
            )}
          </View>
        )}
        ListFooterComponent={totalPages > 1 ? (
          <View style={styles.pagination}>
            <Pressable style={[styles.pageBtn, page <= 1 && styles.pageBtnOff]} disabled={page <= 1} onPress={() => setPage((p) => p - 1)}>
              <Text style={styles.pageBtnText}>Previous</Text>
            </Pressable>
            <Text style={styles.pageInfo}>{page} / {totalPages}</Text>
            <Pressable style={[styles.pageBtn, page >= totalPages && styles.pageBtnOff]} disabled={page >= totalPages} onPress={() => setPage((p) => p + 1)}>
              <Text style={styles.pageBtnText}>Next</Text>
            </Pressable>
          </View>
        ) : null}
      />

      <InventoryFiltersModal
        visible={filtersOpen}
        filter={bFilter}
        onChange={setBFilter}
        onClose={() => setFiltersOpen(false)}
        onReset={() => setBFilter(INITIAL_FILTER)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface2 },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 12, paddingBottom: 24, flexGrow: 1 },
  header: { paddingTop: 8, paddingBottom: 4 },
  headerRight: { flexDirection: 'row', alignItems: 'center', marginRight: 8, gap: 4 },
  headerIcon: { padding: 4 },
  propBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.brand, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, marginRight: 4,
  },
  propBadgeText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  searchWrap: { flex: 1, position: 'relative' },
  searchIcon: { position: 'absolute', left: 12, top: 13, zIndex: 1 },
  search: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, paddingVertical: 11, paddingLeft: 38, paddingRight: 12,
    fontSize: 15, color: colors.ink,
  },
  filterBtn: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  filterDot: {
    position: 'absolute', top: -4, right: -4, backgroundColor: colors.brand,
    minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center',
  },
  filterDotText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  viewBtn: {
    width: 34, height: 34, borderRadius: 8, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  viewBtnOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  count: { fontSize: 12, color: colors.muted, marginLeft: 'auto' },
  filterLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase',
    color: colors.faint, marginBottom: 8, marginTop: 4,
  },
  chips: { flexDirection: 'row', gap: 8, paddingBottom: 8, paddingRight: 12 },
  chip: {
    minHeight: 34, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, justifyContent: 'center',
  },
  chipOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.ink },
  chipTextOn: { color: '#fff' },
  error: { color: colors.danger, marginBottom: 8 },
  empty: { padding: 40, alignItems: 'center', gap: 10 },
  emptyText: { color: colors.muted, textAlign: 'center' },
  pagination: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12,
  },
  pageBtn: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  pageBtnOff: { opacity: 0.4 },
  pageBtnText: { fontWeight: '600', color: colors.ink, fontSize: 13 },
  pageInfo: { color: colors.muted, fontSize: 13 },
});
