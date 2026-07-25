import { useEffect, useState } from 'react';
import {
  Modal, View, Text, TextInput, ScrollView, Pressable, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { mobileApi } from '../../lib/api';
import {
  ASSIGNABLE_CITIES, PERM_LABELS, permissionLabel,
} from '../../lib/access';
import { colors } from '../../constants/theme';
import ModalSafeArea from '../ui/ModalSafeArea';

const GENDERS = [
  ['unspecified', 'Prefer not to say'],
  ['male', 'Male'],
  ['female', 'Female'],
  ['other', 'Other'],
];

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  gender: 'unspecified',
  password: '',
  role: 'member',
  cities: [],
  permissions: [],
};

export default function UserAccessForm({
  visible,
  editing,
  catalog,
  defaultPermissions,
  onClose,
  onSaved,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    if (editing) {
      setForm({
        name: editing.name || '',
        email: editing.email || '',
        phone: editing.phone || '',
        gender: editing.gender || 'unspecified',
        password: '',
        role: editing.role || 'member',
        cities: editing.cities || [],
        permissions: editing.permissions || [],
      });
    } else {
      setForm({
        ...EMPTY_FORM,
        permissions: [...(defaultPermissions || [])],
      });
    }
    setError('');
  }, [visible, editing, defaultPermissions]);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const toggleInArray = (key, value) => setForm((prev) => ({
    ...prev,
    [key]: prev[key].includes(value)
      ? prev[key].filter((x) => x !== value)
      : [...prev[key], value],
  }));

  const submit = async () => {
    if (saving) return;
    setError('');

    if (!form.name.trim()) return setError('Name is required');
    if (!editing && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError('Enter a valid email');
    if (!editing && form.password.length < 8) return setError('Password must be at least 8 characters');
    if (editing && form.password && form.password.length < 8) return setError('Password must be at least 8 characters');
    if (form.role === 'member' && !form.cities.length) return setError('Assign at least one city to a member');

    setSaving(true);
    try {
      if (editing) {
        const payload = {
          name: form.name.trim(),
          phone: form.phone,
          gender: form.gender,
          role: form.role,
          cities: form.cities,
          permissions: form.permissions,
        };
        if (form.password) payload.password = form.password;
        await mobileApi.updateUser(editing.id, payload);
      } else {
        await mobileApi.createUser({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone,
          gender: form.gender,
          password: form.password,
          role: form.role,
          cities: form.cities,
          permissions: form.permissions,
        });
      }
      await onSaved?.();
    } catch (err) {
      setError(err.message || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const isAdminRole = form.role === 'admin';
  const permList = catalog?.length ? catalog : Object.keys(PERM_LABELS);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <ModalSafeArea style={styles.flex}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.head}>
          <Text style={styles.title}>{editing ? `Edit ${editing.name}` : 'Create user'}</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={26} color={colors.ink} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Field label="Full name">
            <TextInput
              style={styles.input}
              value={form.name}
              onChangeText={(v) => setField('name', v)}
              placeholder="e.g. Priya Nair"
              autoCapitalize="words"
            />
          </Field>

          <Field label={editing ? 'Email (cannot be changed)' : 'Email'}>
            <TextInput
              style={[styles.input, editing && styles.inputDisabled]}
              value={form.email}
              onChangeText={(v) => setField('email', v)}
              placeholder="user@spacehaat.in"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!editing}
            />
          </Field>

          <Field label="Phone">
            <TextInput
              style={styles.input}
              value={form.phone}
              onChangeText={(v) => setField('phone', v)}
              placeholder="+91 98XXXXXXXX"
              keyboardType="phone-pad"
            />
          </Field>

          <Field label="Gender">
            <View style={styles.chipRow}>
              {GENDERS.map(([value, label]) => (
                <Chip
                  key={value}
                  label={label}
                  active={form.gender === value}
                  onPress={() => setField('gender', value)}
                />
              ))}
            </View>
          </Field>

          <Field label={editing ? 'Reset password (optional)' : 'Password'}>
            <TextInput
              style={styles.input}
              value={form.password}
              onChangeText={(v) => setField('password', v)}
              placeholder={editing ? 'Leave blank to keep current' : 'Min. 8 characters'}
              secureTextEntry
              autoCapitalize="none"
            />
          </Field>

          <Field label="Role">
            <View style={styles.chipRow}>
              <Chip label="Member" active={form.role === 'member'} onPress={() => setField('role', 'member')} />
              <Chip label="Admin (full access)" active={form.role === 'admin'} onPress={() => setField('role', 'admin')} />
            </View>
          </Field>

          {!isAdminRole ? (
            <>
              <Field label="Assigned cities — member sees only these">
                <View style={styles.chipRow}>
                  {ASSIGNABLE_CITIES.map((city) => (
                    <Chip
                      key={city}
                      label={city}
                      active={form.cities.includes(city)}
                      onPress={() => toggleInArray('cities', city)}
                    />
                  ))}
                </View>
              </Field>

              <Field label="Permissions">
                <View style={styles.chipRow}>
                  {permList.map((perm) => (
                    <Chip
                      key={perm}
                      label={PERM_LABELS[perm] || permissionLabel(perm)}
                      active={form.permissions.includes(perm)}
                      onPress={() => toggleInArray('permissions', perm)}
                    />
                  ))}
                </View>
              </Field>
            </>
          ) : (
            <View style={styles.adminNote}>
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.brand} />
              <Text style={styles.adminNoteText}>Admins have full access to every city and section.</Text>
            </View>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable style={styles.cancelBtn} onPress={onClose} disabled={saving}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Pressable style={[styles.saveBtn, saving && styles.btnOff]} onPress={submit} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : (
              <>
                <Ionicons name="person-add-outline" size={18} color="#fff" />
                <Text style={styles.saveText}>{editing ? 'Save changes' : 'Create user'}</Text>
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
      </ModalSafeArea>
    </Modal>
  );
}

function Field({ label, children }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

function Chip({ label, active, onPress }) {
  return (
    <Pressable
      style={[styles.chip, active && styles.chipOn]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, active && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.surface2 },
  head: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  title: { flex: 1, fontSize: 18, fontWeight: '700', color: colors.ink, marginRight: 12 },
  body: { padding: 16, paddingBottom: 24, gap: 4 },
  field: { marginBottom: 14 },
  label: { fontSize: 12, fontWeight: '700', color: colors.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3 },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 15, color: colors.ink,
  },
  inputDisabled: { opacity: 0.6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  chipOn: { backgroundColor: colors.brandSoft, borderColor: colors.brand },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.ink },
  chipTextOn: { color: colors.brandInk },
  adminNote: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.brandSoft, borderRadius: 12, padding: 12, marginTop: 4,
  },
  adminNoteText: { flex: 1, fontSize: 13, color: colors.brandInk, lineHeight: 18 },
  error: { color: colors.danger, fontSize: 13, marginTop: 8 },
  footer: {
    flexDirection: 'row', gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  cancelBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14,
    borderRadius: 12, borderWidth: 1, borderColor: colors.border,
  },
  cancelText: { fontWeight: '700', color: colors.ink },
  saveBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 12, backgroundColor: colors.brand,
  },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  btnOff: { opacity: 0.6 },
});
