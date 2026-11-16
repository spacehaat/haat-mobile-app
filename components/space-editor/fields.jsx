import { useMemo, useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, Switch, Modal, FlatList, ActivityIndicator, Image, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../../constants/theme';
import ModalSafeArea from '../ui/ModalSafeArea';
import { mobileApi } from '../../lib/api';

export const IMAGE_MEDIA_TYPES = (() => {
  if (ImagePicker.MediaType?.Images) return ImagePicker.MediaType.Images;
  if (ImagePicker.MediaTypeOptions?.Images) return ImagePicker.MediaTypeOptions.Images;
  return 'images';
})();

export const assetToFile = (asset, i = 0) => ({
  uri: asset.uri,
  name: asset.fileName || `photo-${Date.now()}-${i}.jpg`,
  type: asset.mimeType || 'image/jpeg',
});

export function Label({ text, required, hint }) {
  return (
    <View style={styles.labelRow}>
      <Text style={styles.label}>{text}{required ? <Text style={styles.req}> *</Text> : null}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

export function TextField({
  label, value, onChange, placeholder, required, hint, keyboardType, multiline, lines = 4,
  autoCapitalize, prefix, suffix, maxLength,
}) {
  return (
    <View style={styles.field}>
      {label ? <Label text={label} required={required} hint={hint} /> : null}
      <View style={[styles.inputWrap, multiline && styles.inputWrapMulti]}>
        {prefix ? <Text style={styles.affix}>{prefix}</Text> : null}
        <TextInput
          style={[styles.input, multiline && { minHeight: lines * 22, textAlignVertical: 'top' }]}
          value={value === undefined || value === null ? '' : String(value)}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.faint}
          keyboardType={keyboardType}
          multiline={multiline}
          autoCapitalize={autoCapitalize ?? (keyboardType === 'email-address' || keyboardType === 'url' ? 'none' : 'sentences')}
          autoCorrect={!(keyboardType === 'email-address' || keyboardType === 'url')}
          maxLength={maxLength}
        />
        {suffix ? <Text style={styles.affix}>{suffix}</Text> : null}
      </View>
    </View>
  );
}

/** Two fields side by side. */
export function Row({ children }) {
  return <View style={styles.row}>{children}</View>;
}
export function Col({ children }) {
  return <View style={{ flex: 1 }}>{children}</View>;
}

export function ToggleRow({ label, hint, value, onChange, icon }) {
  return (
    <Pressable style={styles.toggle} onPress={() => onChange(!value)}>
      {icon ? <Ionicons name={icon} size={18} color={value ? colors.brandInk : colors.muted} /> : null}
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {hint ? <Text style={styles.toggleHint}>{hint}</Text> : null}
      </View>
      <Switch
        value={Boolean(value)}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: colors.brandSoft }}
        thumbColor={value ? colors.brand : '#f4f4f4'}
      />
    </Pressable>
  );
}

/** Pick one of a few options, shown as chips. */
export function ChoiceChips({ label, required, hint, options, value, onChange }) {
  return (
    <View style={styles.field}>
      {label ? <Label text={label} required={required} hint={hint} /> : null}
      <View style={styles.chips}>
        {options.map((o) => {
          const v = typeof o === 'string' ? o : o.value;
          const text = typeof o === 'string' ? o : o.label;
          const on = value === v;
          return (
            <Pressable key={v} style={[styles.chip, on && styles.chipOn]} onPress={() => onChange(v)}>
              {on ? <Ionicons name="checkmark" size={14} color={colors.brandInk} /> : null}
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{text}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** A tap-to-choose field that opens a searchable list (brands, cities, areas, plan types…). */
export function PickerField({
  label, required, hint, value, valueLabel, options = [], onChange, placeholder = 'Choose…',
  disabled, loading, emptyText = 'Nothing to choose from yet.', allowClear, compact,
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const selected = options.find((o) => o.id === value);
  const shown = selected?.name || valueLabel || '';
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? options.filter((o) => o.name.toLowerCase().includes(t)) : options;
  }, [options, q]);

  return (
    <View style={compact ? null : styles.field}>
      {label ? <Label text={label} required={required} hint={hint} /> : null}
      <Pressable
        style={[styles.picker, disabled && styles.pickerOff]}
        disabled={disabled}
        onPress={() => { setQ(''); setOpen(true); }}
      >
        <Text style={[styles.pickerText, !shown && { color: colors.faint }]} numberOfLines={1}>
          {shown || placeholder}
        </Text>
        {loading ? <ActivityIndicator size="small" color={colors.brand} /> : <Ionicons name="chevron-down" size={18} color={colors.muted} />}
      </Pressable>

      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(false)}>
        <ModalSafeArea>
          <View style={styles.sheetHead}>
            <Text style={styles.sheetTitle}>{label || 'Choose'}</Text>
            <Pressable onPress={() => setOpen(false)} hitSlop={10}>
              <Ionicons name="close" size={24} color={colors.ink} />
            </Pressable>
          </View>
          {options.length > 8 ? (
            <View style={styles.search}>
              <Ionicons name="search" size={18} color={colors.muted} />
              <TextInput
                style={styles.searchInput}
                value={q}
                onChangeText={setQ}
                placeholder="Search"
                placeholderTextColor={colors.faint}
                autoFocus
              />
            </View>
          ) : null}
          <FlatList
            data={list}
            keyExtractor={(o) => o.id}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={allowClear && value ? (
              <Pressable style={styles.option} onPress={() => { onChange(''); setOpen(false); }}>
                <Text style={[styles.optionText, { color: colors.danger }]}>Clear selection</Text>
              </Pressable>
            ) : null}
            ListEmptyComponent={<Text style={styles.empty}>{loading ? 'Loading…' : emptyText}</Text>}
            renderItem={({ item }) => {
              const on = item.id === value;
              return (
                <Pressable style={[styles.option, on && styles.optionOn]} onPress={() => { onChange(item.id, item); setOpen(false); }}>
                  <Text style={[styles.optionText, on && { color: colors.brandInk, fontWeight: '800' }]}>{item.name}</Text>
                  {on ? <Ionicons name="checkmark-circle" size={20} color={colors.brand} /> : null}
                </Pressable>
              );
            }}
          />
        </ModalSafeArea>
      </Modal>
    </View>
  );
}

/** One image (plan image, SEO share image). Uploads as soon as it's picked. */
export function SingleImageField({ label, hint, value, onChange }) {
  const [busy, setBusy] = useState(false);
  const pick = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Photos access needed', 'Allow photo library access to choose an image.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: IMAGE_MEDIA_TYPES, quality: 0.85 });
    if (res.canceled || !res.assets?.length) return;
    setBusy(true);
    try {
      const [up] = await mobileApi.uploadSpaceImages([assetToFile(res.assets[0])]);
      if (up) onChange(up);
    } catch (err) {
      Alert.alert('Upload failed', err.message || 'Could not upload the image');
    } finally {
      setBusy(false);
    }
  };
  return (
    <View style={styles.field}>
      {label ? <Label text={label} hint={hint} /> : null}
      <View style={styles.singleImg}>
        {value?.url ? <Image source={{ uri: value.url }} style={styles.singleThumb} /> : (
          <View style={[styles.singleThumb, styles.singleEmpty]}><Ionicons name="image-outline" size={22} color={colors.faint} /></View>
        )}
        <Pressable style={styles.smallBtn} onPress={pick} disabled={busy}>
          {busy ? <ActivityIndicator size="small" color={colors.brand} /> : <Ionicons name="cloud-upload-outline" size={16} color={colors.brandInk} />}
          <Text style={styles.smallBtnText}>{value?.url ? 'Change' : 'Choose image'}</Text>
        </Pressable>
        {value?.url ? (
          <Pressable style={[styles.smallBtn, styles.smallBtnDanger]} onPress={() => onChange(null)} disabled={busy}>
            <Ionicons name="trash-outline" size={16} color={colors.danger} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

/** Grouped block inside a step. */
export function Group({ title, hint, children, right }) {
  return (
    <View style={styles.group}>
      {title ? (
        <View style={styles.groupHead}>
          <View style={{ flex: 1 }}>
            <Text style={styles.groupTitle}>{title}</Text>
            {hint ? <Text style={styles.groupHint}>{hint}</Text> : null}
          </View>
          {right}
        </View>
      ) : null}
      {children}
    </View>
  );
}

export const styles = StyleSheet.create({
  field: { marginBottom: 14 },
  labelRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: 6 },
  label: { fontSize: 13.5, fontWeight: '700', color: colors.ink },
  req: { color: colors.danger },
  hint: { fontSize: 11.5, color: colors.faint, flexShrink: 1, textAlign: 'right' },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 12,
  },
  inputWrapMulti: { alignItems: 'flex-start' },
  input: { flex: 1, paddingVertical: 12, fontSize: 15.5, color: colors.ink },
  affix: { fontSize: 14, fontWeight: '700', color: colors.muted, paddingHorizontal: 2 },
  row: { flexDirection: 'row', gap: 10 },
  toggle: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, marginBottom: 10,
  },
  toggleLabel: { fontSize: 15, fontWeight: '700', color: colors.ink },
  toggleHint: { fontSize: 12, color: colors.muted, marginTop: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 13, paddingVertical: 9,
    borderRadius: 999, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  chipOn: { backgroundColor: colors.brandSoft, borderColor: colors.brand },
  chipText: { fontSize: 14, fontWeight: '600', color: colors.ink },
  chipTextOn: { color: colors.brandInk, fontWeight: '800' },
  picker: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 13,
  },
  pickerOff: { opacity: 0.5 },
  pickerText: { flex: 1, fontSize: 15.5, color: colors.ink },
  sheetHead: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: colors.ink },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 8, margin: 12, paddingHorizontal: 12,
    backgroundColor: colors.surface2, borderRadius: 12,
  },
  searchInput: { flex: 1, paddingVertical: 11, fontSize: 15.5, color: colors.ink },
  option: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  optionOn: { backgroundColor: colors.brandSoft },
  optionText: { fontSize: 15.5, color: colors.ink, flex: 1 },
  empty: { padding: 24, textAlign: 'center', color: colors.muted },
  singleImg: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  singleThumb: { width: 72, height: 48, borderRadius: 8, backgroundColor: colors.border },
  singleEmpty: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' },
  smallBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 9,
    borderRadius: 10, borderWidth: 1, borderColor: colors.brand, backgroundColor: colors.brandSoft,
  },
  smallBtnDanger: { borderColor: '#F3C4C4', backgroundColor: '#FFF5F5' },
  smallBtnText: { fontSize: 13.5, fontWeight: '700', color: colors.brandInk },
  group: {
    backgroundColor: colors.surface, borderRadius: 16, padding: 14, marginBottom: 14,
    borderWidth: 1, borderColor: colors.border,
  },
  groupHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  groupTitle: { fontSize: 15.5, fontWeight: '800', color: colors.ink },
  groupHint: { fontSize: 12, color: colors.muted, marginTop: 2 },
});
