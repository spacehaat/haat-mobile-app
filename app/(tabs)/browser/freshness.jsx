import { useEffect, useMemo, useState } from 'react';
import {
  View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { Redirect } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { mobileApi } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import { canSeeFreshness } from '../../../lib/access';
import FreshBadge from '../../../components/ui/FreshBadge';
import ListPagination from '../../../components/ui/ListPagination';
import { DEFAULT_FRESHNESS_PAGE_SIZE } from '../../../constants/pagination';
import { colors } from '../../../constants/theme';

export default function FreshnessScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [verifyingId, setVerifyingId] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_FRESHNESS_PAGE_SIZE);

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => mobileApi.getDashboardStats(),
  });

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['freshness-stale'],
    queryFn: async () => {
      const [stale, expired] = await Promise.all([
        mobileApi.listListings({ fresh: 'stale', limit: 50, page: 1 }),
        mobileApi.listListings({ fresh: 'expired', limit: 50, page: 1 }),
      ]);
      const items = [...(stale.items || []), ...(expired.items || [])]
        .map((l) => ({ ...l, id: l.id || l._id }))
        .sort((a, b) => (b.fresh?.days || 0) - (a.fresh?.days || 0));
      return items;
    },
    enabled: canSeeFreshness(user),
  });

  const verifyMutation = useMutation({
    mutationFn: (id) => mobileApi.verifyListing(id),
    onMutate: (id) => setVerifyingId(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['freshness-stale'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (err) => Alert.alert('Verify failed', err.message),
    onSettled: () => setVerifyingId(null),
  });

  const listings = data || [];
  const listTotal = listings.length;
  const pageCount = Math.max(1, Math.ceil(listTotal / pageSize));
  const currentPage = Math.min(page, pageCount);

  const pagedListings = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return listings.slice(start, start + pageSize);
  }, [listings, currentPage, pageSize]);

  const counts = useMemo(() => ({
    fresh: stats?.listings?.fresh ?? 0,
    stale: stats?.listings?.stale ?? 0,
    expired: stats?.listings?.expired ?? 0,
  }), [stats]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  if (!canSeeFreshness(user)) return <Redirect href="/(tabs)" />;

  return (
    <View style={styles.screen}>
      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Freshness overview</Text>
        <View style={styles.bar}>
          <View style={[styles.segFresh, { flex: counts.fresh }]} />
          <View style={[styles.segStale, { flex: counts.stale }]} />
          <View style={[styles.segExpired, { flex: counts.expired }]} />
        </View>
        <View style={styles.legend}>
          <Text style={styles.legendItem}>Fresh {counts.fresh}</Text>
          <Text style={styles.legendItem}>Stale {counts.stale}</Text>
          <Text style={styles.legendItem}>Expired {counts.expired}</Text>
        </View>
        <Text style={styles.pct}>{stats?.listings?.freshPct ?? 0}% fresh inventory</Text>
      </View>

      <FlatList
        data={pagedListings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.brand} />}
        ListHeaderComponent={(
          <Text style={styles.listTitle}>Needs re-verification ({listTotal})</Text>
        )}
        ListFooterComponent={(
          <ListPagination
            page={currentPage}
            pageCount={pageCount}
            total={listTotal}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
            disabled={isLoading}
          />
        )}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.rowBody}>
              <Text style={styles.name}>{item.operator}</Text>
              <Text style={styles.sub}>{item.micro}, {item.city} · {item.seats} seats</Text>
              <FreshBadge fresh={item.fresh} compact />
            </View>
            <Pressable
              style={[styles.verifyBtn, verifyingId === item.id && styles.verifyBtnOff]}
              disabled={verifyingId === item.id}
              onPress={() => verifyMutation.mutate(item.id)}
            >
              {verifyingId === item.id ? (
                <ActivityIndicator color={colors.brand} size="small" />
              ) : (
                <Ionicons name="checkmark-circle-outline" size={22} color={colors.brand} />
              )}
            </Pressable>
          </View>
        )}
        ListEmptyComponent={(
          <View style={styles.empty}>
            {isLoading ? <ActivityIndicator color={colors.brand} /> : (
              <>
                <Ionicons name="checkmark-circle" size={36} color={colors.success} />
                <Text style={styles.emptyText}>All listings are fresh!</Text>
              </>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface2 },
  summary: {
    margin: 12, marginBottom: 0, backgroundColor: colors.surface, borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: colors.border,
  },
  summaryTitle: { fontSize: 13, fontWeight: '700', color: colors.ink, marginBottom: 10 },
  bar: { flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', marginBottom: 8 },
  segFresh: { backgroundColor: '#2e9e5b' },
  segStale: { backgroundColor: '#a86408' },
  segExpired: { backgroundColor: '#d14343' },
  legend: { flexDirection: 'row', gap: 12, marginBottom: 4 },
  legendItem: { fontSize: 11, color: colors.muted, fontWeight: '600' },
  pct: { fontSize: 12, color: colors.faint },
  list: { padding: 12, paddingBottom: 32 },
  listTitle: {
    fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase',
    color: colors.faint, marginBottom: 10,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.surface, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: colors.border, marginBottom: 8,
  },
  rowBody: { flex: 1, gap: 4 },
  name: { fontSize: 14, fontWeight: '700', color: colors.ink },
  sub: { fontSize: 12, color: colors.muted },
  verifyBtn: { padding: 8 },
  verifyBtnOff: { opacity: 0.5 },
  empty: { padding: 40, alignItems: 'center', gap: 10 },
  emptyText: { color: colors.muted, fontWeight: '600' },
});
