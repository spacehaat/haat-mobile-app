import { Alert, View, StyleSheet } from 'react-native';
import { Redirect, router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mobileApi } from '../../../../lib/api';
import { useAuth } from '../../../../context/AuthContext';
import { canManageInventory, defaultTabPathForUser } from '../../../../lib/access';
import LoadingScreen from '../../../../components/ui/LoadingScreen';
import InventoryWizard from '../../../../components/inventory/InventoryWizard';
import { mergeListingUpdate } from '@spacehaat/inventory-schema';
import { colors } from '../../../../constants/theme';

export default function EditListingScreen() {
  const { id } = useLocalSearchParams();
  const listingId = Array.isArray(id) ? id[0] : id;
  const isNew = listingId === 'new';
  const { user } = useAuth();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const canEdit = canManageInventory(user);

  useEffect(() => {
    navigation.setOptions({ title: 'Edit listing' });
  }, [navigation]);

  const { data: listing, isLoading, error } = useQuery({
    queryKey: ['listing', listingId],
    queryFn: () => mobileApi.getListing(listingId),
    enabled: !isNew && Boolean(listingId),
  });

  const saveMutation = useMutation({
    mutationFn: async (payload) => mobileApi.updateListing(listingId, mergeListingUpdate(listing, payload)),
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({ queryKey: ['listings'] });
      const savedId = saved?.id || saved?._id || listingId;
      if (savedId) {
        queryClient.setQueryData(['listing', savedId], saved);
      }
      Alert.alert('Saved', 'Listing updated.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (err) => Alert.alert('Save failed', err.message || 'Could not save listing'),
  });

  if (isNew) return <Redirect href="/(tabs)/browser/new" />;
  if (!canEdit) return <Redirect href={defaultTabPathForUser(user)} />;
  if (isLoading) return <LoadingScreen label="Loading listing…" />;
  if (error || !listing) {
    return <LoadingScreen label={error?.message || 'Listing not found'} />;
  }

  return (
    <View style={styles.screen}>
      <InventoryWizard
        listing={listing}
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
