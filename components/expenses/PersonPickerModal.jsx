import { useMemo, useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ModalSafeArea from '../ui/ModalSafeArea';
import { colors } from '../../constants/theme';

/**
 * Admin: whose expense is this. Team members, names used before (office helper, vendor),
 * or a new name typed in the search box.
 * `onSelect({ userId, name })` — userId is null for people who are not app users.
 */
export default function PersonPickerModal({ visible, people, meId, onSelect, onClose }) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  const staff = useMemo(
    () => (people?.staff || []).filter((p) => !q || p.name.toLowerCase().includes(q)),
    [people, q],
  );
  const others = useMemo(
    () => (people?.others || []).filter((n) => !q || n.toLowerCase().includes(q)),
    [people, q],
  );
  const exact = q && [...(people?.staff || []).map((p) => p.name), ...(people?.others || [])].some((n) => n.toLowerCase() === q);

  const pick = (person) => {
    setQuery('');
    onSelect(person);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <ModalSafeArea>
        <View style={styles.header}>
          <Text style={styles.title}>Whose expense?</Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={24} color={colors.ink} />
          </Pressable>
        </View>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={colors.muted} />
          <TextInput
            style={styles.search}
            placeholder="Search or type a new name"
            placeholderTextColor={colors.faint}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
          />
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 32 }}>
          {q && !exact ? (
            <Pressable style={styles.row} onPress={() => pick({ userId: null, name: query.trim() })}>
              <Ionicons name="person-add-outline" size={20} color={colors.brand} />
              <Text style={[styles.name, { color: colors.brandInk }]}>Add “{query.trim()}”</Text>
            </Pressable>
          ) : null}
          {staff.length ? <Text style={styles.section}>Team</Text> : null}
          {staff.map((p) => (
            <Pressable key={p.userId} style={styles.row} onPress={() => pick({ userId: p.userId, name: p.name })}>
              <Ionicons name="person-circle-outline" size={22} color={colors.muted} />
              <Text style={styles.name}>{p.name}{p.userId === meId ? ' (you)' : ''}</Text>
            </Pressable>
          ))}
          {others.length ? <Text style={styles.section}>Others</Text> : null}
          {others.map((n) => (
            <Pressable key={n} style={styles.row} onPress={() => pick({ userId: null, name: n })}>
              <Ionicons name="person-outline" size={20} color={colors.muted} />
              <Text style={styles.name}>{n}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </ModalSafeArea>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  title: { fontSize: 18, fontWeight: '800', color: colors.ink },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 8,
    paddingHorizontal: 12, borderRadius: 12, backgroundColor: colors.surface2,
  },
  search: { flex: 1, paddingVertical: 10, fontSize: 15, color: colors.ink },
  section: { fontSize: 12, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 14, marginBottom: 4, marginHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  name: { fontSize: 15, color: colors.ink },
});
