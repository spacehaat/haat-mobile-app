import { Alert, View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { mobileApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { canManageInventory } from '../../lib/access';
import InventoryWizard from './InventoryWizard';
import { colors } from '../../constants/theme';

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
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (err) => Alert.alert('Save failed', err.message || 'Could not save listing'),
  });

  return (
    <View style={styles.screen}>
      <InventoryWizard
        listing={null}
        canSeeInternal={canEdit}
        saving={saveMutation.isPending}
        onCancel={() => router.back()}
        onSave={(payload) => saveMutation.mutate(payload)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface2 },
});
