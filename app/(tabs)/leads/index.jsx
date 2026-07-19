import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, TextInput, FlatList, Pressable, StyleSheet,
  ActivityIndicator, RefreshControl, ScrollView, Modal,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { mobileApi } from '../../../lib/api';
import { formatDate, leadSubtitle } from '../../../lib/format';
import { PAGE_SIZE, STAGES } from '../../../constants/leads';
import {
  MOBILE_DATE_FILTERS,
  leadDateFilterLabel,
  resolveLeadDateRange,
} from '../../../lib/leadDateFilter.js';
import StageBadge from '../../../components/ui/StageBadge';
import { colors } from '../../../constants/theme';
import { initials } from '@spacehaat/utils';

function StageFilters({ stage, onChange, stageCounts = {} }) {
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
          const count = value ? stageCounts[value] : Object.values(stageCounts).reduce((a, b) => a + b, 0);
          return (
            <Pressable
              key={value || 'all'}
              style={[styles.chip, active && styles.chipOn]}
              onPress={() => onChange(value)}
              hitSlop={6}
            >
              <Text style={[styles.chipText, active && styles.chipTextOn]}>
                {label}
                {count ? ` (${count})` : ''}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function DateFilterModal({
  visible,
  value,
  customFrom,
  customTo,
  onClose,
  onApply,
}) {
  const [period, setPeriod] = useState(value);
  const [from, setFrom] = useState(customFrom);
  const [to, setTo] = useState(customTo);

  useEffect(() => {
    if (!visible) return;
    setPeriod(value);
    setFrom(customFrom);
    setTo(customTo);
  }, [visible, value, customFrom, customTo]);

  const handleOptionPress = (nextPeriod) => {
    setPeriod(nextPeriod);
    if (nextPeriod !== 'custom') {
      onApply({ period: nextPeriod, from: '', to: '' });
      onClose();
    }
  };

  const handleApplyCustom = () => {
    onApply({ period: 'custom', from: from.trim(), to: to.trim() });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
          {MOBILE_DATE_FILTERS.map(([option, label]) => {
            const selected = period === option;
            return (
              <Pressable
                key={option}
                style={[styles.modalOption, selected && styles.modalOptionOn]}
                onPress={() => handleOptionPress(option)}
              >
                <Text style={[styles.modalOptionText, selected && styles.modalOptionTextOn]}>{label}</Text>
                {selected ? <Ionicons name="checkmark" size={18} color={colors.brand} /> : null}
              </Pressable>
            );
          })}
          {period === 'custom' ? (
            <View style={styles.customDates}>
              <Text style={styles.customDatesLabel}>Custom range</Text>
              <View style={styles.customDateRow}>
                <Text style={styles.customDateFieldLabel}>From</Text>
                <TextInput
                  style={styles.customDateInput}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.faint}
                  value={from}
                  onChangeText={setFrom}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <View style={styles.customDateRow}>
                <Text style={styles.customDateFieldLabel}>To</Text>
                <TextInput
                  style={styles.customDateInput}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.faint}
                  value={to}
                  onChangeText={setTo}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <Pressable style={styles.customApplyBtn} onPress={handleApplyCustom}>
                <Text style={styles.customApplyText}>Apply custom range</Text>
              </Pressable>
            </View>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function LeadsListScreen() {
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState('');
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('this_month');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [dateModalOpen, setDateModalOpen] = useState(false);

  const onSearchChange = useCallback((text) => {
    setSearch(text);
    setPage(1);
    clearTimeout(onSearchChange._t);
    onSearchChange._t = setTimeout(() => setDebouncedSearch(text.trim()), 350);
  }, []);

  const dateRange = useMemo(
    () => resolveLeadDateRange(dateFilter, { from: customDateFrom, to: customDateTo }),
    [dateFilter, customDateFrom, customDateTo],
  );

  const queryKey = useMemo(
    () => ['leads', page, debouncedSearch, stage, dateFilter, customDateFrom, customDateTo, dateRange.dateFrom, dateRange.dateTo],
    [page, debouncedSearch, stage, dateFilter, customDateFrom, customDateTo, dateRange.dateFrom, dateRange.dateTo],
  );

  const { data, isLoading, isRefetching, refetch, error } = useQuery({
    queryKey,
    queryFn: () => mobileApi.listLeads({
      page,
      limit: PAGE_SIZE,
      search: debouncedSearch,
      stage,
      dateFrom: dateRange.dateFrom,
      dateTo: dateRange.dateTo,
    }),
  });

  const items = data?.items || [];
  const total = data?.total || 0;
  const stageCounts = data?.stageCounts || {};
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const onStageChange = useCallback((value) => {
    setStage(value);
    setPage(1);
  }, []);

  const onDateApply = useCallback(({ period, from, to }) => {
    setDateFilter(period);
    setCustomDateFrom(from);
    setCustomDateTo(to);
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
      <Pressable style={styles.dateFilterBtn} onPress={() => setDateModalOpen(true)}>
        <Ionicons name="calendar-outline" size={16} color={colors.brand} />
        <Text style={styles.dateFilterText}>
          {leadDateFilterLabel(dateFilter, MOBILE_DATE_FILTERS)}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.muted} />
      </Pressable>

      {dateFilter === 'custom' && (customDateFrom || customDateTo) ? (
        <Text style={styles.customRangeHint}>
          {customDateFrom || '…'} to {customDateTo || '…'}
        </Text>
      ) : null}

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

      <StageFilters stage={stage} onChange={onStageChange} stageCounts={stageCounts} />

      {error ? <Text style={styles.error}>{error.message}</Text> : null}
      {stage ? (
        <Pressable style={styles.clearFilter} onPress={() => onStageChange('')}>
          <Ionicons name="close-circle" size={14} color={colors.brand} />
          <Text style={styles.clearFilterText}>Clear stage filter</Text>
        </Pressable>
      ) : null}
      {total > 0 ? (
        <Text style={styles.resultCount}>{total} lead{total === 1 ? '' : 's'} in this period</Text>
      ) : null}
    </View>
  );

  return (
    <View style={styles.screen}>
      <DateFilterModal
        visible={dateModalOpen}
        value={dateFilter}
        customFrom={customDateFrom}
        customTo={customDateTo}
        onClose={() => setDateModalOpen(false)}
        onApply={onDateApply}
      />
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
                {stage || debouncedSearch || dateFilter !== 'this_month'
                  || (dateFilter === 'custom' && (customDateFrom || customDateTo)) ? (
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
  dateFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
  },
  dateFilterText: { fontSize: 14, fontWeight: '700', color: colors.ink },
  customRangeHint: {
    fontSize: 12,
    color: colors.muted,
    marginBottom: 10,
    marginTop: -4,
    fontWeight: '600',
  },
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
  resultCount: { fontSize: 12, color: colors.muted, marginBottom: 8, fontWeight: '600' },
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 24,
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalOptionOn: { backgroundColor: colors.surface2 },
  modalOptionText: { fontSize: 16, color: colors.ink, fontWeight: '500' },
  modalOptionTextOn: { color: colors.brand, fontWeight: '700' },
  customDates: {
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface2,
  },
  customDatesLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.faint,
    marginBottom: 10,
  },
  customDateRow: { marginBottom: 10 },
  customDateFieldLabel: { fontSize: 12, fontWeight: '600', color: colors.muted, marginBottom: 6 },
  customDateInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.ink,
  },
  customApplyBtn: {
    marginTop: 4,
    backgroundColor: colors.brand,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  customApplyText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
