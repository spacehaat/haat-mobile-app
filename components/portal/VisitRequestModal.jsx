import { useState } from 'react';
import {
  Modal, View, Text, Pressable, StyleSheet, TextInput, ScrollView, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';
import ModalSafeArea from '../ui/ModalSafeArea';

export default function VisitRequestModal({ visible, shortlisted, advisor, onClose, onSubmit, busy }) {
  const [date1, setDate1] = useState('');
  const [date2, setDate2] = useState('');
  const [note, setNote] = useState('');
  const [sent, setSent] = useState(false);

  const reset = () => {
    setDate1('');
    setDate2('');
    setNote('');
    setSent(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const submit = async () => {
    const preferredDates = [date1, date2].filter((d) => d.trim());
    if (!preferredDates.length) return;
    await onSubmit({ preferredDates, visitNote: note });
    setSent(true);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <ModalSafeArea style={styles.safe}>
        {sent ? (
          <View style={styles.sentWrap}>
            <View style={styles.sentRing}><Ionicons name="checkmark" size={28} color="#fff" /></View>
            <Text style={styles.sentTitle}>Visit request sent</Text>
            <Text style={styles.sentSub}>{advisor} will confirm your slot shortly.</Text>
            <Pressable style={styles.primaryBtn} onPress={handleClose}>
              <Text style={styles.primaryBtnText}>Done</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.head}>
              <View>
                <Text style={styles.headTitle}>Request a visit</Text>
                <Text style={styles.headSub}>We&apos;ll confirm a slot within a few hours</Text>
              </View>
              <Pressable onPress={handleClose} hitSlop={12}>
                <Ionicons name="close" size={26} color={colors.ink} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.body}>
              {shortlisted.map((s) => (
                <View key={s.id} style={styles.visitRow}>
                  <Image source={{ uri: s.images?.[0] }} style={styles.thumb} />
                  <View style={styles.visitInfo}>
                    <Text style={styles.visitName}>{s.operator}</Text>
                    <Text style={styles.visitSub}>{s.micro}, {s.city}</Text>
                  </View>
                </View>
              ))}
              <Text style={styles.label}>Preferred dates (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                placeholder="Date 1"
                placeholderTextColor={colors.faint}
                value={date1}
                onChangeText={setDate1}
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                placeholder="Date 2 (optional)"
                placeholderTextColor={colors.faint}
                value={date2}
                onChangeText={setDate2}
                autoCapitalize="none"
              />
              <Text style={styles.label}>Anything we should know?</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                multiline
                placeholder="e.g. Prefer mornings, team of 4 visiting"
                placeholderTextColor={colors.faint}
                value={note}
                onChangeText={setNote}
              />
            </ScrollView>
            <View style={styles.foot}>
              <Pressable style={styles.ghostBtn} onPress={handleClose}>
                <Text style={styles.ghostBtnText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.primaryBtn, busy && styles.btnOff]} onPress={submit} disabled={busy}>
                <Ionicons name="calendar-outline" size={18} color="#fff" />
                <Text style={styles.primaryBtnText}>Send request</Text>
              </Pressable>
            </View>
          </>
        )}
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
  headTitle: { fontSize: 17, fontWeight: '800', color: colors.ink },
  headSub: { fontSize: 12, color: colors.muted, marginTop: 2 },
  body: { padding: 16, paddingBottom: 24 },
  visitRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10,
    backgroundColor: colors.surface2, borderRadius: 10, marginBottom: 8,
  },
  thumb: { width: 38, height: 30, borderRadius: 6 },
  visitInfo: { flex: 1 },
  visitName: { fontSize: 13, fontWeight: '650', color: colors.ink },
  visitSub: { fontSize: 12, color: colors.muted },
  label: { fontSize: 12, fontWeight: '650', color: colors.ink, marginTop: 12, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12,
    fontSize: 15, color: colors.ink, backgroundColor: '#FAFAF8', marginBottom: 8,
  },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  foot: { flexDirection: 'row', gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: colors.border },
  ghostBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center',
  },
  ghostBtnText: { fontWeight: '700', color: colors.ink },
  primaryBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 12, backgroundColor: colors.brand,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  btnOff: { opacity: 0.5 },
  sentWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  sentRing: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.success,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  sentTitle: { fontSize: 18, fontWeight: '800', color: colors.ink },
  sentSub: { fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 8, marginBottom: 20 },
});
