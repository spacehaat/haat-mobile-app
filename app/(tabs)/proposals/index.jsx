import { useCallback, useMemo, useState, useEffect } from 'react';
import {
  View, Text, TextInput, FlatList, Pressable, StyleSheet,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { router, useNavigation } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { mobileApi } from '../../../lib/api';
import { clientPortalUrl } from '../../../lib/portalUrl';
import { useProposal } from '../../../context/ProposalContext';
import { canSeeProposalBuilder } from '../../../lib/access';
import RequireScreen from '../../../components/RequireScreen';
import ProposalFeedbackModal from '../../../components/ProposalFeedbackModal';
import { useAuth } from '../../../context/AuthContext';
import { formatDate } from '../../../lib/format';
import { priceRange } from '@spacehaat/utils';
import { colors } from '../../../constants/theme';

const PAGE_SIZE = 15;

function feedbackSummary(item) {
  const fb = item.feedback || {};
  const parts = [];
  if (fb.shortlisted) parts.push(`${fb.shortlisted} shortlisted`);
  if (fb.visitRequests) parts.push(`${fb.visitRequests} visit${fb.visitRequests === 1 ? '' : 's'}`);
  if (fb.comments) parts.push(`${fb.comments} comment${fb.comments === 1 ? '' : 's'}`);
  return parts.join(' · ');
}

function ProposalCard({ item, onPress, onClientLink, onFeedback }) {
  const who = item.client?.name
    ? `${item.client.name}${item.client.company ? ` · ${item.client.company}` : ''}`
    : (item.client?.company || 'No client set');
  const isSent = item.status === 'sent';
  const dateLabel = isSent
    ? `Sent ${formatDate(item.sentAt)}`
    : `Generated ${formatDate(item.generatedAt)}`;
  const hasFeedback = (item.feedback?.total || 0) > 0;
  const summary = feedbackSummary(item);

  return (
    <Pressable style={[styles.card, item.feedbackNewCount ? styles.cardNewFeedback : null]} onPress={onPress}>
      <View style={styles.cardTop}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <View style={styles.badgeRow}>
          {item.feedbackNewCount ? (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>{item.feedbackNewCount} new</Text>
            </View>
          ) : null}
          <View style={[styles.status, isSent ? styles.statusSent : styles.statusDraft]}>
            <Ionicons name={isSent ? 'send' : 'document-text-outline'} size={12} color={isSent ? colors.success : colors.muted} />
            <Text style={[styles.statusText, isSent && styles.statusTextSent]}>{isSent ? 'Sent' : 'Generated'}</Text>
          </View>
        </View>
      </View>
      <Text style={styles.client} numberOfLines={1}>{who}</Text>
      <View style={styles.stats}>
        <Text style={styles.stat}>{item.summary?.listingCount || 0} spaces</Text>
        <Text style={styles.statDot}>·</Text>
        <Text style={styles.stat}>{priceRange(item.summary)}</Text>
      </View>
      {item.summary?.cities?.length ? (
        <Text style={styles.cities} numberOfLines={1}>📍 {item.summary.cities.join(', ')}</Text>
      ) : null}
      {hasFeedback ? (
        <View style={styles.feedbackLine}>
          {item.feedback?.shortlisted ? <Text style={styles.feedbackChip}>♥ {item.feedback.shortlisted}</Text> : null}
          {item.feedback?.visitRequests ? <Text style={styles.feedbackChip}>📅 {item.feedback.visitRequests}</Text> : null}
          {item.feedback?.comments ? <Text style={styles.feedbackChip}>💬 {item.feedback.comments}</Text> : null}
          <Text style={styles.feedbackSub} numberOfLines={1}>{summary}</Text>
        </View>
      ) : null}
      <Text style={styles.date}>{dateLabel}{isSent && item.channel ? ` · ${item.channel === 'whatsapp' ? 'WhatsApp' : 'Email'}` : ''}</Text>
      <View style={styles.cardActions}>
        <Pressable style={styles.cardBtn} onPress={(e) => { e.stopPropagation?.(); onClientLink(item); }}>
          <Ionicons name="link-outline" size={14} color={colors.ink} />
          <Text style={styles.cardBtnText}>Client link</Text>
        </Pressable>
        {(hasFeedback || item.shareToken) ? (
          <Pressable style={styles.cardBtn} onPress={(e) => { e.stopPropagation?.(); onFeedback(item); }}>
            <Ionicons name="chatbubble-outline" size={14} color={colors.ink} />
            <Text style={styles.cardBtnText}>
              Feedback{item.feedbackNewCount ? ` (${item.feedbackNewCount})` : ''}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function ProposalsListScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const { proposalCount } = useProposal();
  const showBuilder = canSeeProposalBuilder(user);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [feedbackProposal, setFeedbackProposal] = useState(null);

  useEffect(() => {
    if (!showBuilder) return;
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => router.push('/(tabs)/proposals/builder')}
          style={styles.builderBtn}
        >
          <Ionicons name="create-outline" size={22} color={colors.brand} />
          {proposalCount > 0 ? (
            <View style={styles.builderBadge}>
              <Text style={styles.builderBadgeText}>{proposalCount}</Text>
            </View>
          ) : null}
        </Pressable>
      ),
    });
  }, [navigation, showBuilder, proposalCount]);

  const onSearchChange = useCallback((text) => {
    setSearch(text);
    setPage(1);
    clearTimeout(onSearchChange._t);
    onSearchChange._t = setTimeout(() => setDebouncedSearch(text.trim()), 350);
  }, []);

  const queryKey = useMemo(() => ['proposals', page, debouncedSearch], [page, debouncedSearch]);

  const { data, isLoading, isRefetching, refetch, error } = useQuery({
    queryKey,
    queryFn: () => mobileApi.listProposals({ page, limit: PAGE_SIZE, search: debouncedSearch }),
  });

  const items = data?.items || [];
  const total = data?.total || 0;
  const feedbackNewTotal = data?.feedbackNewTotal || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleClientLink = async (item) => {
    try {
      const existingPath = item.shareToken ? `/p/${item.shareToken}` : '';
      const result = existingPath ? { sharePath: existingPath } : await mobileApi.createProposalShareLink(item.id);
      const url = clientPortalUrl(result.sharePath);
      await Clipboard.setStringAsync(url);
      Alert.alert('Copied', 'Client portal link copied to clipboard.');
      refetch();
    } catch (e) {
      Alert.alert('Could not create link', e?.message || 'Try again.');
    }
  };

  const openFeedback = (item) => {
    setFeedbackProposal({ id: item.id, title: item.title });
  };

  const listHeader = (
    <View style={styles.header}>
      {showBuilder ? (
        <Pressable style={styles.builderBanner} onPress={() => router.push('/(tabs)/proposals/builder')}>
          <Ionicons name="document-text" size={20} color={colors.brand} />
          <View style={styles.builderBannerBody}>
            <Text style={styles.builderBannerTitle}>Proposal Builder</Text>
            <Text style={styles.builderBannerSub}>
              {proposalCount > 0 ? `${proposalCount} space${proposalCount === 1 ? '' : 's'} selected` : 'Build a client-ready proposal'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </Pressable>
      ) : null}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={colors.muted} style={styles.searchIcon} />
        <TextInput
          style={styles.search}
          placeholder="Search proposals…"
          placeholderTextColor={colors.faint}
          value={search}
          onChangeText={onSearchChange}
          clearButtonMode="while-editing"
        />
      </View>
      {total > 0 ? (
        <Text style={styles.count}>
          {total} proposal{total === 1 ? '' : 's'}
          {feedbackNewTotal > 0 ? (
            <Text style={styles.newPill}> · {feedbackNewTotal} new update{feedbackNewTotal === 1 ? '' : 's'}</Text>
          ) : null}
        </Text>
      ) : null}
      {error ? <Text style={styles.error}>{error.message}</Text> : null}
    </View>
  );

  return (
    <RequireScreen screen="proposals">
    <View style={styles.screen}>
      <FlatList
        style={styles.list}
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProposalCard
            item={item}
            onPress={() => router.push(`/(tabs)/proposals/${item.id}`)}
            onClientLink={handleClientLink}
            onFeedback={openFeedback}
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
                <Ionicons name="folder-open-outline" size={32} color={colors.faint} />
                <Text style={styles.emptyText}>
                  {debouncedSearch ? 'No proposals match your search.' : 'No proposals yet.'}
                </Text>
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
      {feedbackProposal ? (
        <ProposalFeedbackModal
          proposalId={feedbackProposal.id}
          proposalTitle={feedbackProposal.title}
          onClose={() => setFeedbackProposal(null)}
          onSeen={refetch}
        />
      ) : null}
    </View>
    </RequireScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface2 },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 12, paddingBottom: 24, flexGrow: 1 },
  header: { paddingTop: 8, paddingBottom: 4 },
  builderBtn: { marginRight: 14, padding: 4, position: 'relative' },
  builderBadge: {
    position: 'absolute', top: 0, right: 0, backgroundColor: colors.brand,
    minWidth: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
  },
  builderBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  builderBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.brandSoft, borderRadius: 12, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: colors.border,
  },
  builderBannerBody: { flex: 1 },
  builderBannerTitle: { fontSize: 14, fontWeight: '700', color: colors.ink },
  builderBannerSub: { fontSize: 12, color: colors.muted, marginTop: 2 },
  searchWrap: { marginBottom: 8, position: 'relative' },
  searchIcon: { position: 'absolute', left: 12, top: 13, zIndex: 1 },
  search: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, paddingVertical: 11, paddingLeft: 38, paddingRight: 12,
    fontSize: 15, color: colors.ink,
  },
  count: { fontSize: 12, color: colors.muted, marginBottom: 8 },
  newPill: { color: colors.brandInk, fontWeight: '700' },
  feedbackLine: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 6 },
  feedbackChip: { fontSize: 12, fontWeight: '600', color: colors.ink },
  feedbackSub: { fontSize: 11, color: colors.muted, flex: 1 },
  cardActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
  cardBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 7,
    borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface2,
  },
  cardBtnText: { fontSize: 12, fontWeight: '650', color: colors.ink },
  error: { color: colors.danger, marginBottom: 8 },
  card: {
    backgroundColor: colors.surface, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: colors.border, marginBottom: 10,
  },
  cardNewFeedback: { borderColor: '#A5D6A7' },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  badgeRow: { alignItems: 'flex-end', gap: 4 },
  newBadge: { backgroundColor: colors.brand, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  newBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  title: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.ink },
  status: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: colors.surface2,
  },
  statusSent: { backgroundColor: '#e6f4ec' },
  statusDraft: { backgroundColor: colors.surface2 },
  statusText: { fontSize: 11, fontWeight: '700', color: colors.muted },
  statusTextSent: { color: colors.success },
  client: { fontSize: 13, color: colors.muted, marginBottom: 8 },
  stats: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  stat: { fontSize: 13, fontWeight: '600', color: colors.ink },
  statDot: { color: colors.faint },
  cities: { fontSize: 12, color: colors.muted, marginBottom: 6 },
  date: { fontSize: 11, color: colors.faint },
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
