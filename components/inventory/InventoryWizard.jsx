import { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TextInput, Pressable, StyleSheet,
  ActivityIndicator, Switch, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const IMAGE_MEDIA_TYPES = (() => {
  if (ImagePicker.MediaType?.Images) return ImagePicker.MediaType.Images;
  if (ImagePicker.MediaTypeOptions?.Images) return ImagePicker.MediaTypeOptions.Images;
  return 'images';
})();
import {
  INV_SCHEMA, AMENITIES, schemaForUser, listingToDraft,
  draftToListingPayload, validateDraft,
} from '@spacehaat/inventory-schema';
import { colors } from '../../constants/theme';
import { mobileApi } from '../../lib/api';

async function resolveDraftImages(draftPhotos, listingId) {
  const photos = Array.isArray(draftPhotos) ? draftPhotos.filter((p) => p?.uri || p?.src) : [];
  if (!photos.length) return { images: [], photoMeta: [] };

  const pending = photos.filter((p) => p.local);
  let uploaded = [];
  if (pending.length) {
    const files = pending.map((p, i) => ({
      uri: p.uri,
      name: p.fileName || `photo-${i + 1}.jpg`,
      type: p.mimeType || 'image/jpeg',
    }));
    uploaded = await mobileApi.uploadImages(files, listingId);
  }

  const images = [];
  const photoMeta = [];
  let uploadIdx = 0;
  for (const photo of photos) {
    let src = photo.src || photo.uri;
    if (photo.local) {
      src = uploaded[uploadIdx++]?.url;
    }
    if (!src) continue;
    images.push(src);
    photoMeta.push({ label: photo.label || '', price: photo.price ?? '' });
  }
  return { images, photoMeta };
}

function ImagesField({ value, onChange }) {
  const photos = Array.isArray(value) ? value : [];

  const pickImages = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: IMAGE_MEDIA_TYPES,
      allowsMultipleSelection: true,
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.length) return;

    onChange([
      ...photos,
      ...result.assets.map((asset) => ({
        uri: asset.uri,
        local: true,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
        label: '',
        price: '',
      })),
    ]);
  };

  const removeAt = (index) => onChange(photos.filter((_, i) => i !== index));
  const setCover = (index) => {
    const next = [...photos];
    const [item] = next.splice(index, 1);
    next.unshift(item);
    onChange(next);
  };

  return (
    <View style={styles.field}>
      <Text style={styles.label}>Workspace photos</Text>
      <View style={styles.photoGrid}>
        {photos.map((p, i) => (
          <View key={`${p.uri || p.src}-${i}`} style={styles.photoCard}>
            <Image source={{ uri: p.uri || p.src }} style={styles.photoThumb} />
            {i === 0 ? (
              <Text style={styles.coverTag}>Cover</Text>
            ) : (
              <Pressable style={styles.coverBtn} onPress={() => setCover(i)}>
                <Ionicons name="star-outline" size={14} color="#fff" />
              </Pressable>
            )}
            <Pressable style={styles.removeBtn} onPress={() => removeAt(i)}>
              <Ionicons name="close" size={14} color="#fff" />
            </Pressable>
          </View>
        ))}
      </View>
      <Pressable style={styles.addPhotosBtn} onPress={pickImages}>
        <Ionicons name="cloud-upload-outline" size={20} color={colors.brand} />
        <Text style={styles.addPhotosText}>Add photos</Text>
        <Text style={styles.addPhotosHint}>JPG / PNG · first photo is cover</Text>
      </Pressable>
    </View>
  );
}

function WizardField({ field, value, onChange }) {
  if (field.div) {
    return (
      <View style={styles.dividerRow}>
        <Text style={styles.divider}>{field.div}</Text>
        {field.tag === 'live' ? <Text style={styles.liveTag}>live</Text> : null}
      </View>
    );
  }

  const label = (
    <Text style={styles.label}>
      {field.l}{field.req ? ' *' : ''}{field.live ? ' · live' : ''}
    </Text>
  );

  if (field.t === 'images') {
    return <ImagesField value={value} onChange={onChange} />;
  }

  if (field.t === 'toggle') {
    return (
      <View style={styles.field}>
        {label}
        <Switch
          value={Boolean(value)}
          onValueChange={onChange}
          trackColor={{ false: colors.border, true: colors.brandSoft }}
          thumbColor={value ? colors.brand : '#f4f4f4'}
        />
      </View>
    );
  }

  if (field.t === 'chips') {
    const choices = field.choices ? field.choices() : AMENITIES;
    const selected = Array.isArray(value) ? value : [];
    return (
      <View style={styles.field}>
        {label}
        <View style={styles.chipRow}>
          {choices.map((choice) => {
            const on = selected.includes(choice);
            return (
              <Pressable
                key={choice}
                style={[styles.chip, on && styles.chipOn]}
                onPress={() => onChange(on ? selected.filter((x) => x !== choice) : [...selected, choice])}
              >
                <Text style={[styles.chipText, on && styles.chipTextOn]}>{choice}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  if (field.t === 'select') {
    const opts = field.opts ? field.opts() : [];
    return (
      <View style={styles.field}>
        {label}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {opts.map((opt) => {
            const on = value === opt;
            return (
              <Pressable key={opt} style={[styles.chip, on && styles.chipOn]} onPress={() => onChange(opt)}>
                <Text style={[styles.chipText, on && styles.chipTextOn]}>{opt}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  if (field.t === 'textarea' || field.t === 'list') {
    const textVal = field.t === 'list' && Array.isArray(value) ? value.join('\n') : (value ?? '');
    return (
      <View style={styles.field}>
        {label}
        <TextInput
          style={[styles.input, styles.textArea]}
          value={String(textVal)}
          onChangeText={onChange}
          placeholder={field.ph || ''}
          multiline
          numberOfLines={field.t === 'list' ? 4 : 3}
          textAlignVertical="top"
        />
      </View>
    );
  }

  const keyboardType = field.t === 'num' || field.t === 'inr' ? 'numeric' : 'default';
  return (
    <View style={styles.field}>
      {label}
      <TextInput
        style={styles.input}
        value={value === undefined || value === null ? '' : String(value)}
        onChangeText={onChange}
        placeholder={field.ph || ''}
        keyboardType={keyboardType}
      />
      {field.suf ? <Text style={styles.suffix}>{field.suf}</Text> : null}
    </View>
  );
}

export default function InventoryWizard({
  listing,
  canSeeInternal,
  saving,
  onSave,
  onCancel,
}) {
  const groups = useMemo(() => schemaForUser(canSeeInternal, INV_SCHEMA), [canSeeInternal]);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState(() => listingToDraft(listing));
  const [error, setError] = useState('');

  const group = groups[step];
  const pct = groups.length ? Math.round(((step + 1) / groups.length) * 100) : 0;
  const isEdit = Boolean(listing?.id || listing?._id);

  const setPath = (path, val) => setDraft((prev) => ({ ...prev, [path]: val }));

  const handleSave = async () => {
    const errors = validateDraft(draft, groups);
    if (errors.length) {
      setError(errors[0]);
      return;
    }
    setError('');
    try {
      const payload = draftToListingPayload(draft, groups);
      const listingId = listing?.id || listing?._id;
      const { images, photoMeta } = await resolveDraftImages(draft.images, listingId);
      payload.images = images;
      payload.photoMeta = photoMeta;
      onSave?.(payload);
    } catch (err) {
      setError(err?.message || 'Failed to upload photos');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct}%` }]} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rail} contentContainerStyle={styles.railContent}>
        {groups.map((g, i) => (
          <Pressable
            key={g.id}
            style={[styles.stepChip, i === step && styles.stepChipOn, i < step && styles.stepChipDone]}
            onPress={() => setStep(i)}
          >
            <Text style={[styles.stepChipText, i === step && styles.stepChipTextOn]}>{g.id} · {g.title.split(' ')[0]}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} keyboardShouldPersistTaps="handled">
        <View style={styles.stepHead}>
          <Text style={styles.stepTitle}>{group?.title}</Text>
          <Text style={styles.stepSub}>
            Step {step + 1} of {groups.length}
            {group?.tag === 'internal' ? ' · Internal only' : ''}
          </Text>
        </View>

        {(group?.fields || []).map((field, idx) => (
          <WizardField
            key={field.p || field.div || idx}
            field={field}
            value={field.p ? draft[field.p] : undefined}
            onChange={(val) => field.p && setPath(field.p, val)}
          />
        ))}

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.cancelBtn} onPress={onCancel} disabled={saving}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        {step > 0 ? (
          <Pressable style={styles.backBtn} onPress={() => setStep((s) => s - 1)} disabled={saving}>
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        ) : null}
        {step < groups.length - 1 ? (
          <Pressable style={styles.nextBtn} onPress={() => setStep((s) => s + 1)} disabled={saving}>
            <Text style={styles.nextText}>Continue</Text>
          </Pressable>
        ) : (
          <Pressable style={[styles.saveBtn, saving && styles.btnOff]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : (
              <>
                <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                <Text style={styles.saveText}>{isEdit ? 'Save changes' : 'Publish'}</Text>
              </>
            )}
          </Pressable>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.surface2 },
  progressTrack: { height: 4, backgroundColor: colors.border },
  progressFill: { height: 4, backgroundColor: colors.brand },
  rail: { maxHeight: 48, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  railContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  stepChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
    backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border,
  },
  stepChipOn: { backgroundColor: colors.brandSoft, borderColor: colors.brand },
  stepChipDone: { borderColor: colors.brand },
  stepChipText: { fontSize: 12, fontWeight: '600', color: colors.muted },
  stepChipTextOn: { color: colors.brandInk },
  body: { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 24 },
  stepHead: { marginBottom: 16 },
  stepTitle: { fontSize: 20, fontWeight: '800', color: colors.ink },
  stepSub: { fontSize: 13, color: colors.muted, marginTop: 4 },
  field: { marginBottom: 14 },
  label: { fontSize: 12, fontWeight: '700', color: colors.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3 },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 15, color: colors.ink,
  },
  textArea: { minHeight: 88, paddingTop: 11 },
  suffix: { fontSize: 12, color: colors.muted, marginTop: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  chipOn: { backgroundColor: colors.brandSoft, borderColor: colors.brand },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.ink },
  chipTextOn: { color: colors.brandInk },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 8 },
  divider: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', color: colors.faint },
  liveTag: { fontSize: 10, fontWeight: '700', color: colors.brand, backgroundColor: colors.brandSoft, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  error: { color: colors.danger, fontSize: 13, marginTop: 8 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 },
  photoCard: {
    width: 104, height: 78, borderRadius: 10, overflow: 'hidden',
    backgroundColor: colors.border, position: 'relative',
  },
  photoThumb: { width: '100%', height: '100%' },
  coverTag: {
    position: 'absolute', left: 4, bottom: 4, fontSize: 9, fontWeight: '700',
    color: '#fff', backgroundColor: colors.brand, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  coverBtn: {
    position: 'absolute', left: 4, top: 4, width: 22, height: 22, borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center',
  },
  removeBtn: {
    position: 'absolute', right: 4, top: 4, width: 22, height: 22, borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center',
  },
  addPhotosBtn: {
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.border, borderRadius: 12,
    paddingVertical: 18, alignItems: 'center', gap: 4, backgroundColor: colors.surface,
  },
  addPhotosText: { fontSize: 14, fontWeight: '700', color: colors.ink },
  addPhotosHint: { fontSize: 11, color: colors.muted },
  footer: {
    flexDirection: 'row', gap: 8, padding: 16, borderTopWidth: 1, borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  cancelBtn: { paddingVertical: 14, paddingHorizontal: 12 },
  cancelText: { color: colors.muted, fontWeight: '600' },
  backBtn: {
    paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  backText: { fontWeight: '700', color: colors.ink },
  nextBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14,
    borderRadius: 12, backgroundColor: colors.brand,
  },
  nextText: { color: '#fff', fontWeight: '700' },
  saveBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 12, backgroundColor: colors.brand,
  },
  saveText: { color: '#fff', fontWeight: '700' },
  btnOff: { opacity: 0.6 },
});
