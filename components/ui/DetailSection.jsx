import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';

export default function DetailSection({
  title, tag, tagLabel, internal, open, onToggle, children,
}) {
  const tagText = tagLabel || (tag === 'dynamic' ? 'Dynamic' : tag === 'internal' ? 'Internal only' : 'Static');
  const tagStyle = tag === 'dynamic' ? styles.tagDynamic : tag === 'internal' ? styles.tagInternal : styles.tagStatic;

  return (
    <View style={[styles.section, internal && styles.sectionInternal]}>
      <Pressable style={styles.head} onPress={onToggle}>
        <Ionicons
          name={open ? 'chevron-down' : 'chevron-forward'}
          size={16}
          color={colors.muted}
        />
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        <View style={[styles.tag, tagStyle]}>
          {internal ? <Ionicons name="lock-closed" size={10} color={colors.muted} /> : null}
          <Text style={[styles.tagText, tag === 'internal' && styles.tagTextInternal]}>{tagText}</Text>
        </View>
      </Pressable>
      {open ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
    overflow: 'hidden',
  },
  sectionInternal: { borderColor: '#e8dcc8' },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  title: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.ink },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  tagStatic: { backgroundColor: colors.surface2 },
  tagDynamic: { backgroundColor: '#e8f4fd' },
  tagInternal: { backgroundColor: '#f5efe6' },
  tagText: { fontSize: 10, fontWeight: '700', color: colors.muted },
  tagTextInternal: { color: '#8a6d3b' },
  body: { paddingHorizontal: 14, paddingBottom: 14, gap: 8 },
});
