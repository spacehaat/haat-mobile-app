import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, Image, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../../constants/theme';

const IMAGE_MEDIA_TYPES = (() => {
  if (ImagePicker.MediaType?.Images) return ImagePicker.MediaType.Images;
  if (ImagePicker.MediaTypeOptions?.Images) return ImagePicker.MediaTypeOptions.Images;
  return 'images';
})();

function assetToPhoto(asset) {
  return {
    uri: asset.uri,
    local: true,
    fileName: asset.fileName,
    mimeType: asset.mimeType,
    label: '',
    price: '',
  };
}

export default function InventoryMediaSection({ value, onChange, uploading = false }) {
  const photos = Array.isArray(value) ? value : [];
  const [expandedIndex, setExpandedIndex] = useState(null);

  const updatePhotos = (next) => onChange(next);

  const ensureLibraryPermission = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.granted) return true;
    Alert.alert('Photos access needed', 'Allow photo library access to upload workspace images.');
    return false;
  };

  const ensureCameraPermission = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (perm.granted) return true;
    Alert.alert('Camera access needed', 'Allow camera access to take workspace photos.');
    return false;
  };

  const pickFromLibrary = async () => {
    if (!(await ensureLibraryPermission())) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: IMAGE_MEDIA_TYPES,
      allowsMultipleSelection: true,
      quality: 0.85,
      selectionLimit: 20,
    });
    if (result.canceled || !result.assets?.length) return;

    updatePhotos([...photos, ...result.assets.map(assetToPhoto)]);
  };

  const takePhoto = async () => {
    if (!(await ensureCameraPermission())) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: IMAGE_MEDIA_TYPES,
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.length) return;

    updatePhotos([...photos, ...result.assets.map(assetToPhoto)]);
  };

  const removeAt = (index) => {
    Alert.alert('Remove photo', 'Remove this image from the listing?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          updatePhotos(photos.filter((_, i) => i !== index));
          if (expandedIndex === index) setExpandedIndex(null);
        },
      },
    ]);
  };

  const setCover = (index) => {
    if (index === 0) return;
    const next = [...photos];
    const [item] = next.splice(index, 1);
    next.unshift(item);
    updatePhotos(next);
    setExpandedIndex(0);
  };

  const movePhoto = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= photos.length) return;
    const next = [...photos];
    [next[index], next[target]] = [next[target], next[index]];
    updatePhotos(next);
    setExpandedIndex(target);
  };

  const updatePhotoField = (index, field, text) => {
    updatePhotos(photos.map((p, i) => (i === index ? { ...p, [field]: text } : p)));
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Workspace photos</Text>
          <Text style={styles.sub}>
            {photos.length
              ? `${photos.length} photo${photos.length === 1 ? '' : 's'} · first is cover`
              : 'Add photos for the listing gallery'}
          </Text>
        </View>
        {uploading ? <ActivityIndicator color={colors.brand} /> : null}
      </View>

      {photos.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carousel}
        >
          {photos.map((photo, index) => {
            const uri = photo.uri || photo.src;
            const expanded = expandedIndex === index;
            return (
              <View key={`${uri}-${index}`} style={styles.card}>
                <Pressable onPress={() => setExpandedIndex(expanded ? null : index)}>
                  <Image source={{ uri }} style={styles.thumb} />
                  {index === 0 ? (
                    <View style={styles.coverBadge}>
                      <Text style={styles.coverBadgeText}>Cover</Text>
                    </View>
                  ) : null}
                  {photo.local ? (
                    <View style={styles.newBadge}>
                      <Text style={styles.newBadgeText}>New</Text>
                    </View>
                  ) : null}
                </Pressable>

                <View style={styles.cardActions}>
                  {index > 0 ? (
                    <Pressable style={styles.iconBtn} onPress={() => setCover(index)}>
                      <Ionicons name="star-outline" size={16} color={colors.ink} />
                    </Pressable>
                  ) : null}
                  <Pressable
                    style={[styles.iconBtn, index === 0 && styles.iconBtnOff]}
                    disabled={index === 0}
                    onPress={() => movePhoto(index, -1)}
                  >
                    <Ionicons name="chevron-back" size={16} color={colors.ink} />
                  </Pressable>
                  <Pressable
                    style={[styles.iconBtn, index === photos.length - 1 && styles.iconBtnOff]}
                    disabled={index === photos.length - 1}
                    onPress={() => movePhoto(index, 1)}
                  >
                    <Ionicons name="chevron-forward" size={16} color={colors.ink} />
                  </Pressable>
                  <Pressable style={[styles.iconBtn, styles.iconBtnDanger]} onPress={() => removeAt(index)}>
                    <Ionicons name="trash-outline" size={16} color={colors.danger} />
                  </Pressable>
                </View>

                {expanded ? (
                  <View style={styles.meta}>
                    <Text style={styles.metaLabel}>Label</Text>
                    <TextInput
                      style={styles.metaInput}
                      value={photo.label || ''}
                      onChangeText={(text) => updatePhotoField(index, 'label', text)}
                      placeholder="e.g. Reception, Cabin, Meeting room"
                      placeholderTextColor={colors.faint}
                    />
                    <Text style={styles.metaLabel}>Price hint (optional)</Text>
                    <TextInput
                      style={styles.metaInput}
                      value={photo.price === undefined || photo.price === null ? '' : String(photo.price)}
                      onChangeText={(text) => updatePhotoField(index, 'price', text)}
                      placeholder="e.g. 8500"
                      placeholderTextColor={colors.faint}
                      keyboardType="numeric"
                    />
                  </View>
                ) : (
                  <Pressable onPress={() => setExpandedIndex(index)} style={styles.editHint}>
                    <Text style={styles.editHintText}>
                      {photo.label || 'Tap to add label'}
                    </Text>
                  </Pressable>
                )}
              </View>
            );
          })}
        </ScrollView>
      ) : (
        <View style={styles.empty}>
          <Ionicons name="images-outline" size={36} color={colors.faint} />
          <Text style={styles.emptyText}>No photos yet</Text>
          <Text style={styles.emptySub}>Upload workspace photos for the listing detail gallery.</Text>
        </View>
      )}

      <View style={styles.actions}>
        <Pressable style={styles.actionBtn} onPress={pickFromLibrary} disabled={uploading}>
          <Ionicons name="images-outline" size={20} color={colors.brand} />
          <Text style={styles.actionText}>Photo library</Text>
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={takePhoto} disabled={uploading}>
          <Ionicons name="camera-outline" size={20} color={colors.brand} />
          <Text style={styles.actionText}>Camera</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 8,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  title: { fontSize: 15, fontWeight: '800', color: colors.ink },
  sub: { fontSize: 12, color: colors.muted, marginTop: 2 },
  carousel: { gap: 12, paddingBottom: 4 },
  card: {
    width: 220,
    backgroundColor: colors.surface2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  thumb: { width: '100%', height: 140, backgroundColor: colors.border },
  coverBadge: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    backgroundColor: colors.brand,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  coverBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  newBadge: {
    position: 'absolute',
    right: 8,
    top: 8,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  newBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnOff: { opacity: 0.35 },
  iconBtnDanger: { borderColor: '#fecaca' },
  meta: { paddingHorizontal: 10, paddingBottom: 10, gap: 4 },
  metaLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.faint,
    marginTop: 4,
  },
  metaInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.ink,
  },
  editHint: { paddingHorizontal: 10, paddingBottom: 10 },
  editHintText: { fontSize: 12, color: colors.muted },
  empty: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 6,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: colors.surface2,
  },
  emptyText: { fontSize: 14, fontWeight: '700', color: colors.ink },
  emptySub: { fontSize: 12, color: colors.muted, textAlign: 'center', paddingHorizontal: 20 },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.brand,
    backgroundColor: colors.brandSoft,
  },
  actionText: { fontSize: 14, fontWeight: '700', color: colors.brandInk },
});
