import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, Alert, Image, Modal } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../context/AuthContext';
import { isAdmin } from '../../../lib/access';
import { mobileApi } from '../../../lib/api';
import { formatDate } from '../../../lib/format';
import { dayLabel, formatRupees, paidByLabel } from '../../../lib/expenses';
import ModalSafeArea from '../../../components/ui/ModalSafeArea';
import { colors } from '../../../constants/theme';

function Row({ icon, label, value }) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={18} color={colors.muted} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function ExpenseDetailScreen() {
  const { id } = useLocalSearchParams();
  const qc = useQueryClient();
  const { user } = useAuth();
  const admin = isAdmin(user);
  const [busy, setBusy] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);

  const q = useQuery({ queryKey: ['expense', String(id)], queryFn: () => mobileApi.getExpense(String(id)) });
  const e = q.data;

  const refreshLists = () => {
    qc.invalidateQueries({ queryKey: ['expenses'] });
    qc.invalidateQueries({ queryKey: ['expense-summary'] });
  };

  const settle = async (settled) => {
    setBusy(true);
    try {
      const item = await mobileApi.settleExpense(e.id, settled);
      qc.setQueryData(['expense', String(id)], item);
      refreshLists();
    } catch (err) {
      Alert.alert('Could not update', err.message || 'Try again');
    } finally {
      setBusy(false);
    }
  };

  const remove = () => {
    Alert.alert('Delete expense?', `${formatRupees(e.amount)} · ${e.category?.name}`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await mobileApi.deleteExpense(e.id);
            refreshLists();
            router.back();
          } catch (err) {
            Alert.alert('Could not delete', err.message || 'Try again');
            setBusy(false);
          }
        },
      },
    ]);
  };

  if (q.isLoading) return <ActivityIndicator style={{ marginTop: 40 }} color={colors.brand} />;
  if (!e) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>{q.error?.message || 'Expense not found'}</Text>
      </View>
    );
  }

  const status = e.paidBy === 'company' ? null : e.settled ? `Paid back ${e.settledAt ? `on ${formatDate(e.settledAt)}` : ''}` : 'Still to be paid back';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name={e.category?.icon || 'pricetag-outline'} size={22} color={colors.brandInk} />
        </View>
        <Text style={styles.amount}>{formatRupees(e.amount)}</Text>
        <Text style={styles.category}>{e.category?.name}</Text>
        {e.note ? <Text style={styles.note}>{e.note}</Text> : null}
        {status ? (
          <View style={[styles.status, e.settled ? styles.statusDone : styles.statusDue]}>
            <Ionicons name={e.settled ? 'checkmark-circle' : 'time-outline'} size={14} color={e.settled ? colors.brandInk : '#9A5B00'} />
            <Text style={[styles.statusText, { color: e.settled ? colors.brandInk : '#9A5B00' }]}>{status}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.card}>
        <Row icon="calendar-outline" label="Date" value={`${dayLabel(e.date)}${dayLabel(e.date).includes(',') ? '' : ` · ${formatDate(e.date)}`}`} />
        <Row icon="person-outline" label="Whose" value={e.person?.name || '—'} />
        <Row icon="wallet-outline" label="Paid" value={paidByLabel(e)} />
        <Row icon="create-outline" label="Added by" value={`${e.createdBy?.name || '—'} · ${formatDate(e.createdAt)}`} />
      </View>

      {e.receipt?.url ? (
        <Pressable style={styles.card} onPress={() => setShowReceipt(true)}>
          <Text style={styles.cardTitle}>Bill</Text>
          <Image source={{ uri: e.receipt.url }} style={styles.receipt} resizeMode="cover" />
        </Pressable>
      ) : null}

      {admin && e.paidBy !== 'company' ? (
        <Pressable
          style={[styles.btn, e.settled ? styles.btnGhost : styles.btnPrimary]}
          onPress={() => settle(!e.settled)}
          disabled={busy}
        >
          {busy ? <ActivityIndicator color={e.settled ? colors.ink : '#FFFFFF'} /> : (
            <Text style={e.settled ? styles.btnGhostText : styles.btnPrimaryText}>
              {e.settled ? 'Mark as not paid back' : `Mark as paid back to ${e.paidBy === 'other' ? e.paidByName || 'them' : e.person?.name || 'them'}`}
            </Text>
          )}
        </Pressable>
      ) : null}

      {e.canEdit ? (
        <View style={styles.actions}>
          <Pressable style={[styles.btn, styles.btnGhost, { flex: 1 }]} onPress={() => router.push(`/(tabs)/expenses/new?id=${e.id}`)} disabled={busy}>
            <Text style={styles.btnGhostText}>Edit</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.btnDanger, { flex: 1 }]} onPress={remove} disabled={busy}>
            <Text style={styles.btnDangerText}>Delete</Text>
          </Pressable>
        </View>
      ) : (
        <Text style={styles.locked}>This expense has been paid back, so only an admin can change it.</Text>
      )}

      <Modal visible={showReceipt} animationType="fade" onRequestClose={() => setShowReceipt(false)}>
        <ModalSafeArea style={{ backgroundColor: '#000' }}>
          <Pressable style={styles.close} onPress={() => setShowReceipt(false)} hitSlop={12}>
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </Pressable>
          <Image source={{ uri: e.receipt?.url }} style={{ flex: 1 }} resizeMode="contain" />
        </ModalSafeArea>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface2 },
  content: { padding: 16, paddingBottom: 40, gap: 12 },
  hero: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 18, padding: 20, borderWidth: 1, borderColor: colors.border },
  heroIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  amount: { fontSize: 34, fontWeight: '800', color: colors.ink, marginTop: 10 },
  category: { fontSize: 15, fontWeight: '700', color: colors.brandInk, marginTop: 2 },
  note: { fontSize: 14, color: colors.ink, marginTop: 10, textAlign: 'center', lineHeight: 20 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 12, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  statusDue: { backgroundColor: '#FFF4E0' },
  statusDone: { backgroundColor: colors.brandSoft },
  statusText: { fontSize: 12, fontWeight: '700' },
  card: { backgroundColor: colors.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.border },
  cardTitle: { fontSize: 13, fontWeight: '800', color: colors.ink, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9 },
  rowLabel: { width: 76, fontSize: 13, color: colors.muted },
  rowValue: { flex: 1, fontSize: 14, color: colors.ink, fontWeight: '600', textAlign: 'right' },
  receipt: { width: '100%', height: 220, borderRadius: 12, backgroundColor: colors.surface2 },
  actions: { flexDirection: 'row', gap: 10 },
  btn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  btnPrimary: { backgroundColor: colors.brand },
  btnPrimaryText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  btnGhost: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  btnGhostText: { color: colors.ink, fontWeight: '700', fontSize: 15 },
  btnDanger: { backgroundColor: '#FDECEC' },
  btnDangerText: { color: colors.danger, fontWeight: '700', fontSize: 15 },
  locked: { fontSize: 12, color: colors.muted, textAlign: 'center' },
  close: { position: 'absolute', top: 50, right: 20, zIndex: 2 },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  missingText: { fontSize: 15, color: colors.muted },
});
