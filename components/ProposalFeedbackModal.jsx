import { useEffect, useRef, useState } from 'react';
import {
  Modal, View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { mobileApi } from '../lib/api';
import { formatPortalWhen } from '../lib/portalHelpers';
import { colors } from '../constants/theme';
import ModalSafeArea from './ui/ModalSafeArea';

function formatDates(dates = []) {
  return dates
    .filter(Boolean)
    .map((raw) => {
      const d = new Date(raw);
      if (Number.isNaN(d.getTime())) return raw;
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    })
    .join(', ');
}

function Section({ icon, title, children }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Ionicons name={icon} size={16} color={colors.ink} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function ListItem({ title, when, extra }) {
  return (
    <View style={styles.item}>
      <View style={styles.itemTop}>
        <Text style={styles.itemTitle}>{title}</Text>
        {when ? <Text style={styles.itemWhen}>{when}</Text> : null}
      </View>
      {extra}
    </View>
  );
}

export default function ProposalFeedbackModal({ proposalId, proposalTitle, onClose, onSeen }) {
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState('');
  const onSeenRef = useRef(onSeen);
  onSeenRef.current = onSeen;

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError('');
      setDetail(null);
      try {
        const item = await mobileApi.getProposal(proposalId);
        if (!alive) return;
        setDetail(item);
        try {
          await mobileApi.markProposalFeedbackSeen(proposalId);
          if (alive) onSeenRef.current?.();
        } catch {
          // still show feedback if mark-seen fails
        }
      } catch (e) {
        if (alive) setError(e?.message || 'Could not load client feedback.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [proposalId]);

  const fb = detail?.feedbackDetail;
  const shortlisted = (fb?.interactions || []).filter((x) => x.status === 'shortlisted');
  const rejected = (fb?.interactions || []).filter((x) => x.status === 'rejected');
  const comments = fb?.comments || [];
  const visits = fb?.visitRequests || [];
  const empty = !loading && !error && !shortlisted.length && !rejected.length && !comments.length && !visits.length;

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <ModalSafeArea style={styles.safe}>
        <View style={styles.head}>
          <View style={styles.headBody}>
            <Text style={styles.headTitle}>Client feedback</Text>
            {proposalTitle ? <Text style={styles.headSub} numberOfLines={2}>{proposalTitle}</Text> : null}
          </View>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={26} color={colors.ink} />
          </Pressable>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.body}>
          {loading ? (
            <View style={styles.empty}>
              <ActivityIndicator color={colors.brand} />
              <Text style={styles.emptyText}>Loading feedback…</Text>
            </View>
          ) : error ? (
            <View style={styles.empty}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : empty ? (
            <View style={styles.empty}>
              <Ionicons name="chatbubble-outline" size={32} color={colors.faint} />
              <Text style={styles.emptyText}>
                No client feedback yet. Share the client portal link to start collecting responses.
              </Text>
            </View>
          ) : (
            <>
              {shortlisted.length ? (
                <Section icon="heart" title={`Shortlisted (${shortlisted.length})`}>
                  {shortlisted.map((x) => (
                    <ListItem key={`${x.listingId}-short`} title={x.listingLabel} when={formatPortalWhen(x.updatedAt)} />
                  ))}
                </Section>
              ) : null}

              {visits.length ? (
                <Section icon="calendar-outline" title={`Visit requests (${visits.length})`}>
                  {visits.map((x, i) => (
                    <ListItem
                      key={`${x.listingId}-visit-${i}`}
                      title={x.listingLabel}
                      when={formatPortalWhen(x.createdAt)}
                      extra={(
                        <>
                          {x.preferredDates?.length ? (
                            <Text style={styles.extra}>Preferred: {formatDates(x.preferredDates)}</Text>
                          ) : null}
                          {x.note ? <Text style={styles.note}>&ldquo;{x.note}&rdquo;</Text> : null}
                        </>
                      )}
                    />
                  ))}
                </Section>
              ) : null}

              {comments.length ? (
                <Section icon="chatbubble-outline" title={`Comments (${comments.length})`}>
                  {comments.map((x, i) => (
                    <ListItem
                      key={`${x.listingId}-cmt-${i}`}
                      title={x.listingLabel}
                      when={formatPortalWhen(x.createdAt)}
                      extra={<Text style={styles.comment}>{x.text}</Text>}
                    />
                  ))}
                </Section>
              ) : null}

              {rejected.length ? (
                <Section icon="close-circle-outline" title={`Not interested (${rejected.length})`}>
                  {rejected.map((x) => (
                    <ListItem key={`${x.listingId}-rej`} title={x.listingLabel} when={formatPortalWhen(x.updatedAt)} />
                  ))}
                </Section>
              ) : null}
            </>
          )}
        </ScrollView>
      </ModalSafeArea>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  head: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headBody: { flex: 1, paddingRight: 12 },
  headTitle: { fontSize: 17, fontWeight: '800', color: colors.ink },
  headSub: { fontSize: 13, color: colors.muted, marginTop: 4 },
  scroll: { flex: 1 },
  body: { flexGrow: 1, padding: 16, paddingBottom: 32 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12, minHeight: 240 },
  emptyText: { color: colors.muted, textAlign: 'center', lineHeight: 20 },
  errorText: { color: colors.danger, textAlign: 'center' },
  section: { marginBottom: 20 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.ink },
  item: {
    backgroundColor: colors.surface2, borderRadius: 10, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: colors.border,
  },
  itemTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  itemTitle: { flex: 1, fontSize: 14, fontWeight: '650', color: colors.ink },
  itemWhen: { fontSize: 11, color: colors.muted },
  extra: { fontSize: 12, color: colors.muted, marginTop: 6 },
  note: { fontSize: 13, color: colors.ink, fontStyle: 'italic', marginTop: 6 },
  comment: { fontSize: 13, color: colors.ink, marginTop: 6, lineHeight: 18 },
});
