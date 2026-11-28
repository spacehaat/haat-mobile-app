import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, ScrollView, Pressable, StyleSheet, ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Redirect, router, useLocalSearchParams, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../../context/AuthContext';
import { canManageInventory, canEnableListings, defaultTabPathForUser, isAdmin } from '../../../../lib/access';
import { mobileApi } from '../../../../lib/api';
import { formatRupees } from '../../../../lib/expenses';
import { IMAGE_MEDIA_TYPES, assetToFile } from '../../../../components/space-editor/fields';
import { VERTICALS } from '../../../../constants/inventory';
import { colors } from '../../../../constants/theme';

const V = VERTICALS['virtual-office'];
const TIERS = ['Tier 1', 'Tier 2', 'Tier 3'];
const AMENITY_PICKS = ['Business Address', 'Mail Handling', 'GST Registration', 'Company Registration', 'Meeting Rooms', 'Reception Services', 'Lounge Access'];

const EMPTY = {
  spaceName: '', city: '', locality: '', state: '', fullAddress: '', phoneNumber: '', status: 'Active', cityTier: '',
  annualPriceInr: '', sellingPriceInr: '', couponCode: '', couponPercentage: '',
  amenities: 'Business Address, Mail Handling', contactNotes: '', remarks: '', images: [],
};

const splitAmenities = (s) => String(s || '').split(',').map((x) => x.trim()).filter(Boolean);
const digits = (s) => String(s).replace(/[^\d]/g, '');

function Field({ label, hint, children }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

/** Add a virtual office, or edit one (`?id=`). */
export default function VirtualOfficeFormScreen() {
  const { id } = useLocalSearchParams();
  const editId = typeof id === 'string' && id ? id : null;
  const { user } = useAuth();
  const admin = isAdmin(user);
  const canEnable = canEnableListings(user);
  const navigation = useNavigation();
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const [loaded, setLoaded] = useState(!editId);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { data: stats } = useQuery({ queryKey: ['virtual-offices', 'stats'], queryFn: () => mobileApi.getVirtualOfficeStats(), staleTime: 5 * 60 * 1000 });

  useEffect(() => {
    navigation.setOptions({ title: editId ? 'Edit virtual office' : 'New virtual office' });
  }, [navigation, editId]);

  useEffect(() => {
    if (!editId) return;
    mobileApi.getVirtualOffice(editId)
      .then((vo) => {
        setForm({
          ...EMPTY,
          ...vo,
          annualPriceInr: vo.annualPriceInr ? String(vo.annualPriceInr) : '',
          sellingPriceInr: vo.sellingPriceInr ? String(vo.sellingPriceInr) : '',
          couponPercentage: vo.couponPercentage ? String(vo.couponPercentage) : '',
          images: vo.images || [],
        });
        setLoaded(true);
      })
      .catch((err) => {
        Alert.alert('Could not open', err.message || 'Try again');
        router.back();
      });
  }, [editId]);

  if (!canManageInventory(user)) return <Redirect href={defaultTabPathForUser(user)} />;

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const amenities = splitAmenities(form.amenities);
  const toggleAmenity = (a) => {
    const next = amenities.includes(a) ? amenities.filter((x) => x !== a) : [...amenities, a];
    set('amenities')(next.join(', '));
  };

  const addPhotos = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Photos access needed', 'Allow access in Settings to add photos.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: IMAGE_MEDIA_TYPES, quality: 0.7, allowsMultipleSelection: true, selectionLimit: 10 });
    if (res.canceled || !res.assets?.length) return;
    setUploading(true);
    try {
      const up = await mobileApi.uploadImages(res.assets.map(assetToFile), 'virtual-offices');
      const added = up.filter((u) => u?.url).map((u) => ({ url: u.url, name: '' }));
      setForm((f) => ({ ...f, images: [...(f.images || []), ...added] }));
    } catch (err) {
      Alert.alert('Upload failed', err.message || 'Could not upload the photos');
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!form.spaceName.trim() || !form.city.trim()) {
      Alert.alert('Missing details', 'Space name and city are needed.');
      return;
    }
    const code = form.couponCode.trim().toUpperCase();
    const pct = Number(form.couponPercentage) || 0;
    if (code && (pct <= 0 || pct > 100)) {
      Alert.alert('Coupon', 'Enter a discount between 1 and 100%.');
      return;
    }
    const body = {
      spaceName: form.spaceName, city: form.city, locality: form.locality, state: form.state, fullAddress: form.fullAddress,
      phoneNumber: form.phoneNumber, status: form.status, cityTier: form.cityTier, amenities: form.amenities,
      contactNotes: form.contactNotes, remarks: form.remarks, images: form.images,
      sellingPriceInr: Number(form.sellingPriceInr) || 0, couponCode: code, couponPercentage: code ? pct : 0,
      ...(admin ? { annualPriceInr: Number(form.annualPriceInr) || 0 } : {}),
    };
    setSaving(true);
    try {
      const saved = editId ? await mobileApi.updateVirtualOffice(editId, body) : await mobileApi.createVirtualOffice(body);
      qc.invalidateQueries({ queryKey: ['virtual-offices'] });
      qc.setQueryData(['virtual-office', saved.id], saved);
      if (editId) router.back();
      else router.replace(`/(tabs)/browser/vo/${saved.id}`);
    } catch (err) {
      Alert.alert('Could not save', err.message || 'Try again');
      setSaving(false);
    }
  };

  if (!loaded) return <ActivityIndicator style={{ marginTop: 40 }} color={V.color} />;

  const selling = Number(form.sellingPriceInr) || 0;
  const operator = Number(form.annualPriceInr) || 0;
  const cities = (stats?.cities || []).map((c) => c.city);
  const cityMatches = form.city.trim()
    ? cities.filter((c) => c.toLowerCase().startsWith(form.city.trim().toLowerCase()) && c.toLowerCase() !== form.city.trim().toLowerCase()).slice(0, 6)
    : [];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Field label="Space name *">
            <TextInput style={styles.input} value={form.spaceName} onChangeText={set('spaceName')} placeholder="e.g. Vision Cowork" placeholderTextColor={colors.faint} />
          </Field>
          <Field label="City *">
            <TextInput style={styles.input} value={form.city} onChangeText={set('city')} placeholder="City" placeholderTextColor={colors.faint} />
            {cityMatches.length ? (
              <View style={styles.suggest}>
                {cityMatches.map((c) => (
                  <Pressable key={c} style={styles.suggestChip} onPress={() => set('city')(c)}>
                    <Text style={styles.suggestText}>{c}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </Field>
          <View style={styles.two}>
            <View style={{ flex: 1 }}>
              <Field label="Locality">
                <TextInput style={styles.input} value={form.locality} onChangeText={set('locality')} placeholder="e.g. Saket" placeholderTextColor={colors.faint} />
              </Field>
            </View>
            <View style={{ flex: 1 }}>
              <Field label="State">
                <TextInput style={styles.input} value={form.state} onChangeText={set('state')} placeholder="State" placeholderTextColor={colors.faint} />
              </Field>
            </View>
          </View>
          <Field label="Full address">
            <TextInput style={[styles.input, styles.multi]} value={form.fullAddress} onChangeText={set('fullAddress')} multiline placeholder="Address on the customer's documents" placeholderTextColor={colors.faint} />
          </Field>
          <Field label="Operator phone">
            <TextInput style={styles.input} value={form.phoneNumber} onChangeText={set('phoneNumber')} keyboardType="phone-pad" placeholder="Phone" placeholderTextColor={colors.faint} />
          </Field>
          {canEnable ? (
            <Field label="Status">
              <View style={styles.seg}>
                {['Active', 'Inactive'].map((s) => (
                  <Pressable key={s} style={[styles.segBtn, form.status === s && { backgroundColor: V.color }]} onPress={() => set('status')(s)}>
                    <Text style={[styles.segText, form.status === s && { color: '#fff' }]}>{s}</Text>
                  </Pressable>
                ))}
              </View>
            </Field>
          ) : (
            <Field label="Status">
              <Text style={styles.statusNote}>
                {editId ? `${form.status}. Only staff allowed to enable properties can change it.` : 'Saved as Inactive until someone allowed to enable properties switches it on.'}
              </Text>
            </Field>
          )}
          <Field label="City tier">
            <View style={styles.seg}>
              {TIERS.map((t) => (
                <Pressable key={t} style={[styles.segBtn, form.cityTier === t && { backgroundColor: V.color }]} onPress={() => set('cityTier')(form.cityTier === t ? '' : t)}>
                  <Text style={[styles.segText, form.cityTier === t && { color: '#fff' }]}>{t}</Text>
                </Pressable>
              ))}
            </View>
          </Field>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Price per year</Text>
          <View style={styles.two}>
            {admin ? (
              <View style={{ flex: 1 }}>
                <Field label="Operator (₹)" hint="What we pay">
                  <TextInput style={styles.input} value={form.annualPriceInr} onChangeText={(v) => set('annualPriceInr')(digits(v))} keyboardType="number-pad" placeholder="0" placeholderTextColor={colors.faint} />
                </Field>
              </View>
            ) : null}
            <View style={{ flex: 1 }}>
              <Field label="Selling (₹)" hint={selling ? `${formatRupees(Math.round(selling / 12))} / month` : 'What the customer pays'}>
                <TextInput style={styles.input} value={form.sellingPriceInr} onChangeText={(v) => set('sellingPriceInr')(digits(v))} keyboardType="number-pad" placeholder="0" placeholderTextColor={colors.faint} />
              </Field>
            </View>
          </View>
          {admin && selling && operator ? (
            <Text style={[styles.margin, { color: selling >= operator ? colors.brandInk : colors.danger }]}>Margin {formatRupees(selling - operator)} / year</Text>
          ) : null}
          <View style={styles.two}>
            <View style={{ flex: 1 }}>
              <Field label="Coupon code">
                <TextInput style={styles.input} value={form.couponCode} onChangeText={(v) => set('couponCode')(v.toUpperCase().replace(/\s+/g, ''))} autoCapitalize="characters" placeholder="None" placeholderTextColor={colors.faint} />
              </Field>
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Discount %">
                <TextInput style={[styles.input, !form.couponCode && { opacity: 0.5 }]} editable={!!form.couponCode} value={form.couponCode ? form.couponPercentage : ''} onChangeText={(v) => set('couponPercentage')(digits(v).slice(0, 3))} keyboardType="number-pad" placeholder="0" placeholderTextColor={colors.faint} />
              </Field>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>What's included</Text>
          <View style={styles.tags}>
            {AMENITY_PICKS.map((a) => {
              const on = amenities.includes(a);
              return (
                <Pressable key={a} style={[styles.tag, on && { backgroundColor: V.soft, borderColor: V.color }]} onPress={() => toggleAmenity(a)}>
                  {on ? <Ionicons name="checkmark" size={13} color={V.color} /> : null}
                  <Text style={[styles.tagText, on && { color: V.color, fontWeight: '800' }]}>{a}</Text>
                </Pressable>
              );
            })}
          </View>
          <TextInput style={[styles.input, { marginTop: 10 }]} value={form.amenities} onChangeText={set('amenities')} placeholder="Others, separated by commas" placeholderTextColor={colors.faint} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Notes (internal)</Text>
          <Field label="Contact / notes">
            <TextInput style={[styles.input, styles.multi]} value={form.contactNotes} onChangeText={set('contactNotes')} multiline placeholder="Who to call, how they bill…" placeholderTextColor={colors.faint} />
          </Field>
          <Field label="Remarks">
            <TextInput style={[styles.input, styles.multi]} value={form.remarks} onChangeText={set('remarks')} multiline placeholder="e.g. Price checked Apr 2025" placeholderTextColor={colors.faint} />
          </Field>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Photos</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {(form.images || []).map((img, i) => (
              <View key={`${img.url}-${i}`}>
                <Image source={{ uri: img.url }} style={styles.thumb} />
                <Pressable style={styles.thumbX} hitSlop={8} onPress={() => setForm((f) => ({ ...f, images: f.images.filter((_, j) => j !== i) }))}>
                  <Ionicons name="close" size={14} color="#fff" />
                </Pressable>
                {i === 0 ? <Text style={styles.cover}>Cover</Text> : null}
              </View>
            ))}
            <Pressable style={styles.addPhoto} onPress={addPhotos} disabled={uploading}>
              {uploading ? <ActivityIndicator color={V.color} /> : (
                <>
                  <Ionicons name="images-outline" size={22} color={V.color} />
                  <Text style={styles.addPhotoText}>Add</Text>
                </>
              )}
            </Pressable>
          </ScrollView>
        </View>

        <Pressable style={[styles.saveBtn, (saving || uploading) && { opacity: 0.6 }]} onPress={save} disabled={saving || uploading}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>{editId ? 'Save changes' : 'Add virtual office'}</Text>}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  statusNote: { fontSize: 13.5, color: colors.muted, lineHeight: 19 },
  screen: { flex: 1, backgroundColor: colors.surface2 },
  content: { padding: 16, paddingBottom: 48, gap: 12 },
  card: { backgroundColor: colors.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.border },
  cardTitle: { fontSize: 14, fontWeight: '800', color: colors.ink, marginBottom: 10 },
  field: { marginBottom: 12 },
  label: { fontSize: 12.5, fontWeight: '700', color: colors.muted, marginBottom: 6 },
  hint: { fontSize: 11.5, color: colors.faint, marginTop: 4 },
  input: {
    backgroundColor: colors.surface2, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11,
    fontSize: 15, color: colors.ink, borderWidth: 1, borderColor: colors.border,
  },
  multi: { minHeight: 64, textAlignVertical: 'top' },
  two: { flexDirection: 'row', gap: 10 },
  seg: { flexDirection: 'row', gap: 6 },
  segBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 11, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border },
  segText: { fontSize: 13, fontWeight: '700', color: colors.ink },
  suggest: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  suggestChip: { backgroundColor: V.soft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  suggestText: { fontSize: 12.5, fontWeight: '700', color: V.color },
  margin: { fontSize: 13, fontWeight: '800', marginBottom: 12, marginTop: -4 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 7, borderWidth: 1, borderColor: colors.border },
  tagText: { fontSize: 13, fontWeight: '600', color: colors.ink },
  thumb: { width: 96, height: 76, borderRadius: 12, backgroundColor: colors.surface2 },
  thumbX: { position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  cover: { position: 'absolute', bottom: 4, left: 4, fontSize: 10, fontWeight: '800', color: '#fff', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 5, borderRadius: 5, overflow: 'hidden' },
  addPhoto: { width: 96, height: 76, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: V.border, alignItems: 'center', justifyContent: 'center', gap: 2 },
  addPhotoText: { fontSize: 12, fontWeight: '700', color: V.color },
  saveBtn: { backgroundColor: V.color, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
