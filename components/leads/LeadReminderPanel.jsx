import { useMemo, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  REMINDER_PRESETS,
  buildReminderDate,
  defaultCustomDateString,
  defaultCustomTimeString,
  formatReminderDateTime,
  reminderStatus,
} from '@spacehaat/utils';
import { colors } from '../../constants/theme';

export default function LeadReminderPanel({ dueAt, saving, onSave }) {
  const [preset, setPreset] = useState('tomorrow');
  const [customDate, setCustomDate] = useState(defaultCustomDateString());
  const [customTime, setCustomTime] = useState(defaultCustomTimeString());
  const [note, setNote] = useState('');

  const status = useMemo(() => reminderStatus(dueAt), [dueAt]);

  const saveReminder = async () => {
    const due = preset === 'custom'
      ? buildReminderDate('custom', { customDate, customTime })
      : buildReminderDate(preset);

    if (!due) {
      Alert.alert('Invalid date', 'Please enter a valid date and time.');
      return;
    }

    await onSave({
      dueAt: due.toISOString(),
      note: note.trim() || undefined,
    });
    setNote('');
  };

  return (
    <View style={styles.panel}>
      <Text style={styles.title}>Remind me</Text>

      <View style={[styles.status, status.key === 'overdue' && styles.statusOverdue]}>
        <Ionicons name="alarm-outline" size={20} color={status.key === 'overdue' ? colors.danger : colors.brand} />
        <View style={styles.statusBody}>
          <Text style={styles.statusWhen}>{formatReminderDateTime(dueAt)}</Text>
          <Text style={styles.statusLabel}>{status.label}</Text>
        </View>
      </View>

      <View style={styles.presets}>
        {REMINDER_PRESETS.map((item) => {
          const active = preset === item.id;
          return (
            <Pressable
              key={item.id}
              style={[styles.preset, active && styles.presetOn]}
              onPress={() => setPreset(item.id)}
            >
              <Text style={[styles.presetText, active && styles.presetTextOn]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {preset === 'custom' ? (
        <View style={styles.customRow}>
          <View style={styles.customField}>
            <Text style={styles.fieldLabel}>Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={customDate}
              onChangeText={setCustomDate}
              placeholder="2026-07-25"
              placeholderTextColor={colors.faint}
              autoCapitalize="none"
            />
          </View>
          <View style={styles.customField}>
            <Text style={styles.fieldLabel}>Time (HH:MM)</Text>
            <TextInput
              style={styles.input}
              value={customTime}
              onChangeText={setCustomTime}
              placeholder="10:00"
              placeholderTextColor={colors.faint}
              autoCapitalize="none"
            />
          </View>
        </View>
      ) : null}

      <Text style={styles.fieldLabel}>Note (optional)</Text>
      <TextInput
        style={[styles.input, styles.noteInput]}
        value={note}
        onChangeText={setNote}
        placeholder="e.g. Client will decide after budget approval"
        placeholderTextColor={colors.faint}
        multiline
      />

      <Pressable
        style={[styles.saveBtn, saving && styles.saveBtnOff]}
        disabled={saving}
        onPress={saveReminder}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="notifications-outline" size={18} color="#fff" />
            <Text style={styles.saveText}>Set reminder</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 12,
  },
  title: { fontSize: 13, fontWeight: '800', color: colors.ink, marginBottom: 10 },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.brandSoft,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  statusOverdue: { backgroundColor: '#fdecec' },
  statusBody: { flex: 1 },
  statusWhen: { fontSize: 14, fontWeight: '700', color: colors.ink },
  statusLabel: { fontSize: 12, color: colors.muted, marginTop: 2 },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  preset: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetOn: { backgroundColor: colors.brandSoft, borderColor: colors.brand },
  presetText: { fontSize: 13, fontWeight: '600', color: colors.ink },
  presetTextOn: { color: colors.brandInk },
  customRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  customField: { flex: 1 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.faint,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.ink,
  },
  noteInput: { minHeight: 72, textAlignVertical: 'top', marginBottom: 12 },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.brand,
    borderRadius: 12,
    paddingVertical: 13,
  },
  saveBtnOff: { opacity: 0.6 },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
