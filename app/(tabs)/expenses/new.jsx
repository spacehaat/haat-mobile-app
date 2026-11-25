import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, ScrollView, Pressable, StyleSheet, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../context/AuthContext';
import { isAdmin } from '../../../lib/access';
import { mobileApi } from '../../../lib/api';
import { PAID_BY, dayLabel, shiftDay, todayIso } from '../../../lib/expenses';
import { IMAGE_MEDIA_TYPES, assetToFile } from '../../../components/space-editor/fields';
import DatePickerModal from '../../../components/expenses/DatePickerModal';
import PersonPickerModal from '../../../components/expenses/PersonPickerModal';
import CategoryEditorModal from '../../../components/expenses/CategoryEditorModal';
import { colors } from '../../../constants/theme';

/** Add an expense, or edit one (`?id=`). Built to be quick: amount, category, save. */
export default function ExpenseFormScreen() {
  const { id } = useLocalSearchParams();
  const editId = typeof id === 'string' && id ? id : null;
  const navigation = useNavigation();
  const qc = useQueryClient();
  const { user } = useAuth();
  const admin = isAdmin(user);

  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [savedCategory, setSavedCategory] = useState(null);
  const [date, setDate] = useState(todayIso());
  const [person, setPerson] = useState({ userId: user?.id || null, name: user?.name || '' });
  const [paidBy, setPaidBy] = useState('company');
  const [paidByName, setPaidByName] = useState('');
  const [note, setNote] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(!editId);
  const [showDate, setShowDate] = useState(false);
  const [showPerson, setShowPerson] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: editId ? 'Edit expense' : 'Add expense' });
  }, [navigation, editId]);

  const categoriesQ = useQuery({ queryKey: ['expense-categories'], queryFn: () => mobileApi.listExpenseCategories() });
  const peopleQ = useQuery({ queryKey: ['expense-people'], queryFn: () => mobileApi.listExpensePeople(), enabled: admin });
  const activeCategories = categoriesQ.data || [];
  // When editing, keep showing the expense's own category even if it has been switched off since.
  const categories = savedCategory && !activeCategories.some((c) => c.id === savedCategory.id) ? [...activeCategories, savedCategory] : activeCategories;

  // Staff usually pay themselves first; the company is the usual payer for an admin's entries.
  useEffect(() => {
    if (!editId && !admin) setPaidBy('self');
  }, [editId, admin]);

  useEffect(() => {
    if (!editId) return;
    mobileApi.getExpense(editId)
      .then((e) => {
        setAmount(String(e.amount));
        setCategoryId(e.category?.id || '');
        setSavedCategory(e.category || null);
        setDate(e.date);
        setPerson({ userId: e.person?.userId || null, name: e.person?.name || '' });
        setPaidBy(e.paidBy);
        setPaidByName(e.paidByName || '');
        setNote(e.note || '');
        setReceipt(e.receipt);
        setLoaded(true);
      })
      .catch((err) => {
        Alert.alert('Could not open expense', err.message || 'Try again');
        router.back();
      });
  }, [editId]);

  const pickReceipt = async (fromCamera) => {
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(fromCamera ? 'Camera access needed' : 'Photos access needed', 'Allow access in Settings to attach a bill.');
      return;
    }
    const opts = { mediaTypes: IMAGE_MEDIA_TYPES, quality: 0.6 };
    const res = fromCamera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (res.canceled || !res.assets?.length) return;
    setUploading(true);
    try {
      const [up] = await mobileApi.uploadImages([assetToFile(res.assets[0])], 'expenses');
      if (up?.url) setReceipt({ key: up.key || '', url: up.url });
    } catch (err) {
      Alert.alert('Upload failed', err.message || 'Could not upload the bill');
    } finally {
      setUploading(false);
    }
  };

  const chooseReceipt = () => {
    Alert.alert('Attach bill', undefined, [
      { text: 'Take photo', onPress: () => pickReceipt(true) },
      { text: 'Choose from photos', onPress: () => pickReceipt(false) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const save = async () => {
    const value = Number(String(amount).replace(/,/g, ''));
    if (!Number.isFinite(value) || value <= 0) {
      Alert.alert('Amount needed', 'Enter how much was spent.');
      return;
    }
    if (!categoryId) {
      Alert.alert('Category needed', 'Choose what the money was spent on.');
      return;
    }
    if (paidBy === 'other' && !paidByName.trim()) {
      Alert.alert('Who paid?', 'Enter the name of the person who paid.');
      return;
    }
    const payload = {
      amount: value,
      categoryId,
      date,
      note: note.trim(),
      paidBy,
      paidByName: paidBy === 'other' ? paidByName.trim() : '',
      receipt: receipt?.url ? receipt : null,
      ...(admin ? (person.userId ? { personUserId: person.userId } : { personName: person.name }) : {}),
    };
    setSaving(true);
    try {
      if (editId) await mobileApi.updateExpense(editId, payload);
      else await mobileApi.createExpense(payload);
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['expense-summary'] });
      qc.invalidateQueries({ queryKey: ['expense'] });
      qc.invalidateQueries({ queryKey: ['expense-people'] });
      router.back();
    } catch (err) {
      Alert.alert('Could not save', err.message || 'Try again');
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) return <ActivityIndicator style={{ marginTop: 40 }} color={colors.brand} />;

  const today = todayIso();
  const yesterday = shiftDay(today, -1);
  const paidSelfLabel = admin && person.userId !== user?.id ? `${person.name.split(' ')[0] || 'They'} paid` : 'I paid';

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.amountBox}>
          <Text style={styles.rupee}>₹</Text>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={(t) => setAmount(t.replace(/[^0-9.]/g, ''))}
            placeholder="0"
            placeholderTextColor={colors.faint}
            keyboardType="decimal-pad"
            autoFocus={!editId}
            maxLength={11}
          />
        </View>

        <Text style={styles.label}>Category</Text>
        <View style={styles.wrap}>
          {categories.map((c) => {
            const active = c.id === categoryId;
            return (
              <Pressable key={c.id} style={[styles.catChip, active && styles.catChipActive]} onPress={() => setCategoryId(c.id)}>
                <Ionicons name={c.icon} size={16} color={active ? '#FFFFFF' : colors.brandInk} />
                <Text style={[styles.catText, active && styles.catTextActive]}>{c.name}</Text>
              </Pressable>
            );
          })}
          {admin ? (
            <Pressable style={[styles.catChip, styles.catChipNew]} onPress={() => setShowNewCategory(true)}>
              <Ionicons name="add" size={16} color={colors.muted} />
              <Text style={[styles.catText, { color: colors.muted }]}>New</Text>
            </Pressable>
          ) : null}
          {categoriesQ.isLoading ? <ActivityIndicator color={colors.brand} /> : null}
        </View>

        <Text style={styles.label}>Date</Text>
        <View style={styles.wrap}>
          {[{ v: today, l: 'Today' }, { v: yesterday, l: 'Yesterday' }].map((d) => (
            <Pressable key={d.v} style={[styles.pill, date === d.v && styles.pillActive]} onPress={() => setDate(d.v)}>
              <Text style={date === d.v ? styles.pillActiveText : styles.pillText}>{d.l}</Text>
            </Pressable>
          ))}
          <Pressable style={[styles.pill, date !== today && date !== yesterday && styles.pillActive]} onPress={() => setShowDate(true)}>
            <Ionicons name="calendar-outline" size={15} color={date !== today && date !== yesterday ? '#FFFFFF' : colors.ink} />
            <Text style={date !== today && date !== yesterday ? styles.pillActiveText : styles.pillText}>
              {date !== today && date !== yesterday ? dayLabel(date) : 'Other date'}
            </Text>
          </Pressable>
        </View>

        {admin ? (
          <>
            <Text style={styles.label}>Whose expense</Text>
            <Pressable style={styles.select} onPress={() => setShowPerson(true)}>
              <Ionicons name="person-circle-outline" size={20} color={colors.muted} />
              <Text style={styles.selectText}>{person.name || 'Choose'}{person.userId === user?.id ? ' (you)' : ''}</Text>
              <Ionicons name="chevron-down" size={18} color={colors.muted} />
            </Pressable>
          </>
        ) : null}

        <Text style={styles.label}>Paid by</Text>
        <View style={styles.segment}>
          {PAID_BY.map((p) => {
            const active = paidBy === p.value;
            return (
              <Pressable key={p.value} style={[styles.segBtn, active && styles.segBtnActive]} onPress={() => setPaidBy(p.value)}>
                <Ionicons name={p.icon} size={16} color={active ? '#FFFFFF' : colors.ink} />
                <Text style={[styles.segText, active && styles.segTextActive]}>{p.value === 'self' ? paidSelfLabel : p.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.hint}>{PAID_BY.find((p) => p.value === paidBy)?.hint}</Text>
        {paidBy === 'other' ? (
          <TextInput
            style={styles.input}
            placeholder="Name of the person who paid"
            placeholderTextColor={colors.faint}
            value={paidByName}
            onChangeText={setPaidByName}
            maxLength={120}
          />
        ) : null}

        <Text style={styles.label}>Note</Text>
        <TextInput
          style={[styles.input, styles.noteInput]}
          placeholder="What was it for? e.g. Cab to client site visit"
          placeholderTextColor={colors.faint}
          value={note}
          onChangeText={setNote}
          multiline
          maxLength={1000}
        />

        <Text style={styles.label}>Bill (optional)</Text>
        {receipt?.url ? (
          <View style={styles.receiptRow}>
            <Image source={{ uri: receipt.url }} style={styles.receiptThumb} />
            <Pressable style={styles.smallBtn} onPress={chooseReceipt} disabled={uploading}>
              <Text style={styles.smallBtnText}>Change</Text>
            </Pressable>
            <Pressable style={styles.smallBtn} onPress={() => setReceipt(null)}>
              <Text style={[styles.smallBtnText, { color: colors.danger }]}>Remove</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable style={styles.receiptAdd} onPress={chooseReceipt} disabled={uploading}>
            {uploading ? <ActivityIndicator color={colors.brand} /> : <Ionicons name="camera-outline" size={20} color={colors.brandInk} />}
            <Text style={styles.receiptAddText}>{uploading ? 'Uploading…' : 'Add photo of bill'}</Text>
          </Pressable>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={[styles.saveBtn, (saving || uploading) && { opacity: 0.6 }]} onPress={save} disabled={saving || uploading}>
          {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveText}>{editId ? 'Save changes' : 'Save expense'}</Text>}
        </Pressable>
      </View>

      <DatePickerModal visible={showDate} value={date} onSelect={setDate} onClose={() => setShowDate(false)} />
      {admin ? (
        <PersonPickerModal
          visible={showPerson}
          people={peopleQ.data}
          meId={user?.id}
          onSelect={setPerson}
          onClose={() => setShowPerson(false)}
        />
      ) : null}
      <CategoryEditorModal
        visible={showNewCategory}
        onClose={() => setShowNewCategory(false)}
        onSaved={(item) => {
          qc.setQueryData(['expense-categories'], (prev) => [...(prev || []), item]);
          setCategoryId(item.id);
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { padding: 16, paddingBottom: 40 },
  amountBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, marginBottom: 6, borderRadius: 18, backgroundColor: colors.brandSoft },
  rupee: { fontSize: 34, fontWeight: '700', color: colors.brandInk, marginRight: 4 },
  amountInput: { fontSize: 42, fontWeight: '800', color: colors.ink, minWidth: 80, textAlign: 'center', padding: 0 },
  label: { fontSize: 12, fontWeight: '800', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 20, marginBottom: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, backgroundColor: colors.brandSoft, borderWidth: 1, borderColor: colors.brandSoft },
  catChipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  catChipNew: { backgroundColor: colors.surface, borderColor: colors.border, borderStyle: 'dashed' },
  catText: { fontSize: 14, fontWeight: '600', color: colors.brandInk },
  catTextActive: { color: '#FFFFFF' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: colors.surface2 },
  pillActive: { backgroundColor: colors.ink },
  pillText: { fontSize: 14, fontWeight: '600', color: colors.ink },
  pillActiveText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  select: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12 },
  selectText: { flex: 1, fontSize: 15, color: colors.ink, fontWeight: '600' },
  segment: { flexDirection: 'row', gap: 6 },
  segBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 11, borderRadius: 12, backgroundColor: colors.surface2 },
  segBtnActive: { backgroundColor: colors.brand },
  segText: { fontSize: 13, fontWeight: '700', color: colors.ink },
  segTextActive: { color: '#FFFFFF' },
  hint: { fontSize: 12, color: colors.muted, marginTop: 6 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11, fontSize: 15, color: colors.ink, marginTop: 8 },
  noteInput: { minHeight: 70, textAlignVertical: 'top', marginTop: 0 },
  receiptAdd: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border, borderRadius: 12, padding: 14, justifyContent: 'center' },
  receiptAddText: { fontSize: 14, fontWeight: '600', color: colors.brandInk },
  receiptRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  receiptThumb: { width: 64, height: 64, borderRadius: 10, backgroundColor: colors.surface2 },
  smallBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: colors.surface2 },
  smallBtnText: { fontSize: 13, fontWeight: '700', color: colors.ink },
  footer: { padding: 16, paddingBottom: 24, backgroundColor: colors.surface, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  saveBtn: { backgroundColor: colors.brand, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  saveText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});
