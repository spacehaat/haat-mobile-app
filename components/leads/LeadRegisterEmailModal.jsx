import { useEffect, useState } from 'react';
import {
  View, Text, Modal, Pressable, StyleSheet, TextInput, ActivityIndicator, Linking, Alert,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  buildLeadRegistrationEmail,
  leadRegistrationMailto,
  requirementLabelFromLead,
} from '../../lib/leadRegistrationEmail';
import { colors } from '../../constants/theme';

export default function LeadRegisterEmailModal({
  visible,
  onClose,
  lead,
  memberName,
  memberPhone,
}) {
  const insets = useSafeAreaInsets();
  const [recipientName, setRecipientName] = useState('');
  const [requirement, setRequirement] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setRecipientName('');
    setRequirement(requirementLabelFromLead(lead));
    setCompanyName(String(lead?.company || '').trim());
    setOpening(false);
  }, [visible, lead?.id]);

  const handleOpen = async () => {
    if (!recipientName.trim()) {
      Alert.alert('Recipient name', 'Enter the recipient name (e.g. Shlok).');
      return;
    }
    if (!requirement.trim()) {
      Alert.alert('Requirement', 'Enter the requirement.');
      return;
    }

    const { subject, body } = buildLeadRegistrationEmail({
      recipientName: recipientName.trim(),
      clientName: lead?.name || lead?.company,
      companyName: companyName.trim(),
      requirement: requirement.trim(),
      contact: lead?.contact,
      memberName,
      memberPhone,
    });

    const href = leadRegistrationMailto({ subject, body });
    setOpening(true);
    try {
      await Linking.openURL(href);
      onClose?.();
    } catch (e) {
      Alert.alert('Mail unavailable', e?.message || 'Could not open the mail app.');
    } finally {
      setOpening(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <Pressable style={styles.backdrop} onPress={onClose}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: Math.max(insets.bottom, 16) + 12 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.title}>Register lead by email</Text>
              <Text style={styles.copy}>
                Opens your mail app with subject and body filled. Add the recipient email manually in the mail app.
              </Text>

              <Text style={styles.fieldLabel}>Recipient name</Text>
              <TextInput
                style={styles.input}
                value={recipientName}
                onChangeText={setRecipientName}
                placeholder="e.g. Shlok"
                placeholderTextColor={colors.faint}
                autoCapitalize="words"
              />

              <Text style={styles.fieldLabel}>Requirement</Text>
              <TextInput
                style={styles.input}
                value={requirement}
                onChangeText={setRequirement}
                placeholder="e.g. 200+ seats"
                placeholderTextColor={colors.faint}
              />

              <Text style={styles.fieldLabel}>Company name (optional)</Text>
              <TextInput
                style={styles.input}
                value={companyName}
                onChangeText={setCompanyName}
                placeholder="e.g. Acme Pvt Ltd"
                placeholderTextColor={colors.faint}
                autoCapitalize="words"
              />

              <View style={styles.actions}>
                <Pressable style={styles.btnGhost} onPress={onClose} disabled={opening}>
                  <Text style={styles.btnGhostText}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.btnPrimary} onPress={handleOpen} disabled={opening}>
                  {opening ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="mail-outline" size={16} color="#fff" />
                      <Text style={styles.btnPrimaryText}>Open email</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </Pressable>
          </ScrollView>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
  },
  title: { fontSize: 18, fontWeight: '700', color: colors.ink, marginBottom: 8 },
  copy: { fontSize: 13, lineHeight: 19, color: colors.muted, marginBottom: 16 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
    color: colors.ink,
    backgroundColor: colors.surface2,
    marginBottom: 12,
  },
  actions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  btnGhost: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnGhostText: { fontWeight: '600', color: colors.ink },
  btnPrimary: {
    flex: 1.2,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.brand,
  },
  btnPrimaryText: { fontWeight: '700', color: '#fff' },
});
