import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, TextInput, Image, Linking, ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { publicApi, publicProposalPdfUrl } from '../../lib/publicApi';
import {
  initials, statusFor, listingPhotos, priceRangeLabel,
} from '../../lib/portalHelpers';
import PortalSpaceCard from './PortalSpaceCard';
import VisitRequestModal from './VisitRequestModal';
import GallerySheet from '../ui/GallerySheet';
import { colors } from '../../constants/theme';

function SectionLabel({ title, count }) {
  return (
    <View style={styles.secLab}>
      <Text style={styles.secTitle}>{title}</Text>
      {count != null ? <View style={styles.secCnt}><Text style={styles.secCntText}>{count}</Text></View> : null}
      <View style={styles.secLine} />
    </View>
  );
}

function RejectedRow({ listing, onUndo }) {
  return (
    <View style={styles.rejRow}>
      <Image source={{ uri: listing.images?.[0] }} style={styles.rejThumb} />
      <View style={styles.rejInfo}>
        <Text style={styles.rejName}>{listing.operator}</Text>
        <Text style={styles.rejSub} numberOfLines={1}>{listing.micro}, {listing.city}</Text>
      </View>
      <Pressable onPress={onUndo}><Text style={styles.undo}>Undo</Text></Pressable>
    </View>
  );
}

export default function PublicProposalPortal({ token }) {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState('');
  const [commentDrafts, setCommentDrafts] = useState({});
  const [panelOpenById, setPanelOpenById] = useState({});
  const [overallDraft, setOverallDraft] = useState('');
  const [overallSent, setOverallSent] = useState(false);
  const [visitOpen, setVisitOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [gallery, setGallery] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const result = await publicApi.getPublicProposal(token);
        if (alive) setData(result);
      } catch (e) {
        if (alive) setError(e?.message || 'This proposal link is not available.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [token]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(''), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  const feedback = data?.feedback || {};
  const proposal = data?.proposal;
  const listings = data?.listings || [];
  const advisor = proposal?.sentBy || 'Spacehaat';
  const clientName = proposal?.client?.company || proposal?.client?.name || 'you';

  const buckets = useMemo(() => {
    const out = { shortlisted: [], pending: [], rejected: [] };
    listings.forEach((l) => {
      const st = statusFor(feedback, l.id);
      out[st === 'shortlisted' ? 'shortlisted' : st === 'rejected' ? 'rejected' : 'pending'].push(l);
    });
    return out;
  }, [feedback, listings]);

  const totalSeats = useMemo(() => listings.reduce((a, l) => a + (l.seats || 0), 0), [listings]);

  const updateFeedback = useCallback(async (payload, successMsg) => {
    setSaving(payload.listingId || 'overall');
    try {
      const result = await publicApi.updatePublicProposal(token, payload);
      setData((prev) => ({ ...prev, feedback: result.feedback }));
      if (successMsg) setToast(successMsg);
    } catch (e) {
      setToast(e?.message || 'Could not save your update.');
    } finally {
      setSaving('');
    }
  }, [token]);

  const toggleLike = (listingId) => {
    const current = statusFor(feedback, listingId);
    const next = current === 'shortlisted' ? 'none' : 'shortlisted';
    updateFeedback(
      { listingId, status: next },
      next === 'shortlisted' ? 'Added to your shortlist' : 'Removed from shortlist',
    );
  };

  const rejectListing = (listingId) => {
    updateFeedback({ listingId, status: 'rejected' }, 'Moved to "Not interested"');
  };

  const undoReject = (listingId) => {
    updateFeedback({ listingId, status: 'none' }, '');
  };

  const sendComment = (listingId) => {
    const text = (commentDrafts[listingId] || '').trim();
    if (!text) return;
    updateFeedback({ listingId, comment: text }, 'Comment sent').then(() => {
      setCommentDrafts((prev) => ({ ...prev, [listingId]: '' }));
      setPanelOpenById((prev) => ({ ...prev, [listingId]: true }));
    });
  };

  const sendOverall = () => {
    const text = overallDraft.trim();
    if (!text) return;
    updateFeedback({ comment: text }, 'Feedback sent').then(() => {
      setOverallDraft('');
      setOverallSent(true);
    });
  };

  const submitVisit = async ({ preferredDates, visitNote }) => {
    for (const listing of buckets.shortlisted) {
      await updateFeedback({ listingId: listing.id, preferredDates, visitNote }, '');
    }
    setToast('Visit request sent');
  };

  const openPdf = () => Linking.openURL(publicProposalPdfUrl(token));

  const renderCard = (listing, status) => (
    <PortalSpaceCard
      key={listing.id}
      listing={listing}
      status={status}
      comments={(feedback.comments || []).filter((c) => c.listingId === listing.id)}
      panelOpen={!!panelOpenById[listing.id]}
      saving={saving === listing.id}
      onLike={() => toggleLike(listing.id)}
      onReject={() => rejectListing(listing.id)}
      onTogglePanel={() => setPanelOpenById((prev) => ({ ...prev, [listing.id]: !prev[listing.id] }))}
      onSendComment={() => sendComment(listing.id)}
      commentDraft={commentDrafts[listing.id] || ''}
      onCommentDraft={(v) => setCommentDrafts((prev) => ({ ...prev, [listing.id]: v }))}
      onOpenGallery={(idx) => setGallery({ listing, index: idx })}
    />
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.brand} />
        <Text style={styles.centerText}>Loading proposal…</Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.center}>
        <Ionicons name="close-circle-outline" size={40} color={colors.danger} />
        <Text style={styles.errorTitle}>Proposal link unavailable</Text>
        <Text style={styles.centerText}>{error || 'Invalid or expired link.'}</Text>
      </View>
    );
  }

  const expiryLabel = proposal.expiresAt
    ? new Date(proposal.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.topbar}>
        <View style={styles.topbarIn}>
          <View style={styles.brand}>
            <Image source={require('../../assets/icon.png')} style={styles.brandMark} />
            <View>
              <Text style={styles.brandName}>Spacehaat</Text>
              <Text style={styles.brandSub}>WORKSPACE PROPOSAL</Text>
            </View>
          </View>
          <Pressable style={styles.pdfBtn} onPress={openPdf}>
            <Ionicons name="download-outline" size={16} color={colors.ink} />
            <Text style={styles.pdfBtnText}>PDF</Text>
          </Pressable>
        </View>
        {expiryLabel ? (
          <Text style={styles.expiry}><Ionicons name="time-outline" size={12} /> Link valid until {expiryLabel}</Text>
        ) : null}
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <View style={styles.kickerRow}>
            <View style={styles.kickerDot} />
            <Text style={styles.kicker}>LIVE PROPOSAL · UPDATED IN REAL TIME</Text>
          </View>
          <Text style={styles.h1}>
            A shortlist of spaces,{'\n'}picked for <Text style={styles.h1Em}>{clientName}</Text>
          </Text>
          <Text style={styles.lead}>
            {proposal.coverNote || `Review the curated workspace options below and share your feedback with ${advisor}.`}
          </Text>
          <View style={styles.heroMeta}>
            <View style={styles.hm}>
              <View style={styles.hmAv}><Text style={styles.hmAvText}>{initials(advisor)}</Text></View>
              <View>
                <Text style={styles.hmName}>{advisor}</Text>
                <Text style={styles.hmSub}>Your workspace advisor</Text>
              </View>
            </View>
            <View style={styles.hmStat}>
              <Text style={styles.hmStatN}>{listings.length}</Text>
              <Text style={styles.hmStatL}>Spaces</Text>
            </View>
            <View style={styles.hmStat}>
              <Text style={styles.hmStatN}>{totalSeats}</Text>
              <Text style={styles.hmStatL}>Total seats</Text>
            </View>
            <View style={styles.hmStat}>
              <Text style={styles.hmStatN}>{priceRangeLabel(listings)}</Text>
              <Text style={styles.hmStatL}>Per seat / mo</Text>
            </View>
          </View>
        </View>

        <View style={styles.wrap}>
          <SectionLabel title="Shortlisted" count={buckets.shortlisted.length} />
          {buckets.shortlisted.length
            ? buckets.shortlisted.map((l) => renderCard(l, 'shortlisted'))
            : <Text style={styles.emptyHint}>Nothing shortlisted yet — tap the heart on any space below.</Text>}

          <SectionLabel title="For your review" count={buckets.pending.length} />
          {buckets.pending.length
            ? buckets.pending.map((l) => renderCard(l, 'pending'))
            : <Text style={styles.emptyHint}>You&apos;ve reviewed everything — nice!</Text>}

          {buckets.rejected.length ? (
            <>
              <SectionLabel title="Not interested" count={buckets.rejected.length} />
              {buckets.rejected.map((l) => (
                <RejectedRow key={l.id} listing={l} onUndo={() => undoReject(l.id)} />
              ))}
            </>
          ) : null}

          <SectionLabel title="Overall feedback" />
          <View style={styles.feedbackCard}>
            <Text style={styles.fbTitle}>Anything else on your mind?</Text>
            <Text style={styles.fbSub}>General notes go straight to {advisor}.</Text>
            <TextInput
              style={styles.fbInput}
              multiline
              placeholder="Share preferences, budget, timeline…"
              placeholderTextColor={colors.faint}
              value={overallDraft}
              onChangeText={setOverallDraft}
            />
            <Pressable style={styles.fbSend} onPress={sendOverall} disabled={saving === 'overall'}>
              <Ionicons name="send" size={16} color="#fff" />
              <Text style={styles.fbSendText}>Send feedback</Text>
            </Pressable>
            {overallSent ? (
              <Text style={styles.fbSent}><Ionicons name="checkmark-circle" size={14} color={colors.success} /> Sent to {advisor}</Text>
            ) : null}
          </View>

          <View style={styles.footer}>
            <View style={styles.hmAv}><Text style={styles.hmAvText}>{initials(advisor)}</Text></View>
            <View>
              <Text style={styles.hmName}>{advisor}</Text>
              <Text style={styles.hmSub}>Workspace Advisor · Spacehaat</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {buckets.shortlisted.length ? (
        <View style={[styles.sticky, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={styles.stickyInner}>
            <Text style={styles.stickyTxt}>
              <Text style={styles.stickyBold}>{buckets.shortlisted.length}</Text> shortlisted
            </Text>
            <Pressable style={styles.stickyBtn} onPress={() => setVisitOpen(true)}>
              <Ionicons name="calendar-outline" size={16} color="#fff" />
              <Text style={styles.stickyBtnText}>Request a visit</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <VisitRequestModal
        visible={visitOpen}
        shortlisted={buckets.shortlisted}
        advisor={advisor}
        onClose={() => setVisitOpen(false)}
        onSubmit={submitVisit}
        busy={!!saving}
      />

      {gallery ? (
        <GallerySheet
          visible
          photos={listingPhotos(gallery.listing)}
          title={`${gallery.listing.operator} · ${gallery.listing.micro}`}
          initialIndex={gallery.index}
          onClose={() => setGallery(null)}
        />
      ) : null}

      {toast ? (
        <View style={[styles.toast, { bottom: 24 + insets.bottom }]}>
          <Ionicons name="checkmark-circle" size={16} color={colors.success} />
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FAFAF8' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#FAFAF8' },
  centerText: { color: colors.muted, marginTop: 12, textAlign: 'center' },
  errorTitle: { fontSize: 20, fontWeight: '800', color: colors.ink, marginTop: 12 },
  topbar: {
    backgroundColor: 'rgba(250,250,248,0.95)', borderBottomWidth: 1, borderBottomColor: colors.border,
    paddingHorizontal: 16, paddingBottom: 10,
  },
  topbarIn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandMark: { width: 34, height: 34, borderRadius: 9 },
  brandName: { fontSize: 16, fontWeight: '800', color: colors.ink },
  brandSub: { fontSize: 10, color: colors.muted, letterSpacing: 1 },
  pdfBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  pdfBtnText: { fontSize: 13, fontWeight: '650', color: colors.ink },
  expiry: { fontSize: 11, color: colors.muted, marginTop: 8 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  hero: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 },
  kickerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  kickerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  kicker: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, color: colors.brand },
  h1: { fontSize: 28, fontWeight: '800', color: colors.ink, lineHeight: 34 },
  h1Em: { color: colors.brand },
  lead: { fontSize: 15, color: colors.muted, lineHeight: 22, marginTop: 14 },
  heroMeta: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 20, paddingTop: 16,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  hm: { flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: '45%' },
  hmAv: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.ink,
    alignItems: 'center', justifyContent: 'center',
  },
  hmAvText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  hmName: { fontSize: 13, fontWeight: '650', color: colors.ink },
  hmSub: { fontSize: 11, color: colors.muted },
  hmStat: { minWidth: 70 },
  hmStatN: { fontSize: 18, fontWeight: '800', color: colors.ink },
  hmStatL: { fontSize: 10, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  wrap: { paddingHorizontal: 16, paddingTop: 8 },
  secLab: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24, marginBottom: 12 },
  secTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, color: colors.muted },
  secCnt: { backgroundColor: colors.surface2, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  secCntText: { fontSize: 11, fontWeight: '700', color: colors.muted },
  secLine: { flex: 1, height: 1, backgroundColor: colors.border },
  emptyHint: { fontSize: 13, color: colors.faint, paddingVertical: 4 },
  feedbackCard: {
    backgroundColor: colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border,
  },
  fbTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
  fbSub: { fontSize: 12, color: colors.muted, marginTop: 4, marginBottom: 12 },
  fbInput: {
    minHeight: 88, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12,
    fontSize: 14, color: colors.ink, backgroundColor: '#FAFAF8', textAlignVertical: 'top',
  },
  fbSend: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.brand, borderRadius: 10, paddingVertical: 12, marginTop: 12,
  },
  fbSendText: { color: '#fff', fontWeight: '700' },
  fbSent: { marginTop: 10, fontSize: 13, fontWeight: '600', color: colors.success },
  footer: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 32, paddingTop: 20,
    borderTopWidth: 1, borderTopColor: colors.border, marginBottom: 16,
  },
  rejRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, marginBottom: 8,
    backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, opacity: 0.85,
  },
  rejThumb: { width: 52, height: 40, borderRadius: 7 },
  rejInfo: { flex: 1 },
  rejName: { fontWeight: '650', color: colors.ink },
  rejSub: { fontSize: 12, color: colors.muted },
  undo: { fontSize: 12, fontWeight: '700', color: colors.brandInk },
  sticky: {
    position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', paddingHorizontal: 18, paddingTop: 12,
  },
  stickyInner: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.ink,
    borderRadius: 16, paddingVertical: 12, paddingHorizontal: 16, maxWidth: 420,
  },
  stickyTxt: { flex: 1, color: '#fff', fontSize: 14, fontWeight: '600' },
  stickyBold: { color: colors.brand, fontWeight: '800' },
  stickyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.brand,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
  },
  stickyBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  toast: {
    position: 'absolute', alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.ink, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12,
  },
  toastText: { color: '#fff', fontWeight: '600', fontSize: 13 },
});
