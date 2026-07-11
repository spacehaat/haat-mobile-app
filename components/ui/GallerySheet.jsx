import { useEffect, useRef } from 'react';
import {
  Modal, View, Text, Pressable, ScrollView, Image, StyleSheet, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { inr } from '@spacehaat/utils';
import { colors } from '../../constants/theme';

const GALLERY_ROW_HEIGHT = 300;

export default function GallerySheet({ visible, photos, title, onClose, initialIndex = 0 }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!visible || !photos?.length) return;
    const idx = Math.max(0, Math.min(initialIndex, photos.length - 1));
    const t = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: idx * GALLERY_ROW_HEIGHT, animated: false });
    }, 50);
    return () => clearTimeout(t);
  }, [visible, initialIndex, photos?.length]);

  if (!visible) return null;

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.head}>
          <Text style={styles.title} numberOfLines={2}>{title || 'Gallery'}</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={26} color={colors.ink} />
          </Pressable>
        </View>
        <ScrollView ref={scrollRef} contentContainerStyle={styles.content}>
          {(photos || []).map((ph, i) => (
            <View key={`${ph.src}-${i}`} style={styles.cell}>
              <Image source={{ uri: ph.src }} style={styles.img} resizeMode="cover" />
              <View style={styles.meta}>
                <Text style={styles.label}>{ph.label || `Photo ${i + 1}`}</Text>
                {ph.caption ? <Text style={styles.caption}>{ph.caption}</Text> : null}
                {ph.price ? (
                  <Text style={styles.price}>{inr(ph.price)}{ph.unit || '/seat'}</Text>
                ) : null}
              </View>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface2 },
  head: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  title: { flex: 1, fontSize: 17, fontWeight: '700', color: colors.ink, marginRight: 12 },
  content: { padding: 16, paddingBottom: 40, gap: 16 },
  cell: {
    backgroundColor: colors.surface, borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.border,
  },
  img: { width: '100%', height: 220, backgroundColor: colors.surface2 },
  meta: { padding: 12, gap: 4 },
  label: { fontSize: 14, fontWeight: '700', color: colors.ink },
  caption: { fontSize: 13, color: colors.muted },
  price: { fontSize: 13, fontWeight: '600', color: colors.brand },
});
