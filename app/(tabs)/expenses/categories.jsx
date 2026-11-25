import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList, Switch, Alert, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../context/AuthContext';
import { isAdmin } from '../../../lib/access';
import { mobileApi } from '../../../lib/api';
import CategoryEditorModal from '../../../components/expenses/CategoryEditorModal';
import { colors } from '../../../constants/theme';

/** Admin: add, rename and switch off expense categories. Switched-off ones stay on old expenses. */
export default function ExpenseCategoriesScreen() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null); // category, or {} for new
  const q = useQuery({ queryKey: ['expense-categories', 'all'], queryFn: () => mobileApi.listExpenseCategories({ all: true }) });

  if (!isAdmin(user)) return <Redirect href="/(tabs)/expenses" />;

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['expense-categories'] });
  };

  const toggle = async (cat) => {
    try {
      await mobileApi.updateExpenseCategory(cat.id, { active: !cat.active });
      refresh();
    } catch (err) {
      Alert.alert('Could not update', err.message || 'Try again');
    }
  };

  return (
    <View style={styles.screen}>
      <FlatList
        data={q.data || []}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        ListHeaderComponent={
          <Text style={styles.help}>Switch a category off to hide it when adding expenses. Old expenses keep it.</Text>
        }
        ListEmptyComponent={q.isLoading ? <ActivityIndicator color={colors.brand} /> : null}
        renderItem={({ item }) => (
          <View style={[styles.row, !item.active && { opacity: 0.55 }]}>
            <View style={styles.icon}>
              <Ionicons name={item.icon} size={18} color={colors.brandInk} />
            </View>
            <Pressable style={styles.body} onPress={() => setEditing(item)}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.sub}>{item.active ? 'Tap to rename' : 'Switched off'}</Text>
            </Pressable>
            <Switch value={item.active} onValueChange={() => toggle(item)} trackColor={{ true: colors.brand }} />
          </View>
        )}
        ListFooterComponent={
          <Pressable style={styles.add} onPress={() => setEditing({})}>
            <Ionicons name="add-circle-outline" size={20} color={colors.brandInk} />
            <Text style={styles.addText}>New category</Text>
          </Pressable>
        }
      />
      <CategoryEditorModal
        visible={editing != null}
        category={editing?.id ? editing : null}
        onClose={() => setEditing(null)}
        onSaved={refresh}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface2 },
  help: { fontSize: 13, color: colors.muted, marginBottom: 6, lineHeight: 18 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: colors.border },
  icon: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: colors.ink },
  sub: { fontSize: 12, color: colors.muted, marginTop: 2 },
  add: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8, padding: 14, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border, backgroundColor: colors.surface },
  addText: { fontSize: 15, fontWeight: '700', color: colors.brandInk },
});
