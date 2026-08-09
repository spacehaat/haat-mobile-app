import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, ScrollView, Pressable, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { mobileApi } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import { canAssignLeads } from '../../../lib/access';
import { colors } from '../../../constants/theme';
import { SAMPLE_ENQUIRY, CITIES } from '../../../constants/match';
import AssigneePicker from '../../../components/leads/AssigneePicker';

const PARSE_LABEL = { openai: 'AI parsed', rules: 'Smart parsed' };

function emptyForm() {
  return {
    name: '', contact: '', email: '', company: '',
    city: 'Bangalore', microlocation: '', seats: '',
    budget: '', moveIn: '', rawEnquiry: '', assigneeId: '',
  };
}

export default function NewLeadScreen() {
  const { user } = useAuth();
  const canAssign = canAssignLeads(user);
  const [enquiry, setEnquiry] = useState(SAMPLE_ENQUIRY);
  const [form, setForm] = useState(emptyForm());
  const [parseSource, setParseSource] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [assigneeOptions, setAssigneeOptions] = useState([]);
  const [suggestedAssigneeId, setSuggestedAssigneeId] = useState('');
  const [loadingAssignees, setLoadingAssignees] = useState(false);

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    if (!canAssign || !showForm || !form.city) return;
    let cancelled = false;
    setLoadingAssignees(true);
    mobileApi.listLeadAssignees(form.city)
      .then((data) => {
        if (cancelled) return;
        setAssigneeOptions(data.items || []);
        setSuggestedAssigneeId(data.suggestedId || '');
        // Clear selection if previously chosen user is no longer in this city
        if (form.assigneeId && !(data.items || []).some((u) => u.id === form.assigneeId)) {
          setForm((f) => ({ ...f, assigneeId: '' }));
        }
      })
      .catch(() => {
        if (!cancelled) setAssigneeOptions([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingAssignees(false);
      });
    return () => { cancelled = true; };
  }, [canAssign, showForm, form.city]);

  const parseEnquiry = async () => {
    if (!enquiry.trim()) return;
    setIsParsing(true);
    try {
      const data = await mobileApi.parseLead(enquiry.trim());
      const fields = data.fields || {};
      setForm({
        name: fields.name || '',
        contact: fields.contact || fields.phone || '',
        email: fields.email || '',
        company: fields.company || '',
        city: fields.city || 'Bangalore',
        microlocation: fields.microlocation || fields.locality || '',
        seats: fields.seats ? String(fields.seats) : '',
        budget: fields.budget ? String(fields.budget) : '',
        moveIn: fields.moveIn || '',
        rawEnquiry: enquiry.trim(),
        assigneeId: '',
      });
      setParseSource(data.source);
      setShowForm(true);
    } catch (err) {
      Alert.alert('Parse failed', err.message || 'Could not parse enquiry');
    } finally {
      setIsParsing(false);
    }
  };

  const saveLead = async () => {
    if (!form.name && !form.company) {
      Alert.alert('Missing info', 'Enter at least a name or company.');
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        source: parseSource === 'openai' || parseSource === 'rules' ? 'whatsapp' : 'manual',
        name: form.name.trim(),
        contact: form.contact.trim(),
        email: form.email.trim(),
        company: form.company.trim(),
        city: form.city.trim(),
        microlocation: form.microlocation.trim(),
        seats: form.seats ? Number(form.seats) : 0,
        budget: form.budget ? Number(form.budget) : 0,
        moveIn: form.moveIn.trim(),
        rawEnquiry: form.rawEnquiry || enquiry.trim(),
        stage: 'new',
      };
      if (canAssign && form.assigneeId) {
        payload.assigneeId = form.assigneeId;
      }
      const lead = await mobileApi.createLead(payload);
      Alert.alert('Lead created', `${lead.displayTitle || lead.name || 'Lead'} added.`, [
        { text: 'View lead', onPress: () => router.replace(`/(tabs)/leads/${lead.id}`) },
        { text: 'Back to list', onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert('Could not create lead', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const busy = isParsing || isSaving;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.intro}>Paste a client message — we'll extract contact details and requirements.</Text>

          <View style={styles.panel}>
            <Text style={styles.lab}>Client enquiry</Text>
            <TextInput
              style={styles.enquiryInput}
              multiline
              value={enquiry}
              onChangeText={setEnquiry}
              placeholder="Paste WhatsApp or email…"
              placeholderTextColor={colors.faint}
              textAlignVertical="top"
            />
            <View style={styles.parseRow}>
              {parseSource ? (
                <View style={styles.sourcePill}>
                  <Ionicons name="sparkles" size={12} color={colors.brand} />
                  <Text style={styles.sourceText}>{PARSE_LABEL[parseSource] || 'Parsed'}</Text>
                </View>
              ) : <View />}
              <Pressable
                style={[styles.primaryBtn, (busy || !enquiry.trim()) && styles.btnOff]}
                disabled={busy || !enquiry.trim()}
                onPress={parseEnquiry}
              >
                {isParsing ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Ionicons name="sparkles" size={16} color="#fff" />
                    <Text style={styles.primaryBtnText}>Parse enquiry</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>

          {showForm ? (
            <View style={styles.panel}>
              <Text style={styles.lab}>Lead details</Text>
              {[
                ['Name', 'name'], ['Company', 'company'], ['Phone', 'contact'],
                ['Email', 'email'],
              ].map(([label, key]) => (
                <View key={key} style={styles.field}>
                  <Text style={styles.fieldLab}>{label}</Text>
                  <TextInput
                    style={styles.inp}
                    value={form[key]}
                    onChangeText={(v) => setField(key, v)}
                    autoCapitalize={key === 'email' ? 'none' : 'sentences'}
                  />
                </View>
              ))}

              <View style={styles.field}>
                <Text style={styles.fieldLab}>City</Text>
                <View style={styles.chips}>
                  {CITIES.map((c) => {
                    const on = form.city === c;
                    return (
                      <Pressable
                        key={c}
                        style={[styles.chip, on && styles.chipOn]}
                        onPress={() => setField('city', c)}
                      >
                        <Text style={[styles.chipText, on && styles.chipTextOn]}>{c}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {[
                ['Microlocation', 'microlocation'],
                ['Seats', 'seats'], ['Budget/seat', 'budget'], ['Move-in', 'moveIn'],
              ].map(([label, key]) => (
                <View key={key} style={styles.field}>
                  <Text style={styles.fieldLab}>{label}</Text>
                  <TextInput
                    style={styles.inp}
                    value={form[key]}
                    onChangeText={(v) => setField(key, v)}
                    keyboardType={key === 'seats' || key === 'budget' ? 'numeric' : 'default'}
                  />
                </View>
              ))}

              {canAssign ? (
                <AssigneePicker
                  options={assigneeOptions}
                  value={form.assigneeId}
                  suggestedId={suggestedAssigneeId}
                  loading={loadingAssignees}
                  onChange={(id) => setField('assigneeId', id)}
                />
              ) : null}

              <Pressable
                style={[styles.primaryBtn, styles.saveBtn, busy && styles.btnOff]}
                disabled={busy}
                onPress={saveLead}
              >
                {isSaving ? <ActivityIndicator color="#fff" /> : (
                  <Text style={styles.primaryBtnText}>Create lead</Text>
                )}
              </Pressable>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface2 },
  content: { padding: 16, paddingBottom: 40 },
  intro: { fontSize: 14, color: colors.muted, lineHeight: 20, marginBottom: 12 },
  panel: {
    backgroundColor: colors.surface, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: colors.border, marginBottom: 12,
  },
  lab: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', color: colors.faint, marginBottom: 8 },
  enquiryInput: {
    minHeight: 120, borderWidth: 1, borderColor: colors.border,
    borderRadius: 10, padding: 12, fontSize: 14, color: colors.ink, backgroundColor: colors.surface2,
  },
  parseRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, gap: 8 },
  sourcePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.brandSoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999,
  },
  sourceText: { fontSize: 11, fontWeight: '700', color: colors.brand },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: colors.brand, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  btnOff: { opacity: 0.5 },
  field: { marginBottom: 12 },
  fieldLab: { fontSize: 12, fontWeight: '600', color: colors.muted, marginBottom: 6 },
  inp: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: 12, fontSize: 15, color: colors.ink, backgroundColor: colors.surface2,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
    backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border,
  },
  chipOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.ink },
  chipTextOn: { color: '#fff' },
  saveBtn: { marginTop: 8 },
});
