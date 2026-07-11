import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View, RefreshControl, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { mobileApi } from '../../../lib/api';
import { clientPortalUrl } from '../../../lib/portalUrl';
import { shareProposalPdfFile, openProposalPdf } from '../../../lib/shareProposal';
import { useProposal } from '../../../context/ProposalContext';
import { canSeeProposalBuilder } from '../../../lib/access';
import { useAuth } from '../../../context/AuthContext';
import { formatDate } from '../../../lib/format';
import { priceRange, inr } from '@spacehaat/utils';
import LoadingScreen from '../../../components/ui/LoadingScreen';
import ProposalFeedbackModal from '../../../components/ProposalFeedbackModal';
import { colors } from '../../../constants/theme';

export default function ProposalDetailScreen() {
  const { id } = useLocalSearchParams();
  const proposalId = Array.isArray(id) ? id[0] : id;
  const { user } = useAuth();
  const { loadStoredProposal } = useProposal();
  const showBuilder = canSeeProposalBuilder(user);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [opening, setOpening] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [linking, setLinking] = useState(false);

  const { data: proposal, isLoading, refetch, isRefetching, error } = useQuery({
    queryKey: ['proposal', proposalId],
    queryFn: () => mobileApi.getProposal(proposalId),
    enabled: Boolean(proposalId),
  });

  const openPdf = async () => {
    if (!proposal?.pdfUrl) {
      Alert.alert('No PDF', 'This proposal does not have a PDF yet.');
      return;
    }
    setOpening(true);
    try {
      await openProposalPdf(proposal.pdfUrl, proposal.title, { proposalId });
    } catch (err) {
      Alert.alert('Could not open PDF', err.message || 'Try Share PDF instead.');
    } finally {
      setOpening(false);
    }
  };

  const sharePdf = async () => {
    if (!proposal?.pdfUrl) {
      Alert.alert('No PDF', 'This proposal does not have a PDF yet.');
      return;
    }
    setSharing(true);
    try {
      const result = await shareProposalPdfFile(proposal.pdfUrl, proposal.title, { proposalId });
      if (result?.cancelled) return;
    } catch (err) {
      Alert.alert('Share failed', err.message || 'Could not share PDF');
    } finally {
      setSharing(false);
    }
  };

  const editInBuilder = async () => {
    setLoadingDraft(true);
    try {
      await loadStoredProposal(proposalId);
      router.push('/(tabs)/proposals/builder');
    } catch (err) {
      Alert.alert('Could not load', err.message || 'Failed to load proposal into builder');
    } finally {
      setLoadingDraft(false);
    }
  };

  const copyClientLink = async () => {
    setLinking(true);
    try {
      const existingPath = proposal?.shareToken ? `/p/${proposal.shareToken}` : '';
      const result = existingPath ? { sharePath: existingPath } : await mobileApi.createProposalShareLink(proposalId);
      const url = clientPortalUrl(result.sharePath);
      await Clipboard.setStringAsync(url);
      Alert.alert('Copied', 'Client portal link copied to clipboard.');
      refetch();
    } catch (err) {
      Alert.alert('Could not create link', err.message || 'Try again.');
    } finally {
      setLinking(false);
    }
  };

  if (isLoading) return <LoadingScreen label="Loading proposal…" />;
  if (error || !proposal) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error?.message || 'Proposal not found'}</Text>
      </View>
    );
  }

  const isSent = proposal.status === 'sent';
  const who = proposal.client?.name
    ? `${proposal.client.name}${proposal.client.company ? ` · ${proposal.client.company}` : ''}`
    : (proposal.client?.company || 'No client set');
  const hasFeedback = (proposal.feedback?.total || 0) > 0;
  const portalUrl = proposal.shareToken ? clientPortalUrl(proposal.shareToken) : null;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.brand} />}
    >
      <Text style={styles.title}>{proposal.title}</Text>
      <View style={[styles.status, isSent ? styles.statusSent : styles.statusDraft]}>
        <Ionicons name={isSent ? 'send' : 'document-text-outline'} size={14} color={isSent ? colors.success : colors.muted} />
        <Text style={[styles.statusText, isSent && styles.statusTextSent]}>
          {isSent ? 'Sent' : 'Generated'}
        </Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Client</Text>
        <Text style={styles.panelVal}>{who}</Text>
        {proposal.client?.email ? <Text style={styles.panelSub}>{proposal.client.email}</Text> : null}
        {proposal.client?.phone ? <Text style={styles.panelSub}>{proposal.client.phone}</Text> : null}
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Summary</Text>
        <View style={styles.kpiRow}>
          <View style={styles.kpi}>
            <Text style={styles.kpiN}>{proposal.summary?.listingCount || 0}</Text>
            <Text style={styles.kpiL}>Spaces</Text>
          </View>
          <View style={styles.kpi}>
            <Text style={styles.kpiN}>{priceRange(proposal.summary)}</Text>
            <Text style={styles.kpiL}>Price range</Text>
          </View>
        </View>
        {proposal.summary?.cities?.length ? (
          <Text style={styles.panelSub}>📍 {proposal.summary.cities.join(', ')}</Text>
        ) : null}
        {proposal.summary?.operators?.length ? (
          <Text style={styles.panelSub}>Operators: {proposal.summary.operators.join(', ')}</Text>
        ) : null}
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Timeline</Text>
        <Text style={styles.panelVal}>
          {isSent ? `Sent ${formatDate(proposal.sentAt)}` : `Generated ${formatDate(proposal.generatedAt)}`}
        </Text>
        {isSent && proposal.channel ? (
          <Text style={styles.panelSub}>via {proposal.channel === 'whatsapp' ? 'WhatsApp' : 'Email'}</Text>
        ) : null}
        {proposal.sentBy ? <Text style={styles.panelSub}>By {proposal.sentBy}</Text> : null}
      </View>

      {(proposal.listings || []).length ? (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Included spaces</Text>
          {(proposal.listings || []).map((l) => (
            <View key={l.id} style={styles.listingRow}>
              <Text style={styles.listingName}>{l.operator}</Text>
              <Text style={styles.listingSub}>{l.micro}, {l.city} · {l.seats} seats · {inr(l.price)}/seat</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Client portal</Text>
        <Text style={styles.panelSub}>
          Share a live link so your client can shortlist spaces, leave comments, and request visits.
        </Text>
        {portalUrl ? (
          <Text style={styles.portalUrl} numberOfLines={2}>{portalUrl}</Text>
        ) : null}
        {hasFeedback ? (
          <View style={styles.feedbackRow}>
            {proposal.feedback?.shortlisted ? <Text style={styles.feedbackChip}>♥ {proposal.feedback.shortlisted}</Text> : null}
            {proposal.feedback?.visitRequests ? <Text style={styles.feedbackChip}>📅 {proposal.feedback.visitRequests}</Text> : null}
            {proposal.feedback?.comments ? <Text style={styles.feedbackChip}>💬 {proposal.feedback.comments}</Text> : null}
            {proposal.feedbackNewCount ? (
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>{proposal.feedbackNewCount} new</Text>
              </View>
            ) : null}
          </View>
        ) : null}
        <View style={styles.portalActions}>
          <Pressable style={[styles.btn, styles.btnOutline, linking && styles.btnOff]} disabled={linking} onPress={copyClientLink}>
            {linking ? <ActivityIndicator color={colors.ink} /> : (
              <>
                <Ionicons name="link-outline" size={18} color={colors.ink} />
                <Text style={styles.btnText}>Copy client link</Text>
              </>
            )}
          </Pressable>
          {(hasFeedback || proposal.shareToken) ? (
            <Pressable style={[styles.btn, styles.btnOutline]} onPress={() => setFeedbackOpen(true)}>
              <Ionicons name="chatbubble-outline" size={18} color={colors.ink} />
              <Text style={styles.btnText}>
                View feedback{proposal.feedbackNewCount ? ` (${proposal.feedbackNewCount})` : ''}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.actions}>
        {showBuilder ? (
          <Pressable style={[styles.btn, styles.btnPrimary, loadingDraft && styles.btnOff]} disabled={loadingDraft} onPress={editInBuilder}>
            {loadingDraft ? <ActivityIndicator color="#fff" /> : (
              <>
                <Ionicons name="create-outline" size={18} color="#fff" />
                <Text style={styles.btnPrimaryText}>Edit in builder</Text>
              </>
            )}
          </Pressable>
        ) : null}
        <Pressable
          style={[styles.btn, styles.btnOutline, (!proposal.pdfUrl || opening) && styles.btnOff]}
          disabled={!proposal.pdfUrl || opening}
          onPress={openPdf}
        >
          {opening ? (
            <ActivityIndicator color={colors.ink} />
          ) : (
            <>
              <Ionicons name="open-outline" size={18} color={colors.ink} />
              <Text style={styles.btnText}>Open PDF</Text>
            </>
          )}
        </Pressable>
        {proposal.pdfUrl ? (
          <Pressable style={[styles.btn, sharing && styles.btnOff]} disabled={sharing} onPress={sharePdf}>
            {sharing ? (
              <ActivityIndicator color={colors.ink} />
            ) : (
              <>
                <Ionicons name="share-outline" size={18} color={colors.ink} />
                <Text style={styles.btnText}>Share PDF</Text>
              </>
            )}
          </Pressable>
        ) : (
          <Text style={styles.noPdf}>PDF not generated yet</Text>
        )}
      </View>

      {feedbackOpen ? (
        <ProposalFeedbackModal
          proposalId={proposalId}
          proposalTitle={proposal.title}
          onClose={() => setFeedbackOpen(false)}
          onSeen={refetch}
        />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface2 },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  error: { color: colors.danger },
  title: { fontSize: 22, fontWeight: '800', color: colors.ink, marginBottom: 10 },
  status: {
    alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, marginBottom: 16,
    backgroundColor: colors.surface2,
  },
  statusSent: { backgroundColor: '#e6f4ec' },
  statusDraft: { backgroundColor: colors.surface2 },
  statusText: { fontSize: 12, fontWeight: '700', color: colors.muted },
  statusTextSent: { color: colors.success },
  panel: {
    backgroundColor: colors.surface, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: colors.border, marginBottom: 12,
  },
  panelTitle: {
    fontSize: 11, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase',
    color: colors.faint, marginBottom: 8,
  },
  panelVal: { fontSize: 15, fontWeight: '600', color: colors.ink },
  panelSub: { fontSize: 13, color: colors.muted, marginTop: 4 },
  kpiRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  kpi: {
    flex: 1, backgroundColor: colors.surface2, borderRadius: 10, padding: 12,
  },
  kpiN: { fontSize: 15, fontWeight: '800', color: colors.ink },
  kpiL: { fontSize: 11, color: colors.muted, marginTop: 4 },
  listingRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  listingName: { fontSize: 14, fontWeight: '700', color: colors.ink },
  listingSub: { fontSize: 12, color: colors.muted, marginTop: 2 },
  portalUrl: { fontSize: 12, color: colors.brandInk, marginTop: 8, fontWeight: '600' },
  feedbackRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 10 },
  feedbackChip: { fontSize: 12, fontWeight: '600', color: colors.ink },
  newBadge: { backgroundColor: colors.brand, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  newBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  portalActions: { gap: 10, marginTop: 12 },
  actions: { gap: 10, marginTop: 4 },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 12, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
  },
  btnPrimary: { backgroundColor: colors.brand, borderColor: colors.brand },
  btnOutline: { backgroundColor: colors.surface },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  btnText: { color: colors.ink, fontWeight: '700', fontSize: 15 },
  btnOff: { opacity: 0.5 },
  noPdf: { textAlign: 'center', color: colors.muted, fontSize: 13 },
});
