import { useEffect, useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';
import { mobileApi } from '../../lib/api';
import { CATEGORY_ICONS } from '../../lib/expenses';

/** Admin: create a category, or rename / change the icon of one (`category` given). */
export default function CategoryEditorModal({ visible, category, onSaved, onClose }) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(CATEGORY_ICONS[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setName(category?.name || '');
    setIcon(category?.icon || CATEGORY_ICONS[0]);
  }, [visible, category]);

  const save = async () => {
    if (!name.trim()) {
      Alert.alert('Name needed', 'Give the category a name, e.g. Fuel or Office supplies.');
      return;
    }
    setSaving(true);
    try {
      const item = category
        ? await mobileApi.updateExpenseCategory(category.id, { name: name.trim(), icon })
        : await mobileApi.createExpenseCategory({ name: name.trim(), icon });
      onSaved(item);
      onClose();
    } catch (err) {
      Alert.alert('Could not save', err.message || 'Try again');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={onClose}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.title}>{category ? 'Edit category' : 'New category'}</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Fuel, Office supplies"
              placeholderTextColor={colors.faint}
              value={name}
              onChangeText={setName}
              autoFocus
              maxLength={60}
            />
            <Text style={styles.label}>Icon</Text>
            <View style={styles.icons}>
              {CATEGORY_ICONS.map((ic) => (
                <Pressable key={ic} style={[styles.iconBtn, icon === ic && styles.iconBtnActive]} onPress={() => setIcon(ic)}>
                  <Ionicons name={ic} size={20} color={icon === ic ? '#FFFFFF' : colors.brandInk} />
                </Pressable>
              ))}
            </View>
            <View style={styles.actions}>
              <Pressable style={[styles.btn, styles.btnGhost]} onPress={onClose}>
                <Text style={styles.btnGhostText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.btn, styles.btnPrimary]} onPress={save} disabled={saving}>
                {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.btnPrimaryText}>Save</Text>}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', padding: 24 },
  sheet: { backgroundColor: colors.surface, borderRadius: 18, padding: 18 },
  title: { fontSize: 17, fontWeight: '800', color: colors.ink, marginBottom: 12 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: colors.ink },
  label: { fontSize: 12, fontWeight: '700', color: colors.muted, marginTop: 14, marginBottom: 8 },
  icons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  iconBtnActive: { backgroundColor: colors.brand },
  actions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  btn: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  btnGhost: { backgroundColor: colors.surface2 },
  btnGhostText: { fontWeight: '700', color: colors.ink },
  btnPrimary: { backgroundColor: colors.brand },
  btnPrimaryText: { fontWeight: '700', color: '#FFFFFF' },
});
