import { useState } from 'react';
import {
  View, ScrollView, Image, Pressable, Text, StyleSheet, Dimensions,
} from 'react-native';
import { colors } from '../../constants/theme';

const SCREEN_W = Dimensions.get('window').width;
const MAX_DOTS = 4;

function visibleDotCount(total) {
  if (total <= 1) return 0;
  return Math.min(total, MAX_DOTS);
}

function activeDotIndex(currentIndex, total, dots) {
  if (total <= dots) return currentIndex;
  if (total <= 1) return 0;
  return Math.round((currentIndex / (total - 1)) * (dots - 1));
}

export default function ListingGalleryCarousel({ photos, onOpenGallery, horizontalPadding = 16 }) {
  const slideWidth = SCREEN_W - horizontalPadding * 2;
  const [index, setIndex] = useState(0);

  if (!photos?.length) return null;

  const openAt = (i) => onOpenGallery?.(i);
  const dotCount = visibleDotCount(photos.length);
  const activeDot = activeDotIndex(index, photos.length, dotCount);

  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        pagingEnabled
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const next = Math.round(e.nativeEvent.contentOffset.x / slideWidth);
          setIndex(Math.max(0, Math.min(next, photos.length - 1)));
        }}
      >
        {photos.map((ph, i) => (
          <Pressable
            key={`${ph.src}-${i}`}
            style={{ width: slideWidth }}
            onPress={() => openAt(i)}
          >
            {ph.src && (ph.src.startsWith('http') || ph.src.startsWith('file:') || ph.src.startsWith('content:')) ? (
              <Image
                source={{ uri: ph.src }}
                style={[styles.img, { width: slideWidth }]}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.img, styles.imgPlaceholder, { width: slideWidth }]}>
                <Text style={styles.placeholderText}>No photo</Text>
              </View>
            )}
            <View style={styles.shade} />
          </Pressable>
        ))}
      </ScrollView>

      <Pressable style={styles.countBadge} onPress={() => openAt(index)} hitSlop={8}>
        <Text style={styles.countText}>{index + 1}/{photos.length}</Text>
      </Pressable>

      {dotCount > 1 ? (
        <View style={styles.dots}>
          {Array.from({ length: dotCount }, (_, i) => (
            <View key={i} style={[styles.dot, i === activeDot && styles.dotActive]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 12,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.surface2,
  },
  img: {
    height: 220,
    backgroundColor: colors.surface2,
  },
  imgPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: colors.faint, fontWeight: '600' },
  shade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  countBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  countText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  dots: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 18,
  },
});
