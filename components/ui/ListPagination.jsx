import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PAGE_SIZE_OPTIONS } from '../../constants/pagination';
import { colors } from '../../constants/theme';

export default function ListPagination({
  page,
  pageCount,
  total,
  pageSize,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  onPageChange,
  onPageSizeChange,
  disabled = false,
}) {
  if (!total) return null;

  const rangeStart = (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  return (
    <View style={styles.wrap}>
      <Text style={styles.info}>
        Showing {rangeStart}–{rangeEnd} of {total}
      </Text>

      <View style={styles.sizeRow}>
        <Text style={styles.sizeLabel}>Per page</Text>
        <View style={styles.sizeOptions}>
          {pageSizeOptions.map((n) => {
            const active = n === pageSize;
            return (
              <Pressable
                key={n}
                style={[styles.sizeChip, active && styles.sizeChipOn]}
                disabled={disabled}
                onPress={() => onPageSizeChange(n)}
              >
                <Text style={[styles.sizeChipText, active && styles.sizeChipTextOn]}>{n}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {pageCount > 1 ? (
        <View style={styles.controls}>
          <Pressable
            style={[styles.navBtn, page <= 1 && styles.navBtnOff]}
            disabled={disabled || page <= 1}
            onPress={() => onPageChange(page - 1)}
          >
            <Ionicons name="chevron-back" size={18} color={page <= 1 ? colors.faint : colors.ink} />
            <Text style={[styles.navBtnText, page <= 1 && styles.navBtnTextOff]}>Previous</Text>
          </Pressable>
          <Text style={styles.pageNum}>{page} / {pageCount}</Text>
          <Pressable
            style={[styles.navBtn, page >= pageCount && styles.navBtnOff]}
            disabled={disabled || page >= pageCount}
            onPress={() => onPageChange(page + 1)}
          >
            <Text style={[styles.navBtnText, page >= pageCount && styles.navBtnTextOff]}>Next</Text>
            <Ionicons name="chevron-forward" size={18} color={page >= pageCount ? colors.faint : colors.ink} />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  info: { fontSize: 12, color: colors.muted, textAlign: 'center' },
  sizeRow: { gap: 8 },
  sizeLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.faint,
    textAlign: 'center',
  },
  sizeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  sizeChip: {
    minWidth: 44,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  sizeChipOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  sizeChipText: { fontSize: 13, fontWeight: '700', color: colors.ink },
  sizeChipTextOn: { color: '#fff' },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  navBtnOff: { opacity: 0.45 },
  navBtnText: { fontWeight: '600', color: colors.ink, fontSize: 13 },
  navBtnTextOff: { color: colors.faint },
  pageNum: { color: colors.muted, fontSize: 13, fontWeight: '700' },
});
