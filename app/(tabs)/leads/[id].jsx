import { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, Linking, TextInput,
  ActivityIndicator, RefreshControl, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { mobileApi } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import { isAdmin } from '../../../lib/access';
import { runOfflineAction } from '../../../lib/offlineQueue';
import { formatDate, isOverdue, leadSubtitle } from '../../../lib/format';
import { formatReminderDateTime, reminderStatus, activeReminderDueAt } from '@spacehaat/utils';
import LeadReminderPanel from '../../../components/leads/LeadReminderPanel';
import { STAGES, STAGE_LABEL } from '../../../constants/leads';
import StageBadge from '../../../components/ui/StageBadge';
import LoadingScreen from '../../../components/ui/LoadingScreen';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { colors } from '../../../constants/theme';
import { openWhatsApp } from '../../../lib/whatsapp';
import { initials } from '@spacehaat/utils';

export default function LeadDetailScreen() {
  const { id } = useLocalSearchParams();
  const leadId = Array.isArray(id) ? id[0] : id;
  const { user } = useAuth();
  const admin = isAdmin(user);
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const [noteText, setNoteText] = useState('');
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const { data: lead, isLoading, refetch, isRefetching, error } = useQuery({
    queryKey: ['lead', leadId],
    queryFn: () => mobileApi.getLead(leadId),
    enabled: Boolean(leadId),
  });

  const deleteMutation = useMutation({
    mutationFn: () => mobileApi.deleteLead(leadId),
    onSuccess: () => {
      setConfirmDeleteOpen(false);
      queryClient.removeQueries({ queryKey: ['lead', leadId] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      router.back();
    },
    onError: (err) => Alert.alert('Delete failed', err.message || 'Could not delete lead'),
  });

  const stageMutation = useMutation({
    mutationFn: async (stage) => {
      const result = await runOfflineAction({ type: 'UPDATE_LEAD_STAGE', leadId, stage });
      if (result?.queued) return { ...lead, stage, _offlineQueued: true };
      return result;
    },
    onSuccess: (updated) => {
      if (updated._offlineQueued) {
        Alert.alert('Saved offline', 'Stage change will sync when you reconnect.');
      }
      queryClient.setQueryData(['lead', leadId], updated);
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: (err) => Alert.alert('Update failed', err.message),
  });

  const noteMutation = useMutation({
    mutationFn: async (text) => {
      const result = await runOfflineAction({ type: 'ADD_LEAD_NOTE', leadId, text });
      if (result?.queued) {
        return {
          ...lead,
          notes: [...(lead.notes || []), { text, who: 'You (offline)', at: new Date().toISOString() }],
          _offlineQueued: true,
        };
      }
      return result;
    },
    onSuccess: (updated) => {
      if (updated._offlineQueued) {
        Alert.alert('Saved offline', 'Note will sync when you reconnect.');
      }
      queryClient.setQueryData(['lead', leadId], updated);
      setNoteText('');
    },
    onError: (err) => Alert.alert('Could not add note', err.message),
  });

  const reminderMutation = useMutation({
    mutationFn: async ({ dueAt, note }) => mobileApi.setLeadReminder(leadId, { dueAt, note }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['lead', leadId], updated);
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      Alert.alert('Reminder set', 'You will get a notification at the scheduled time.');
    },
    onError: (err) => Alert.alert('Could not set reminder', err.message || 'Try again'),
  });

  if (isLoading) return <LoadingScreen label="Loading lead…" />;
  if (error || !lead) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error?.message || 'Lead not found'}</Text>
      </View>
    );
  }

  const openMail = () => {
    if (lead.email) Linking.openURL(`mailto:${lead.email}`);
  };

  const openPhone = () => {
    if (lead.contact) Linking.openURL(`tel:${lead.contact.replace(/\s/g, '')}`);
  };

  const openWhatsAppChat = () => {
    const greeting = lead.name ? `Hi ${lead.name.split(' ')[0]}, ` : 'Hi, ';
    openWhatsApp(lead.contact, `${greeting}following up on your workspace enquiry with Spacehaat.`);
  };

  const submitNote = () => {
    const text = noteText.trim();
    if (!text || noteMutation.isPending) return;
    noteMutation.mutate(text);
  };

  const reminderDueAt = activeReminderDueAt(lead);

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.brand} />}
      >
        <View style={styles.hero}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{initials(lead.name || lead.company)}</Text></View>
          <View style={styles.heroBody}>
            <Text style={styles.title}>{lead.name || lead.company || 'Lead'}</Text>
            {lead.company && lead.name ? <Text style={styles.company}>{lead.company}</Text> : null}
            {leadSubtitle(lead) ? <Text style={styles.sub}>{leadSubtitle(lead)}</Text> : null}
          </View>
          {admin ? (
            <Pressable
              style={styles.deleteIconBtn}
              onPress={() => setConfirmDeleteOpen(true)}
              disabled={deleteMutation.isPending}
            >
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.badges}>
          <StageBadge stage={lead.stage} />
          <Text style={styles.date}><Ionicons name="calendar-outline" size={13} color={colors.muted} /> {formatDate(lead.leadDate)}</Text>
        </View>

        <View style={styles.kpis}>
          <View style={styles.kpi}><Text style={styles.kpiN}>{lead.listingIds?.length || 0}</Text><Text style={styles.kpiL}>Shortlisted</Text></View>
          <View style={styles.kpi}><Text style={styles.kpiN}>{lead.proposalIds?.length || 0}</Text><Text style={styles.kpiL}>Proposals</Text></View>
          <View style={[styles.kpi, isOverdue(reminderDueAt) && styles.kpiOverdue]}>
            <Text style={[styles.kpiN, isOverdue(reminderDueAt) && styles.kpiNOverdue]}>{formatReminderDateTime(reminderDueAt)}</Text>
            <Text style={styles.kpiL}>{reminderStatus(reminderDueAt).label}</Text>
          </View>
        </View>

        <LeadReminderPanel
          dueAt={reminderDueAt}
          saving={reminderMutation.isPending}
          onSave={(payload) => reminderMutation.mutateAsync(payload)}
        />

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Pipeline</Text>
          <Text style={styles.panelHint}>Tap a stage to update</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.stageRow}
            keyboardShouldPersistTaps="handled"
          >
            {STAGES.filter(([v]) => v).map(([value, label]) => {
              const active = lead.stage === value;
              return (
                <Pressable
                  key={value}
                  style={[styles.stagePill, active && styles.stagePillOn]}
                  onPress={() => stageMutation.mutate(value)}
                  disabled={stageMutation.isPending}
                  hitSlop={4}
                >
                  {stageMutation.isPending && active ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={[styles.stagePillText, active && styles.stagePillTextOn]}>
                      {STAGE_LABEL[value] || label}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Contact</Text>
          {lead.email ? (
            <Pressable style={styles.contactRow} onPress={openMail}>
              <Ionicons name="mail-outline" size={18} color={colors.brand} />
              <View style={styles.contactBody}>
                <Text style={styles.contactLab}>Email</Text>
                <Text style={styles.contactVal}>{lead.email}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.faint} />
            </Pressable>
          ) : null}
        {lead.contact ? (
          <Pressable style={styles.contactRow} onPress={openPhone}>
            <Ionicons name="call-outline" size={18} color={colors.brand} />
            <View style={styles.contactBody}>
              <Text style={styles.contactLab}>Phone</Text>
              <Text style={styles.contactVal}>{lead.contact}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.faint} />
          </Pressable>
        ) : null}
        {lead.contact ? (
          <Pressable style={[styles.contactRow, styles.waRow]} onPress={openWhatsAppChat}>
            <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
            <View style={styles.contactBody}>
              <Text style={styles.contactLab}>WhatsApp</Text>
              <Text style={styles.contactVal}>Send follow-up message</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.faint} />
          </Pressable>
        ) : null}
          {!lead.email && !lead.contact ? <Text style={styles.muted}>No contact details</Text> : null}
        </View>

        {(lead.city || lead.seats || lead.seatRange || lead.interestedIn?.length) ? (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Requirement</Text>
            {lead.interestedIn?.map((t) => <Text key={t} style={styles.reqLine}>• {t}</Text>)}
            {lead.city ? <Text style={styles.reqLine}>📍 {lead.city}{lead.microlocation ? ` · ${lead.microlocation}` : ''}</Text> : null}
            {lead.seatRange ? <Text style={styles.reqLine}>{lead.seatRange} seats</Text> : (lead.seats ? <Text style={styles.reqLine}>{lead.seats} seats</Text> : null)}
          </View>
        ) : null}

        {lead.rawEnquiry ? (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Original enquiry</Text>
            <Text style={styles.enquiry}>{lead.rawEnquiry}</Text>
          </View>
        ) : null}

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Notes</Text>
          {(lead.notes || []).length ? (lead.notes || []).map((n, i) => (
            <View key={`${n.at}-${i}`} style={styles.note}>
              <Text style={styles.noteMeta}>{n.who} · {formatDate(n.at)}</Text>
              <Text style={styles.noteText}>{n.text}</Text>
            </View>
          )) : <Text style={styles.muted}>No notes yet — add a follow-up below.</Text>}
        </View>
      </ScrollView>

      <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TextInput
          style={styles.noteInput}
          placeholder="Add a follow-up note…"
          placeholderTextColor={colors.faint}
          value={noteText}
          onChangeText={setNoteText}
          multiline
          maxLength={2000}
          textAlignVertical="top"
          returnKeyType="default"
          blurOnSubmit={false}
        />
        <Pressable
          style={[styles.noteBtn, (!noteText.trim() || noteMutation.isPending) && styles.noteBtnOff]}
          disabled={!noteText.trim() || noteMutation.isPending}
          onPress={submitNote}
        >
          {noteMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="add-circle-outline" size={18} color="#fff" />
              <Text style={styles.noteBtnText}>Add note</Text>
            </>
          )}
        </Pressable>
      </View>

      <ConfirmDialog
        visible={confirmDeleteOpen}
        title="Delete lead"
        message={`Delete “${lead.name || lead.company || 'this lead'}”? This cannot be undone.`}
        confirmLabel="Delete"
        busy={deleteMutation.isPending}
        onCancel={() => { if (!deleteMutation.isPending) setConfirmDeleteOpen(false); }}
        onConfirm={() => deleteMutation.mutate()}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface2 },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  error: { color: colors.danger },
  hero: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  avatar: {
    width: 52, height: 52, borderRadius: 16, backgroundColor: colors.brandSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: colors.brand, fontWeight: '800', fontSize: 17 },
  heroBody: { flex: 1 },
  deleteIconBtn: {
    width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fbe9e9', borderWidth: 1, borderColor: '#f5c4c4',
  },
  title: { fontSize: 22, fontWeight: '800', color: colors.ink },
  company: { fontSize: 14, fontWeight: '600', color: colors.muted, marginTop: 2 },
  sub: { fontSize: 13, color: colors.muted, marginTop: 4 },
  badges: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  date: { fontSize: 12, color: colors.muted },
  kpis: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  kpi: {
    flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  kpiOverdue: { borderColor: '#f5c4c4', backgroundColor: '#fbe9e9' },
  kpiN: { fontSize: 15, fontWeight: '800', color: colors.ink },
  kpiNOverdue: { color: colors.danger },
  kpiL: { fontSize: 11, color: colors.muted, marginTop: 4 },
  panel: {
    backgroundColor: colors.surface, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: colors.border, marginBottom: 12,
  },
  panelTitle: {
    fontSize: 11, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase',
    color: colors.faint, marginBottom: 4,
  },
  panelHint: { fontSize: 12, color: colors.muted, marginBottom: 10 },
  stageRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 8 },
  stagePill: {
    minHeight: 38,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
  },
  stagePillOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  stagePillText: { fontSize: 12, fontWeight: '600', color: colors.ink },
  stagePillTextOn: { color: '#fff' },
  contactRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12,
    backgroundColor: colors.surface2, borderRadius: 10, marginBottom: 8,
  },
  waRow: { backgroundColor: '#eefbf3' },
  contactBody: { flex: 1 },
  contactLab: { fontSize: 10, fontWeight: '700', color: colors.muted, textTransform: 'uppercase' },
  contactVal: { fontSize: 14, fontWeight: '600', color: colors.ink, marginTop: 2 },
  reqLine: { fontSize: 14, color: colors.ink, marginBottom: 6, lineHeight: 20 },
  enquiry: { fontSize: 14, lineHeight: 21, color: colors.muted },
  muted: { fontSize: 14, color: colors.muted, lineHeight: 20 },
  note: { marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  noteMeta: { fontSize: 11, color: colors.muted, marginBottom: 4 },
  noteText: { fontSize: 14, lineHeight: 20, color: colors.ink },
  composer: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  noteInput: {
    minHeight: 72,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: colors.ink,
    backgroundColor: colors.surface2,
  },
  noteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.brand,
    borderRadius: 12,
    paddingVertical: 14,
  },
  noteBtnOff: { opacity: 0.5 },
  noteBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
