import { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { mobileApi } from '../../lib/api';
import { colors } from '../../constants/theme';
import { Group, ChoiceChips } from './fields';

const METHODS = [
  { value: 'call', label: 'Phone call' },
  { value: 'visit', label: 'Site visit' },
  { value: 'documents', label: 'Documents' },
];
const METHOD_TEXT = { call: 'phone call with the operator', visit: 'site visit by our team', documents: 'documents from the operator' };

const dateText = (at) => {
  const d = at ? new Date(at) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
};

/**
 * Website "Verified on <date>" badge for a coworking space or PG. Saves straight away (not with the
 * form's Save button) and records today's date and who did it.
 */
export default function VerificationBox({ listingId, value, color = colors.brand }) {
  const [v, setV] = useState(value || { at: null, by: '', method: '' });
  const [method, setMethod] = useState(value?.method || 'call');
  const [busy, setBusy] = useState(false);
  const date = dateText(v.at);

  const save = async (body) => {
    setBusy(true);
    try {
      const next = await mobileApi.setWebsiteVerification(listingId, body);
      setV(next || { at: null, by: '', method: '' });
    } catch (err) {
      Alert.alert('Not saved', err.message || 'Could not update the verification.');
    } finally {
      setBusy(false);
    }
  };

  const confirm = () => Alert.alert(
    'Mark as verified?',
    'Only do this after confirming the address, prices and availability with the operator. The website will show "Verified on" today\'s date.',
    [{ text: 'Cancel', style: 'cancel' }, { text: 'Verify', onPress: () => save({ method }) }],
  );

  return (
    <Group title="Website verification" hint='Shows "Verified on <date>" on the website'>
      <View style={[s.status, date ? { backgroundColor: '#E6F4EC' } : null]}>
        <Ionicons name={date ? 'shield-checkmark' : 'shield-outline'} size={18} color={date ? '#1F7A45' : colors.muted} />
        <Text style={[s.statusText, date ? { color: '#1F7A45' } : null]}>
          {date
            ? `Verified on ${date}${v.by ? ` by ${v.by}` : ''}${v.method ? ` · ${METHOD_TEXT[v.method] || v.method}` : ''}`
            : 'Not verified — no badge on the website.'}
        </Text>
      </View>
      <ChoiceChips label="How was it checked?" options={METHODS} value={method} onChange={setMethod} />
      <View style={s.row}>
        <Pressable style={[s.btn, { backgroundColor: color }, busy && s.off]} onPress={confirm} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <Ionicons name="checkmark-circle" size={17} color="#fff" />}
          <Text style={s.btnText}>{date ? 'Verify again today' : 'Mark as verified'}</Text>
        </Pressable>
        {date ? (
          <Pressable style={[s.ghost, busy && s.off]} onPress={() => save({ remove: true })} disabled={busy}>
            <Text style={s.ghostText}>Remove</Text>
          </Pressable>
        ) : null}
      </View>
    </Group>
  );
}

const s = StyleSheet.create({
  status: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10, backgroundColor: colors.surface2, marginBottom: 10 },
  statusText: { flex: 1, fontSize: 13.5, color: colors.muted, fontWeight: '600' },
  row: { flexDirection: 'row', gap: 8 },
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12 },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  ghost: { paddingHorizontal: 16, justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  ghostText: { fontWeight: '700', color: colors.danger },
  off: { opacity: 0.6 },
});
