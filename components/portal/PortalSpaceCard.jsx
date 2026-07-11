import { useRef, useState } from 'react';
import {
  View, Text, Image, Pressable, StyleSheet, TextInput, Dimensions, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { inr } from '@spacehaat/utils';
import { listingPhotos } from '../../lib/portalHelpers';
import { colors } from '../../constants/theme';

const CARD_WIDTH = Dimensions.get('window').width - 32;
const GALLERY_HEIGHT = Math.round(CARD_WIDTH * 0.48);

export default function PortalSpaceCard({
  listing, status, comments, panelOpen, saving,
  onLike, onReject, onTogglePanel, onSendComment, commentDraft, onCommentDraft,
  onOpenGallery,
}) {
  const photos = listingPhotos(listing);
  const [slide, setSlide] = useState(0);
  const listRef = useRef(null);
  const metro = listing.nearestMetro || '—';
  const carpet = listing.carpet ? `${listing.carpet.toLocaleString('en-IN')} sqft` : '—';

  const goSlide = (next) => {
    const idx = ((next % photos.length) + photos.length) % photos.length;
    setSlide(idx);
    listRef.current?.scrollToOffset({ offset: idx * CARD_WIDTH, animated: true });
  };

  return (
    <View style={[styles.card, status === 'shortlisted' && styles.cardShortlisted]}>
      {status === 'shortlisted' ? (
        <View style={styles.ribbon}>
          <Ionicons name="heart" size={14} color="#fff" />
          <Text style={styles.ribbonText}>Shortlisted by you</Text>
        </View>
      ) : null}

      <View style={styles.gallery}>
        <FlatList
          ref={listRef}
          data={photos}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(p, i) => `${p.src}-${i}`}
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / CARD_WIDTH);
            setSlide(idx);
          }}
          renderItem={({ item, index }) => (
            <Pressable onPress={() => onOpenGallery(index)} style={{ width: CARD_WIDTH }}>
              <Image source={{ uri: item.src }} style={styles.galleryImg} resizeMode="cover" />
            </Pressable>
          )}
        />
        <View style={styles.countPill}>
          <Text style={styles.countText}>{slide + 1} / {photos.length}</Text>
        </View>
        {photos.length > 1 ? (
          <>
            <Pressable style={[styles.navBtn, styles.navPrev]} onPress={() => goSlide(slide - 1)}>
              <Ionicons name="chevron-back" size={20} color={colors.ink} />
            </Pressable>
            <Pressable style={[styles.navBtn, styles.navNext]} onPress={() => goSlide(slide + 1)}>
              <Ionicons name="chevron-forward" size={20} color={colors.ink} />
            </Pressable>
          </>
        ) : null}
        <Pressable style={styles.expandBtn} onPress={() => onOpenGallery(slide)}>
          <Ionicons name="expand-outline" size={18} color="#fff" />
        </Pressable>
        <View style={styles.cap}>
          <View style={styles.typePill}><Text style={styles.typePillText}>{listing.type}</Text></View>
          <Text style={styles.photoLab} numberOfLines={1}>{photos[slide]?.label}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.topRow}>
          <View style={styles.titleBlock}>
            <Text style={styles.operator}>{listing.operator}</Text>
            <View style={styles.locRow}>
              <Ionicons name="location-outline" size={14} color={colors.brand} />
              <Text style={styles.loc}>{listing.micro}, {listing.city}</Text>
            </View>
          </View>
          <View style={styles.priceBlock}>
            <Text style={styles.price}>{inr(listing.price)}</Text>
            <Text style={styles.priceSub}>per seat / month</Text>
          </View>
        </View>

        <View style={styles.specs}>
          <View style={styles.spec}><Text style={styles.specL}>Seats</Text><Text style={styles.specV}>{listing.seats || '—'}</Text></View>
          <View style={styles.spec}><Text style={styles.specL}>Carpet</Text><Text style={styles.specV}>{carpet}</Text></View>
          <View style={styles.spec}><Text style={styles.specL}>Availability</Text><Text style={styles.specV}>{listing.avail || 'Available now'}</Text></View>
          <View style={styles.spec}><Text style={styles.specL}>Metro</Text><Text style={styles.specV} numberOfLines={2}>{metro}</Text></View>
        </View>

        {listing.amenities?.length ? (
          <View style={styles.amenRow}>
            {listing.amenities.map((a) => (
              <View key={a} style={styles.amenChip}>
                <Ionicons name="checkmark" size={11} color={colors.success} />
                <Text style={styles.amenText}>{a}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.actions}>
          <Pressable
            style={[styles.actBtn, status === 'shortlisted' && styles.actBtnOn]}
            onPress={onLike}
            disabled={!!saving}
          >
            <Ionicons name={status === 'shortlisted' ? 'heart' : 'heart-outline'} size={16} color={status === 'shortlisted' ? colors.brandInk : colors.muted} />
            <Text style={[styles.actLab, status === 'shortlisted' && styles.actLabOn]}>
              {status === 'shortlisted' ? 'Shortlisted' : 'Shortlist'}
            </Text>
          </Pressable>
          <Pressable style={styles.actBtn} onPress={onReject} disabled={!!saving}>
            <Ionicons name="close" size={16} color={colors.muted} />
            <Text style={styles.actLab}>Not for me</Text>
          </Pressable>
          <Pressable style={styles.actBtn} onPress={onTogglePanel}>
            <Ionicons name="chatbubble-outline" size={16} color={colors.muted} />
            <Text style={styles.actLab}>Comment</Text>
          </Pressable>
          {comments.length ? (
            <Text style={styles.cmtCount}>{comments.length} comment{comments.length > 1 ? 's' : ''}</Text>
          ) : null}
        </View>

        {panelOpen ? (
          <View style={styles.commentPanel}>
            <TextInput
              style={styles.commentInput}
              multiline
              placeholder="Ask a question or leave a note about this space…"
              placeholderTextColor={colors.faint}
              value={commentDraft}
              onChangeText={onCommentDraft}
            />
            <Pressable style={styles.sendBtn} onPress={onSendComment} disabled={!!saving}>
              <Ionicons name="send" size={18} color="#fff" />
            </Pressable>
          </View>
        ) : null}

        {comments.length ? (
          <View style={styles.cmtList}>
            {comments.map((c, i) => (
              <View key={`${c.createdAt}-${i}`} style={styles.cmtItem}>
                <View style={styles.cmtAv}><Text style={styles.cmtAvText}>Y</Text></View>
                <View style={styles.cmtBody}>
                  <Text style={styles.cmtWho}>You · {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Just now'}</Text>
                  <Text style={styles.cmtText}>{c.text}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.border,
    overflow: 'hidden', marginBottom: 16,
  },
  cardShortlisted: { borderColor: '#A5D6A7', borderWidth: 2 },
  ribbon: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.brand,
    paddingVertical: 9, paddingHorizontal: 16,
  },
  ribbonText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  gallery: { height: GALLERY_HEIGHT, backgroundColor: colors.surface2, position: 'relative' },
  galleryImg: { width: CARD_WIDTH, height: GALLERY_HEIGHT },
  countPill: {
    position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  countText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  navBtn: {
    position: 'absolute', top: '50%', marginTop: -20, width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center',
  },
  navPrev: { left: 10 },
  navNext: { right: 10 },
  expandBtn: {
    position: 'absolute', bottom: 12, right: 12, width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center',
  },
  cap: {
    position: 'absolute', left: 14, bottom: 12, flexDirection: 'row', alignItems: 'center', gap: 8,
    maxWidth: '70%',
  },
  typePill: { backgroundColor: 'rgba(255,255,255,0.94)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  typePillText: { fontSize: 12, fontWeight: '700', color: colors.ink },
  photoLab: { color: '#fff', fontSize: 12, fontWeight: '600', flex: 1 },
  body: { padding: 16 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  titleBlock: { flex: 1 },
  operator: { fontSize: 18, fontWeight: '800', color: colors.ink },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  loc: { fontSize: 13, color: colors.muted, flex: 1 },
  priceBlock: { alignItems: 'flex-end' },
  price: { fontSize: 20, fontWeight: '800', color: colors.ink },
  priceSub: { fontSize: 11, color: colors.muted, marginTop: 2 },
  specs: {
    flexDirection: 'row', flexWrap: 'wrap', borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, overflow: 'hidden', marginBottom: 12,
  },
  spec: { width: '50%', padding: 10, borderRightWidth: 1, borderBottomWidth: 1, borderColor: colors.border },
  specL: { fontSize: 9, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.4 },
  specV: { fontSize: 13, fontWeight: '700', color: colors.ink, marginTop: 3 },
  amenRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  amenChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.surface2,
    borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5,
  },
  amenText: { fontSize: 11, color: colors.ink },
  actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  actBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 9,
    borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  actBtnOn: { backgroundColor: colors.brandSoft, borderColor: '#A5D6A7' },
  actLab: { fontSize: 13, fontWeight: '600', color: colors.muted },
  actLabOn: { color: colors.brandInk },
  cmtCount: { marginLeft: 'auto', fontSize: 12, color: colors.muted },
  commentPanel: { flexDirection: 'row', gap: 8, marginTop: 12, alignItems: 'flex-end' },
  commentInput: {
    flex: 1, minHeight: 64, maxHeight: 120, borderWidth: 1, borderColor: colors.border,
    borderRadius: 10, padding: 10, fontSize: 14, color: colors.ink, backgroundColor: '#FAFAF8',
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 10, backgroundColor: colors.brand,
    alignItems: 'center', justifyContent: 'center',
  },
  cmtList: { marginTop: 12, gap: 8 },
  cmtItem: { flexDirection: 'row', gap: 8 },
  cmtAv: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: colors.ink,
    alignItems: 'center', justifyContent: 'center',
  },
  cmtAvText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  cmtBody: { flex: 1, backgroundColor: colors.surface2, borderRadius: 10, padding: 10 },
  cmtWho: { fontSize: 12, fontWeight: '600', color: colors.ink },
  cmtText: { fontSize: 13, color: colors.ink, marginTop: 4, lineHeight: 18 },
});
