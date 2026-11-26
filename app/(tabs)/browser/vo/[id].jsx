import { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, Alert, Image, Linking, RefreshControl,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../../context/AuthContext';
import { canManageInventory, isAdmin } from '../../../../lib/access';
import { mobileApi } from '../../../../lib/api';
import { formatDate } from '../../../../lib/format';
import { formatRupees } from '../../../../lib/expenses';
import { VERTICALS } from '../../../../constants/inventory';
import { colors } from '../../../../constants/theme';

const V = VERTICALS['virtual-office'];

function Row({ icon, label, value, onPress }) {
  if (!value) return null;
  return (
    <Pressable style={styles.row} onPress={onPress} disabled={!onPress}>
      <Ionicons name={icon} size={18} color={colors.muted} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, onPress && { color: V.color }]}>{value}</Text>
    </Pressable>
  );
}

export default function VirtualOfficeDetailScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const admin = isAdmin(user);
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const q = useQuery({ queryKey: ['virtual-office', String(id)], queryFn: () => mobileApi.getVirtualOffice(String(id)) });
  const vo = q.data;

  if (q.isLoading) return <ActivityIndicator style={{ marginTop: 40 }} color={V.color} />;
  if (!vo) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>{q.error?.message || 'Virtual office not found'}</Text>
      </View>
    );
  }

  const phone = vo.phoneNumber?.replace(/[^\d+]/g, '');
  const place = [vo.locality, vo.city].filter(Boolean).join(', ');

  const remove = () => {
    Alert.alert('Delete virtual office?', `${vo.spaceName} · ${vo.city}\nSwitching it to Inactive keeps the record instead.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await mobileApi.deleteVirtualOffice(vo.id);
            qc.invalidateQueries({ queryKey: ['virtual-offices'] });
            router.back();
          } catch (err) {
            Alert.alert('Could not delete', err.message || 'Try again');
            setBusy(false);
          }
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={q.refetch} tintColor={V.color} />}
    >
      {vo.images?.[0]?.url ? <Image source={{ uri: vo.images[0].url }} style={styles.cover} resizeMode="cover" /> : null}

      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={[styles.heroIcon, { backgroundColor: V.soft }]}>
            <Ionicons name="mail" size={20} color={V.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{vo.spaceName}</Text>
            <Text style={styles.place}>{place}{vo.cityTier ? ` · ${vo.cityTier}` : ''}</Text>
          </View>
          <View style={[styles.status, vo.isActive ? { backgroundColor: V.soft } : { backgroundColor: colors.surface2 }]}>
            <Text style={[styles.statusText, { color: vo.isActive ? V.color : colors.muted }]}>{vo.status}</Text>
          </View>
        </View>

        <View style={styles.priceBox}>
          {vo.sellingPriceInr ? (
            <>
              <Text style={styles.price}>{formatRupees(vo.sellingPriceInr)}<Text style={styles.per}> / year</Text></Text>
              <Text style={styles.sub}>{formatRupees(vo.sellingMonthlyPriceInr)} / month</Text>
              {vo.couponCode ? (
                <Text style={styles.coupon}>With {vo.couponCode} ({vo.couponPercentage}% off): {formatRupees(vo.priceAfterCouponInr)} / year</Text>
              ) : null}
            </>
          ) : (
            <Text style={styles.noPrice}>Price on request</Text>
          )}
          {admin ? (
            <View style={styles.costRow}>
              <Text style={styles.costText}>Operator: <Text style={styles.costVal}>{vo.annualPriceInr ? formatRupees(vo.annualPriceInr) : '—'}</Text></Text>
              <Text style={styles.costText}>
                Margin: <Text style={[styles.costVal, { color: (vo.marginInr || 0) >= 0 ? colors.brandInk : colors.danger }]}>{vo.marginInr != null ? formatRupees(vo.marginInr) : '—'}</Text>
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.actions}>
          {phone ? (
            <Pressable style={[styles.action, { backgroundColor: V.color }]} onPress={() => Linking.openURL(`tel:${phone}`)}>
              <Ionicons name="call" size={16} color="#fff" />
              <Text style={styles.actionTextOn}>Call</Text>
            </Pressable>
          ) : null}
          <Pressable style={styles.action} onPress={() => router.push(`/(tabs)/browser/vo/proposal?ids=${vo.id}`)}>
            <Ionicons name="paper-plane-outline" size={16} color={colors.ink} />
            <Text style={styles.actionText}>Proposal</Text>
          </Pressable>
          {canManageInventory(user) ? (
            <Pressable style={styles.action} onPress={() => router.push(`/(tabs)/browser/vo/edit?id=${vo.id}`)}>
              <Ionicons name="create-outline" size={16} color={colors.ink} />
              <Text style={styles.actionText}>Edit</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {vo.amenityList?.length ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>What's included</Text>
          <View style={styles.tags}>
            {vo.amenityList.map((a) => (
              <View key={a} style={styles.tag}>
                <Ionicons name="checkmark" size={13} color={V.color} />
                <Text style={styles.tagText}>{a}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.card}>
        <Row icon="location-outline" label="Address" value={vo.fullAddress} />
        <Row icon="map-outline" label="State" value={vo.state} />
        <Row icon="call-outline" label="Phone" value={vo.phoneNumber} onPress={phone ? () => Linking.openURL(`tel:${phone}`) : undefined} />
        <Row icon="chatbox-ellipses-outline" label="Contact" value={vo.contactNotes} />
        <Row icon="document-text-outline" label="Remarks" value={vo.remarks} />
        <Row icon="time-outline" label="Updated" value={vo.updated_on ? formatDate(vo.updated_on) : ''} />
      </View>

      {vo.images?.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {vo.images.slice(1).map((img) => <Image key={img.url} source={{ uri: img.url }} style={styles.thumb} />)}
        </ScrollView>
      ) : null}

      {admin ? (
        <Pressable style={styles.delete} onPress={remove} disabled={busy}>
          {busy ? <ActivityIndicator color={colors.danger} /> : <Text style={styles.deleteText}>Delete virtual office</Text>}
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface2 },
  content: { padding: 16, paddingBottom: 40, gap: 12 },
  cover: { width: '100%', height: 190, borderRadius: 18, backgroundColor: colors.surface },
  hero: { backgroundColor: colors.surface, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: colors.border },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 19, fontWeight: '800', color: colors.ink },
  place: { fontSize: 13, color: colors.muted, marginTop: 2 },
  status: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 12, fontWeight: '800' },
  priceBox: { marginTop: 14, padding: 12, borderRadius: 14, backgroundColor: colors.surface2 },
  price: { fontSize: 26, fontWeight: '800', color: colors.ink },
  per: { fontSize: 14, fontWeight: '600', color: colors.muted },
  sub: { fontSize: 13, color: colors.muted, marginTop: 2 },
  coupon: { fontSize: 13, fontWeight: '700', color: '#9A5B00', marginTop: 6 },
  noPrice: { fontSize: 16, fontWeight: '700', color: colors.muted },
  costRow: { flexDirection: 'row', gap: 16, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
  costText: { fontSize: 12.5, color: colors.muted },
  costVal: { fontWeight: '800', color: colors.ink },
  actions: { flexDirection: 'row', gap: 8, marginTop: 14 },
  action: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11,
    borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  actionText: { fontSize: 14, fontWeight: '700', color: colors.ink },
  actionTextOn: { fontSize: 14, fontWeight: '800', color: '#fff' },
  card: { backgroundColor: colors.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.border },
  cardTitle: { fontSize: 13, fontWeight: '800', color: colors.ink, marginBottom: 10 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.surface2, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  tagText: { fontSize: 13, color: colors.ink, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 9 },
  rowLabel: { width: 70, fontSize: 13, color: colors.muted },
  rowValue: { flex: 1, fontSize: 14, color: colors.ink, fontWeight: '600', textAlign: 'right' },
  thumb: { width: 120, height: 90, borderRadius: 12, backgroundColor: colors.surface },
  delete: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', backgroundColor: '#FDECEC' },
  deleteText: { color: colors.danger, fontWeight: '700', fontSize: 15 },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  missingText: { fontSize: 15, color: colors.muted },
});
