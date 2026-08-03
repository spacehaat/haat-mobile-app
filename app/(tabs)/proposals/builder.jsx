import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, TextInput, ScrollView, Pressable, StyleSheet,
  ActivityIndicator, Alert, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { mobileApi } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import { useProposal } from '../../../context/ProposalContext';
import ProposalSpaceCard from '../../../components/ui/ProposalSpaceCard';
import { buildProposalRender, coverNote } from '../../../lib/listingHelpers';
import {
  proposalChannelForApi,
  shareProposalWithMessage,
  shareSuccessMessage,
  buildProposalShareMessage,
} from '../../../lib/shareProposal';
import { normalizeListing } from '../../../constants/inventory';
import RequireScreen from '../../../components/RequireScreen';
import { colors } from '../../../constants/theme';
import { inr } from '@spacehaat/utils';

async function fetchListingsByIds(ids) {
  const unique = [...new Set((ids || []).map((id) => String(id)).filter(Boolean))];
  if (!unique.length) return [];

  const results = await Promise.all(unique.map(async (id) => {
    try {
      const listing = await mobileApi.getListing(id);
      return normalizeListing(listing);
    } catch {
      return null;
    }
  }));

  const byId = new Map(results.filter(Boolean).map((l) => [String(l.id), l]));
  return unique.map((id) => byId.get(id)).filter(Boolean);
}

export default function ProposalBuilderScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const {
    proposalIds, proposalTitle, client, coverNoteText, coverNoteIdx,
    linkedLead, editingProposalId,
    updateClient, updateCoverNote, updateProposalTitle,
    removeFromProposal, reorderProposal, regenerateCoverNote,
    applyProposalDraft,
  } = useProposal();

  const [sendOpen, setSendOpen] = useState(false);
  const [sendChannel, setSendChannel] = useState('wa');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfMeta, setPdfMeta] = useState(null);

  // Fetch each selected listing by id (same as web using full listing cache).
  // Avoids missing spaces when they fall outside a generic listListings page.
  const { data: selectedListings = [], isLoading: listingsLoading } = useQuery({
    queryKey: ['proposal-builder-listings', proposalIds],
    queryFn: () => fetchListingsByIds(proposalIds),
    enabled: proposalIds.length > 0,
  });

  const items = useMemo(() => {
    const byId = new Map((selectedListings || []).map((l) => [String(l.id), l]));
    return proposalIds
      .map((id) => byId.get(String(id)))
      .filter(Boolean);
  }, [proposalIds, selectedListings]);

  const proposalRender = useMemo(() => buildProposalRender(items), [items]);

  const suggestedTitle = useMemo(() => {
    const who = client.company || client.name;
    const base = who ? `${who} — workspace proposal` : 'Workspace proposal';
    return `${base} · ${items.length} option${items.length !== 1 ? 's' : ''}`;
  }, [client.company, client.name, items.length]);

  const displayTitle = proposalTitle?.trim() || suggestedTitle;
  const activeCoverNote = coverNoteText || coverNote(client, items.length, coverNoteIdx);

  useEffect(() => {
    if (!items.length || coverNoteText) return;
    updateCoverNote(coverNote(client, items.length, coverNoteIdx));
  }, [items.length, coverNoteText, coverNoteIdx, client.name, client.company]);

  const brokerName = user?.name || 'Spacehaat';

  const sendMessage = useMemo(() => buildProposalShareMessage({
    channel: sendChannel,
    clientName: client.name,
    clientCompany: client.company,
    listingCount: items.length,
    brokerName,
    title: displayTitle,
  }), [sendChannel, client.name, client.company, items.length, brokerName, displayTitle]);

  const persistProposal = useCallback(async () => {
    const isCreate = !editingProposalId;
    const result = await mobileApi.generateProposalPdf(
      proposalRender,
      displayTitle,
      editingProposalId,
      linkedLead?.id || null,
    );
    if (result?.pdf) setPdfMeta(result.pdf);
    if (isCreate && result?.draft) {
      applyProposalDraft(result.draft);
      setPdfMeta(null);
    }
    queryClient.invalidateQueries({ queryKey: ['proposals'] });
    return result;
  }, [proposalRender, displayTitle, editingProposalId, linkedLead, applyProposalDraft, queryClient]);

  const createProposal = async () => {
    setCreateLoading(true);
    try {
      await persistProposal();
      Alert.alert(
        'Saved',
        editingProposalId ? 'Proposal updated and saved.' : 'Proposal created and saved.',
      );
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to save proposal');
    } finally {
      setCreateLoading(false);
    }
  };

  const downloadPdf = async () => {
    setPdfLoading(true);
    try {
      const { pdf, proposal } = await persistProposal();
      const shareResult = await shareProposalWithMessage({
        message: sendMessage,
        pdfUrl: pdf?.url || pdfMeta?.url,
        title: displayTitle,
        channel: sendChannel,
        proposalId: proposal?.id || editingProposalId,
        clientName: client.name,
        clientCompany: client.company,
        listingCount: items.length,
        brokerName,
      });
      if (!shareResult.cancelled) {
        Alert.alert('PDF ready', shareSuccessMessage({ channel: sendChannel, ...shareResult }));
      }
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to generate PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  const confirmSend = async () => {
    setSending(true);
    try {
      const result = await mobileApi.sendProposal(
        proposalChannelForApi(sendChannel),
        user?.name || '',
        proposalRender,
        displayTitle,
        linkedLead?.id || null,
      );
      if (result?.pdf) setPdfMeta(result.pdf);

      // Share the PDF file with curated text — never a PDF URL alone.
      const shareResult = await shareProposalWithMessage({
        message: sendMessage,
        pdfUrl: result?.pdf?.url || pdfMeta?.url,
        title: displayTitle,
        channel: sendChannel,
        proposalId: result?.proposal?.id || editingProposalId,
        clientName: client.name,
        clientCompany: client.company,
        listingCount: items.length,
        brokerName,
      });

      setSent(true);
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      if (!shareResult.cancelled) {
        Alert.alert('Ready to send', shareSuccessMessage({ channel: sendChannel, ...shareResult }));
      }
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to send proposal');
    } finally {
      setSending(false);
    }
  };

  const updateOrder = (idx, delta) => {
    const next = [...proposalIds];
    const swapIdx = idx + delta;
    if (swapIdx < 0 || swapIdx >= next.length) return;
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    reorderProposal(next);
  };

  if (!proposalIds.length) {
    return (
      <RequireScreen screen="proposal">
      <View style={[styles.emptyWrap, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.emptyIcon}>
          <Ionicons name="document-text-outline" size={36} color={colors.brand} />
        </View>
        <Text style={styles.emptyTitle}>No spaces selected yet</Text>
        <Text style={styles.emptyLead}>
          Add spaces from Smart Match or Inventory, then build your client-ready proposal here.
        </Text>
        <View style={styles.emptyActions}>
          <Pressable style={styles.primaryBtn} onPress={() => router.push('/(tabs)/match')}>
            <Ionicons name="sparkles" size={16} color="#fff" />
            <Text style={styles.primaryBtnText}>Smart Match</Text>
          </Pressable>
          <Pressable style={styles.secondaryBtn} onPress={() => router.push('/(tabs)/browser')}>
            <Ionicons name="business-outline" size={16} color={colors.ink} />
            <Text style={styles.secondaryBtnText}>Inventory</Text>
          </Pressable>
        </View>
      </View>
      </RequireScreen>
    );
  }

  if (listingsLoading && items.length < proposalIds.length) {
    return (
      <RequireScreen screen="proposal">
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={colors.brand} size="large" />
        <Text style={styles.loadingText}>Loading selected spaces…</Text>
      </View>
      </RequireScreen>
    );
  }

  const minP = items.length ? Math.min(...items.map((l) => l.price)) : 0;
  const maxP = items.length ? Math.max(...items.map((l) => l.price)) : 0;
  const who = client.name
    ? `${client.name}${client.company ? ` · ${client.company}` : ''}`
    : (client.company || '[Client name]');

  const pdfPages = pdfMeta?.pageCount || Math.max(1, Math.ceil(items.length / 2) + 1);
  const pdfSizeMb = pdfMeta?.sizeBytes
    ? `${(pdfMeta.sizeBytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(0.4, items.length * 0.3).toFixed(1)} MB`;

  return (
    <RequireScreen screen="proposal">
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        {linkedLead ? (
          <View style={styles.leadBanner}>
            <Ionicons name="person-outline" size={20} color={colors.brand} />
            <View style={styles.leadBody}>
              <Text style={styles.leadTitle}>Linked lead: {linkedLead.title || linkedLead.displayTitle || linkedLead.id}</Text>
              <Text style={styles.leadSub}>Proposal will attach to this deal when saved or sent.</Text>
            </View>
            <Pressable onPress={() => router.push('/(tabs)/leads')}>
              <Text style={styles.leadLink}>View</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.block}>
          <View style={styles.blockHead}>
            <Ionicons name="document-text-outline" size={18} color={colors.ink} />
            <Text style={styles.blockTitle}>Proposal name</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder={suggestedTitle}
            placeholderTextColor={colors.faint}
            value={proposalTitle}
            onChangeText={updateProposalTitle}
            maxLength={120}
          />
          <Text style={styles.hint}>Used as document title. Leave blank to auto-name.</Text>
        </View>

        <View style={styles.block}>
          <View style={styles.blockHead}>
            <Ionicons name="person-outline" size={18} color={colors.ink} />
            <Text style={styles.blockTitle}>Client</Text>
          </View>
          <Text style={styles.fieldLabel}>Contact name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Ananya Rao"
            placeholderTextColor={colors.faint}
            value={client.name}
            onChangeText={(name) => updateClient({ ...client, name })}
          />
          <Text style={styles.fieldLabel}>Company</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Acme Corp"
            placeholderTextColor={colors.faint}
            value={client.company}
            onChangeText={(company) => updateClient({ ...client, company })}
          />
        </View>

        <View style={styles.block}>
          <View style={styles.blockHead}>
            <Ionicons name="sparkles" size={18} color={colors.brand} />
            <Text style={styles.blockTitle}>Cover note</Text>
            <Pressable style={styles.ghostBtn} onPress={() => regenerateCoverNote(items.length)}>
              <Ionicons name="refresh" size={14} color={colors.brand} />
              <Text style={styles.ghostBtnText}>Regenerate</Text>
            </Pressable>
          </View>
          <TextInput
            style={[styles.input, styles.textarea]}
            multiline
            value={activeCoverNote}
            onChangeText={updateCoverNote}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.block}>
          <View style={styles.blockHead}>
            <Ionicons name="layers-outline" size={18} color={colors.ink} />
            <Text style={styles.blockTitle}>Selected spaces</Text>
            <View style={styles.countPill}><Text style={styles.countPillText}>{items.length}</Text></View>
          </View>
          {items.length < proposalIds.length ? (
            <Text style={styles.missingHint}>
              Loaded {items.length} of {proposalIds.length} spaces. Some may have been removed from inventory.
            </Text>
          ) : null}
          {items.map((l, i) => (
            <View key={l.id} style={styles.peItem}>
              <Text style={styles.peRank}>{i + 1}</Text>
              <View style={styles.peInfo}>
                <Text style={styles.peName}>{l.operator}</Text>
                <Text style={styles.peSub}>{l.micro}, {l.city} · {l.seats} seats · {inr(l.price)}</Text>
              </View>
              <View style={styles.peCtrl}>
                <Pressable style={styles.iconBtn} disabled={i === 0} onPress={() => updateOrder(i, -1)}>
                  <Ionicons name="chevron-up" size={18} color={i === 0 ? colors.faint : colors.ink} />
                </Pressable>
                <Pressable style={styles.iconBtn} disabled={i === items.length - 1} onPress={() => updateOrder(i, 1)}>
                  <Ionicons name="chevron-down" size={18} color={i === items.length - 1 ? colors.faint : colors.ink} />
                </Pressable>
                <Pressable style={styles.iconBtn} onPress={() => removeFromProposal(l.id)}>
                  <Ionicons name="close" size={18} color={colors.danger} />
                </Pressable>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.block}>
          <View style={styles.blockHead}>
            <Ionicons name="eye-outline" size={18} color={colors.ink} />
            <Text style={styles.blockTitle}>Live preview</Text>
          </View>
          <View style={styles.previewMeta}>
            <Text style={styles.previewTitle}>{displayTitle}</Text>
            <Text style={styles.previewSub}>For {who} · {items.length} options · {inr(minP)}–{inr(maxP)}/seat</Text>
          </View>
          <Text style={styles.previewNote}>{activeCoverNote}</Text>
          {items.map((l, i) => (
            <ProposalSpaceCard key={l.id} listing={l} index={i} total={items.length} />
          ))}
        </View>

        <View style={styles.block}>
          <View style={styles.blockHead}>
            <Ionicons name="shield-checkmark-outline" size={18} color={colors.ink} />
            <Text style={styles.blockTitle}>PDF export</Text>
          </View>
          <Text style={styles.pdfMeta}>{pdfPages} pages · ~{pdfSizeMb}</Text>
          <Text style={styles.hint}>
            Download / Send shares the PDF file with curated text — not a link.
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={[styles.actionPrimary, createLoading && styles.btnOff]}
            disabled={createLoading}
            onPress={createProposal}
          >
            {createLoading ? <ActivityIndicator color="#fff" /> : (
              <>
                <Ionicons name={editingProposalId ? 'refresh' : 'add-circle-outline'} size={18} color="#fff" />
                <Text style={styles.actionPrimaryText}>
                  {editingProposalId ? 'Update proposal' : 'Create proposal'}
                </Text>
              </>
            )}
          </Pressable>

          <Pressable
            style={[styles.actionSecondary, pdfLoading && styles.btnOff]}
            disabled={pdfLoading}
            onPress={downloadPdf}
          >
            {pdfLoading ? <ActivityIndicator color={colors.ink} /> : (
              <>
                <Ionicons name="download-outline" size={18} color={colors.ink} />
                <Text style={styles.actionSecondaryText}>Download PDF</Text>
              </>
            )}
          </Pressable>

          <Pressable style={styles.actionSecondary} onPress={() => { setSendOpen(true); setSent(false); }}>
            <Ionicons name="send-outline" size={18} color={colors.ink} />
            <Text style={styles.actionSecondaryText}>Send via WhatsApp / Email</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal visible={sendOpen} animationType="slide" transparent onRequestClose={() => setSendOpen(false)}>
        <View style={styles.modalBg}>
          <View style={[styles.modal, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Send proposal</Text>
              <Pressable onPress={() => setSendOpen(false)}>
                <Ionicons name="close" size={24} color={colors.ink} />
              </Pressable>
            </View>

            <View style={styles.channelRow}>
              <Pressable
                style={[styles.channelBtn, sendChannel === 'wa' && styles.channelBtnOn]}
                onPress={() => setSendChannel('wa')}
              >
                <Ionicons name="logo-whatsapp" size={18} color={sendChannel === 'wa' ? '#fff' : colors.success} />
                <Text style={[styles.channelText, sendChannel === 'wa' && styles.channelTextOn]}>WhatsApp</Text>
              </Pressable>
              <Pressable
                style={[styles.channelBtn, sendChannel === 'email' && styles.channelBtnOn]}
                onPress={() => setSendChannel('email')}
              >
                <Ionicons name="mail-outline" size={18} color={sendChannel === 'email' ? '#fff' : colors.ink} />
                <Text style={[styles.channelText, sendChannel === 'email' && styles.channelTextOn]}>Email</Text>
              </Pressable>
            </View>

            <Text style={styles.sendHint}>
              Saves the proposal, then opens the share sheet with the PDF file attached. Curated message is copied so you can paste it in WhatsApp or Email.
            </Text>

            <ScrollView style={styles.msgScroll}>
              <Text style={styles.msgPreview}>{sendMessage}</Text>
            </ScrollView>

            {sent ? (
              <View style={styles.sentBanner}>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <Text style={styles.sentText}>Saved — check clipboard and share sheet</Text>
              </View>
            ) : null}

            <Pressable
              style={[styles.actionPrimary, sending && styles.btnOff]}
              disabled={sending}
              onPress={confirmSend}
            >
              {sending ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Ionicons name="share-outline" size={18} color="#fff" />
                  <Text style={styles.actionPrimaryText}>Share PDF & save</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
    </RequireScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface2 },
  content: { padding: 16 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: colors.muted },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: colors.brandSoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: colors.ink, marginBottom: 8 },
  emptyLead: { fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  emptyActions: { flexDirection: 'row', gap: 10 },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.brand, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.surface, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  secondaryBtnText: { color: colors.ink, fontWeight: '700' },
  leadBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.brandSoft, borderRadius: 12, padding: 12, marginBottom: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  leadBody: { flex: 1 },
  leadTitle: { fontSize: 13, fontWeight: '700', color: colors.ink },
  leadSub: { fontSize: 11, color: colors.muted, marginTop: 2 },
  leadLink: { color: colors.brand, fontWeight: '700', fontSize: 13 },
  block: {
    backgroundColor: colors.surface, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: colors.border, marginBottom: 12,
  },
  blockHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  blockTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.ink },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: colors.muted, marginBottom: 6, marginTop: 4 },
  input: {
    backgroundColor: colors.surface2, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11,
    fontSize: 15, color: colors.ink, borderWidth: 1, borderColor: colors.border,
  },
  textarea: { minHeight: 100, paddingTop: 12 },
  hint: { fontSize: 11, color: colors.faint, marginTop: 6 },
  missingHint: { fontSize: 12, color: colors.muted, marginBottom: 10, lineHeight: 18 },
  ghostBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ghostBtnText: { color: colors.brand, fontWeight: '600', fontSize: 12 },
  countPill: {
    backgroundColor: colors.ink, borderRadius: 999, minWidth: 22, height: 22,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
  },
  countPillText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  peItem: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border,
  },
  peRank: { width: 24, fontSize: 14, fontWeight: '800', color: colors.brand, textAlign: 'center' },
  peInfo: { flex: 1, minWidth: 0 },
  peName: { fontSize: 14, fontWeight: '700', color: colors.ink },
  peSub: { fontSize: 12, color: colors.muted, marginTop: 2 },
  peCtrl: { flexDirection: 'row', gap: 2 },
  iconBtn: { padding: 6 },
  previewMeta: { marginBottom: 10 },
  previewTitle: { fontSize: 16, fontWeight: '800', color: colors.ink },
  previewSub: { fontSize: 12, color: colors.muted, marginTop: 4 },
  previewNote: { fontSize: 13, color: colors.ink, lineHeight: 20, marginBottom: 12, fontStyle: 'italic' },
  pdfMeta: { fontSize: 13, color: colors.muted },
  linkBtn: { marginTop: 8 },
  linkBtnText: { color: colors.brand, fontWeight: '600', fontSize: 13 },
  actions: { gap: 10, marginTop: 4 },
  actionPrimary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.brand, borderRadius: 12, paddingVertical: 14,
  },
  actionPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  actionSecondary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.surface, borderRadius: 12, paddingVertical: 14,
    borderWidth: 1, borderColor: colors.border,
  },
  actionSecondaryText: { color: colors.ink, fontWeight: '700', fontSize: 15 },
  btnOff: { opacity: 0.6 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 16, maxHeight: '85%',
  },
  modalHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.ink },
  channelRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  channelBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.border,
  },
  channelBtnOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  channelText: { fontWeight: '700', color: colors.ink, fontSize: 13 },
  channelTextOn: { color: '#fff' },
  msgScroll: { maxHeight: 180, marginBottom: 12 },
  sendHint: { fontSize: 13, color: colors.muted, lineHeight: 20, marginBottom: 12 },
  msgPreview: { fontSize: 14, color: colors.ink, lineHeight: 22 },
  sentBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#e6f4ec', padding: 10, borderRadius: 10, marginBottom: 12,
  },
  sentText: { color: colors.success, fontWeight: '600', fontSize: 13 },
});
