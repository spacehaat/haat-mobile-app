import { useCallback, useMemo, useState } from 'react';
import {
  View, Text, TextInput, FlatList, Pressable, StyleSheet,
  ActivityIndicator, RefreshControl, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { mobileApi } from '../../../lib/api';
import { formatDate, leadSubtitle } from '../../../lib/format';
import { PAGE_SIZE, STAGES } from '../../../constants/leads';
import StageBadge from '../../../components/ui/StageBadge';
import { colors } from '../../../constants/theme';
import { initials } from '@spacehaat/utils';

function StageFilters({ stage, onChange }) {
  return (
    <View style={styles.filterBlock}>
      <Text style={styles.filterLabel}>Stage</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
        keyboardShouldPersistTaps="handled"
      >
        {STAGES.map(([value, label]) => {
          const active = stage === value;
          return (
            <Pressable
              key={value || 'all'}
              style={[styles.chip, active && styles.chipOn]}
              onPress={() => onChange(value)}
              hitSlop={6}
            >
              <Text style={[styles.chipText, active && styles.chipTextOn]}>{label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default function LeadsListScreen() {
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState('');
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const onSearchChange = useCallback((text) => {
    setSearch(text);
    setPage(1);
    clearTimeout(onSearchChange._t);
    onSearchChange._t = setTimeout(() => setDebouncedSearch(text.trim()), 350);
  }, []);

  const queryKey = useMemo(() => ['leads', page, debouncedSearch, stage], [page, debouncedSearch, stage]);

  const { data, isLoading, isRefetching, refetch, error } = useQuery({
    queryKey,
    queryFn: () => mobileApi.listLeads({
      page,
      limit: PAGE_SIZE,
      search: debouncedSearch,
      stage,
    }),
  });

  const items = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const onStageChange = useCallback((value) => {
    setStage(value);
    setPage(1);
  }, []);

  const renderItem = ({ item }) => (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/(tabs)/leads/${item.id}`)}
    >
      <View style={styles.cardTop}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{initials(item.name || item.company)}</Text></View>
        <View style={styles.cardBody}>
          <Text style={styles.name}>{item.name || item.company || 'Unnamed lead'}</Text>
          {leadSubtitle(item) ? <Text style={styles.sub}>{leadSubtitle(item)}</Text> : null}
        </View>
        <StageBadge stage={item.stage} compact />
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.meta}>{formatDate(item.leadDate)}</Text>
        {item.assigneeName ? <Text style={styles.meta}> · {item.assigneeName}</Text> : null}
      </View>
    </Pressable>
  );

  const listHeader = (
    <View style={styles.header}>
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={colors.muted} style={styles.searchIcon} />
        <TextInput
          style={styles.search}
          placeholder="Search leads…"
          placeholderTextColor={colors.faint}
          value={search}
          onChangeText={onSearchChange}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      <StageFilters stage={stage} onChange={onStageChange} />

      {error ? <Text style={styles.error}>{error.message}</Text> : null}
      {stage ? (
        <Pressable style={styles.clearFilter} onPress={() => onStageChange('')}>
          <Ionicons name="close-circle" size={14} color={colors.brand} />
          <Text style={styles.clearFilterText}>Clear stage filter</Text>
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <View style={styles.screen}>
      <FlatList
        style={styles.list}
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.brand} />}
        ListEmptyComponent={(
          <View style={styles.empty}>
            {isLoading ? <ActivityIndicator color={colors.brand} /> : (
              <>
                <Text style={styles.emptyText}>No leads found</Text>
                {stage || debouncedSearch ? (
                  <Text style={styles.emptyHint}>Try clearing filters or adjusting your search.</Text>
                ) : null}
              </>
            )}
          </View>
        )}
        ListFooterComponent={totalPages > 1 ? (
          <View style={styles.pagination}>
            <Pressable
              style={[styles.pageBtn, page <= 1 && styles.pageBtnOff]}
              disabled={page <= 1}
              onPress={() => setPage((p) => p - 1)}
            >
              <Text style={styles.pageBtnText}>Previous</Text>
            </Pressable>
            <Text style={styles.pageInfo}>{page} / {totalPages}</Text>
            <Pressable
              style={[styles.pageBtn, page >= totalPages && styles.pageBtnOff]}
              disabled={page >= totalPages}
              onPress={() => setPage((p) => p + 1)}
            >
              <Text style={styles.pageBtnText}>Next</Text>
            </Pressable>
          </View>
        ) : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface2 },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 12, paddingBottom: 24, flexGrow: 1 },
  header: { paddingTop: 8, paddingBottom: 4 },
  searchWrap: { marginBottom: 10, position: 'relative' },
  searchIcon: { position: 'absolute', left: 12, top: 13, zIndex: 1 },
  search: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 11,
    paddingLeft: 38,
    paddingRight: 12,
    fontSize: 15,
    color: colors.ink,
  },
  filterBlock: { marginBottom: 8 },
  filterLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.faint,
    marginBottom: 8,
  },
  filters: { flexDirection: 'row', alignItems: 'center', paddingRight: 12, gap: 8 },
  chip: {
    minHeight: 36,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
  },
  chipOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.ink },
  chipTextOn: { color: '#fff' },
  clearFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
    paddingVertical: 4,
  },
  clearFilterText: { fontSize: 13, fontWeight: '600', color: colors.brand },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  avatar: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: colors.brandSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: colors.brand, fontWeight: '800', fontSize: 14 },
  cardBody: { flex: 1, minWidth: 0 },
  name: { fontSize: 15, fontWeight: '700', color: colors.ink },
  sub: { marginTop: 2, fontSize: 12, color: colors.muted },
  metaRow: { flexDirection: 'row', marginTop: 10 },
  meta: { fontSize: 12, color: colors.muted },
  empty: { padding: 40, alignItems: 'center', gap: 8 },
  emptyText: { color: colors.muted, fontSize: 15, fontWeight: '600' },
  emptyHint: { color: colors.faint, fontSize: 13, textAlign: 'center' },
  error: { color: colors.danger, marginBottom: 8 },
  pagination: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, paddingHorizontal: 4,
  },
  pageBtn: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  pageBtnOff: { opacity: 0.4 },
  pageBtnText: { fontWeight: '600', color: colors.ink, fontSize: 13 },
  pageInfo: { color: colors.muted, fontSize: 13 },
});
