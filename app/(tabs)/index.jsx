import { useQuery } from '@tanstack/react-query';
import { ScrollView, View, Text, StyleSheet, RefreshControl, Pressable, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useBiometric } from '../../context/BiometricContext';
import { canSeeBrowserTab, canSeeFreshness, canSeeLeadsTab } from '../../lib/access';
import RequireScreen from '../../components/RequireScreen';
import { mobileApi } from '../../lib/api';
import { greetingName } from '../../lib/format';
import KpiCard from '../../components/ui/KpiCard';
import { colors } from '../../constants/theme';

export default function DashboardScreen() {
  const { user } = useAuth();
  const { enabled: bioEnabled, available: bioAvailable, enable: enableBio, disable: disableBio } = useBiometric();

  const { data: stats, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => mobileApi.getDashboardStats(),
  });

  const listings = stats?.listings;
  const proposals = stats?.proposals;
  const leads = stats?.leads;

  const toggleBiometric = async () => {
    if (bioEnabled) {
      await disableBio();
      Alert.alert('Biometric lock disabled');
      return;
    }
    const ok = await enableBio();
    if (ok) Alert.alert('Biometric lock enabled', 'App will require Face ID / fingerprint when returning from background.');
    else Alert.alert('Could not enable', 'Biometric authentication was not completed.');
  };

  return (
    <RequireScreen screen="dashboard">
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.brand} />}
    >
      <Text style={styles.greeting}>Good morning, {greetingName(user?.name)} 👋</Text>
      <Text style={styles.lead}>
        Live snapshot across {(user?.cities || []).join(', ') || 'your cities'}.
      </Text>

      <View style={styles.grid}>
        <KpiCard
          label="Active listings"
          value={(listings?.total ?? 0).toLocaleString('en-IN')}
          sub={listings?.addedThisWeek ? `${listings.addedThisWeek} added this week` : 'Inventory count'}
          loading={isLoading}
          onPress={canSeeBrowserTab(user) ? () => router.push('/(tabs)/browser') : undefined}
        />
        <KpiCard
          label="Fresh inventory"
          value={`${listings?.freshPct ?? 0}%`}
          sub="Verified in last 5 days"
          loading={isLoading}
        />
        <KpiCard
          label="Needs re-verify"
          value={String(listings?.needsReverify ?? 0)}
          sub="Stale inventory"
          loading={isLoading}
          onPress={canSeeFreshness(user) ? () => router.push('/(tabs)/browser/freshness') : undefined}
        />
        <KpiCard
          label="Open leads"
          value={String(leads?.open ?? 0)}
          sub={leads?.overdue ? `${leads.overdue} overdue follow-up` : 'Active pipeline'}
          loading={isLoading}
          onPress={canSeeLeadsTab(user) ? () => router.push('/(tabs)/leads') : undefined}
        />
        <KpiCard
          label="Proposals sent"
          value={String(proposals?.sentThisWeek ?? 0)}
          sub={`${proposals?.sentToday ?? 0} sent today`}
          loading={isLoading}
        />
        <KpiCard
          label="Overdue follow-ups"
          value={String(leads?.overdue ?? 0)}
          sub="Needs attention today"
          loading={isLoading}
          onPress={canSeeLeadsTab(user) ? () => router.push('/(tabs)/leads') : undefined}
        />
      </View>

      {bioAvailable ? (
        <Pressable style={styles.settingRow} onPress={toggleBiometric}>
          <Ionicons name="finger-print-outline" size={22} color={colors.brand} />
          <View style={styles.settingBody}>
            <Text style={styles.settingTitle}>Biometric app lock</Text>
            <Text style={styles.settingSub}>{bioEnabled ? 'Enabled — tap to disable' : 'Require Face ID / fingerprint on resume'}</Text>
          </View>
          <Ionicons name={bioEnabled ? 'checkmark-circle' : 'ellipse-outline'} size={26} color={bioEnabled ? colors.brand : colors.faint} />
        </Pressable>
      ) : null}
    </ScrollView>
    </RequireScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface2 },
  content: { padding: 16, paddingBottom: 32 },
  greeting: { fontSize: 24, fontWeight: '800', color: colors.ink, marginBottom: 6 },
  lead: { fontSize: 14, color: colors.muted, lineHeight: 20, marginBottom: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surface, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: colors.border,
  },
  settingBody: { flex: 1 },
  settingTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
  settingSub: { fontSize: 12, color: colors.muted, marginTop: 2 },
});
