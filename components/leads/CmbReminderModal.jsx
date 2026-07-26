import { useState } from 'react';
import {
  View, Text, Modal, Pressable, StyleSheet, TextInput, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  REMINDER_PRESETS,
  buildReminderDate,
  defaultCustomDateString,
  defaultCustomTimeString,
} from '@spacehaat/utils';
import { colors } from '../../constants/theme';

export default function CmbReminderModal({ visible, saving, onClose, onSkip, onSave }) {
  const [preset, setPreset] = useState('tomorrow');
  const [customDate, setCustomDate] = useState(defaultCustomDateString());
  const [customTime, setCustomTime] = useState(defaultCustomTimeString());
  const [note, setNote] = useState('');

  const handleSave = async () => {
    const due = preset === 'custom'
      ? buildReminderDate('custom', { customDate, customTime })
      : buildReminderDate(preset);
    if (!due) return;
    await onSave({
      dueAt: due.toISOString(),
      note: note.trim() || undefined,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Call me back</Text>
          <Text style={styles.copy}>
            Mark this lead as Call me back. Optionally set a reminder for when to follow up.
          </Text>

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
                <Text style={styles.fieldLabel}>Date</Text>
                <TextInput
                  style={styles.input}
                  value={customDate}
                  onChangeText={setCustomDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.faint}
                />
              </View>
              <View style={styles.customField}>
                <Text style={styles.fieldLabel}>Time</Text>
                <TextInput
                  style={styles.input}
                  value={customTime}
                  onChangeText={setCustomTime}
                  placeholder="10:00"
                  placeholderTextColor={colors.faint}
                />
              </View>
            </View>
          ) : null}

          <Text style={styles.fieldLabel}>Note (optional)</Text>
          <TextInput
            style={[styles.input, styles.noteInput]}
            value={note}
            onChangeText={setNote}
            placeholder="e.g. Client asked to call after 4 PM"
            placeholderTextColor={colors.faint}
            multiline
          />

          <View style={styles.actions}>
            <Pressable style={[styles.btn, styles.btnGhost]} disabled={saving} onPress={onSkip}>
              <Text style={styles.btnGhostText}>Skip reminder</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.btnPrimary, saving && styles.btnOff]} disabled={saving} onPress={handleSave}>
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="notifications-outline" size={16} color="#fff" />
                  <Text style={styles.btnPrimaryText}>Save + reminder</Text>
                </>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 20,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  title: { fontSize: 18, fontWeight: '800', color: colors.ink },
  copy: { fontSize: 14, lineHeight: 20, color: colors.muted },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
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
  customRow: { flexDirection: 'row', gap: 10 },
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
  noteInput: { minHeight: 72, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  btnGhost: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnGhostText: { color: colors.ink, fontWeight: '700', fontSize: 14 },
  btnPrimary: { backgroundColor: colors.brand },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  btnOff: { opacity: 0.6 },
});
