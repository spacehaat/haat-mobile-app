import { Modal, View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../../constants/theme';

export default function ConfirmDialog({
  visible,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  danger = true,
  busy = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={busy ? undefined : onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <Pressable style={[styles.btn, styles.btnGhost]} onPress={onCancel} disabled={busy}>
              <Text style={styles.btnGhostText}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              style={[styles.btn, danger ? styles.btnDanger : styles.btnPrimary, busy && styles.btnOff]}
              onPress={onConfirm}
              disabled={busy}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnPrimaryText}>{confirmLabel}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 20, 20, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { fontSize: 18, fontWeight: '800', color: colors.ink, marginBottom: 8 },
  message: { fontSize: 14, lineHeight: 21, color: colors.muted, marginBottom: 20 },
  actions: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  btn: {
    minWidth: 96,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGhost: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnGhostText: { fontWeight: '700', color: colors.ink },
  btnPrimary: { backgroundColor: colors.brand },
  btnDanger: { backgroundColor: colors.danger },
  btnPrimaryText: { fontWeight: '700', color: '#fff' },
  btnOff: { opacity: 0.65 },
});
