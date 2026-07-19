import { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TextInput, Pressable, StyleSheet,
  ActivityIndicator, Switch, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  INV_SCHEMA, AMENITIES, schemaForUser, listingToDraft,
  draftToListingPayload, validateDraft,
} from '@spacehaat/inventory-schema';
import { colors } from '../../constants/theme';
import { mobileApi } from '../../lib/api';
import InventoryMediaSection from './InventoryMediaSection';

export async function resolveDraftImages(draftPhotos, listingId) {
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

function WizardField({ field, value, onChange, uploadingImages }) {
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
    return (
      <InventoryMediaSection
        value={value}
        onChange={onChange}
        uploading={uploadingImages}
      />
    );
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
        autoCapitalize={field.ph?.includes('http') ? 'none' : 'sentences'}
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
  const [uploadingImages, setUploadingImages] = useState(false);

  const group = groups[step];
  const pct = groups.length ? Math.round(((step + 1) / groups.length) * 100) : 0;
  const isEdit = Boolean(listing?.id || listing?._id);
  const isMediaStep = group?.id === 'G';

  const setPath = (path, val) => setDraft((prev) => ({ ...prev, [path]: val }));

  const handleSave = async () => {
    const errors = validateDraft(draft, groups);
    if (errors.length) {
      setError(errors[0]);
      return;
    }
    setError('');
    try {
      setUploadingImages(true);
      const payload = draftToListingPayload(draft, groups);
      const listingId = listing?.id || listing?._id;
      const { images, photoMeta } = await resolveDraftImages(draft.images, listingId);
      payload.images = images;
      payload.photoMeta = photoMeta;
      if (images.length) {
        payload.profile = {
          ...(payload.profile || {}),
          contactsMedia: {
            ...(payload.profile?.contactsMedia || {}),
            gallery: images,
          },
        };
      }
      onSave?.(payload);
    } catch (err) {
      setError(err?.message || 'Failed to upload photos');
    } finally {
      setUploadingImages(false);
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
            <Text style={[styles.stepChipText, i === step && styles.stepChipTextOn]}>
              {g.id} · {g.id === 'G' ? 'Media' : g.title.split(' ')[0]}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} keyboardShouldPersistTaps="handled">
        <View style={styles.stepHead}>
          <Text style={styles.stepTitle}>{group?.title}</Text>
          <Text style={styles.stepSub}>
            Step {step + 1} of {groups.length}
            {group?.tag === 'internal' ? ' · Internal only' : ''}
            {isMediaStep ? ' · Upload, reorder, and label photos' : ''}
          </Text>
        </View>

        {(group?.fields || []).map((field, idx) => (
          <WizardField
            key={field.p || field.div || idx}
            field={field}
            value={field.p ? draft[field.p] : undefined}
            onChange={(val) => field.p && setPath(field.p, val)}
            uploadingImages={uploadingImages || saving}
          />
        ))}

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.cancelBtn} onPress={onCancel} disabled={saving || uploadingImages}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        {step > 0 ? (
          <Pressable style={styles.backBtn} onPress={() => setStep((s) => s - 1)} disabled={saving || uploadingImages}>
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        ) : null}
        {step < groups.length - 1 ? (
          <Pressable style={styles.nextBtn} onPress={() => setStep((s) => s + 1)} disabled={saving || uploadingImages}>
            <Text style={styles.nextText}>Continue</Text>
          </Pressable>
        ) : (
          <Pressable
            style={[styles.saveBtn, (saving || uploadingImages) && styles.btnOff]}
            onPress={handleSave}
            disabled={saving || uploadingImages}
          >
            {(saving || uploadingImages) ? <ActivityIndicator color="#fff" /> : (
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
