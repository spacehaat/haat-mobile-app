import { Component } from 'react';
import { Alert, View, StyleSheet, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { mobileApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { canManageInventory } from '../../lib/access';
import InventoryWizard from './InventoryWizard';
import { colors } from '../../constants/theme';

function goBackToInventory() {
  if (router.canGoBack()) router.back();
  else router.replace('/(tabs)/browser');
}

class WizardBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={36} color={colors.danger} />
          <Text style={styles.errorText}>
            {this.state.error?.message || 'Could not open add inventory'}
          </Text>
          <Pressable style={styles.backBtn} onPress={goBackToInventory}>
            <Text style={styles.backBtnText}>Back to inventory</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function NewListingScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canEdit = canManageInventory(user);

  const saveMutation = useMutation({
    mutationFn: (payload) => mobileApi.createListing(payload),
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({ queryKey: ['listings'] });
      const savedId = saved?.id || saved?._id;
      if (savedId) {
        queryClient.setQueryData(['listing', savedId], saved);
      }
      Alert.alert('Saved', 'Listing published.', [
        { text: 'OK', onPress: goBackToInventory },
      ]);
    },
    onError: (err) => Alert.alert('Save failed', err.message || 'Could not save listing'),
  });

  return (
    <WizardBoundary>
      <View style={styles.screen}>
        <InventoryWizard
          listing={null}
          canSeeInternal={canEdit}
          saving={saveMutation.isPending}
          onCancel={goBackToInventory}
          onSave={(payload) => saveMutation.mutate(payload)}
        />
      </View>
    </WizardBoundary>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface2 },
  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12,
    backgroundColor: colors.surface2,
  },
  errorText: { color: colors.danger, textAlign: 'center', fontSize: 15 },
  backBtn: {
    marginTop: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  backBtnText: { color: colors.ink, fontWeight: '700' },
});
