import { useState } from 'react';
import {
  Alert, Pressable, ScrollView, StyleSheet, Text, View, ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { mobileApi } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import { useProposal } from '../../../context/ProposalContext';
import { canVerifyListings, canManageInventory, canSeeProposalBuilder, isAdmin, defaultTabPathForUser } from '../../../lib/access';
import FreshBadge from '../../../components/ui/FreshBadge';
import LoadingScreen from '../../../components/ui/LoadingScreen';
import ListingDetailSections from '../../../components/ui/ListingDetailSections';
import ListingGalleryCarousel from '../../../components/ui/ListingGalleryCarousel';
import GallerySheet from '../../../components/ui/GallerySheet';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { coverImg, allGalleryPhotos, normalizeListingRecord } from '../../../lib/listingHelpers';
import { colors } from '../../../constants/theme';
import { inr } from '@spacehaat/utils';

function goBackToInventory() {
  if (router.canGoBack()) router.back();
  else router.replace('/(tabs)/browser');
}

function ListingDetailError({ message }) {
  return (
    <View style={styles.center}>
      <Ionicons name="alert-circle-outline" size={36} color={colors.danger} />
      <Text style={styles.error}>{message || 'Listing not found'}</Text>
      <Pressable style={styles.backBtn} onPress={goBackToInventory}>
        <Ionicons name="chevron-back" size={18} color={colors.ink} />
        <Text style={styles.backBtnText}>Back to inventory</Text>
      </Pressable>
    </View>
  );
}

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams();
  const listingId = Array.isArray(id) ? id[0] : id;
  const reservedRoute = listingId === 'edit' || listingId === 'new';

  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canVerify = canVerifyListings(user);
  const canEdit = canManageInventory(user);
  const admin = isAdmin(user);
  const showProposal = canSeeProposalBuilder(user);
  const { isInProposal, addToProposal, removeFromProposal } = useProposal();
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const { data: listing, isLoading, refetch, isRefetching, error } = useQuery({
    queryKey: ['listing', listingId],
    queryFn: async () => normalizeListingRecord(await mobileApi.getListing(listingId)),
    enabled: Boolean(listingId) && !reservedRoute,
  });

  const verifyMutation = useMutation({
    mutationFn: () => mobileApi.verifyListing(listingId),
    onSuccess: (updated) => {
      queryClient.setQueryData(['listing', listingId], normalizeListingRecord(updated));
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      Alert.alert('Verified', 'Listing marked as verified.');
    },
    onError: (err) => Alert.alert('Verify failed', err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => mobileApi.deleteListing(listingId),
    onSuccess: () => {
      setConfirmDeleteOpen(false);
      queryClient.removeQueries({ queryKey: ['listing', listingId] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      goBackToInventory();
    },
    onError: (err) => Alert.alert('Delete failed', err.message || 'Could not delete listing'),
  });

  const inProposal = listing ? isInProposal(listing.id || listing._id) : false;
  const gallery = listing ? allGalleryPhotos(listing) : [];
  const carouselPhotos = listing
    ? (gallery.length
      ? gallery
      : [{
        src: coverImg(listing),
        label: listing.type,
        caption: `${listing.operator} · ${listing.micro}`,
      }])
    : [];

  const openGallery = (index = 0) => {
    setGalleryIndex(index);
    setGalleryOpen(true);
  };

  const toggleProposal = async () => {
    if (!listing) return;
    const lid = listing.id || listing._id;
    try {
      if (inProposal) {
        await removeFromProposal(lid);
      } else {
        await addToProposal(lid, listing);
      }
    } catch (err) {
      Alert.alert('Proposal', err.message || 'Could not update proposal');
    }
  };

  if (listingId === 'new') {
    if (!canEdit) return <Redirect href={defaultTabPathForUser(user)} />;
    return <Redirect href="/(tabs)/browser/new" />;
  }

  if (listingId === 'edit') {
    return <Redirect href="/(tabs)/browser" />;
  }

  if (isLoading) return <LoadingScreen label="Loading listing…" />;
  if (error || !listing) {
    return <ListingDetailError message={error?.message} />;
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.brand} />}
      >
        <ListingGalleryCarousel
          photos={carouselPhotos}
          onOpenGallery={openGallery}
        />

        <View style={styles.heroMeta}>
          <Text style={styles.title}>{listing.operator} · {listing.micro}</Text>
          <Text style={styles.sub}>{listing.type} · {listing.city}</Text>
          <FreshBadge fresh={listing.fresh} />
        </View>

        <View style={styles.quick}>
          <View style={styles.quickCell}>
            <Text style={styles.quickL}>Seats available</Text>
            <Text style={styles.quickN}>{listing.seats}</Text>
          </View>
          <View style={styles.quickCell}>
            <Text style={styles.quickL}>From</Text>
            <Text style={styles.quickN}>{inr(listing.price)}</Text>
            <Text style={styles.quickU}>/seat/mo</Text>
          </View>
          <View style={styles.quickCell}>
            <Text style={styles.quickL}>Available</Text>
            <Text style={styles.quickN}>{listing.avail || '—'}</Text>
          </View>
        </View>

        <ListingDetailSections
          listing={listing}
          canSeeInternal={canVerify}
        />

        <View style={styles.actions}>
          {canEdit ? (
            <Pressable
              style={[styles.btn, styles.btnEdit]}
              onPress={() => router.push({ pathname: '/(tabs)/browser/edit/[id]', params: { id: String(listingId) } })}
            >
              <Ionicons name="pencil-outline" size={20} color="#fff" />
              <Text style={styles.btnPrimaryText}>Edit listing</Text>
            </Pressable>
          ) : null}

          {showProposal ? (
            <Pressable
              style={[styles.btn, inProposal ? styles.btnSuccess : styles.btnPrimary]}
              onPress={toggleProposal}
            >
              <Ionicons
                name={inProposal ? 'checkmark-circle' : 'add-circle-outline'}
                size={20}
                color="#fff"
              />
              <Text style={styles.btnPrimaryText}>
                {inProposal ? 'Added to proposal' : 'Add to proposal'}
              </Text>
            </Pressable>
          ) : null}

          {inProposal ? (
            <Pressable style={styles.btn} onPress={() => router.push('/(tabs)/proposals/builder')}>
              <Ionicons name="document-text-outline" size={20} color={colors.ink} />
              <Text style={styles.btnText}>Open proposal builder</Text>
            </Pressable>
          ) : null}

          {canVerify ? (
            <Pressable
              style={[styles.btn, styles.btnVerify, verifyMutation.isPending && styles.btnOff]}
              disabled={verifyMutation.isPending}
              onPress={() => verifyMutation.mutate()}
            >
              {verifyMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="refresh-outline" size={20} color="#fff" />
                  <Text style={styles.btnPrimaryText}>Mark verified</Text>
                </>
              )}
            </Pressable>
          ) : null}

          {admin ? (
            <Pressable
              style={[styles.btn, styles.btnDanger, deleteMutation.isPending && styles.btnOff]}
              disabled={deleteMutation.isPending}
              onPress={() => setConfirmDeleteOpen(true)}
            >
              <>
                <Ionicons name="trash-outline" size={20} color="#fff" />
                <Text style={styles.btnPrimaryText}>Delete listing</Text>
              </>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>

      <GallerySheet
        visible={galleryOpen}
        photos={carouselPhotos}
        initialIndex={galleryIndex}
        title={`${listing.operator} · ${listing.micro}`}
        onClose={() => setGalleryOpen(false)}
      />

      <ConfirmDialog
        visible={confirmDeleteOpen}
        title="Delete listing"
        message={`Delete “${listing.operator} · ${listing.micro}”? This cannot be undone.`}
        confirmLabel="Delete"
        busy={deleteMutation.isPending}
        onCancel={() => { if (!deleteMutation.isPending) setConfirmDeleteOpen(false); }}
        onConfirm={() => deleteMutation.mutate()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface2 },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12, backgroundColor: colors.surface2 },
  error: { color: colors.danger, textAlign: 'center', fontSize: 15 },
  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  backBtnText: { color: colors.ink, fontWeight: '700' },
  heroMeta: { marginBottom: 12, gap: 6 },
  title: { fontSize: 20, fontWeight: '800', color: colors.ink },
  sub: { fontSize: 14, color: colors.muted },
  quick: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  quickCell: {
    flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  quickL: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', color: colors.faint },
  quickN: { fontSize: 16, fontWeight: '800', color: colors.ink, marginTop: 4 },
  quickU: { fontSize: 11, color: colors.muted },
  actions: { gap: 10, marginTop: 8 },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 12, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
  },
  btnPrimary: { backgroundColor: colors.brand, borderColor: colors.brand },
  btnSuccess: { backgroundColor: colors.success, borderColor: colors.success },
  btnVerify: { backgroundColor: colors.success, borderColor: colors.success },
  btnEdit: { backgroundColor: colors.ink, borderColor: colors.ink },
  btnDanger: { backgroundColor: colors.danger, borderColor: colors.danger },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  btnText: { color: colors.ink, fontWeight: '700', fontSize: 15 },
  btnOff: { opacity: 0.6 },
});
