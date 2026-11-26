import { useEffect, useMemo, useState } from 'react';
import {
  View, Text, TextInput, ScrollView, Pressable, StyleSheet, ActivityIndicator, Alert, Switch, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useQuery } from '@tanstack/react-query';
import { mobileApi } from '../../../../lib/api';
import { sendByEmail, sendOnWhatsApp, shareProposalPdf } from '../../../../lib/voProposal';
import { VERTICALS } from '../../../../constants/inventory';
import { colors } from '../../../../constants/theme';

const V = VERTICALS['virtual-office'];

/**
 * Send a virtual office proposal (`?ids=a,b`): locations, prices, what's included and our bank
 * details. WhatsApp and email get the text; the PDF is offered when a picked office has photos.
 */
export default function VirtualOfficeProposalScreen() {
  const { ids: idsParam } = useLocalSearchParams();
  const ids = useMemo(() => String(idsParam || '').split(',').map((s) => s.trim()).filter(Boolean), [idsParam]);
  const [clientName, setClientName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [withAddress, setWithAddress] = useState(false);
  const [channel, setChannel] = useState('whatsapp');
  const [edited, setEdited] = useState(null); // text the user changed by hand, for this channel
  const [pdfBusy, setPdfBusy] = useState(false);
  const [debouncedName, setDebouncedName] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedName(clientName.trim()), 400);
    return () => clearTimeout(t);
  }, [clientName]);

  const body = { ids, clientName: debouncedName, channel, withAddress };
  const q = useQuery({
    queryKey: ['vo-proposal', body],
    queryFn: () => mobileApi.getVirtualOfficeProposal(body),
    enabled: ids.length > 0,
    placeholderData: (prev) => prev,
  });

  // A new draft from the server replaces hand edits only when the inputs change.
  useEffect(() => { setEdited(null); }, [debouncedName, channel, withAddress]);

  const text = edited ?? q.data?.text ?? '';
  const subject = q.data?.subject || 'Virtual Office – SpaceWallah';
  const hasPhotos = Boolean(q.data?.hasPhotos);

  const copy = async () => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', 'The proposal text is on your clipboard.');
  };

  /** Text for a channel: what's on screen for the shown one, a fresh draft for the other. */
  const draftFor = async (ch) => {
    if (ch === channel && text) return { text, subject };
    return mobileApi.getVirtualOfficeProposal({ ids, clientName: clientName.trim(), channel: ch, withAddress });
  };

  const sendWhatsApp = async () => {
    try {
      const d = await draftFor('whatsapp');
      await sendOnWhatsApp(d.text, phone);
    } catch (err) {
      Alert.alert('WhatsApp', err.message || 'Could not prepare the message');
    }
  };

  const sendEmail = async () => {
    try {
      const d = await draftFor('email');
      await sendByEmail(d, email);
    } catch (err) {
      Alert.alert('Email', err.message || 'Could not prepare the email');
    }
  };

  const sharePdf = async () => {
    setPdfBusy(true);
    try {
      await Clipboard.setStringAsync(text).catch(() => {});
      await shareProposalPdf({ ids, clientName: clientName.trim(), withAddress }, { message: text });
    } catch (err) {
      Alert.alert('PDF', err.message || 'Could not make the PDF');
    } finally {
      setPdfBusy(false);
    }
  };

  if (!ids.length) {
    return (
      <View style={styles.center}><Text style={styles.muted}>Pick at least one virtual office first.</Text></View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Client</Text>
          <TextInput style={styles.input} value={clientName} onChangeText={setClientName} placeholder="Client name" placeholderTextColor={colors.faint} />
          <View style={styles.two}>
            <TextInput style={[styles.input, { flex: 1 }]} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="WhatsApp number" placeholderTextColor={colors.faint} />
            <TextInput style={[styles.input, { flex: 1 }]} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="Email" placeholderTextColor={colors.faint} />
          </View>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchLabel}>Include full address</Text>
              <Text style={styles.switchHint}>Off: only the locality and city are shared.</Text>
            </View>
            <Switch value={withAddress} onValueChange={setWithAddress} trackColor={{ true: V.color }} />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.previewHead}>
            <Text style={styles.cardTitle}>{ids.length} location{ids.length === 1 ? '' : 's'} · message</Text>
            <View style={styles.seg}>
              {[['whatsapp', 'WhatsApp'], ['email', 'Email']].map(([k, label]) => (
                <Pressable key={k} style={[styles.segBtn, channel === k && { backgroundColor: V.color }]} onPress={() => setChannel(k)}>
                  <Text style={[styles.segText, channel === k && { color: '#fff' }]}>{label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          {q.isLoading ? <ActivityIndicator color={V.color} style={{ marginVertical: 20 }} /> : null}
          {q.error ? <Text style={styles.error}>{q.error.message}</Text> : null}
          {text ? (
            <TextInput style={styles.preview} value={text} onChangeText={setEdited} multiline scrollEnabled={false} />
          ) : null}
          <Text style={styles.hint}>You can edit the text before sending.</Text>
          <Pressable style={styles.copy} onPress={copy} disabled={!text}>
            <Ionicons name="copy-outline" size={15} color={colors.ink} />
            <Text style={styles.copyText}>Copy text</Text>
          </Pressable>
        </View>
      </ScrollView>

      <View style={styles.bar}>
        <Pressable style={[styles.btn, { backgroundColor: '#25D366' }]} onPress={sendWhatsApp} disabled={!text}>
          <Ionicons name="logo-whatsapp" size={18} color="#fff" />
          <Text style={styles.btnTextOn}>WhatsApp</Text>
        </Pressable>
        <Pressable style={[styles.btn, styles.btnGhost]} onPress={sendEmail} disabled={!text}>
          <Ionicons name="mail-outline" size={18} color={colors.ink} />
          <Text style={styles.btnText}>Email</Text>
        </Pressable>
        <Pressable
          style={[styles.btn, styles.btnGhost, !hasPhotos && { opacity: 0.45 }]}
          onPress={hasPhotos ? sharePdf : () => Alert.alert('PDF needs photos', 'Add photos to at least one of these virtual offices to send a PDF. WhatsApp and email work without them.')}
          disabled={pdfBusy || !text}
        >
          {pdfBusy ? <ActivityIndicator color={colors.ink} /> : (
            <>
              <Ionicons name="document-attach-outline" size={18} color={colors.ink} />
              <Text style={styles.btnText}>PDF</Text>
            </>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface2 },
  content: { padding: 16, paddingBottom: 24, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  muted: { color: colors.muted, fontSize: 15 },
  card: { backgroundColor: colors.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.border, gap: 10 },
  cardTitle: { fontSize: 14, fontWeight: '800', color: colors.ink },
  input: {
    backgroundColor: colors.surface2, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11,
    fontSize: 15, color: colors.ink, borderWidth: 1, borderColor: colors.border,
  },
  two: { flexDirection: 'row', gap: 8 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  switchLabel: { fontSize: 14, fontWeight: '700', color: colors.ink },
  switchHint: { fontSize: 12, color: colors.muted, marginTop: 1 },
  previewHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  seg: { flexDirection: 'row', gap: 4, backgroundColor: colors.surface2, borderRadius: 10, padding: 3 },
  segBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  segText: { fontSize: 12.5, fontWeight: '700', color: colors.ink },
  preview: {
    fontSize: 13.5, lineHeight: 20, color: colors.ink, backgroundColor: '#F7FBF7', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: colors.border, textAlignVertical: 'top',
  },
  hint: { fontSize: 11.5, color: colors.faint },
  error: { color: colors.danger },
  copy: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 6 },
  copyText: { fontSize: 13, fontWeight: '700', color: colors.ink },
  bar: {
    flexDirection: 'row', gap: 8, padding: 12, paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
  },
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13, borderRadius: 12 },
  btnGhost: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  btnText: { fontSize: 14, fontWeight: '700', color: colors.ink },
  btnTextOn: { fontSize: 14, fontWeight: '800', color: '#fff' },
});
