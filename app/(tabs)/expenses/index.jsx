import { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, SectionList, RefreshControl, ActivityIndicator, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../context/AuthContext';
import { isAdmin } from '../../../lib/access';
import { mobileApi } from '../../../lib/api';
import { currentMonth, dayLabel, formatRupees, monthLabel, shiftMonth } from '../../../lib/expenses';
import ExpenseRow from '../../../components/expenses/ExpenseRow';
import { colors } from '../../../constants/theme';

const QUICK_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'To pay back' },
  { key: 'company', label: 'Company paid' },
  { key: 'self', label: 'Self paid' },
  { key: 'other', label: 'Someone else' },
];

function filterParams(quick) {
  if (quick === 'pending') return { settled: 'pending' };
  if (quick === 'company' || quick === 'self' || quick === 'other') return { paidBy: quick };
  return {};
}

export default function ExpensesScreen() {
  const { user } = useAuth();
  const admin = isAdmin(user);
  const [month, setMonth] = useState(currentMonth());
  const [quick, setQuick] = useState('all');
  const [person, setPerson] = useState(null); // { key, name }
  const [category, setCategory] = useState(null); // { id, name }

  // "To pay back" looks at every month: money still owed is owed whenever it was spent.
  const monthParam = quick === 'pending' ? 'all' : month;
  const listParams = { month: monthParam, person: person?.key, categoryId: category?.id, ...filterParams(quick) };

  const summaryQ = useQuery({
    queryKey: ['expense-summary', month, person?.key || ''],
    queryFn: () => mobileApi.getExpenseSummary({ month, person: person?.key }),
  });

  const listQ = useInfiniteQuery({
    queryKey: ['expenses', listParams],
    queryFn: ({ pageParam }) => mobileApi.listExpenses({ ...listParams, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
  });

  const sections = useMemo(() => {
    const items = (listQ.data?.pages || []).flatMap((p) => p.items || []);
    const byDay = new Map();
    for (const e of items) {
      if (!byDay.has(e.date)) byDay.set(e.date, []);
      byDay.get(e.date).push(e);
    }
    return [...byDay.entries()].map(([date, data]) => ({
      date,
      total: data.reduce((s, e) => s + e.amount, 0),
      data,
    }));
  }, [listQ.data]);

  const summary = summaryQ.data;
  const maxCategory = Math.max(1, ...(summary?.byCategory || []).map((c) => c.total));
  const isThisMonth = month === currentMonth();
  const refreshing = (summaryQ.isRefetching || listQ.isRefetching) && !listQ.isFetchingNextPage;

  const header = (
    <View>
      <View style={styles.monthRow}>
        <Pressable hitSlop={12} onPress={() => setMonth(shiftMonth(month, -1))}>
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
        </Pressable>
        <Text style={styles.monthText}>{monthLabel(month)}</Text>
        <Pressable hitSlop={12} disabled={isThisMonth} onPress={() => setMonth(shiftMonth(month, 1))}>
          <Ionicons name="chevron-forward" size={22} color={isThisMonth ? colors.border : colors.ink} />
        </Pressable>
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroLabel}>{person ? `${person.name} · ` : ''}{admin && !person ? 'Spent this month' : 'Your spend this month'}</Text>
        <Text style={styles.heroValue}>{summaryQ.isLoading ? '…' : formatRupees(summary?.total)}</Text>
        <Text style={styles.heroSub}>{summary?.count ? `${summary.count} expense${summary.count === 1 ? '' : 's'}` : 'No expenses yet'}</Text>
        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatLabel}>Today</Text>
            <Text style={styles.heroStatValue}>{formatRupees(summary?.today?.total)}</Text>
          </View>
          <Pressable style={styles.heroStat} onPress={() => setQuick(quick === 'pending' ? 'all' : 'pending')}>
            <Text style={styles.heroStatLabel}>{admin ? 'To pay back' : 'Owed to you'}</Text>
            <Text style={[styles.heroStatValue, summary?.toSettle?.total ? { color: '#9A5B00' } : null]}>
              {formatRupees(summary?.toSettle?.total)}
            </Text>
          </Pressable>
        </View>
      </View>

      {summary?.byCategory?.length ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>By category</Text>
          {summary.byCategory.map((c) => {
            const active = category?.id === c.category.id;
            return (
              <Pressable
                key={c.category.id}
                style={styles.barRow}
                onPress={() => setCategory(active ? null : { id: c.category.id, name: c.category.name })}
              >
                <Ionicons name={c.category.icon || 'pricetag-outline'} size={16} color={colors.brandInk} />
                <View style={styles.barBody}>
                  <View style={styles.barTop}>
                    <Text style={[styles.barName, active && { color: colors.brandInk, fontWeight: '800' }]}>{c.category.name}</Text>
                    <Text style={styles.barAmount}>{formatRupees(c.total)}</Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${Math.max(3, (c.total / maxCategory) * 100)}%` }]} />
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {admin && !person && summary?.byPerson?.length ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>By person</Text>
          {summary.byPerson.map((p) => (
            <Pressable key={p.key} style={styles.personRow} onPress={() => setPerson({ key: p.userId || p.key, name: p.name })}>
              <Ionicons name="person-circle-outline" size={20} color={colors.muted} />
              <Text style={styles.personName}>{p.name}</Text>
              <Text style={styles.personCount}>{p.count}</Text>
              <Text style={styles.personAmount}>{formatRupees(p.total)}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.faint} />
            </Pressable>
          ))}
        </View>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {person ? (
          <Pressable style={[styles.chip, styles.chipActive]} onPress={() => setPerson(null)}>
            <Text style={styles.chipActiveText}>{person.name}</Text>
            <Ionicons name="close" size={14} color="#FFFFFF" />
          </Pressable>
        ) : null}
        {category ? (
          <Pressable style={[styles.chip, styles.chipActive]} onPress={() => setCategory(null)}>
            <Text style={styles.chipActiveText}>{category.name}</Text>
            <Ionicons name="close" size={14} color="#FFFFFF" />
          </Pressable>
        ) : null}
        {QUICK_FILTERS.map((f) => (
          <Pressable key={f.key} style={[styles.chip, quick === f.key && styles.chipActive]} onPress={() => setQuick(f.key)}>
            <Text style={quick === f.key ? styles.chipActiveText : styles.chipText}>{f.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
      {quick === 'pending' ? <Text style={styles.note}>Showing everything still to be paid back, from any month.</Text> : null}
    </View>
  );

  return (
    <View style={styles.screen}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <View style={styles.dayHeader}>
            <Text style={styles.dayText}>{dayLabel(section.date)}</Text>
            <Text style={styles.dayTotal}>{formatRupees(section.total)}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <ExpenseRow expense={item} showPerson={admin} onPress={() => router.push(`/(tabs)/expenses/${item.id}`)} />
        )}
        ListEmptyComponent={
          listQ.isLoading ? (
            <ActivityIndicator style={{ marginTop: 24 }} color={colors.brand} />
          ) : (
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={36} color={colors.faint} />
              <Text style={styles.emptyText}>No expenses here yet.</Text>
              <Text style={styles.emptySub}>Tap + to add one. It takes a few seconds.</Text>
            </View>
          )
        }
        onEndReached={() => listQ.hasNextPage && !listQ.isFetchingNextPage && listQ.fetchNextPage()}
        onEndReachedThreshold={0.4}
        ListFooterComponent={listQ.isFetchingNextPage ? <ActivityIndicator style={{ margin: 16 }} color={colors.brand} /> : <View style={{ height: 96 }} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              summaryQ.refetch();
              listQ.refetch();
            }}
            tintColor={colors.brand}
          />
        }
      />
      <Pressable style={({ pressed }) => [styles.fab, pressed && { opacity: 0.85 }]} onPress={() => router.push('/(tabs)/expenses/new')}>
        <Ionicons name="add" size={30} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface2 },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 12 },
  monthText: { fontSize: 16, fontWeight: '700', color: colors.ink },
  hero: { marginHorizontal: 16, borderRadius: 18, padding: 18, backgroundColor: colors.brandInk },
  heroLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  heroValue: { fontSize: 34, fontWeight: '800', color: '#FFFFFF', marginTop: 4 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  heroStats: { flexDirection: 'row', gap: 10, marginTop: 16 },
  heroStat: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12 },
  heroStatLabel: { fontSize: 11, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.4 },
  heroStatValue: { fontSize: 17, fontWeight: '800', color: colors.ink, marginTop: 4 },
  card: { marginHorizontal: 16, marginTop: 12, backgroundColor: colors.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.border },
  cardTitle: { fontSize: 13, fontWeight: '800', color: colors.ink, marginBottom: 8 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  barBody: { flex: 1 },
  barTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  barName: { fontSize: 13, color: colors.ink, fontWeight: '600' },
  barAmount: { fontSize: 13, color: colors.ink, fontWeight: '700' },
  barTrack: { height: 6, borderRadius: 3, backgroundColor: colors.surface2, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3, backgroundColor: colors.brand },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 9 },
  personName: { flex: 1, fontSize: 14, color: colors.ink, fontWeight: '600' },
  personCount: { fontSize: 12, color: colors.muted },
  personAmount: { fontSize: 14, fontWeight: '700', color: colors.ink, minWidth: 80, textAlign: 'right' },
  chips: { paddingHorizontal: 16, paddingVertical: 14, gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { fontSize: 13, color: colors.ink, fontWeight: '600' },
  chipActiveText: { fontSize: 13, color: '#FFFFFF', fontWeight: '700' },
  note: { fontSize: 12, color: colors.muted, marginHorizontal: 18, marginTop: -6, marginBottom: 8 },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 },
  dayText: { fontSize: 13, fontWeight: '700', color: colors.muted },
  dayTotal: { fontSize: 13, fontWeight: '700', color: colors.muted },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 6 },
  emptyText: { fontSize: 15, fontWeight: '700', color: colors.ink },
  emptySub: { fontSize: 13, color: colors.muted },
  fab: {
    position: 'absolute', right: 20, bottom: 24, width: 60, height: 60, borderRadius: 30,
    backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
});
