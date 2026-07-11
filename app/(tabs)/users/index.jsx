import { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { mobileApi } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import RequireScreen from '../../../components/RequireScreen';
import UserAccessForm from '../../../components/users/UserAccessForm';
import {
  PERM_LABELS, permissionLabel, DEFAULT_MEMBER_PERMISSIONS,
} from '../../../lib/access';
import { colors } from '../../../constants/theme';

export default function UsersScreen() {
  const { user: authUser, permissionCatalog } = useAuth();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const catalog = permissionCatalog?.length ? permissionCatalog : Object.keys(PERM_LABELS);

  const { data: users = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['users'],
    queryFn: () => mobileApi.listUsers(),
  });

  const stats = useMemo(() => ({
    total: users.length,
    admins: users.filter((u) => u.role === 'admin').length,
    members: users.filter((u) => u.role === 'member').length,
  }), [users]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (u) => {
    setEditing(u);
    setFormOpen(true);
  };

  const toggleStatus = async (u) => {
    if (u.id === authUser?.id) {
      Alert.alert('Not allowed', 'You cannot change your own status.');
      return;
    }
    const next = u.status === 'active' ? 'disabled' : 'active';
    try {
      await mobileApi.updateUser(u.id, { status: next });
      await queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (err) {
      Alert.alert('Update failed', err.message || 'Could not update user');
    }
  };

  const onSaved = async () => {
    setFormOpen(false);
    setEditing(null);
    await queryClient.invalidateQueries({ queryKey: ['users'] });
  };

  return (
    <RequireScreen screen="users">
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.brand} />}
      >
        <Text style={styles.lead}>Create team members and control what they can see and do.</Text>

        <View style={styles.statsRow}>
          <StatBox label="Total" value={stats.total} />
          <StatBox label="Admins" value={stats.admins} />
          <StatBox label="Members" value={stats.members} />
        </View>

        <Pressable style={styles.createBtn} onPress={openCreate}>
          <Ionicons name="person-add-outline" size={20} color="#fff" />
          <Text style={styles.createBtnText}>Create user</Text>
        </Pressable>

        {isLoading ? (
          <ActivityIndicator color={colors.brand} style={{ marginTop: 32 }} />
        ) : !users.length ? (
          <Text style={styles.empty}>No users yet.</Text>
        ) : (
          users.map((u) => (
            <View key={u.id} style={styles.card}>
              <View style={styles.cardHead}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{(u.name || '?').slice(0, 1).toUpperCase()}</Text>
                </View>
                <View style={styles.cardMeta}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name}>{u.name}</Text>
                    {u.id === authUser?.id ? <Text style={styles.you}>You</Text> : null}
                  </View>
                  <Text style={styles.email}>{u.email}</Text>
                </View>
                <View style={[styles.rolePill, u.role === 'admin' && styles.roleAdmin]}>
                  <Text style={styles.roleText}>{u.role === 'admin' ? 'Admin' : 'Member'}</Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <Text style={styles.metaLine}>
                  <Text style={styles.metaLabel}>Cities: </Text>
                  {u.role === 'admin' ? 'All cities' : (u.cities?.join(', ') || '—')}
                </Text>
                <Text style={styles.metaLine}>
                  <Text style={styles.metaLabel}>Access: </Text>
                  {u.role === 'admin'
                    ? 'Full access'
                    : `${(u.permissions || []).length} permission${(u.permissions || []).length === 1 ? '' : 's'}`}
                </Text>
                {(u.permissions || []).length > 0 && u.role !== 'admin' ? (
                  <View style={styles.permRow}>
                    {(u.permissions || []).slice(0, 4).map((p) => (
                      <Text key={p} style={styles.permChip}>{permissionLabel(p)}</Text>
                    ))}
                    {(u.permissions || []).length > 4 ? (
                      <Text style={styles.permMore}>+{(u.permissions || []).length - 4} more</Text>
                    ) : null}
                  </View>
                ) : null}
                <Text style={[styles.status, u.status === 'active' ? styles.statusOn : styles.statusOff]}>
                  {u.status === 'active' ? 'Active' : 'Disabled'}
                </Text>
              </View>

              <View style={styles.cardActions}>
                <Pressable style={styles.actionBtn} onPress={() => openEdit(u)}>
                  <Ionicons name="pencil-outline" size={18} color={colors.ink} />
                  <Text style={styles.actionText}>Edit</Text>
                </Pressable>
                <Pressable
                  style={[styles.actionBtn, u.status === 'active' ? styles.actionDanger : styles.actionOk]}
                  onPress={() => toggleStatus(u)}
                  disabled={u.id === authUser?.id}
                >
                  <Ionicons
                    name={u.status === 'active' ? 'power-outline' : 'checkmark-circle-outline'}
                    size={18}
                    color={u.status === 'active' ? colors.danger : colors.success}
                  />
                  <Text style={[styles.actionText, u.status === 'active' ? styles.dangerText : styles.okText]}>
                    {u.status === 'active' ? 'Disable' : 'Enable'}
                  </Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <UserAccessForm
        visible={formOpen}
        editing={editing}
        catalog={catalog}
        defaultPermissions={DEFAULT_MEMBER_PERMISSIONS}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSaved={onSaved}
      />
    </RequireScreen>
  );
}

function StatBox({ label, value }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statN}>{value}</Text>
      <Text style={styles.statL}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface2 },
  content: { padding: 16, paddingBottom: 40 },
  lead: { fontSize: 14, color: colors.muted, lineHeight: 20, marginBottom: 14 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  statBox: {
    flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center',
  },
  statN: { fontSize: 20, fontWeight: '800', color: colors.ink },
  statL: { fontSize: 11, color: colors.muted, marginTop: 2, textTransform: 'uppercase', fontWeight: '700' },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.brand, borderRadius: 12, paddingVertical: 14, marginBottom: 16,
  },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 24 },
  card: {
    backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border,
    marginBottom: 12, overflow: 'hidden',
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  avatar: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: colors.brandSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '800', color: colors.brandInk },
  cardMeta: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 16, fontWeight: '700', color: colors.ink },
  you: { fontSize: 11, fontWeight: '700', color: colors.brand, backgroundColor: colors.brandSoft, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 },
  email: { fontSize: 12, color: colors.muted, marginTop: 2 },
  rolePill: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
    backgroundColor: colors.surface2,
  },
  roleAdmin: { backgroundColor: colors.brandSoft },
  roleText: { fontSize: 11, fontWeight: '700', color: colors.ink, textTransform: 'capitalize' },
  cardBody: { paddingHorizontal: 14, paddingBottom: 10, gap: 4 },
  metaLine: { fontSize: 13, color: colors.ink, lineHeight: 18 },
  metaLabel: { color: colors.muted, fontWeight: '600' },
  permRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  permChip: {
    fontSize: 11, fontWeight: '600', color: colors.ink,
    backgroundColor: colors.surface2, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999,
  },
  permMore: { fontSize: 11, color: colors.muted, alignSelf: 'center' },
  status: { fontSize: 12, fontWeight: '700', marginTop: 4 },
  statusOn: { color: colors.success },
  statusOff: { color: colors.danger },
  cardActions: {
    flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border,
  },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12,
  },
  actionDanger: {},
  actionOk: {},
  actionText: { fontSize: 13, fontWeight: '700', color: colors.ink },
  dangerText: { color: colors.danger },
  okText: { color: colors.success },
});
