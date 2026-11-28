import { Component, useState } from 'react';
import {
  Alert, Pressable, ScrollView, StyleSheet, Text, View, ActivityIndicator,
  RefreshControl, Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { mobileApi } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import { useProposal } from '../../../context/ProposalContext';
import {
  canVerifyListings, canSeeProposalBuilder, canManageInventory, isAdmin, canEnableListings,
} from '../../../lib/access';
import FreshBadge from '../../../components/ui/FreshBadge';
import ListingStatusBadge from '../../../components/ui/StatusBadge';
import SpaceEditor from '../../../components/space-editor/SpaceEditor';
import LoadingScreen from '../../../components/ui/LoadingScreen';
import ListingDetailSections from '../../../components/ui/ListingDetailSections';
import ListingGalleryCarousel from '../../../components/ui/ListingGalleryCarousel';
import GallerySheet from '../../../components/ui/GallerySheet';
import { coverImg, allGalleryPhotos, normalizeListingRecord, profileOf } from '../../../lib/listingHelpers';
import { STATUS_COLORS, verticalOf } from '../../../constants/inventory';
import { VerticalTag } from '../../../components/ui/ListingCard';
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

class ListingDetailBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return <ListingDetailError message={this.state.error?.message || 'Something went wrong'} />;
    }
    return this.props.children;
  }
}

const STATUS_NOTE = {
  pending: 'Waiting for approval — not live on the website yet. Confirm details before sharing.',
  inprogress: 'Our team is still working on this space. Confirm details before sharing.',
  rejected: 'Rejected on the website. Check with the team before sharing it with a client.',
};

const STATUS_ACTIONS = [
  { key: 'approved', label: 'Approve', icon: 'checkmark-circle-outline' },
  { key: 'pending', label: 'Pending', icon: 'time-outline' },
  { key: 'inprogress', label: 'In progress', icon: 'sync-circle-outline' },
  { key: 'rejected', label: 'Reject', icon: 'close-circle-outline' },
];
const STATUS_CONFIRM = {
  approved: ['Approve this listing?', 'It goes live on the website within a few minutes.'],
  rejected: ['Reject this listing?', 'It is taken off the website and out of the priority lists.'],
};

/** Admin status buttons on the listing page (not in the edit form). PGs have no separate "Pending". */
function StatusActions({ current, pg, busy, pendingKey, onChange }) {
  const actions = STATUS_ACTIONS.filter((a) => !(pg && a.key === 'pending'));
  const press = (key) => {
    if (key === current || busy) return;
    const ask = STATUS_CONFIRM[key];
    if (!ask) return onChange(key);
    Alert.alert(ask[0], ask[1], [{ text: 'Cancel', style: 'cancel' }, { text: 'Yes', onPress: () => onChange(key) }]);
  };
  return (
    <View style={styles.statusBox}>
      <Text style={styles.statusTitle}>Listing status</Text>
      <View style={styles.statusRow}>
        {actions.map((a) => {
          const on = a.key === current;
          const tone = STATUS_COLORS[a.key];
          return (
            <Pressable
              key={a.key}
              onPress={() => press(a.key)}
              disabled={busy}
              style={[styles.statusBtn, on && { backgroundColor: tone.bg, borderColor: tone.text }, busy && !on && styles.btnOff]}
            >
              {busy && pendingKey === a.key ? <ActivityIndicator size="small" color={tone.text} /> : (
                <Ionicons name={on ? tone.icon : a.icon} size={16} color={on ? tone.text : colors.muted} />
              )}
              <Text style={[styles.statusBtnText, on && { color: tone.text }]}>{on && a.key === 'approved' ? 'Approved' : on && a.key === 'rejected' ? 'Rejected' : a.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Stat({ label, value, unit }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statL}>{label}</Text>
      <Text style={styles.statN} numberOfLines={1}>{value}</Text>
      {unit ? <Text style={styles.statU}>{unit}</Text> : null}
    </View>
  );
}

function ListingDetailBody() {
  const { id, vertical: vParam } = useLocalSearchParams();
  const vertical = Array.isArray(vParam) ? vParam[0] : vParam;
  const listingId = Array.isArray(id) ? id[0] : id;
  const reservedRoute = listingId === 'edit' || listingId === 'new' || listingId === 'add';
  const insets = useSafeAreaInsets();

  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canVerify = canVerifyListings(user);
  const admin = isAdmin(user);
  const canEnable = canEnableListings(user);
  const canEdit = canManageInventory(user);
  const showProposal = canSeeProposalBuilder(user);
  const { isInProposal, addToProposal, removeFromProposal } = useProposal();
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

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
      Alert.alert('Verified', 'Marked as verified today.');
    },
    onError: (err) => Alert.alert('Verify failed', err.message),
  });

  const statusMutation = useMutation({
    mutationFn: (status) => mobileApi.setListingStatus(listingId, status),
    onSuccess: (updated) => {
      queryClient.setQueryData(['listing', listingId], normalizeListingRecord(updated));
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
    onError: (err) => Alert.alert('Status not changed', err.message),
  });

  // On some Android builds, /browser/add (and /new, /edit) resolve as [id].
  if (reservedRoute) {
    if (listingId !== 'edit' && canEdit) return <SpaceEditor vertical={vertical} />;
    return <ListingDetailError message="Open a space from Inventory to edit it." />;
  }

  if (!listingId) {
    return <ListingDetailError message="Missing listing id" />;
  }

  if (isLoading) return <LoadingScreen label="Loading space…" />;
  if (error || !listing) {
    return <ListingDetailError message={error?.message} />;
  }

  const lid = listing.id || listing._id;
  const inProposal = isInProposal(lid);
  const gallery = allGalleryPhotos(listing);
  const cover = coverImg(listing);
  const carouselPhotos = gallery.length
    ? gallery
    : (cover ? [{ src: cover, label: listing.type || 'Photo', caption: `${listing.operator || ''} · ${listing.micro || ''}` }] : []);
  const place = [listing.micro, listing.city].filter(Boolean).join(', ');
  const types = (listing.spaceTypes?.length ? listing.spaceTypes : [listing.type]).filter(Boolean);
  const note = STATUS_NOTE[listing.status?.key];
  const tone = STATUS_COLORS[listing.status?.key];
  const I = profileOf(listing).identity || {};
  const V = verticalOf(listing);
  const mo = V.key === 'managed-office';
  const pg = V.key === 'coliving';
  const po = V.key === 'private-office';
  const editable = ['workspace', 'managed-office', 'pg', 'private-office'].includes(listing.source);

  const openGallery = (index = 0) => {
    setGalleryIndex(index);
    setGalleryOpen(true);
  };

  const toggleProposal = async () => {
    try {
      if (inProposal) await removeFromProposal(lid);
      else await addToProposal(lid, listing);
    } catch (err) {
      Alert.alert('Proposal', err.message || 'Could not update proposal');
    }
  };

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          title: mo ? 'Managed office' : pg ? 'PG / Coliving' : po ? 'Private office' : 'Coworking space',
          headerRight: canEdit && editable ? () => (
            <Pressable onPress={() => router.push(`/(tabs)/browser/edit/${lid}`)} hitSlop={8} style={[styles.headerEdit, { backgroundColor: V.soft }]}>
              <Ionicons name="create-outline" size={18} color={V.color} />
              <Text style={[styles.headerEditText, { color: V.color }]}>Edit</Text>
            </Pressable>
          ) : undefined,
        }}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: 120 + insets.bottom }]}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.brand} />}
      >
        <ListingGalleryCarousel photos={carouselPhotos} onOpenGallery={openGallery} />

        <View style={styles.hero}>
          <View style={styles.badges}>
            <VerticalTag listing={listing} />
            <ListingStatusBadge status={listing.status} />
            <FreshBadge fresh={listing.fresh} />
            {listing.isActive === false ? <Text style={styles.hidden}>Hidden on website</Text> : null}
          </View>
          <Text style={styles.title}>{listing.operator}</Text>
          {place ? (
            <View style={styles.placeRow}>
              <Ionicons name="location" size={15} color={colors.brand} />
              <Text style={styles.place}>{place}</Text>
            </View>
          ) : null}
          {I.address ? <Text style={styles.address} numberOfLines={2}>{I.address}</Text> : null}
          {types.length ? (
            <View style={styles.types}>
              {(mo ? listing.office?.seatTypes || [] : types).map((t) => <Text key={t} style={[styles.typeChip, { color: V.color, backgroundColor: V.soft }]}>{t}</Text>)}
            </View>
          ) : null}
        </View>

        {note ? (
          <View style={[styles.note, tone && { backgroundColor: tone.bg }]}>
            <Ionicons name={tone?.icon || 'information-circle'} size={18} color={tone?.text || colors.ink} />
            <Text style={[styles.noteText, tone && { color: tone.text }]}>{note}</Text>
          </View>
        ) : null}

        {canEnable && editable ? (
          <StatusActions
            current={listing.status?.key}
            pg={pg}
            busy={statusMutation.isPending}
            pendingKey={statusMutation.variables}
            onChange={(key) => statusMutation.mutate(key)}
          />
        ) : null}

        <View style={styles.stats}>
          <Stat label={pg ? 'Rent from' : po ? 'Monthly rent' : 'Starting from'} value={listing.price ? inr(listing.price) : '—'} unit={listing.price ? (pg || po ? '/mo' : '/seat/mo') : 'on request'} />
          {po ? (
            <>
              <Stat label="Area" value={listing.privateOffice?.areaSqft ? listing.privateOffice.areaSqft.toLocaleString('en-IN') : '—'} unit={listing.privateOffice?.areaSqft ? 'sq ft' : ''} />
              <Stat label="Furnishing" value={listing.privateOffice?.officeType || '—'} />
            </>
          ) : pg ? (
            <>
              <Stat label="Room types" value={(listing.plans || []).length || '—'} />
              <Stat label="For" value={listing.pg?.gender || '—'} />
            </>
          ) : <Stat label="Total seats" value={listing.seats || '—'} />}
          {pg || po ? null : mo ? (
            <Stat label="Min seats" value={listing.office?.minSeats || '—'} unit={listing.office?.minMonths ? `${listing.office.minMonths}-mo lock-in` : ''} />
          ) : (
            <Stat label="Plans" value={(listing.plans || []).length || '—'} unit={types[0] || ''} />
          )}
        </View>

        <ListingDetailSections listing={listing} canSeeInternal={canVerify} />

        <View style={styles.links}>
          {canEdit && editable ? (
            <Pressable style={[styles.linkBtn, styles.editBtn, { backgroundColor: V.color, borderColor: V.color }]} onPress={() => router.push(`/(tabs)/browser/edit/${lid}`)}>
              <Ionicons name="create-outline" size={18} color="#fff" />
              <Text style={[styles.linkText, { color: '#fff' }]}>{mo || po ? 'Edit office details' : pg ? 'Edit PG details' : 'Edit space details'}</Text>
            </Pressable>
          ) : null}
          {listing.url ? (
            <Pressable style={styles.linkBtn} onPress={() => Linking.openURL(listing.url)}>
              <Ionicons name="globe-outline" size={18} color={colors.ink} />
              <Text style={styles.linkText}>View on website</Text>
            </Pressable>
          ) : null}
          {admin && listing.adminUrl ? (
            <Pressable style={styles.linkBtn} onPress={() => Linking.openURL(listing.adminUrl)}>
              <Ionicons name="open-outline" size={18} color={colors.ink} />
              <Text style={styles.linkText}>Open in admin panel</Text>
            </Pressable>
          ) : null}
          {canVerify ? (
            <Pressable
              style={[styles.linkBtn, verifyMutation.isPending && styles.btnOff]}
              disabled={verifyMutation.isPending}
              onPress={() => verifyMutation.mutate()}
            >
              {verifyMutation.isPending ? <ActivityIndicator color={colors.brand} /> : (
                <>
                  <Ionicons name="shield-checkmark-outline" size={18} color={colors.brandInk} />
                  <Text style={[styles.linkText, { color: colors.brandInk }]}>Mark verified today</Text>
                </>
              )}
            </Pressable>
          ) : null}
        </View>
      </ScrollView>

      {showProposal && !pg ? (
        <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.barPrice}>{listing.price ? inr(listing.price) : 'On request'}<Text style={styles.barUnit}>{listing.price ? (po ? ' /mo' : ' /seat/mo') : ''}</Text></Text>
            <Text style={styles.barSub} numberOfLines={1}>{listing.seats ? `${listing.seats} seats · ` : ''}{listing.city}</Text>
          </View>
          {inProposal ? (
            <Pressable style={styles.barGhost} onPress={() => router.push('/(tabs)/proposals/builder')}>
              <Ionicons name="document-text-outline" size={18} color={colors.ink} />
            </Pressable>
          ) : null}
          <Pressable style={[styles.barBtn, inProposal && styles.barBtnOn]} onPress={toggleProposal}>
            <Ionicons name={inProposal ? 'checkmark-circle' : 'add-circle-outline'} size={19} color="#fff" />
            <Text style={styles.barBtnText}>{inProposal ? 'In proposal' : 'Add to proposal'}</Text>
          </Pressable>
        </View>
      ) : null}

      <GallerySheet
        visible={galleryOpen}
        photos={carouselPhotos}
        initialIndex={galleryIndex}
        title={listing.operator}
        onClose={() => setGalleryOpen(false)}
      />
    </View>
  );
}

export default function ListingDetailScreen() {
  return (
    <ListingDetailBoundary>
      <ListingDetailBody />
    </ListingDetailBoundary>
  );
}

const styles = StyleSheet.create({
  statusBox: { marginBottom: 12, padding: 12, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border },
  statusTitle: { fontSize: 13, fontWeight: '800', color: colors.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.4 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusBtn: { flexGrow: 1, flexBasis: '45%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface2 || '#F5F5F3' },
  statusBtnText: { fontSize: 14, fontWeight: '700', color: colors.ink },
  screen: { flex: 1, backgroundColor: colors.surface2 },
  scroll: { flex: 1 },
  content: { padding: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12, backgroundColor: colors.surface2 },
  error: { color: colors.danger, textAlign: 'center', fontSize: 15 },
  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  backBtnText: { color: colors.ink, fontWeight: '700' },
  hero: { marginTop: 4, marginBottom: 12, gap: 7 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  hidden: { fontSize: 11, fontWeight: '800', color: '#fff', backgroundColor: '#555', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, overflow: 'hidden' },
  title: { fontSize: 25, fontWeight: '800', color: colors.ink, letterSpacing: -0.5, marginTop: 2 },
  placeRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  place: { fontSize: 15, fontWeight: '600', color: colors.ink },
  address: { fontSize: 13, color: colors.muted, lineHeight: 18 },
  types: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  typeChip: {
    fontSize: 12, fontWeight: '700', color: colors.brandInk, backgroundColor: colors.brandSoft,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, overflow: 'hidden',
  },
  note: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', borderRadius: 14, padding: 12, marginBottom: 12, backgroundColor: colors.surface },
  noteText: { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 18 },
  stats: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  stat: {
    flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: 12,
    shadowColor: '#0B2A14', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2,
  },
  statL: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', color: colors.faint, letterSpacing: 0.3 },
  statN: { fontSize: 18, fontWeight: '800', color: colors.ink, marginTop: 4 },
  statU: { fontSize: 11, color: colors.muted, marginTop: 1 },
  links: { gap: 10, marginTop: 14 },
  headerEdit: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: colors.brandSoft, marginRight: 4 },
  headerEditText: { fontSize: 14, fontWeight: '800', color: colors.brandInk },
  editBtn: { backgroundColor: colors.brand, borderColor: colors.brand },
  linkBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  linkText: { color: colors.ink, fontWeight: '700', fontSize: 15 },
  btnOff: { opacity: 0.6 },
  bar: {
    position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingTop: 12, backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: -4 }, elevation: 10,
  },
  barPrice: { fontSize: 18, fontWeight: '800', color: colors.ink },
  barUnit: { fontSize: 12, fontWeight: '600', color: colors.muted },
  barSub: { fontSize: 12, color: colors.muted, marginTop: 1 },
  barGhost: { width: 48, height: 48, borderRadius: 14, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  barBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 48, paddingHorizontal: 18, borderRadius: 14, backgroundColor: colors.brand },
  barBtnOn: { backgroundColor: colors.success },
  barBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
